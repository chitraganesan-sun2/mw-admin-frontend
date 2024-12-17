import * as React from "react";

const ResourceIcon: React.FC<React.HTMLAttributes<HTMLOrSVGElement>> = props => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='20'
        height='20'
        fill='none'
        viewBox='0 0 20 20'
        {...props}
    >
        <g clipPath='url(#clip0_1031_8778)'>
            <path
                fill='currentColor'
                d='M14.166 0H5.833a4.17 4.17 0 0 0-4.167 4.167v12.5A3.337 3.337 0 0 0 4.999 20h9.167a4.17 4.17 0 0 0 4.167-4.167V4.167A4.17 4.17 0 0 0 14.166 0m2.5 4.167v9.166h-10V1.667h3.333v6.956c0 .519.66.741.974.329l1.11-1.453 1.109 1.453c.315.412.974.19.974-.33V1.668c1.378 0 2.5 1.121 2.5 2.5M4.999 1.82v11.513c-.61 0-1.174.177-1.666.464v-9.63c0-1.085.699-2.002 1.666-2.347m9.167 16.513H4.999C2.81 18.294 2.81 15.038 5 15h11.667v.833c0 1.379-1.122 2.5-2.5 2.5'
            ></path>
        </g>
        <defs>
            <clipPath id='clip0_1031_8778'>
                <path fill='#fff' d='M0 0h20v20H0z'></path>
            </clipPath>
        </defs>
    </svg>
);

export default ResourceIcon;
