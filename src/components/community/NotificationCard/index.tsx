import React from "react";
import NotificationProfileImg from "@/assets/images/NotificationProfileImg.png";
import PostImg from "@/assets/images/PostImg.png";
import Image from "next/image";
const NotificationCard = () => {
    return (
        <div className="flex gap-3 items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-[48px] h-[48px] relative">
                    <Image src={NotificationProfileImg} alt="NotificationProfileImg" fill />
                </div>
                <p className="text-gray-light font-medium">
                    <span className="font-semibold text-black">
                        Vinoth Kumar, John Doe, Peter Johnson
                    </span>{" "}
                    liked your post
                </p>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-light "></div>
                <p className="text-gray-light font-medium">1d</p>
            </div>
            <div className="w-[48px] h-[48px] relative">
                <Image src={PostImg} alt="PostImg" fill />
            </div>
        </div>
    );
};

export default NotificationCard;
