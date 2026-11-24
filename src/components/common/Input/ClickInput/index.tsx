import React from "react";
import { FiChevronDown } from "react-icons/fi";

interface ClickInputProps {
  label: string;
  selectedItems: number;
  availableItems: number;
  onClick: () => void;
}

const ClickInput = ({
  label,
  selectedItems,
  availableItems,
  onClick,
}: ClickInputProps) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-2">{label}</span>
        <div className="text-xs text-ink-2">
          {availableItems} Available
        </div>
      </div>
      <button
        type="button"
        aria-label={`${label}: ${selectedItems} selected of ${availableItems} available`}
        className="flex h-10 items-center text-sm justify-between gap-2 cursor-pointer w-full bg-white border border-stroke rounded-xl px-3 appearance-none text-left hover:border-brand-ink"
        onClick={onClick}
      >
        <div className="font-normal text-black">{selectedItems} Selected</div>
        <FiChevronDown aria-hidden className="text-ink-3" />
      </button>
    </div>
  );
};

export default ClickInput;
