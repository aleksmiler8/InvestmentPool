import { Router } from "express";
import { beefyService } from "../services/BeefyService";

const router = Router();

router.get("/vaults", async (_, res) => {
  try {
    const vaults = await beefyService.getVaults();
    res.json(vaults);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;