import { useTranslation } from "react-i18next";

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: "8px",
        fontSize: "16px",
        marginBottom: "20px",
      }}
    >
      <option value="ru">🇷🇺 Русский</option>
      <option value="en">🇬🇧 English</option>
      <option value="de">🇩🇪 Deutsch</option>
      <option value="uk">🇺🇦 Українська</option>
      <option value="pl">🇵🇱 Polski</option>
      <option value="es">🇪🇸 Español</option>
      <option value="fr">🇫🇷 Français</option>
      <option value="it">🇮🇹 Italiano</option>
      <option value="tr">🇹🇷 Türkçe</option>
      <option value="hu">🇭🇺 Magyar</option>
    </select>
  );
}