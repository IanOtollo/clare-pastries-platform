import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, users } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  createSession,
  destroySession,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
} from "../lib/auth";

const router: IRouter = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

router.post("/auth/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const { name, email, password, phone } = parsed.data;
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  if (existing.length) {
    res.status(409).json({ error: "An account with that email already exists" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const inserted = await db
    .insert(users)
    .values({
      name,
      email: email.toLowerCase(),
      passwordHash,
      phone: phone ?? null,
      role: "CUSTOMER",
    })
    .returning({ id: users.id, email: users.email, name: users.name, role: users.role });
  const u = inserted[0]!;
  const { token, expiresAt } = await createSession(u.id);
  setAuthCookie(res, token, expiresAt);
  res.status(201).json({ user: u });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password } = parsed.data;
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  const u = rows[0];
  if (!u || !u.active) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const { token, expiresAt } = await createSession(u.id);
  setAuthCookie(res, token, expiresAt);
  res.json({
    user: { id: u.id, email: u.email, name: u.name, role: u.role },
  });
});

router.post("/auth/logout", async (req, res) => {
  const token = req.cookies?.["clare_sid"];
  if (token) await destroySession(token);
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get("/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
