import { useId } from "react";
import { Select as AntSelect, Spin } from "antd";

const Select = ({
  disabled,
  inputType,
  inputClassName,
  isLoading,
  ...props
}: SelectInputProps) => {
  // Ties the visible label to the select so it has an accessible name.
  const selectId = useId();
  if (inputType !== "select") return null;

  return (
    <div className="flex flex-col gap-1 w-full">
      <label htmlFor={selectId} className="text-xs font-medium text-ink-2">{props.label}</label>
      <AntSelect
        id={selectId}
        placeholder={props.placeholder}
        value={props.value || undefined}
        onChange={props.onChange}
        disabled={disabled}
        showSearch={props.showSearch}
        notFoundContent={
          <p className="text-center py-2 font-medium text-gray-700">
            {isLoading ? <Spin size="small" /> : "No options found"}
          </p>
        }
        className={`w-full font-poppins ${inputClassName ?? ""}`}
        options={props.options}
        popupClassName="overflow-auto no-scrollbar"
        dropdownStyle={{ maxHeight: "262px", overflowY: "auto" }}
        filterOption={(input, option) =>
          option?.label?.toLowerCase().includes(input.toLowerCase()) ||
          option?.value?.toLowerCase().includes(input.toLowerCase())
        }
      />
    </div>
  );
};

export default Select;
