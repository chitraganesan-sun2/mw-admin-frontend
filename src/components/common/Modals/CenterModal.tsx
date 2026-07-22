import { Modal } from "antd";
import React, { useState } from "react";
import Button from "@/components/common/Button";
import { IoMdCheckmark } from "react-icons/io";
import { MdClose } from "react-icons/md";
import ModalCloseIcon from "@/assets/icons/ModalCloseIcon";
import Divider from "../Divider";

const CenterModal: React.FC<CenterModalProps> = ({
  isOpen,
  onClose,
  title,
  topContent,
  titleColor,
  width,
  minWidth,
  height,
  minHeight,
  children,
  customClassName,
  onAccept,
  onReject,
  hideFooter = false,
  actionLoading,
  acceptLoading,
  rejectLoading,
}) => {
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <Modal
        open={isOpen}
        width={width}
        height={height}
        centered
        footer={null}
        onCancel={onClose}
        closeIcon={false}
        className={`${customClassName} !font-poppins`}
      >
        <div className="flex items-center justify-between px-7 py-5">
          <p className="text-xl font-medium">{title}</p>
          <button type="button" aria-label="Close" className="cursor-pointer bg-transparent border-0 p-0" onClick={onClose}>
            <ModalCloseIcon />
          </button>
        </div>
        <Divider />
        <div className="px-7 py-5">{children}</div>
        {!hideFooter && (
          <>
            <Divider />
            <div className="flex items-center gap-2 justify-end px-5 py-4">
              <Button
                onClick={onReject}
                loading={rejectLoading}
                disabled={actionLoading}
                icon={<MdClose className="text-[1.1rem]" />}
                className="w-[150px] text-sm  h-9 !bg-error-light !border-none rounded-xl  py-2 !text-error"
              >
                Reject
              </Button>
              <Button
                key="submit"
                onClick={onAccept}
                loading={acceptLoading}
                disabled={actionLoading}
                icon={<IoMdCheckmark className="text-[1.1rem]" />}
                className="w-[150px] text-sm h-9 !bg-[#DCFCE7] !border-none rounded-xl  py-2 !text-success "
              >
                Accept
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default CenterModal;
