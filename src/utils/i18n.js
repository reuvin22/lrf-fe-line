import environment from "../environment";

// "ja" is the default. Set VITE_LANG=en in .env to switch to English.
const lang = environment.VITE_LANG === "en" ? "en" : "ja";

const translations = {
  // Segment types
  TRAVEL:        { ja: "移動",     en: "Travel" },
  OFFICE:        { ja: "事務所",   en: "Office" },
  SITE:          { ja: "現場",     en: "Site" },

  // OCR statuses
  NEEDS_REVIEW:  { ja: "要確認",   en: "Needs Review" },
  CONFIRMED:     { ja: "承認済み", en: "Confirmed" },
  REJECTED:      { ja: "却下",     en: "Rejected" },
  ERROR:         { ja: "エラー",   en: "Error" },
  PENDING:       { ja: "処理中",   en: "Pending" },

  // Document types
  INVOICE:           { ja: "請求書",           en: "Invoice" },
  MONTHLY_STATEMENT: { ja: "月締め合計請求書", en: "Monthly Statement" },
  QUOTATION:         { ja: "見積書",           en: "Quotation" },
  OTHER:             { ja: "その他",           en: "Other" },
};

/**
 * Translate a key to the current language.
 * Falls back to the raw key if no translation exists.
 * @param {string} key
 * @returns {string}
 */
export function t(key) {
  return translations[key]?.[lang] ?? key;
}

export { lang };
