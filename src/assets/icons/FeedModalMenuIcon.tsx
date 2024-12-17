import * as React from "react";

const FeedModalMenuIcon: React.FC<React.HTMLAttributes<HTMLOrSVGElement>> = props => {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='40'
            height='40'
            fill='none'
            viewBox='0 0 40 40'
        >
            <rect width='39' height='39' x='0.5' y='0.5' fill='#fff' rx='19.5'></rect>
            <rect width='39' height='39' x='0.5' y='0.5' stroke='#E0E0E0' rx='19.5'></rect>
            <g fill='#000' clipPath='url(#clip0_567_2587)'>
                <path d='M10 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4M20 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4M30 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4'></path>
            </g>
            <defs>
                <clipPath id='clip0_567_2587'>
                    <path fill='#fff' d='M8 8h24v24H8z'></path>
                </clipPath>
            </defs>
        </svg>
    );
};

export default FeedModalMenuIcon;
