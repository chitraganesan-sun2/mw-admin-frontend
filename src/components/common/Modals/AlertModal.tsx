import React from "react";
import ViewModal from "./ViewModal";
import { FeedModalCloseIcon } from "@/assets/icons";
import Divider from "../Divider";
import Button from "../Button";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  primaryActionText?: string;
  secondaryActionText?: string;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  isLoading?: boolean;
  type?: "warning" | "danger" | "info";
}

const AlertModal = ({
  isOpen,
  onClose,
  title = "Are You Sure?",
  description,
  primaryActionText = "Yes, Delete",
  secondaryActionText = "Cancel",
  onPrimaryAction,
  onSecondaryAction,
  isLoading = false,
  type = "danger",
}: AlertModalProps) => {
  const handleSecondaryAction = () => {
    if (onSecondaryAction) {
      onSecondaryAction();
    } else {
      onClose();
    }
  };

  const getTitleColor = () => {
    switch (type) {
      case "danger":
        return "text-[#DC2626]";
      case "warning":
        return "text-[#F59E0B]";
      default:
        return "text-black";
    }
  };

  return (
    <ViewModal modalOpen={isOpen} onClose={onClose} width={484} zIndex={100000}>
      <div className="flex flex-col gap-3 !font-poppins">
        <div className="flex items-center justify-between px-5 pt-3">
          <h2 className={`text-2xl font-medium ${getTitleColor()}`}>{title}</h2>
          <span className="cursor-pointer" onClick={onClose}>
            <FeedModalCloseIcon />
          </span>
        </div>
        <p className="text-sm text-gray-light font-medium px-5">
          {description}
        </p>
        <Divider />
        <div className="flex items-center gap-2 justify-end px-5 pb-3">
          <Button
            disabled={isLoading}
            onClick={handleSecondaryAction}
            className="w-fit text-sm h-9 font-medium !font-poppins !bg-white rounded-lg py-2 !text-black !border !border-stroke"
          >
            {secondaryActionText}
          </Button>
          <Button
            loading={isLoading}
            onClick={onPrimaryAction}
            className="w-fit text-sm h-9 font-medium !font-poppins !bg-black !border-none rounded-lg py-2 !text-white hover:!text-white"
          >
            {primaryActionText}
          </Button>
        </div>
      </div>
    </ViewModal>
  );
};

export default AlertModal;
