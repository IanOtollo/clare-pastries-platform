import { Router, type IRouter } from "express";
import { db, reviews } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListReviewsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reviews", async (_req, res) => {
  const rows = await db.select().from(reviews).where(eq(reviews.approved, true));
  res.json(
    ListReviewsResponse.parse(
      rows.map((r) => ({
        id: String(r.id),
        author: r.author,
        rating: r.rating,
        body: r.body,
        location: r.location ?? undefined,
        createdAt: r.createdAt.toISOString(),
      })),
    ),
  );
});

export default router;
