import { Select as AntSelect } from "antd";
import { BiCaretDown } from "react-icons/bi";

const SingleSelect = ({ disabled, inputType, inputClassName, ...props }: SelectInputProps) => {
    if (inputType !== "select") return null;

    return (
        <AntSelect
            placeholder={props.placeholder}
            value={props.value}
            onChange={props.onChange}
            disabled={disabled}
            showSearch={props.showSearch}
            rootClassName='text-sm border hover:bg-background !bg-background border-stroke rounded-md'
            className={`w-full text-sm h-fit rounded-md hover:bg-background !bg-background ${inputClassName}`}
            options={props.options}
            suffixIcon={<BiCaretDown className='text-black' />}
        />
    );
};

export default SingleSelect;