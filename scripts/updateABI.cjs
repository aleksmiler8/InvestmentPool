const fs = require("fs");
const path = require("path");

const artifact = path.join(
  __dirname,
  "../artifacts/contracts/InvestmentPoolV2.sol/InvestmentPoolV2.json"
);

const frontend = path.join(
  __dirname,
  "../frontend/src/contracts/InvestmentPoolABI.ts"
);

const json = JSON.parse(fs.readFileSync(artifact, "utf8"));

const content =
`export const InvestmentPoolABI = ${JSON.stringify(json.abi, null, 2)};\n`;

fs.writeFileSync(frontend, content);

console.log("✅ InvestmentPoolABI.ts updated");