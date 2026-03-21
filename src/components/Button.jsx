import React from "react";

function Button({ buttonStyle, text, customButton = "", onClick }) {
  let style = "";

  switch (buttonStyle) {
    case "primary":
      style = "bg-green-600 text-white py-3 hover:bg-green-300";
      break;

    case "secondary":
      style = "bg-gray-200 text-black py-3 hover:bg-gray-300";
      break;

    case "danger":
      style = "bg-red-600 text-white py-4 hover:bg-red-700";
      break;

    case "active":
      style = "bg-green-600 text-white py-3 hover:bg-green-300";
      break;

    default:
      style = "bg-gray-200 text-black py-3 hover:bg-gray-300";
  }

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl font-semibold cursor-pointer ${style} ${customButton}`}
    >
      {text}
    </button>
  );
}

export default Button;