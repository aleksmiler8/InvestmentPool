import { Router } from "express";
import { pancakeService } from "../services/PancakeService";

const router = Router();

router.get("/pools", async (_, res) => {
  try {
    const pools = await pancakeService.getPools();
    res.json(pools);
  } catch (error: any) {
    console.error("PancakeService error:");
    console.error(error.response?.data || error.message || error);

    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;