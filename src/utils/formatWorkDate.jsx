import { TZ } from "./timezone";

const formatWorkDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString("ja-JP", {
    timeZone: TZ,
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

export default formatWorkDate;
