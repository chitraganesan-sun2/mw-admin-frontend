import React from "react";
import { Input as AntInput } from "antd";
import { cn } from "@/utils/merge-class";

const Input = ({
    inputType,
    name,
    placeholder,
    value,
    onChange,
    disabled = false,
    inputClassName = "",
    label
}: any) => {
    const baseClasses = "h-[40px] rounded-xl font-normal !text-[#121212] placeholder-gray-light text-base !bg-background !shadow-none" ;
    const rootBaseClasses = "border !border-stroke focus:!border-stroke focus:!bg-background";

    const renderPasswordInput = () => (
        <AntInput.Password
            name={name}
            placeholder={placeholder}
            visibilityToggle={false}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rootClassName={cn(rootBaseClasses, inputClassName)}
            className={cn(baseClasses, inputClassName)}
        />
    );

    const renderDefaultInput = () => (
        <AntInput
            name={name}
            type={inputType}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rootClassName={cn(rootBaseClasses, inputClassName)}
            className={cn(baseClasses, inputClassName)}
        />
    );

    const renderInput = () => {
        switch (inputType) {
            case "password":
                return renderPasswordInput();
            default:
                return renderDefaultInput();
        }
    };

    return (
        <div className="flex flex-col gap-3">
            {label && <label className="font-normal text-base">{label}</label>}
            {renderInput()}
        </div>
    );
};

export default Input;