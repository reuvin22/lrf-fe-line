import { TZ } from "./timezone";

export const formattedTime = (dateString) => {
  if (!dateString) return "...";

  const date = new Date(dateString);

  return date.toLocaleTimeString("ja-JP", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });
};
