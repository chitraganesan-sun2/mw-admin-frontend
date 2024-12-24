type ButtonProps = AntButtonProps & {
    customClassName?: string;
    btnVariant?: "primary" | "secondary" | "error" | "success" | "link";
    title?: string;
};
