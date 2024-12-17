import * as React from "react";

const TrendArrow: React.FC<React.HTMLAttributes<HTMLOrSVGElement>> = (
  props
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    fill="none"
    viewBox="0 0 12 12"
  >
    <g clipPath="url(#clip0_1068_4009)">
      <path
        fill="#fff"
        d="M10.5 3h-3a.5.5 0 1 0 0 1h2.793l-3.28 3.281a.725.725 0 0 1-1.024 0l-1.27-1.27a1.726 1.726 0 0 0-2.437 0L.147 8.147a.5.5 0 1 0 .707.707L2.989 6.72a.74.74 0 0 1 1.023 0l1.27 1.269a1.726 1.726 0 0 0 2.437 0l3.282-3.281V7.5a.5.5 0 1 0 1 0v-3c0-.827-.674-1.5-1.5-1.5"
      ></path>
    </g>
    <defs>
      <clipPath id="clip0_1068_4009">
        <path fill="#fff" d="M0 0h12v12H0z"></path>
      </clipPath>
    </defs>
  </svg>
);

export default TrendArrow;
