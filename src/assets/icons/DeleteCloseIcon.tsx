import * as React from "react";

const DeleteCloseIcon: React.FC<React.SVGProps<SVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.width || "24"}
    height={props.height || "24"}
    fill="none"
    viewBox="0 0 24 24"
  >
    <g clipPath="url(#clip0_790_11665)">
      <path
        fill="#B91C1C"
        d="m22.241 5.272-3.515-3.515A5.96 5.96 0 0 0 14.484 0H9.513A5.97 5.97 0 0 0 5.27 1.757L1.755 5.272A5.97 5.97 0 0 0-.002 9.515v4.971c0 1.602.624 3.109 1.757 4.243l3.515 3.515a5.97 5.97 0 0 0 4.243 1.757h4.971a5.96 5.96 0 0 0 4.242-1.757l3.515-3.514a5.96 5.96 0 0 0 1.758-4.243V9.516a5.96 5.96 0 0 0-1.758-4.244m-5.803 9.789a.999.999 0 1 1-1.414 1.414l-3.043-3.043-3.043 3.043a.997.997 0 0 1-1.414 0 1 1 0 0 1 0-1.414l3.043-3.043-3.043-3.043a.999.999 0 1 1 1.414-1.414l3.043 3.043 3.043-3.043a.999.999 0 1 1 1.414 1.414l-3.043 3.043z"
      ></path>
    </g>
    <defs>
      <clipPath id="clip0_790_11665">
        <path fill="#fff" d="M0 0h24v24H0z"></path>
      </clipPath>
    </defs>
  </svg>
);

export default DeleteCloseIcon;
