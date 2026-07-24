import type { MarketInfo } from "./types";
import { protocolRegistry } from "../registry";

export class MarketAnalyzer {
  /**
   * Получить все рынки всех подключенных протоколов
   */
  async getMarkets(): Promise<MarketInfo[]> {
    const markets: MarketInfo[] = [];

    const protocols = protocolRegistry.getAll();

    for (const protocol of protocols) {
      const protocolMarkets = await protocol.adapter.getMarkets();

      markets.push(...(protocolMarkets as MarketInfo[]));
    }

    return markets;
  }

  /**
   * Получить рынки одного протокола
   */
  async getProtocolMarkets(protocolId: string): Promise<MarketInfo[]> {
    const protocol = protocolRegistry.get(protocolId as never);

    if (!protocol) {
      return [];
    }

    return (await protocol.adapter.getMarkets()) as MarketInfo[];
  }
}

export const marketAnalyzer = new MarketAnalyzer();