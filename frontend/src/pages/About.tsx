import { useNavigate } from "react-router-dom";

export default function About() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "850px",
          maxWidth: "100%",
          background: "#ffffff",
          border: "1px solid #dddddd",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          padding: "40px",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#16b6b6",
            fontSize: "42px",
            marginBottom: "10px",
            fontWeight: "700",
          }}
        >
          Investment Pool
        </h1>

        <h2
          style={{
            textAlign: "center",
            color: "#555",
            marginBottom: "8px",
          }}
        >
          About Investment Pool
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#888",
            fontSize: "18px",
            marginBottom: "35px",
          }}
        >
          Smart Blockchain Investment Platform
        </p>

        <h3 style={{ color: "#16b6b6" }}>
          О платформе
        </h3>

        <p style={{ lineHeight: "1.8" }}>
          Investment Pool — это децентрализованная инвестиционная
          платформа, работающая на блокчейне BNB Smart Chain.
        </p>

        <p style={{ lineHeight: "1.8" }}>
          Платформа использует смарт-контракт для автоматического
          выполнения всех инвестиционных операций без участия третьих лиц.
        </p>

        <hr
          style={{
            margin: "30px 0",
            border: "none",
            borderTop: "1px solid #eeeeee",
          }}
        />

        <h3 style={{ color: "#16b6b6" }}>
          Основные принципы
        </h3>

        <p>✔ Все инвестиции управляются смарт-контрактом.</p>

        <p>✔ Все операции записываются в блокчейн и являются прозрачными.</p>

        <p>
          ✔ Вознаграждение рассчитывается автоматически в соответствии с выбранным инвестиционным периодом.
        </p>

        <p>
          ✔ Пользователь полностью контролирует свои средства с помощью собственного криптовалютного кошелька.
        </p>

        <hr
          style={{
            margin: "30px 0",
            border: "none",
            borderTop: "1px solid #eeeeee",
          }}
        />

        <h3 style={{ color: "#16b6b6" }}>
          Безопасность
        </h3>

        <p>
          Investment Pool не хранит средства пользователей.
        </p>

        <p>
          Платформа не имеет доступа к приватным ключам,
          seed-фразам или средствам пользователей.
        </p>

        <p>
          Все транзакции подтверждаются владельцем кошелька и
          выполняются напрямую через смарт-контракт.
        </p>

        <hr
          style={{
            margin: "30px 0",
            border: "none",
            borderTop: "1px solid #eeeeee",
          }}
        />

        <h3 style={{ color: "#16b6b6" }}>
          Наша цель
        </h3>

        <p style={{ lineHeight: "1.8" }}>
          Создать простую, прозрачную и безопасную инвестиционную платформу,
          основанную на технологии блокчейн.
        </p>

        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: "40px",
            width: "100%",
            padding: "14px",
            border: "none",
            borderRadius: "10px",
            background: "#16b6b6",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          ← Назад
        </button>

        <p
          style={{
            textAlign: "center",
            color: "#999",
            marginTop: "25px",
            fontSize: "13px",
          }}
        >
          © Investment Pool
        </p>
      </div>
    </div>
  );
}