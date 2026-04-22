import { randomBytes } from "node:crypto";
import { type Request, type Response, type NextFunction } from "express";
import { db, sessions, users } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const COOKIE_NAME = "clare_sid";
const SESSION_DAYS = 30;

export function newToken() {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: number) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400 * 1000);
  await db.insert(sessions).values({ token, userId, expiresAt });
  return { token, expiresAt };
}

export async function destroySession(token: string) {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export function setAuthCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    expires: expiresAt,
    path: "/",
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export async function loadUser(req: Request): Promise<AuthUser | null> {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      active: users.active,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const u = rows[0];
  if (!u || !u.active) return null;
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  req.user = (await loadUser(req)) ?? undefined;
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (req.user.role !== "ADMIN" && req.user.role !== "STAFF") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
