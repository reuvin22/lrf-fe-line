const DEFAULT_CLOSING_DAY = 10;

// The closing day (admin-configurable via the "closing_day" system setting)
// repeats every month and marks a rolling cycle boundary: the most recent
// occurrence of that day, on or before today, is the cutoff. Any record dated
// on or before the cutoff is locked (view-only) — including old past months —
// and stays locked until the *next* occurrence of the closing day rolls the
// cutoff forward.
export const isAttendanceEditable = (workDate, closingDay = DEFAULT_CLOSING_DAY, now = new Date()) => {
  if (!workDate) return true;

  const [year, month, day] = String(workDate).split("-").map(Number);
  if (!year || !month || !day) return true;

  const cutoffDay = Number.isFinite(closingDay) && closingDay >= 1 && closingDay <= 31
    ? closingDay
    : DEFAULT_CLOSING_DAY;

  const recordDate = new Date(year, month - 1, day);

  // Most recent occurrence of the closing day that is on or before today.
  const cutoff = now.getDate() >= cutoffDay
    ? new Date(now.getFullYear(), now.getMonth(), cutoffDay, 23, 59, 59, 999)
    : new Date(now.getFullYear(), now.getMonth() - 1, cutoffDay, 23, 59, 59, 999);

  return recordDate.getTime() > cutoff.getTime();
};

export const isSiteLeader = (siteAssignments = []) =>
  siteAssignments.some((assignment) => !!assignment?.is_leader);
