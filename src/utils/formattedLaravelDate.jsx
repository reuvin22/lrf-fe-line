export const formattedLaravelDate = (time) => {
  if (!time) return null;

  const date = new Date(time);

  if (isNaN(date.getTime())) return null;

  return date.toISOString();
};