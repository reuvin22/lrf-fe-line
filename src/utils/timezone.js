export const TZ = "Asia/Tokyo";

/**
 * Today's date in JST as "YYYY-MM-DD".
 * Safe when the device is set to any timezone.
 */
export const todayJST = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: TZ });

/**
 * Current JST date parts: { year, month (0-indexed), day }.
 * Use for calendar "today" highlighting and deadline math.
 */
export const nowPartsJST = () => {
  const [year, month, day] = todayJST().split("-").map(Number);
  return { year, month: month - 1, day };
};
