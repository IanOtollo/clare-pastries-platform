import { Router, type IRouter } from "express";
import { z } from "zod";
import { db, orders, orderItems, products, offers } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router: IRouter = Router();

const itemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

const createOrderSchema = z.object({
  customerName: z.string().min(1),
  phone: z.string().min(7),
  email: z.string().email().optional().or(z.literal("")),
  fulfillment: z.enum(["delivery", "pickup"]).default("delivery"),
  address: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["mpesa", "cash", "card"]).default("mpesa"),
  currency: z.enum(["KES", "UGX"]).default("KES"),
  offerCode: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

function genOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const r = Math.floor(Math.random() * 1296)
    .toString(36)
    .toUpperCase()
    .padStart(2, "0");
  return `CP-${ts}-${r}`;
}

router.post("/orders", async (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;
  const ids = data.items.map((i) => i.productId);
  const dbProducts = await db.select().from(products);
  const byId = new Map(dbProducts.map((p) => [p.id, p]));
  for (const id of ids) {
    if (!byId.has(id)) {
      res.status(400).json({ error: `Product ${id} not found` });
      return;
    }
  }
  let subtotal = 0;
  const itemRows = data.items.map((it) => {
    const p = byId.get(it.productId)!;
    const price = Number(p.priceKes);
    subtotal += price * it.quantity;
    return {
      productId: p.id,
      name: p.name,
      imageUrl: p.imageUrl,
      priceKes: String(price),
      quantity: it.quantity,
    };
  });
  const delivery = data.fulfillment === "delivery" ? 200 : 0;
  let discount = 0;
  let appliedCode: string | null = null;
  if (data.offerCode) {
    const off = (
      await db
        .select()
        .from(offers)
        .where(and(eq(offers.code, data.offerCode.toUpperCase()), eq(offers.active, true)))
        .limit(1)
    )[0];
    if (off && Number(off.minSubtotalKes) <= subtotal) {
      const dv = Number(off.discountValue);
      discount = off.discountType === "percent" ? Math.round((subtotal * dv) / 100) : dv;
      appliedCode = off.code;
    }
  }
  const total = subtotal + delivery - discount;
  const inserted = await db
    .insert(orders)
    .values({
      orderNumber: genOrderNumber(),
      userId: req.user?.id ?? null,
      customerName: data.customerName,
      phone: data.phone,
      email: data.email || null,
      fulfillment: data.fulfillment,
      address: data.address ?? null,
      notes: data.notes ?? null,
      subtotalKes: String(subtotal),
      deliveryKes: String(delivery),
      discountKes: String(discount),
      totalKes: String(total),
      currency: data.currency,
      paymentMethod: data.paymentMethod,
      offerCode: appliedCode,
    })
    .returning();
  const order = inserted[0]!;
  await db.insert(orderItems).values(itemRows.map((r) => ({ ...r, orderId: order.id })));
  res.status(201).json({ order, items: itemRows });
});

router.get("/orders/me", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Auth required" });
    return;
  }
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, req.user.id))
    .orderBy(desc(orders.createdAt));
  res.json(rows);
});

router.get("/orders/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const order = (await db.select().from(orders).where(eq(orders.id, id)).limit(1))[0];
  if (!order) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (order.userId && order.userId !== req.user?.id && req.user?.role !== "ADMIN" && req.user?.role !== "STAFF") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  res.json({ order, items });
});

export default router;
