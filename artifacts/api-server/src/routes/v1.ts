import { Router, type IRouter, type Request, type Response } from "express";
import { processQuery } from "../controllers/downloader.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

router.get("/v1/q", async (req: Request, res: Response) => {
  const query = req.query["q"];

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    res.status(400).json({
      status: false,
      error: "Missing or invalid query parameter 'q'",
    });
    return;
  }

  const sanitized = query.trim().slice(0, 500);

  try {
    const result = await processQuery(sanitized, req);
    res.json(result);
  } catch (err) {
    logger.error({ err, query: sanitized }, "Download processing failed");
    res.status(500).json({
      status: false,
      error:
        err instanceof Error
          ? err.message
          : "Invalid input, video not found, or processing failed",
    });
  }
});

export default router;
