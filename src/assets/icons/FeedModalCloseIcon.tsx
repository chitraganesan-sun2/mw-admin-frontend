const FeedModalCloseIcon: React.FC<React.HTMLAttributes<HTMLOrSVGElement>> = props => {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='40'
            height='40'
            fill='none'
            viewBox='0 0 40 40'
            {...props}
        >
            <rect width='39' height='39' x='0.5' y='0.5' fill='#fff' rx='19.5'></rect>
            <rect width='39' height='39' x='0.5' y='0.5' stroke='#E0E0E0' rx='19.5'></rect>
            <path
                fill='#000'
                d='M26 14a1 1 0 0 0-1.414 0L20 18.586 15.414 14A1 1 0 0 0 14 15.414L18.586 20 14 24.586A1 1 0 0 0 15.414 26L20 21.414 24.586 26A1 1 0 0 0 26 24.586L21.414 20 26 15.414A1 1 0 0 0 26 14'
            ></path>
        </svg>
    );
};

export default FeedModalCloseIcon;
