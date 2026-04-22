import { Router, type IRouter } from "express";
import { z } from "zod";
import {
  db,
  products,
  galleryItems,
  customOrders,
  contactMessages,
  reviews,
  orders,
  orderItems,
  offers,
  users,
  settings,
  roles,
} from "@workspace/db";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();
router.use("/admin", requireAdmin);

// ---------- Dashboard stats ----------
router.get("/admin/dashboard/stats", async (_req, res) => {
  const since = new Date(Date.now() - 30 * 86400 * 1000);
  const [orderTotals] = await db
    .select({
      count: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${orders.totalKes}), 0)::float`,
    })
    .from(orders);
  const [recentOrders] = await db
    .select({
      count: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${orders.totalKes}), 0)::float`,
    })
    .from(orders)
    .where(gte(orders.createdAt, since));
  const [pendingOrders] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(eq(orders.status, "pending"));
  const [productCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products);
  const [customerCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.role, "CUSTOMER"));
  const [customOrderCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customOrders)
    .where(eq(customOrders.status, "new"));
  const [unreadMsgs] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contactMessages)
    .where(eq(contactMessages.read, false));
  const recent = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(8);
  res.json({
    orders: orderTotals,
    last30: recentOrders,
    pendingOrders: pendingOrders?.count ?? 0,
    products: productCount?.count ?? 0,
    customers: customerCount?.count ?? 0,
    newCustomOrders: customOrderCount?.count ?? 0,
    unreadMessages: unreadMsgs?.count ?? 0,
    recent,
  });
});

// ---------- Analytics ----------
router.get("/admin/analytics", async (_req, res) => {
  const daily = await db.execute(sql`
    select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
      count(*)::int as orders,
      coalesce(sum(total_kes), 0)::float as revenue
    from orders
    where created_at > now() - interval '30 days'
    group by 1
    order by 1
  `);
  const byCategory = await db.execute(sql`
    select p.category, count(oi.id)::int as items, coalesce(sum(oi.price_kes * oi.quantity), 0)::float as revenue
    from order_items oi
    left join products p on p.id = oi.product_id
    group by 1
    order by revenue desc
  `);
  const topProducts = await db.execute(sql`
    select oi.name, sum(oi.quantity)::int as qty, coalesce(sum(oi.price_kes * oi.quantity), 0)::float as revenue
    from order_items oi
    group by oi.name
    order by revenue desc
    limit 10
  `);
  res.json({ daily: daily.rows, byCategory: byCategory.rows, topProducts: topProducts.rows });
});

// ---------- Orders ----------
router.get("/admin/orders", async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : null;
  const list = status
    ? await db.select().from(orders).where(eq(orders.status, status)).orderBy(desc(orders.createdAt))
    : await db.select().from(orders).orderBy(desc(orders.createdAt));
  res.json(list);
});

router.get("/admin/orders/:id", async (req, res) => {
  const id = Number(req.params.id);
  const order = (await db.select().from(orders).where(eq(orders.id, id)).limit(1))[0];
  if (!order) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  res.json({ order, items });
});

