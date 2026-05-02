import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import v1Router from "./v1.js";
import downloadRouter from "./download.js";
import docsRouter from "./docs.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(v1Router);
router.use(downloadRouter);
router.use(docsRouter);

export default router;
