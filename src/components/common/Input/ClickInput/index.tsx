import React from "react";
import { TiArrowSortedDown } from "react-icons/ti";

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
        <label className="text-base font-normal text-black">{label}</label>
        <div className="text-base font-normal text-black">
          {availableItems} Available
        </div>
      </div>
      <div
        className="flex items-center text-sm justify-between gap-2 cursor-pointer w-full bg-background border border-stroke rounded-lg p-2"
        onClick={onClick}
      >
        <div className="font-normal text-black">{selectedItems} Selected</div>
        <div className="font-normal text-black -rotate-90">
          <TiArrowSortedDown className="text-black text-lg" />
        </div>
      </div>
    </div>
  );
};

export default ClickInput;
