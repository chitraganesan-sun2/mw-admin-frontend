import * as React from "react";

const DeleteIcon: React.FC<React.SVGProps<SVGElement>> = (props) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width={props.width || 32}
    height={props.height || 33}
    fill='none'
    viewBox='0 0 32 33'
  >
    <rect
      width='31.2'
      height='31.2'
      x='0.4'
      y='0.9'
      fill='#fff'
      fillOpacity='0.6'
      rx='15.6'
    ></rect>
    <rect
      width='31.2'
      height='31.2'
      x='0.4'
      y='0.9'
      stroke='#E0E0E0'
      strokeWidth='0.8'
      rx='15.6'
    ></rect>
    <g clipPath='url(#a)'>
      <path
        fill='#DC2626'
        d='M20.8 12.233h-1.653a2.67 2.67 0 0 0-2.613-2.133h-1.067a2.67 2.67 0 0 0-2.613 2.133H11.2a.533.533 0 0 0 0 1.067h.534v6.933A2.67 2.67 0 0 0 14.4 22.9h3.2a2.67 2.67 0 0 0 2.667-2.667V13.3h.533a.533.533 0 1 0 0-1.067m-5.333 6.933a.533.533 0 0 1-1.067 0v-3.2a.533.533 0 1 1 1.067 0zm2.133 0a.533.533 0 0 1-1.066 0v-3.2a.533.533 0 1 1 1.066 0zm-3.642-6.933a1.6 1.6 0 0 1 1.509-1.067h1.067c.678.001 1.282.428 1.509 1.067z'
      ></path>
    </g>
    <defs>
      <clipPath id='a'>
        <path fill='#fff' d='M9.6 10.1h12.8v12.8H9.6z'></path>
      </clipPath>
    </defs>
  </svg>
);

export default React.memo(DeleteIcon);
