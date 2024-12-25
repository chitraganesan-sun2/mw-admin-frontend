import React from "react";
import { Button, Modal } from "antd";
import Divider from "../Divider";
import { IoMdCheckmark } from "react-icons/io";
import { MdClose } from "react-icons/md";

const ViewModal: React.FC<ViewModalProps> = ({
  modalOpen,
  onClose,
  children,
  width,
  height,
  style,
  className,
  isFooterButtonsNeeded,
  onAccept,
  onReject,
  loading,
}) => {
  return (
    <Modal
      className={className}
      styles={{
        wrapper: {
          zIndex: 1000,
        },
        content: {
          padding: 0,
          borderRadius: "1rem",
        },
        body: {
          padding: 0,
          height: height,
          fontFamily: "Poppins",
          display: "flex",
          flexDirection: "column",
        },
      }}
      style={style}
      modalRender={(node) => (
        <div style={{ borderRadius: "12px", overflow: "hidden" }}>{node}</div>
      )}
      centered
      open={modalOpen}
      closeIcon={false}
      footer={null}
      width={width}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </Modal>
  );
};

export default ViewModal;
