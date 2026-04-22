import { Router, type IRouter } from "express";
import { db, products, reviews } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats", async (_req, res) => {
  const allProducts = await db.select().from(products);
  const allReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.approved, true));
  const avg = allReviews.length
    ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
    : 0;
  res.json(
    GetStatsResponse.parse({
      totalProducts: allProducts.length,
      featuredCount: allProducts.filter((p) => p.featured).length,
      avgRating: Number(avg.toFixed(1)),
      deliveryMins: "45-90",
      cityServed: "Busia Town",
    }),
  );
});

export default router;
