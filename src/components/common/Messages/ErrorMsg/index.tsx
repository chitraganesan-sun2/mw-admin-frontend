import React from "react";
import Image from "next/image";
import ErrorImage from "@/assets/images/SomethingWentWrong.gif";

const ErrorMsg = () => {
    return (
        <div className="flex-center min-h-[50vh] w-full h-full max-h-[90vh]">
            <Image
                src={ErrorImage}
                alt="error"
                className="w-full h-full object-contain max-w-[700px]"
            />
        </div>
    );
};

export default ErrorMsg;