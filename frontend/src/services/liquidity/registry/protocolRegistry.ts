import type {
  ProtocolAdapter,
  ProtocolId,
  RegisteredProtocol,
} from "./types";

export class ProtocolRegistry {
  private protocols = new Map<ProtocolId, RegisteredProtocol>()
  async registerAsync(adapter: ProtocolAdapter): Promise<void> {
    const info = await adapter.getInfo();

    this.protocols.set(info.id, {
      info,
      adapter,
    });
  }

  /**
   * Получить протокол по ID
   */
  get(id: ProtocolId): RegisteredProtocol | undefined {
    return this.protocols.get(id);
  }

  /**
   * Получить список всех протоколов
   */
  getAll(): RegisteredProtocol[] {
    return [...this.protocols.values()];
  }

  /**
   * Проверить регистрацию
   */
  has(id: ProtocolId): boolean {
    return this.protocols.has(id);
  }

  /**
   * Удалить протокол
   */
  remove(id: ProtocolId): boolean {
    return this.protocols.delete(id);
  }

  /**
   * Количество зарегистрированных протоколов
   */
  count(): number {
    return this.protocols.size;
  }

  /**
   * Очистить реестр
   */
  clear(): void {
    this.protocols.clear();
  }
}

export const protocolRegistry = new ProtocolRegistry();