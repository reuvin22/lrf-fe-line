const formatWorkDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

export default formatWorkDate;