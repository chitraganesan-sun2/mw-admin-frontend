type ButtonProps = AntButtonProps & {
    customClassName?: string;
    btnVariant?: "primary" | "default" | "secondary" | "error" | "warning" | "success" | "link";
    title?: string;
    /** Square icon-only button (40x40, 32x32 when size="small"). Needs an aria-label. */
    iconOnly?: boolean;
};
