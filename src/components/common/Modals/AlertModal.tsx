import React from "react";
import ViewModal from "./ViewModal";
import { FeedModalCloseIcon } from "@/assets/icons";
import Divider from "../Divider";
import Button from "../Button";
import { IoMdCheckmark } from "react-icons/io";
import { MdClose } from "react-icons/md";

const AlertModal = ({ isOpen, onClose }: AlertModalProps) => {
  const handleAccept = () => {
    console.log("accept");
  };

  const handleReject = () => {
    console.log("reject");
  };

  return (
    <ViewModal
      modalOpen={isOpen}
      onClose={onClose}
      width={484}
      isFooterButtonsNeeded={false}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-5 pt-3">
          <h2 className="text-2xl text-[#DC2626] font-medium">Are You Sure?</h2>
          <span className="cursor-pointer" onClick={onClose}>
            <FeedModalCloseIcon />
          </span>
        </div>
        <p className="text-sm text-gray-light font-medium px-5">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem
          ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
          tempor incididunt ut labore et dolore magna aliqua.
        </p>
        <Divider />
        <div className="flex items-center gap-2 justify-end px-5 pb-3">
          <Button
            onClick={handleReject}
            className="w-fit text-sm h-9 !bg-white rounded-lg  py-2 !text-black !border !border-stroke"
          >
            No, Cancel
          </Button>
          <Button
            key="submit"
            onClick={handleAccept}
            className="w-fit text-sm h-9 !bg-black !border-none rounded-lg  py-2 !text-white "
          >
            Yes, Proceed
          </Button>
        </div>
      </div>
    </ViewModal>
  );
};

export default AlertModal;
