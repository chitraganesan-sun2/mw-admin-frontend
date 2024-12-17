import * as React from "react";

const ModalCloseIcon: React.FC<React.HTMLAttributes<HTMLOrSVGElement>> = (
  props
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="40"
    height="40"
    fill="none"
    viewBox="0 0 40 40"
  >
    <rect width="40" height="40" fill="#fff" rx="20"></rect>
    <path
      fill="#000"
      d="M25.72 14.28a.953.953 0 0 0-1.347 0L20 18.651l-4.373-4.373a.953.953 0 0 0-1.348 1.348L18.652 20l-4.373 4.373a.953.953 0 0 0 1.348 1.348L20 21.348l4.373 4.373a.953.953 0 0 0 1.348-1.348L21.348 20l4.373-4.373a.953.953 0 0 0 0-1.348"
    ></path>
  </svg>
);

export default ModalCloseIcon;
