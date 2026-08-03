import { useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../components/LanguageSelector";

type RulesProps = {
  onContinue: () => void;
};

export default function Rules({ onContinue }: RulesProps) {
  const [accepted, setAccepted] = useState(false);
  const { t } = useTranslation();
  const rules = [
  t("rules.rule1"),
  t("rules.rule2"),
  t("rules.rule3"),
  t("rules.rule4"),
  t("rules.rule5"),
  t("rules.rule6"),
  t("rules.rule7"),
  t("rules.rule8"),
];

const info = [
  t("rules.info1"),
  t("rules.info2"),
  t("rules.info3"),
];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "700px",
          maxWidth: "100%",
          background: "#ffffff",
          border: "1px solid #dddddd",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          padding: "35px",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#16b6b6",
            marginBottom: "10px",
          }}
        >
          <LanguageSelector />
          📄 Investment Pool
        </h1>

        <h2
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          {t("rules_title")}
        </h2>

        <p
          style={{
            textAlign: "center",
            marginBottom: "30px",
            color: "#555555",
          }}
        >
          {t("rules_subtitle")}
        </p>

        <div
          style={{
            border: "1px solid #dcdcdc",
            borderRadius: "10px",
            padding: "20px",
            background: "#fafafa",
            lineHeight: "1.8",
          }}
        >
          {rules.map((rule, index) => (
  <p key={index}>
    <strong>{index + 1}.</strong> {rule}
  </p>
))}
        </div>

        <div
          style={{
            marginTop: "30px",
            padding: "15px",
            background: "#f8f8f8",
            borderRadius: "10px",
            border: "1px solid #e5e5e5",
            fontSize: "14px",
            color: "#666666",
            lineHeight: "1.7",
          }}
        >
          <strong>{t("information")}</strong>

          {info.map((text, index) => (
  <p
    key={index}
    style={index === 0 ? { marginTop: "10px" } : undefined}
  >
    {text}
  </p>
))}
        </div>

        <div
          style={{
            marginTop: "30px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <input
            type="checkbox"
            id="acceptRules"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            style={{
              width: "18px",
              height: "18px",
              cursor: "pointer",
            }}
          />

          <label
            htmlFor="acceptRules"
            style={{
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            {t("accept_rules")}
          </label>
        </div>
                <button
          onClick={onContinue}
          disabled={!accepted}
          style={{
            width: "100%",
            marginTop: "30px",
            padding: "14px",
            border: "none",
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: accepted ? "pointer" : "not-allowed",
            background: accepted ? "#16b6b6" : "#bfbfbf",
            color: "#ffffff",
            transition: "0.2s",
          }}
        >
          {t("continue")}
        </button>

        <p
          style={{
            marginTop: "20px",
            textAlign: "center",
            color: "#888888",
            fontSize: "13px",
            lineHeight: "1.6",
          }}
        >
          © Investment Pool
          <br />
          {t("copyright")}
        </p>
      </div>
    </div>
  );
}