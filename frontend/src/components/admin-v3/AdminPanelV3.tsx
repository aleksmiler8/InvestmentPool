import SystemPanel from "./SystemPanel";
import LiquidityPanel from "./LiquidityPanel";
import VenusMarketsPanel from "./VenusMarketsPanel";
import InvestmentRecommendationsPanel from "./InvestmentRecommendationsPanel";
import PancakePoolsPanel from "./PancakePoolsPanel";
import BeefyVaultsPanel from "./BeefyVaultsPanel";
import SwapAdminPanel from "./SwapAdminPanel";

export default function AdminPanelV3() {
  return (
    <div
      style={{
        marginTop: "40px",
        padding: "25px",
        borderRadius: "16px",
        background: "#eef6ff",
        border: "2px solid #3b82f6",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          color: "#1d4ed8",
        }}
      >
        🚀 Investment Pool V3
      </h2>

      <SystemPanel />
      <SwapAdminPanel />
<LiquidityPanel />
<VenusMarketsPanel />
<PancakePoolsPanel />
<BeefyVaultsPanel />
<InvestmentRecommendationsPanel />
    </div>
  );
}