const updateOrderSchema = z.object({
  status: z.enum(["pending", "confirmed", "baking", "ready", "out_for_delivery", "delivered", "cancelled"]).optional(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
  paymentRef: z.string().optional(),
});
router.patch("/admin/orders/:id", async (req, res) => {
  const id = Number(req.params.id);
  const parsed = updateOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const updated = await db
    .update(orders)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();
  res.json(updated[0] ?? null);
});

// ---------- POS: create in-store order ----------
const posOrderSchema = z.object({
  customerName: z.string().min(1),
  phone: z.string().optional(),
  paymentMethod: z.enum(["cash", "mpesa", "card"]).default("cash"),
  items: z.array(z.object({ productId: z.number().int(), quantity: z.number().int().positive() })).min(1),
});
router.post("/admin/pos/orders", async (req, res) => {
  const parsed = posOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const data = parsed.data;
  const dbProducts = await db.select().from(products);
  const byId = new Map(dbProducts.map((p) => [p.id, p]));
  let subtotal = 0;
  const itemRows = data.items.map((it) => {
    const p = byId.get(it.productId);
    if (!p) throw new Error(`Product ${it.productId} not found`);
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
  const orderNumber = `POS-${Date.now().toString(36).toUpperCase()}`;
  const inserted = await db
    .insert(orders)
    .values({
      orderNumber,
      customerName: data.customerName,
      phone: data.phone ?? "walk-in",
      fulfillment: "pickup",
      subtotalKes: String(subtotal),
      deliveryKes: "0",
      discountKes: "0",
      totalKes: String(subtotal),
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentMethod === "cash" ? "paid" : "pending",
      status: "delivered",
      channel: "pos",
    })
    .returning();
  const order = inserted[0]!;
  await db.insert(orderItems).values(itemRows.map((r) => ({ ...r, orderId: order.id })));
  res.status(201).json({ order, items: itemRows });
});

// ---------- Products ----------
const productSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  priceKes: z.union([z.number(), z.string()]),
  category: z.string().min(1),
  imageUrl: z.string().url(),
  featured: z.boolean().optional(),
  inStock: z.boolean().optional(),
  servings: z.string().optional().nullable(),
});
router.post("/admin/products", async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const inserted = await db
    .insert(products)
    .values({ ...parsed.data, priceKes: String(parsed.data.priceKes), servings: parsed.data.servings ?? null })
    .returning();
  res.status(201).json(inserted[0]);
});
router.patch("/admin/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const data: Record<string, unknown> = { ...parsed.data };
  if (data.priceKes !== undefined) data.priceKes = String(data.priceKes);
  const updated = await db.update(products).set(data).where(eq(products.id, id)).returning();
  res.json(updated[0] ?? null);
});
router.delete("/admin/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(products).where(eq(products.id, id));
  res.json({ ok: true });
});

// ---------- Gallery ----------
const gallerySchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  imageUrl: z.string().url(),
  productId: z.number().int().optional().nullable(),
});
router.post("/admin/gallery", async (req, res) => {
  const parsed = gallerySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const inserted = await db.insert(galleryItems).values(parsed.data).returning();
  res.status(201).json(inserted[0]);
});
router.delete("/admin/gallery/:id", async (req, res) => {
  await db.delete(galleryItems).where(eq(galleryItems.id, Number(req.params.id)));
  res.json({ ok: true });
});

// ---------- Custom Orders ----------
router.get("/admin/custom-orders", async (_req, res) => {
  const list = await db.select().from(customOrders).orderBy(desc(customOrders.createdAt));
  res.json(list);
});
router.patch("/admin/custom-orders/:id", async (req, res) => {
  const id = Number(req.params.id);
  const schema = z.object({
    status: z.enum(["new", "reviewing", "quoted", "approved", "in_production", "delivered", "cancelled"]).optional(),
    adminNotes: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const updated = await db.update(customOrders).set(parsed.data).where(eq(customOrders.id, id)).returning();
  res.json(updated[0] ?? null);
});

// ---------- Contact ----------
router.get("/admin/messages", async (_req, res) => {
  const list = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  res.json(list);
});
router.patch("/admin/messages/:id", async (req, res) => {
  const id = Number(req.params.id);
  const updated = await db
    .update(contactMessages)
    .set({ read: true })
    .where(eq(contactMessages.id, id))
    .returning();
  res.json(updated[0] ?? null);
});

// ---------- Reviews ----------
router.get("/admin/reviews", async (_req, res) => {
  const list = await db.select().from(reviews).orderBy(desc(reviews.createdAt));
  res.json(list);
});
router.patch("/admin/reviews/:id", async (req, res) => {
  const schema = z.object({ approved: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const updated = await db
    .update(reviews)
    .set({ approved: parsed.data.approved })
    .where(eq(reviews.id, Number(req.params.id)))
    .returning();
  res.json(updated[0] ?? null);
});
router.delete("/admin/reviews/:id", async (req, res) => {
  await db.delete(reviews).where(eq(reviews.id, Number(req.params.id)));
  res.json({ ok: true });
});

// ---------- Customers ----------
router.get("/admin/customers", async (_req, res) => {
  const list = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
      role: users.role,
      active: users.active,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "CUSTOMER"))
    .orderBy(desc(users.createdAt));
  res.json(list);
});

// ---------- Offers ----------
router.get("/admin/offers", async (_req, res) => {
  res.json(await db.select().from(offers).orderBy(desc(offers.createdAt)));
});
const offerSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  discountType: z.enum(["percent", "amount"]).default("percent"),
  discountValue: z.union([z.number(), z.string()]),
  minSubtotalKes: z.union([z.number(), z.string()]).optional(),
  active: z.boolean().optional(),
});
router.post("/admin/offers", async (req, res) => {
  const parsed = offerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const inserted = await db
    .insert(offers)
    .values({
      code: parsed.data.code.toUpperCase(),
      label: parsed.data.label,
      discountType: parsed.data.discountType,
      discountValue: String(parsed.data.discountValue),
      minSubtotalKes: String(parsed.data.minSubtotalKes ?? 0),
      active: parsed.data.active ?? true,
    })
    .returning();
  res.status(201).json(inserted[0]);
});
router.patch("/admin/offers/:id", async (req, res) => {
  const parsed = offerSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const data: Record<string, unknown> = { ...parsed.data };
  if (data.code) data.code = (data.code as string).toUpperCase();
  if (data.discountValue !== undefined) data.discountValue = String(data.discountValue);
  if (data.minSubtotalKes !== undefined) data.minSubtotalKes = String(data.minSubtotalKes);
  const updated = await db.update(offers).set(data).where(eq(offers.id, Number(req.params.id))).returning();
  res.json(updated[0] ?? null);
});
router.delete("/admin/offers/:id", async (req, res) => {
  await db.delete(offers).where(eq(offers.id, Number(req.params.id)));
  res.json({ ok: true });
});

