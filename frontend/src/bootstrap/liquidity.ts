import { protocolFactory } from "../services/liquidity/registry";
import { VenusAdapter } from "../services/liquidity/adapters/venus";

let initialized = false;

export async function bootstrapLiquidity() {
  if (initialized) return;

  initialized = true;

  await protocolFactory.register(
    new VenusAdapter()
  );
}