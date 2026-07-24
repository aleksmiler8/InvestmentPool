import { protocolRegistry } from "./registry";

export interface ProtocolStatus {
  id: string;
  name: string;
  status: "connected" | "coming-soon" | "offline";
  allocation: number;
}

class LiquidityService {
  getProtocols(): ProtocolStatus[] {
    return protocolRegistry.getAll().map((protocol) => ({
      id: protocol.info.id,
      name: protocol.info.name,
      status:
        protocol.info.status === "active"
          ? "connected"
          : protocol.info.status === "maintenance"
          ? "offline"
          : "coming-soon",
      allocation: 0,
    }));
  }
}

export const liquidityService = new LiquidityService();