import React from "react";
import { Button as AntButton } from "antd";

const Button: React.FC<ButtonProps> = ({
    btnVariant = "primary",
    customClassName = "",
    title,
    children,
    ...props
}) => {
    const baseStyles =
        "rounded-2xl px-4 py-4 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95";

    const variantStyles = {
        primary: "bg-primary text-black hover:!text-black hover:bg-primary focus:bg-primary hover:!border-black",
        secondary: "bg-black text-white hover:!text-white hover:!bg-black focus:!bg-black hover:!border-black",
        error: "bg-error-light text-error hover:bg-error focus:bg-error-light",
        success: "bg-success-light text-success hover:bg-success focus:bg-success-light",
        link: "text-primary border-none shadow-none hover:underline !bg-transparent hover:!bg-transparent hover:!text-primary text-sm font-normal",
    };

    return (
        <AntButton
            rootClassName={`${baseStyles} ${
                variantStyles[btnVariant as keyof typeof variantStyles]
            } ${customClassName}`}
            {...props}
            icon={props.icon}
        >
            {title && title}
            {children}
        </AntButton>
    );
};

export default Button;