import React, { useEffect } from "react";
import Lottie from "react-lottie-player";
import LoadingAnimation from "@/assets/json/animations/loader.json";
import Cookies from "js-cookie";

type Props = {
    isLoading: boolean;
    customClassName?: string;
    children?: React.ReactNode;
    zIndex?: string | number;
};

const LottieLoader: React.FC<Props> = ({ isLoading, customClassName, zIndex }) => {
    const role = Cookies.get("role");

    useEffect(() => {
        if (isLoading) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isLoading]);
    return (
        <>
            {isLoading && (
                <div
                    style={{ zIndex: zIndex || "1" }}
                    className="w-full h-full flex-center">
                    <div className={`w-[6rem] md:w-[8rem] lg:w-[9rem] h-[6rem] md:h-[8rem] lg:h-[9rem] ${customClassName}`}>
                        <Lottie
                            loop
                            play
                            animationData={LoadingAnimation}
                            rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
                            style={{ width: "100%", borderRadius: "10px" }}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default LottieLoader;