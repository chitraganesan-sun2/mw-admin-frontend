import * as React from "react";

const LogoIcon: React.FC<React.HTMLAttributes<HTMLOrSVGElement>> = props => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='45'
        height='30'
        fill='none'
        viewBox='0 0 45 30'
        {...props}
    >
        <path
            fill='#68DBFF'
            d='M28.694 14.694c0 7.608-6.168 13.776-13.776 13.776S1.143 22.302 1.143 14.694 7.31.918 14.918.918s13.776 6.168 13.776 13.776'
        ></path>
        <path
            fill='#FF7917'
            d='M43.55 14.694c0 7.608-6.107 13.776-13.64 13.776s-13.64-6.168-13.64-13.776S22.377.918 29.91.918s13.64 6.168 13.64 13.776'
        ></path>
        <path
            fill='#5D2C02'
            d='M22.451 26.23a13.76 13.76 0 0 0 6.244-11.536c0-4.828-2.484-9.076-6.244-11.536a13.8 13.8 0 0 0-6.181 11.536c0 4.828 2.459 9.076 6.181 11.536'
        ></path>
    </svg>
);

export default LogoIcon;
