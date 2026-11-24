import React from "react";
import { Button as AntButton } from "antd";

/**
 * The admin Button: one primary look (brand cyan fill, dark text, from the antd theme), a default (white, 1px
 * border), a quiet link, plus the tinted semantic variants the modals use. Sizes come from antd: default is
 * 40px, `size="small"` is 32px. `iconOnly` makes a square icon button (40x40, or 32x32 when small) so the
 * touch target is never smaller than 32px; pass `aria-label`.
 */
const Button: React.FC<ButtonProps> = ({
    btnVariant = "primary",
    customClassName = "",
    title,
    children,
    iconOnly = false,
    ...props
}) => {
    const baseStyles = "font-medium disabled:cursor-not-allowed transition-colors duration-200";

    const variantStyles = {
        primary: "",
        default: "",
        // The one dark "strong" action (selected pill tab, Log In). White on #121212 is 18:1.
        secondary: "!bg-ink !border-ink !text-white hover:!bg-ink-2 hover:!border-ink-2 hover:!text-white",
        error: "!bg-error-light !border-error-light !text-error hover:!bg-error hover:!border-error hover:!text-white",
        warning: "!bg-warning-light !border-warning-light !text-warning hover:!bg-warning hover:!border-warning hover:!text-white",
        success: "!bg-success-light !border-success-light !text-success hover:!bg-success hover:!border-success hover:!text-white",
        link: "!px-0 !h-auto !shadow-none !bg-transparent hover:!bg-transparent hover:underline",
    };

    const iconOnlyStyles = iconOnly
        ? props.size === "small"
            ? "!w-8 !min-w-8 !px-0"
            : "!w-10 !min-w-10 !px-0"
        : "";

    const type = props.type ?? (btnVariant === "primary" ? "primary" : btnVariant === "link" ? "link" : "default");

    return (
        <AntButton
            {...props}
            type={type}
            rootClassName={`${baseStyles} ${
                variantStyles[btnVariant as keyof typeof variantStyles] ?? ""
            } ${iconOnlyStyles} ${customClassName}`}
            icon={props.icon}
        >
            {title && title}
            {children}
        </AntButton>
    );
};

export default Button;
