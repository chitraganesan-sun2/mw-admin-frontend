import { StylesConfig } from "react-select";

export const convertToOptions = (
    data: any[] | null,
    responseAsValue: string | string[] | "payload" | null,
    responseAsLabel: string,
    isLoading: boolean
): InputOption[] => {
    if (isLoading || !data) return [];
    return data.map((item: any) => ({
        label: item[responseAsLabel],
        value: getOptionValue(item, responseAsValue),
    }));
};

export const getOptionValue = (
    item: any,
    responseAsValue: string | string[] | "payload" | null
) => {
    if (responseAsValue === "payload") return item;
    if (responseAsValue === null) return item;
    if (Array.isArray(responseAsValue)) {
        const valueMap = new Map();
        responseAsValue.forEach((value) => {
            valueMap.set(value, item[value]);
        });
        return Object.fromEntries(valueMap);
    }

    return item[responseAsValue];
};

export const customStyles: StylesConfig = {
    control: (base: any, state: any) => ({
        ...base,
        backgroundColor: "var(--input-background)",
        borderRadius: "6px",
        border: "1px solid var(--border-stroke)",
        boxShadow: "none",
        padding: 0,
        paddingRight: "6px",
        "&:hover": {
            border: "1px solid var(--border-stroke)",
        },
    }),
    multiValue: (base: any) => ({
        ...base,
        backgroundColor: "white",
        borderRadius: "20px",
        padding: "2px 8px",
        margin: "2px",
    }),
    multiValueLabel: (base: any) => ({
        ...base,
        color: "#000",
        padding: "2px",
    }),
    multiValueRemove: (base: any) => ({
        ...base,
        color: "#000",
        borderRadius: "50%",
        "&:hover": {
            backgroundColor: "rgba(0,0,0,0.1)",
            color: "#000",
        },
    }),
    placeholder: (base: any) => ({
        ...base,
        color: "#808080",
        fontFamily: "var(--font-light)",
    }),
    input: (base: any) => ({
        ...base,
        color: "#000",
        padding: 0,
    }),
    menu: (base: any) => ({
        ...base,
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    }),
    option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isSelected ? "#E5E7EB" : state.isFocused ? "#F3F4F6" : "white",
        color: "#000",
        "&:active": {
            backgroundColor: "#E5E7EB",
        },
    }),

    indicatorSeparator: (baseStyles: object) => ({
        ...baseStyles,
        display: "none",
    }),
};
