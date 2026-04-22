import { Router, type IRouter } from "express";
import { db, customOrders } from "@workspace/db";
import { CreateCustomOrderBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/custom-orders", async (req, res) => {
  const parsed = CreateCustomOrderBody.parse(req.body);
  const [created] = await db
    .insert(customOrders)
    .values({
      fullName: parsed.fullName,
      phone: parsed.phone,
      email: parsed.email ?? null,
      occasion: parsed.occasion,
      description: parsed.description,
      servings: parsed.servings ?? null,
      preferredDate: parsed.preferredDate ?? null,
      budget: parsed.budget ?? null,
      fulfillment: parsed.fulfillment,
    })
    .returning();
  res.status(201).json({
    id: String(created.id),
    fullName: created.fullName,
    phone: created.phone,
    email: created.email ?? undefined,
    occasion: created.occasion,
    description: created.description,
    servings: created.servings ?? undefined,
    preferredDate: created.preferredDate ?? undefined,
    budget: created.budget ?? undefined,
    fulfillment: created.fulfillment,
    createdAt: created.createdAt.toISOString(),
  });
});

export default router;
