import React from "react";
import { Button, Modal } from "antd";
import Divider from "../Divider";

const ViewModal: React.FC<ViewModalProps> = ({
  modalOpen,
  onClose,
  children,
  width,
  height,
  style,
  className,
  isFooterButtonsNeeded,
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
        {isFooterButtonsNeeded && (
          <div className="mt-auto">
            <Divider />
            <div className="flex justify-center items-center gap-4 py-4 bg-white">
              <Button>
                <span>Edit</span>
              </Button>
              <Button>
                <span>Delete</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ViewModal;
