export const parseImagePaths = (source) => {
  let raw = source;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("[")) {
      try {
        raw = JSON.parse(trimmed);
      } catch {
        raw = [raw];
      }
    } else {
      raw = [raw];
    }
  }

  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];

  return list
    .filter(Boolean)
    .map((p) =>
      String(p)
        .replace(/\\\//g, "/")
        .replace(/^(https?):\/(?!\/)/, "$1://")
    );
};
