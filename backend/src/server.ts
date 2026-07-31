import express from "express";
import cors from "cors";
import axios from "axios";
import pancakeRouter from "./routes/pancake";
import beefyRoutes from "./routes/beefy";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/pancakeswap", pancakeRouter);
app.use("/api/beefy", beefyRoutes);

app.get("/", (_, res) => {
  res.json({
    project: "Investment Pool Backend",
    status: "running",
    version: "1.0.0"
  });
});

app.get("/api/health", (_, res) => {
  res.json({
    ok: true,
    time: new Date()
  });
});
app.get("/api/pancakeswap/pools", async (_, res) => {
  try {
    const query = `
    {
      pools(
        first: 20,
        orderBy: totalValueLockedUSD,
        orderDirection: desc
      ) {
        id
        feeTier
        totalValueLockedUSD
        volumeUSD

        token0 {
          symbol
        }

        token1 {
          symbol
        }
      }
    }`;

    const response = await axios.post(
      "https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc",
      {
        query,
      }
    );

    res.json(response.data);
   } catch (error: any) {
  console.error("PancakeSwap Error:");

  if (error.response) {
    console.error(error.response.status);
    console.error(error.response.data);
  } else {
    console.error(error.message);
  }

  res.status(500).json({
    error: "Failed to load PancakeSwap pools",
  });
}
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(
    `Investment Pool Backend running on http://localhost:${PORT}`
  );
});