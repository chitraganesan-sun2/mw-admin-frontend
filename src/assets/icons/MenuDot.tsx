import * as React from "react";

const MenuDot = (props: React.HTMLAttributes<HTMLOrSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
  >
    <g fill="#000" clipPath="url(#clip0_563_670)">
      <path d="M2 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4M22 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4"></path>
    </g>
    <defs>
      <clipPath id="clip0_563_670">
        <path fill="#fff" d="M0 0h24v24H0z"></path>
      </clipPath>
    </defs>
  </svg>
);

export default MenuDot;
