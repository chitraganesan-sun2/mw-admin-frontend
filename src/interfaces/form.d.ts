
type FormField = {
    id?: string;
    title?: string;
    label?: string;
    inputType: "text" | "password";
    name: string;
    placeholder?: string;
    required?: boolean;
}