import React from "react";
import { Modal } from "antd";
import { useWindowSize } from "@/hooks/useWindowSize";

interface ViewModalProps {
    modalOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    width?: number | string;
    height?: number | string;
    style?: React.CSSProperties;
    className?: string;
    borderRadius?: string;
    showCloseIcon?: boolean;
}

const ViewModal: React.FC<ViewModalProps> = ({
    modalOpen,
    onClose,
    children,
    width = 800,
    height = 720,
    style,
    className = "",
    borderRadius,
    showCloseIcon = false,
}) => {
    const { width: innerWidth } = useWindowSize();
    const isMobile = innerWidth < 768;

    return (
        <Modal
            className={className}
            styles={{
                wrapper: {
                    zIndex: 1000,
                },
                content: {
                    padding: 0,
                    borderRadius: isMobile ? 0 : borderRadius || "1rem",
                },
                body: {
                    padding: 0,
                    height: height,
                },
                mask: {
                    backdropFilter: "blur(4px)",
                },
            }}
            style={{
                ...style,
                margin: 0,
                padding: 0,
            }}
            modalRender={(node) => (
                <div
                    style={{
                        borderRadius: isMobile ? 0 : borderRadius || "12px",
                        overflow: "hidden",
                        width: "100%",
                    }}
                >
                    {node}
                </div>
            )}
            centered
            open={modalOpen}
            closeIcon={showCloseIcon}
            onCancel={onClose}
            footer={null}
            width={width}
        >
            {children}
        </Modal>
    );
};

export default ViewModal;