// ---------- Staff ----------
router.get("/admin/staff", async (_req, res) => {
  const list = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
      role: users.role,
      active: users.active,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(sql`${users.role} <> 'CUSTOMER'`)
    .orderBy(desc(users.createdAt));
  res.json(list);
});
const staffSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
  phone: z.string().optional(),
});
router.post("/admin/staff", async (req, res) => {
  const parsed = staffSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const inserted = await db
    .insert(users)
    .values({
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      role: parsed.data.role,
      phone: parsed.data.phone ?? null,
    })
    .returning({ id: users.id, email: users.email, name: users.name, role: users.role });
  res.status(201).json(inserted[0]);
});
router.patch("/admin/staff/:id", async (req, res) => {
  const id = Number(req.params.id);
  const schema = z.object({
    name: z.string().optional(),
    role: z.enum(["ADMIN", "STAFF"]).optional(),
    active: z.boolean().optional(),
    phone: z.string().optional(),
    password: z.string().min(6).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.password) {
    data.passwordHash = await bcrypt.hash(parsed.data.password, 10);
    delete data.password;
  }
  const updated = await db.update(users).set(data).where(eq(users.id, id)).returning();
  res.json(updated[0] ?? null);
});
router.delete("/admin/staff/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.update(users).set({ active: false }).where(eq(users.id, id));
  res.json({ ok: true });
});

// ---------- Roles ----------
router.get("/admin/roles", async (_req, res) => {
  res.json(await db.select().from(roles).orderBy(roles.id));
});
const roleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  permissions: z.array(z.string()).default([]),
});
router.post("/admin/roles", async (req, res) => {
  const parsed = roleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const inserted = await db.insert(roles).values(parsed.data).returning();
  res.status(201).json(inserted[0]);
});
router.patch("/admin/roles/:id", async (req, res) => {
  const parsed = roleSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const updated = await db.update(roles).set(parsed.data).where(eq(roles.id, Number(req.params.id))).returning();
  res.json(updated[0] ?? null);
});
router.delete("/admin/roles/:id", async (req, res) => {
  await db.delete(roles).where(eq(roles.id, Number(req.params.id)));
  res.json({ ok: true });
});

// ---------- Settings ----------
router.get("/admin/settings", async (_req, res) => {
  const rows = await db.select().from(settings);
  const out: Record<string, unknown> = {};
  for (const r of rows) out[r.key] = r.value;
  res.json(out);
});
router.put("/admin/settings", async (req, res) => {
  const body = req.body ?? {};
  if (typeof body !== "object" || Array.isArray(body)) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  for (const [key, value] of Object.entries(body)) {
    await db
      .insert(settings)
      .values({ key, value: value as object, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: value as object, updatedAt: new Date() },
      });
  }
  res.json({ ok: true });
});

export default router;
