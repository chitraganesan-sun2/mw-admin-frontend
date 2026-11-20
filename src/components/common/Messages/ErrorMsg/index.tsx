import React from "react";
import Image from "next/image";
import { Button } from "antd";
import ErrorImage from "@/assets/images/SomethingWentWrong.gif";

interface ErrorMsgProps {
    /** What went wrong, in words. Defaults to a generic "couldn't load" line. */
    message?: string;
    /** When given, a "Try again" button is shown; it should refetch the failed query. */
    onRetry?: () => void;
    /** Disables the retry button while the refetch is running. */
    retrying?: boolean;
    /** Hide the illustration (small panels, modals). */
    compact?: boolean;
}

// An error state is words first (a screen reader and a person who can't see the GIF both need
// them), with a way to try again. The illustration is decoration only.
const ErrorMsg = ({ message = "Couldn't load this. Please try again.", onRetry, retrying = false, compact = false }: ErrorMsgProps) => {
    return (
        <div role="alert" className="flex flex-col items-center justify-center gap-3 min-h-[30vh] w-full px-4 py-6 text-center">
            {compact ? null : (
                <Image src={ErrorImage} alt="" aria-hidden className="w-full max-h-[40vh] object-contain max-w-[420px]" />
            )}
            <p className="text-dark text-base font-medium">{message}</p>
            {onRetry ? (
                <Button onClick={onRetry} loading={retrying} disabled={retrying}>
                    Try again
                </Button>
            ) : null}
        </div>
    );
};

export default ErrorMsg;
