import React, { useState } from "react";
import { Button, Checkbox, Input, Modal } from "antd";
import ModalCloseIcon from "@/assets/icons/ModalCloseIcon";
import { FaSearch } from "react-icons/fa";

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  width?: number;
  height?: number;
  customClassName?: string;
  handleCheck: (value: boolean) => void;
  items: { id: string; label: string }[];
  selectedItems: string[];
  onSelectItem: (id: string) => void;
  type: "learner" | "volunteer";
  onSave: () => void;
}

const groupItemsByAlphabet = (items: { id: string; label: string }[]) => {
  const groups: { [key: string]: { id: string; label: string }[] } = {};
  items.forEach((item) => {
    const letter = item?.label?.[0]?.toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(item);
  });
  Object.keys(groups).forEach((key) => {
    groups[key].sort((a, b) => a.label.localeCompare(b.label));
  });
  const sortedKeys = Object.keys(groups).sort();
  return sortedKeys.map((key) => ({
    letter: key,
    items: groups[key],
  }));
};

const SelectionModal = ({
  isOpen,
  onClose,
  width,
  height,
  customClassName,
  handleCheck,
  items,
  selectedItems,
  onSelectItem,
  type,
  onSave,
}: SelectionModalProps) => {
  const selectedColor =
    type === "learner"
      ? "bg-[#dff5ff] border-[#09baee]"
      : "bg-[#ffe9d4] border-[#fe5b11]";

  const unselectedColor =
    type === "learner"
      ? "bg-[#f0faff] border-[#dff5ff]"
      : "bg-[#fff4ea] border-[#ffe9d4]";

  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal
      open={isOpen}
      width={720}
      height={height}
      centered
      footer={null}
      onCancel={onClose}
      closeIcon={false}
      className={`${customClassName} !font-poppins`}
    >
      <div className="bg-white border border-stroke  w-full rounded-2xl p-5 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-stroke pb-5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium ">Select Items</h1>
            <div
              className={`text-sm font-medium w-fit rounded-full px-2 py-1 ${selectedColor}`}
            >
              {selectedItems?.length} Selected
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-[#e0e0e0] w-fit rounded-full px-2 py-1 text-black">
              {items?.length} Available
            </div>
            <span className="cursor-pointer" onClick={onClose}>
              <ModalCloseIcon />
            </span>
          </div>
        </div>
        <div>
          <div className="relative">
            <Input
              placeholder="Search"
              className="w-full border px-4 pl-8 border-stroke rounded-full font-medium font-poppins text-sm p-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-[18px] -translate-y-1/2 text-gray-400" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Checkbox
              checked={selectedItems.length === items.length}
              onChange={(e) => handleCheck(e.target.checked)}
            />
            <span className="text-sm font-normal text-gray-500">
              Select all items
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto hide-scrollbar">
          {groupItemsByAlphabet(filteredItems).map((group) => (
            <div key={group.letter} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span>{group.letter}</span>
                <div className="border border-stroke w-full"></div>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className={`cursor-pointer font-medium rounded-full py-1.5 px-4 !border-[3px] transition-colors duration-150 ${
                      selectedItems.includes(item.id)
                        ? selectedColor
                        : unselectedColor
                    }`}
                    onClick={() => onSelectItem(item.id)}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-5 justify-end">
          <Button
            className="w-fit h-[40px] font-poppins font-medium !bg-white !text-black !rounded-xl !border !border-stroke"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="w-fit h-[40px] font-poppins font-medium !bg-black !text-white !rounded-xl "
            onClick={onSave}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SelectionModal;
