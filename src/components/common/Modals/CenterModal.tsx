import { Modal } from "antd";
import DialogLabel from "./DialogLabel";
import React, { useEffect, useState } from "react";
import Button from "@/components/common/Button";
import { IoMdCheckmark } from "react-icons/io";
import { MdClose } from "react-icons/md";
import ModalCloseIcon from "@/assets/icons/ModalCloseIcon";
import Divider from "../Divider";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

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
  queue,
}) => {
  const [loading, setLoading] = useState(false);

  // Alt+Left / Alt+Right step through the queue without leaving the keyboard. Alt (not bare arrows)
  // so it never fights with typing in the rejection-reason box.
  const onPrev = queue?.onPrev;
  const onNext = queue?.onNext;
  useEffect(() => {
    if (!isOpen || !queue) return;
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === "ArrowLeft" && onPrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === "ArrowRight" && onNext) {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, queue, onPrev, onNext]);

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
        <DialogLabel label={typeof title === "string" ? title : undefined} />
        <div className="flex items-center justify-between px-7 py-5">
          <p className="text-xl font-medium">{title}</p>
          <div className="flex items-center gap-3">
            {queue && queue.total > 1 ? (
              <div className="flex items-center gap-1 text-sm text-gray-medium" role="group" aria-label="Move through the queue">
                <button
                  type="button"
                  aria-label="Previous item"
                  title="Previous (Alt+Left)"
                  disabled={!queue.onPrev}
                  onClick={queue.onPrev}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiChevronLeft aria-hidden />
                </button>
                <span aria-live="polite">
                  {queue.position} of {queue.total}
                </span>
                <button
                  type="button"
                  aria-label="Next item"
                  title="Next (Alt+Right)"
                  disabled={!queue.onNext}
                  onClick={queue.onNext}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiChevronRight aria-hidden />
                </button>
              </div>
            ) : null}
            <button type="button" aria-label="Close" className="cursor-pointer bg-transparent border-0 p-0" onClick={onClose}>
              <ModalCloseIcon />
            </button>
          </div>
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
                btnVariant="error"
                customClassName="w-[150px]"
              >
                Reject
              </Button>
              <Button
                key="submit"
                onClick={onAccept}
                loading={acceptLoading}
                disabled={actionLoading}
                icon={<IoMdCheckmark className="text-[1.1rem]" />}
                btnVariant="success"
                customClassName="w-[150px]"
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
