import * as React from "react";

const DeleteIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="40"
    height="40"
    fill="none"
    viewBox="0 0 40 40"
  >
    <rect
      width="39.167"
      height="39.167"
      x="0.417"
      y="0.417"
      fill="#fff"
      rx="12.083"
    ></rect>
    <rect
      width="39.167"
      height="39.167"
      x="0.417"
      y="0.417"
      stroke="#E6E6E6"
      strokeWidth="0.833"
      rx="12.083"
    ></rect>
    <path
      stroke="#DC2626"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.667"
      d="M12.5 15h15M25.833 15v11.667c0 .833-.833 1.666-1.666 1.666h-8.334c-.833 0-1.666-.833-1.666-1.666V15M16.667 15v-1.667c0-.833.833-1.667 1.666-1.667h3.334c.833 0 1.666.834 1.666 1.667V15M18.333 19.167v5M21.667 19.167v5"
    ></path>
  </svg>
);

export default DeleteIcon;
