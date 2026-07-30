import { getContract } from "../../contracts/InvestmentPool";
import toast from "react-hot-toast";

export default function SystemPanel() {
  const pauseContract = async () => {
    try {
      const contract = await getContract();

      const tx = await contract.pause();
      await tx.wait();

      toast.success("Contract paused");
    } catch (e) {
      console.log(e);
      toast.error("Pause failed");
    }
  };

  const resumeContract = async () => {
    try {
      const contract = await getContract();

      const tx = await contract.unpause();
      await tx.wait();

      toast.success("Contract resumed");
    } catch (e) {
      console.log(e);
      toast.error("Resume failed");
    }
  };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "14px",
        padding: "20px",
        background: "#ffffff",
        marginTop: "20px",
      }}
    >
      <h3 style={{ marginTop: 0 }}>
        ⚙ Contract
      </h3>

      <p>
        🌐 Network: <b>BNB Mainnet</b>
      </p>

      <p>
        🚀 Investment Pool: <b>Version 3</b>
      </p>

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginTop: "20px",
        }}
      >
        <button
          onClick={pauseContract}
          style={{
            padding: "12px 24px",
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ⛔ Pause
        </button>

        <button
          onClick={resumeContract}
          style={{
            padding: "12px 24px",
            background: "#22c55e",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ▶ Resume
        </button>
      </div>
    </div>
  );
}