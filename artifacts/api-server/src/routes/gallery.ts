import { Router, type IRouter } from "express";
import { db, galleryItems } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListGalleryQueryParams,
  ListGalleryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/gallery", async (req, res) => {
  const params = ListGalleryQueryParams.parse(req.query);
  const rows = params.category && params.category !== "all"
    ? await db
        .select()
        .from(galleryItems)
        .where(eq(galleryItems.category, params.category))
    : await db.select().from(galleryItems);
  res.json(
    ListGalleryResponse.parse(
      rows.map((g) => ({
        id: String(g.id),
        title: g.title,
        category: g.category,
        imageUrl: g.imageUrl,
        productId: g.productId ? String(g.productId) : undefined,
      })),
    ),
  );
});

export default router;
