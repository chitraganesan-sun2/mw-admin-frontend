import { Select as AntSelect, Spin } from "antd";
import { TiArrowSortedDown } from "react-icons/ti";

const Select = ({
  disabled,
  inputType,
  inputClassName,
  isLoading,
  ...props
}: SelectInputProps) => {
  if (inputType !== "select") return null;

  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-base font-normal text-black">{props.label}</label>
      <AntSelect
        placeholder={props.placeholder}
        value={props.value || undefined}
        onChange={props.onChange}
        disabled={disabled}
        showSearch={props.showSearch}
        notFoundContent={
          <p className="text-center py-2 font-medium text-gray-700">
            {isLoading ? <Spin size="small" /> : "No Data"}
          </p>
        }
        className={`w-full text-sm h-fit rounded-xl hover:bg-[#f4f7fb] !bg-[#f4f7fb] !border border-stroke font-poppins ${inputClassName}`}
        options={props.options}
        popupClassName="overflow-auto no-scrollbar"
        dropdownStyle={{ maxHeight: "262px", overflowY: "auto" }}
        suffixIcon={<TiArrowSortedDown className="text-black text-lg" />}
        filterOption={(input, option) =>
          option?.label?.toLowerCase().includes(input.toLowerCase()) ||
          option?.value?.toLowerCase().includes(input.toLowerCase())
        }
      />
    </div>
  );
};

export default Select;
