import ModalCloseIcon from "@/assets/icons/FeedModalCloseIcon";
import { Drawer } from "antd";
import React, { useState } from "react";
import Divider from "../Divider";
import Button from "@/components/common/Button";

interface SideModalProps {
    children: React.ReactNode;
    title?: string;
    onClose: () => void;
    saveButtonText?: string;
    cancelButtonText?: string;
    onSave?: () => void;
    onCancel?: () => void;
    isOpen?: boolean;
    isDisabled?: boolean;
    isNeedButton?: boolean;
    isLoading?: boolean;
}

const SideModal: React.FC<SideModalProps> = ({
    children,
    title = "Some title",
    onClose,
    saveButtonText = "Save",
    cancelButtonText = "Cancel",
    onSave,
    onCancel,
    isOpen = false,
    isDisabled = false,
    isNeedButton = true,
    isLoading = false,
}) => {
    return (
        <div>
            <Drawer
                placement="right"
                closable={false}
                onClose={onClose}
                open={isOpen}
                width={400}
                className="py-4 !px-0"
                bodyStyle={{ padding: 0 }}
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between gap-4 mb-3 px-5">
                        <h1 className="text-xl font-medium">{title}</h1>
                        <span onClick={onClose} className="cursor-pointer">
                            <ModalCloseIcon />
                        </span>
                    </div>
                    <Divider />
                    <div className="flex-1 overflow-y-auto pb-2">{children}</div>
                    {isNeedButton && (
                        <div className="mt-auto">
                            <Divider />
                            <div className="flex items-center justify-end gap-4 px-5 pt-4">
                                <Button
                                    onClick={onCancel}
                                    title={cancelButtonText}
                                    className="w-fit px-4 py-2 !text-sm !text-black !bg-white !border !border-stroke-light rounded-xl"
                                />
                                <Button
                                    loading={isLoading}
                                    disabled={isDisabled}
                                    onClick={onSave}
                                    title={saveButtonText}
                                    className={`w-fit !text-sm px-4 py-2 !bg-black !text-white rounded-xl ${isDisabled
                                            ? "!bg-opacity-50 !bg-gray-light !cursor-not-allowed"
                                            : ""
                                        }`}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </Drawer>
        </div>
    );
};

export default SideModal;