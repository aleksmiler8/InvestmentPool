import { protocolRegistry } from "./registry";

export class ProtocolRegistryService {
  getProtocols() {
    return protocolRegistry.getAll().map((protocol) => {
      const info = protocol.info;

      return {
        id: info.id,
        name: info.name,
        status: info.status,
        allocation: 0,
      };
    });
  }
}

export const protocolRegistryService = new ProtocolRegistryService();