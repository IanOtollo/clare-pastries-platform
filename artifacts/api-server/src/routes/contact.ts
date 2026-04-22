import { Router, type IRouter } from "express";
import { db, contactMessages } from "@workspace/db";
import { SubmitContactBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/contact", async (req, res) => {
  const parsed = SubmitContactBody.parse(req.body);
  const [created] = await db
    .insert(contactMessages)
    .values({
      name: parsed.name,
      email: parsed.email ?? null,
      phone: parsed.phone ?? null,
      message: parsed.message,
    })
    .returning();
  res.status(201).json({
    id: String(created.id),
    name: created.name,
    email: created.email ?? undefined,
    phone: created.phone ?? undefined,
    message: created.message,
    createdAt: created.createdAt.toISOString(),
  });
});

export default router;
