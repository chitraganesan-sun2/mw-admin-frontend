import * as React from "react";

const VolunteerIcon = (props: React.HTMLAttributes<HTMLOrSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 20 20"
    {...props}
  >
    <g clipPath="url(#clip0_1922_2289)">
      <path
        fill="currentColor"
        d="M12.71 16.5c0 1.083-1.294 2.596-2.1 3.27a.98.98 0 0 1-1.258 0c-.806-.674-2.1-2.187-2.1-3.27 0-.828.611-1.5 1.365-1.5.753 0 1.364.672 1.364 1.5 0-.828.61-1.5 1.364-1.5.753 0 1.364.672 1.364 1.5M5 5c0-2.757 2.242-5 5-5s5 2.243 5 5-2.242 5-5 5-5-2.242-5-5m1.667 0A3.337 3.337 0 0 0 10 8.333 3.337 3.337 0 0 0 13.333 5 3.337 3.337 0 0 0 10 1.667 3.337 3.337 0 0 0 6.667 5M10 11.667c-4.136 0-7.5 3.365-7.5 7.5a.833.833 0 1 0 1.667 0A5.84 5.84 0 0 1 10 13.333a5.84 5.84 0 0 1 5.833 5.834.833.833 0 1 0 1.667 0c0-4.135-3.364-7.5-7.5-7.5"
      ></path>
    </g>
    <defs>
      <clipPath id="clip0_1922_2289">
        <path fill="#fff" d="M0 0h20v20H0z"></path>
      </clipPath>
    </defs>
  </svg>
);

export default VolunteerIcon;
