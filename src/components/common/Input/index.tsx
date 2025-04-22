import React from "react";
import { Input as AntInput } from "antd";
import { cn } from "@/utils/merge-class";
import { IoIosSearch } from "react-icons/io";
import AsyncSelect from "./Others/AsyncSelect";
import SingleSelect from "./Others/SingleSelect";

const Input = (props: any) => {
    const { inputType,
        name,
        placeholder,
        value,
        onChange,
        disabled = false,
        inputClassName = "",
        label } = props;
    const baseClasses = "h-[40px] rounded-xl font-normal !text-[#121212] placeholder-gray-light text-base !bg-background !shadow-none";
    const rootBaseClasses = "border !border-stroke focus:!border-stroke focus:!bg-background";

    if (inputType === "search") {
        return <AntInput
            inputMode="search"
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            value={value}
            rootClassName={cn(
                "hover:!border-stroke border focus:!bg-background-input !border-stroke w-full h-fit focus:!border-stroke focus:!bg-background-input border-stroke",
                inputClassName
            )}
            className={cn(
                inputClassName,
                `w-full text-sm p-2 rounded-md hover:bg-background-input !bg-background-input`
            )}
            prefix={<IoIosSearch className="text-gray text-xl" />}
        />
    }

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
            case "async-select":
                return <AsyncSelect {...props} />
            case "select":
                return <SingleSelect {...props} />
            default:
                return renderDefaultInput();
        }
    };

    return (
        <div className="mb-4 w-full h-auto flex flex-col gap-2">
            {label && <label className="font-medium text-base">{label} <span className="text-red-500">{props?.required && "*"}</span></label>}
            {renderInput()}
        </div>
    );
};

export default Input;