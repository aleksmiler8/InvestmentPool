import { protocolRegistry } from "./protocolRegistry";
import type { ProtocolAdapter } from "./types";

export class ProtocolFactory {
  /**
   * Создать и зарегистрировать адаптер
   */
  async register(adapter: ProtocolAdapter): Promise<void> {
    await protocolRegistry.registerAsync(adapter);
  }

  /**
   * Зарегистрировать несколько адаптеров
   */
  async registerAll(adapters: ProtocolAdapter[]): Promise<void> {
    for (const adapter of adapters) {
      await this.register(adapter);
    }
  }
}

export const protocolFactory = new ProtocolFactory();