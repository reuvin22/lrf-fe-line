import { TZ } from "./timezone";

export default function formattedDate(year, month, day) {
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("ja-JP", {
    timeZone: TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
