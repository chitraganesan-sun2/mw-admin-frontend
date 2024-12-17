import React from "react";
import Image from "next/image";
import DummyProfileImg from "@/assets/images/DummyProfileImg.png";
import TagComponent from "@/components/common/Tag";
import { HeartIcon } from "@/assets/icons";

const CommentCard: React.FC<CommentCardProps> = ({ reply }) => {
  return (
    <div className={`${reply ? "ml-9" : ""}`}>
      <div className="flex justify-between gap-2">
        <div className="flex gap-1">
          <div className="w-[32px] h-[32px] relative flex-shrink-0">
            <Image
              src={DummyProfileImg}
              alt="profile picture"
              fill
              className="rounded-full object-cover"
            />
          </div>
          <div className="ml-1 flex-1 flex flex-col gap-1">
            <div className="flex items-center gap-2 w-full">
              <p className="font-semibold text-black text-sm">Vinoth Kumar</p>
              <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
              <TagComponent text="Volunteer" className="w-fit text-[12px]" />
              <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
              <p className="font-semibold text-black text-sm">1d</p>
            </div>
            <p className="text-[12px] font-normal">
              Love this topic! Music theory is so fascinating
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <HeartIcon />
          <p className="text-[12px] font-medium text-[#EF4444]">14</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-[36px] h-[32px]"></div>
        <p className="text-sm font-medium text-gray-light">Reply</p>
      </div>
    </div>
  );
};

export default CommentCard;
