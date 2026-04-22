import { Router, type IRouter } from "express";
import { db, settings } from "@workspace/db";

const router: IRouter = Router();

router.get("/settings", async (_req, res) => {
  const rows = await db.select().from(settings);
  const out: Record<string, unknown> = {};
  for (const r of rows) out[r.key] = r.value;
  res.json(out);
});

export default router;
