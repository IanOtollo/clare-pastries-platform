import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import customOrdersRouter from "./custom-orders";
import contactRouter from "./contact";
import reviewsRouter from "./reviews";
import galleryRouter from "./gallery";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(customOrdersRouter);
router.use(contactRouter);
router.use(reviewsRouter);
router.use(galleryRouter);
router.use(statsRouter);

export default router;
