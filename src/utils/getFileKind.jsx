export const getFileKind = (name = "", mimeType = "") => {
  const lower = String(name || "").toLowerCase();
  const type = String(mimeType || "").toLowerCase();

  if (type.startsWith("image/") || /\.(png|jpe?g|gif|webp|heic|bmp)(\?|#|$)/.test(lower)) {
    return "image";
  }
  if (type === "application/pdf" || /\.pdf(\?|#|$)/.test(lower)) {
    return "pdf";
  }
  if (type.includes("word") || /\.docx?(\?|#|$)/.test(lower)) {
    return "word";
  }
  if (type.includes("sheet") || type.includes("excel") || /\.xlsx?(\?|#|$)/.test(lower)) {
    return "excel";
  }
  if (type === "text/csv" || /\.csv(\?|#|$)/.test(lower)) {
    return "csv";
  }
  return "other";
};
