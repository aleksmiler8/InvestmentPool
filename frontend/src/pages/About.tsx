import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function About() {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
          {t("about_title")}
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#888",
            fontSize: "18px",
            marginBottom: "35px",
          }}
        >
          {t("about_subtitle")}
        </p>

        <h3 style={{ color: "#16b6b6" }}>
          {t("about_platform")}
        </h3>

        <p style={{ lineHeight: "1.8" }}>
          {t("about_platform_text1")}
        </p>

        <p style={{ lineHeight: "1.8" }}>
          {t("about_platform_text2")}
        </p>

        <hr
          style={{
            margin: "30px 0",
            border: "none",
            borderTop: "1px solid #eeeeee",
          }}
        />

        <h3 style={{ color: "#16b6b6" }}>
          {t("about_principles")}
        </h3>

        <p>✔ {t("about.principle1")}</p>

        <p>✔ {t("about_principle2")}</p>

        <p>✔ {t("about_principle3")}</p>

        <p>✔ {t("about_principle4")}</p>

        <hr
          style={{
            margin: "30px 0",
            border: "none",
            borderTop: "1px solid #eeeeee",
          }}
        />

        <h3 style={{ color: "#16b6b6" }}>
          {t("about_security")}
        </h3>

        <p>{t("about_security_text1")}</p>

        <p>{t("about_security_text2")}</p>

        <p>{t("about_security_text3")}</p>

        <hr
          style={{
            margin: "30px 0",
            border: "none",
            borderTop: "1px solid #eeeeee",
          }}
        />

        <h3 style={{ color: "#16b6b6" }}>
          {t("about_goal")}
        </h3>

        <p style={{ lineHeight: "1.8" }}>
          {t("about_goal_text")}
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
          {t("back")}
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