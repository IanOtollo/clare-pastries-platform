import { Router, type IRouter } from "express";
import cookieParser from "cookie-parser";
import healthRouter from "./health";
import productsRouter from "./products";
import customOrdersRouter from "./custom-orders";
import contactRouter from "./contact";
import reviewsRouter from "./reviews";
import galleryRouter from "./gallery";
import statsRouter from "./stats";
import authRouter from "./auth";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import settingsPublicRouter from "./settings-public";
import { attachUser } from "../lib/auth";

const router: IRouter = Router();

router.use(cookieParser());
router.use(attachUser);

router.use(healthRouter);
router.use(productsRouter);
router.use(customOrdersRouter);
router.use(contactRouter);
router.use(reviewsRouter);
router.use(galleryRouter);
router.use(statsRouter);
router.use(authRouter);
router.use(ordersRouter);
router.use(settingsPublicRouter);
router.use(adminRouter);

export default router;
