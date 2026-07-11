import { useNavigate } from "react-router-dom";
import LanguageSelector from "../components/LanguageSelector";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          width: "520px",
          padding: "30px",
          border: "1px solid #d9d9d9",
          borderRadius: "12px",
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        <h2
  style={{
    color: "#16b6b6",
    marginBottom: "10px",
    fontSize: "48px",
    fontWeight: "bold",
  }}
>
  Investment Pool
</h2>

        <h3>Добро пожаловать</h3>
        <p
  style={{
    color: "#555",
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "15px",
  }}
>
  Smart Blockchain Investment Platform
</p>

        <p>
          Перед использованием платформы выберите язык и ознакомьтесь с правилами.
        </p>
        <div
  style={{
    textAlign: "left",
    marginTop: "20px",
    marginBottom: "20px",
    color: "#444",
    lineHeight: "1.8",
  }}
>
  <div>✔ Secure Smart Contract</div>
  <div>✔ Flexible Investment Plans</div>
  <div>✔ Transparent Reward System</div>
</div>

        <br />

        <LanguageSelector />

        <br />
        <br />

        <button
          onClick={() => {
            const accepted = localStorage.getItem("acceptedRules");

            if (accepted === "true") {
              navigate("/home");
            } else {
              navigate("/rules");
            }
          }}
          style={{
            width: "100%",
            padding: "12px",
            background: "#16b6b6",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          Продолжить
        </button>

        <p
          style={{
            marginTop: "20px",
            color: "#888888",
            fontSize: "13px",
          }}
        >
          © Investment Pool
        </p>
      </div>
    </div>
  );
}