import { Router, type IRouter } from "express";
import { db, products } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListProductsQueryParams,
  ListProductsResponse,
  GetProductParams,
  GetProductResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function row(p: typeof products.$inferSelect) {
  return {
    id: String(p.id),
    slug: p.slug,
    name: p.name,
    description: p.description,
    priceKes: Number(p.priceKes),
    category: p.category,
    imageUrl: p.imageUrl,
    featured: p.featured,
    inStock: p.inStock,
    servings: p.servings ?? undefined,
  };
}

router.get("/products", async (req, res) => {
  const params = ListProductsQueryParams.parse(req.query);
  const filters = [];
  if (params.category && params.category !== "all") {
    filters.push(eq(products.category, params.category));
  }
  if (params.featured !== undefined) {
    filters.push(eq(products.featured, params.featured));
  }
  const rows = await db
    .select()
    .from(products)
    .where(filters.length ? and(...filters) : undefined);
  res.json(ListProductsResponse.parse(rows.map(row)));
});

router.get("/products/:id", async (req, res) => {
  const { id } = GetProductParams.parse(req.params);
  const numId = Number(id);
  const list = Number.isFinite(numId)
    ? await db.select().from(products).where(eq(products.id, numId))
    : await db.select().from(products).where(eq(products.slug, id));
  if (!list[0]) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(GetProductResponse.parse(row(list[0])));
});

export default router;
