import * as React from "react";

const HiringIcon = (props: React.HTMLAttributes<HTMLOrSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 20 20"
    {...props}
  >
    <path
      stroke="currentColor"
      strokeWidth="1.65"
      d="M13.658 4.49c0-1.728 0-2.591-.538-3.129-.537-.537-1.4-.537-3.13-.537-1.728 0-2.591 0-3.129.537-.537.538-.537 1.401-.537 3.13m-5.5 7.333c0-3.457 0-5.185 1.075-6.259C2.973 4.492 4.7 4.491 8.158 4.491h3.666c3.457 0 5.186 0 6.26 1.074s1.074 2.802 1.074 6.26c0 3.456 0 5.185-1.075 6.258s-2.802 1.075-6.259 1.075H8.158c-3.457 0-5.186 0-6.26-1.075S.825 15.281.825 11.824Z"
    ></path>
    <path
      fill="currentColor"
      d="M14.992 6.99a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0"
    ></path>
  </svg>
);

export default HiringIcon;
