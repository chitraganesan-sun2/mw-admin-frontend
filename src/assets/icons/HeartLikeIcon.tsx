import * as React from "react";

const HeartLikeIcon: React.FC<React.SVGProps<SVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.width || "32"}
    height={props.height || "32"}
    fill="none"
    viewBox="0 0 32 32"
  >
    <g clipPath="url(#clip0_556_5250)">
      <path
        fill="#EF4444"
        d="M23.336 2.556a8.53 8.53 0 0 0-7.333 4.4 8.53 8.53 0 0 0-7.334-4.4 9.067 9.067 0 0 0-8.666 9.4c0 6.063 6.38 12.684 11.733 17.173a6.63 6.63 0 0 0 8.533 0c5.352-4.49 11.734-11.11 11.734-17.173a9.066 9.066 0 0 0-8.667-9.4"
      ></path>
    </g>
    <defs>
      <clipPath id="clip0_556_5250">
        <path fill="#fff" d="M0 0h32v32H0z"></path>
      </clipPath>
    </defs>
  </svg>
);

export default HeartLikeIcon;
