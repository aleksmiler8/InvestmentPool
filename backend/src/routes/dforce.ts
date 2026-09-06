import { Router } from "express";
import { dforceService } from "../services/DForceService";

const router = Router();

router.get("/markets", async (_, res) => {
  try {
    const markets = await dforceService.getMarkets();
    res.json({ supplyMarkets: markets });
  } catch (error: any) {
    console.error("DForce API error:", error);
    res.status(500).json({
      error: error?.message || "Failed to load DForce markets",
    });
  }
});

export default router;
