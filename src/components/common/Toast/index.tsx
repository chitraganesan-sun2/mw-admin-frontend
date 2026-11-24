import React from "react";
import toast, { Toaster } from "react-hot-toast";

interface ToastParams {
    type?: "success" | "error" | "info" | "warning";
    position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
    message: string;
    duration?: number;
}

export const showToast = ({
    type = "success",
    message = "Done",
    position = "top-center",
    duration = 4000,
}: ToastParams) => {
    toast.dismiss();

    switch (type) {
        case "success":
            toast.success(message, { duration, position });
            break;

        case "error":
            toast.error(message, { duration, position });
            break;

        case "info":
            toast(message, { duration, position });
            break;

        case "warning":
            // Something worked only partly: stays up longer than a plain notice so it is read.
            toast(message, { duration: Math.max(duration, 8000), position, icon: "⚠️" });
            break;

        default:
            toast("Done", {
                duration,
                position: "top-right",
                style: {
                    background: "#333",
                    color: "#fff",
                },
            });
            break;
    }
};

export const callbackToast = (
    { apiCall, loadingMsg = "Working on it...", successMsg = "Done.", errorMsg = "Couldn't complete that. Please try again." }:
    { apiCall: Promise<any>, loadingMsg?: string, successMsg?: string, errorMsg?: string }
) => {
    return toast.promise(apiCall, {
        loading: loadingMsg,
        success: () => successMsg,
        error: errorMsg,
    });
};

const HotToaster: React.FC = () => {
    return (
        <>
            <Toaster
                toastOptions={{
                    duration: 3000,
                    style: {
                        fontSize: "16px",
                    },
                }}
            />
        </>
    );
};

export default HotToaster;