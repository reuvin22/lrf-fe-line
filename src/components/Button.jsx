import React from "react";
import CircularProgress from "@mui/material/CircularProgress";

function Button({ buttonStyle, text, customButton = "", onClick, loading = false, disabled = false }) {
  let style = "";

  switch (buttonStyle) {
    case "primary":
      style = "bg-green-600 text-white py-3 hover:bg-green-500";
      break;
    case "secondary":
      style = "bg-gray-200 text-black py-3 hover:bg-gray-300";
      break;
    case "danger":
      style = "bg-red-600 text-white py-4 hover:bg-red-700";
      break;
    case "active":
      style = "bg-green-600 text-white py-3 hover:bg-green-500";
      break;
    default:
      style = "bg-gray-200 text-black py-3 hover:bg-gray-300";
  }

  const disabledStyle = disabled || loading ? "opacity-70 cursor-not-allowed" : "";

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full rounded-xl font-semibold cursor-pointer flex justify-center items-center ${style} ${disabledStyle} ${customButton}`}
    >
      {loading ? <CircularProgress size={20} color="inherit" /> : text}
    </button>
  );
}

export default Button;