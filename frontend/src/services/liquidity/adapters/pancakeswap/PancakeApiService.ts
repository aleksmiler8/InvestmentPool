import axios from "axios";
import type { PancakePool } from "./types";

export class PancakeApiService {
  async getPools(): Promise<PancakePool[]> {
    const { data } = await axios.get("/api/pancakeswap/pools");
    return data;
  }
}

export const pancakeApiService = new PancakeApiService();