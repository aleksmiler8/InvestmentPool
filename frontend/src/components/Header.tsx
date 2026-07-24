import LanguageSelector from "./LanguageSelector";
import WalletButton from "./WalletButton";
import { useNavigate } from "react-router-dom";

type HeaderProps = {
  wallet: string;
  bnbBalance: string;
  usdtBalance: string;
};

export default function Header({
  wallet,
  bnbBalance,
  usdtBalance,
}: HeaderProps) {
  const navigate = useNavigate();

  const shortWallet =
    wallet && wallet.length > 10
      ? wallet.slice(0, 6) + "..." + wallet.slice(-4)
      : wallet;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e5e5",
        borderRadius: "12px",
        padding: "20px",
        width: "100%",
        boxSizing: "border-box",
        marginBottom: "30px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "24px",
          width: "100%",
        }}
      >
        <div
          style={{
            flex: "1 1 320px",
            minWidth: 0,
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#16b6b6",
            }}
          >
            Investment Pool
          </h2>

          <div
            style={{
              marginTop: "15px",
              width: "100%",
              maxWidth: "320px",
            }}
          >
            <WalletButton />
          </div>

          {wallet && (
            <>
              <div
                style={{
                  marginTop: "15px",
                  fontWeight: "bold",
                  wordBreak: "break-word",
                }}
              >
                👛 {shortWallet}
              </div>

              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  rowGap: "8px",
                  fontSize: "15px",
                  fontWeight: "bold",
                }}
              >
                <div>💰 BNB: {Number(bnbBalance).toFixed(4)}</div>
                <div>🪙 USDT: {Number(usdtBalance).toFixed(4)}</div>
              </div>

              <button
                onClick={() => navigate("/swap")}
                style={{
                  marginTop: "20px",
                  width: "100%",
                  maxWidth: "220px",
                  padding: "10px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#16b6b6",
                  color: "#ffffff",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                ⇄ Swap
              </button>
            </>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "15px",
            flex: "0 1 220px",
            minWidth: "160px",
          }}
        >
          <LanguageSelector />

          <button
            onClick={() => navigate("/about")}
            style={{
              background: "transparent",
              border: "none",
              color: "#16b6b6",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              padding: "6px 0",
            }}
          >
            About
          </button>
        </div>
      </div>
    </div>
  );
}