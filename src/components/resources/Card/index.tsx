"use client";
import BackgroundImg from "@/assets/images/BackgroundImg.jpeg";
import Image from "next/image";
import TagComponent from "@/components/common/Tag";
import { FlagIcon, TrendArrow } from "@/assets/icons";

type CardProps = {
  onClick: () => void;
};

const Card = ({ onClick }: CardProps) => {
  return (
    <div
      className="w-[259px] h-[313px] rounded-xl shadow-md border border-[#f7f7f7] flex flex-col justify-between"
      onClick={onClick}
    >
      <div className="w-full h-[120px] relative">
        <span className="absolute top-2 right-2 flex items-center gap-1 text-white z-10">
          <TrendArrow />
          <span className="text-[0.75rem] font-medium text-white">
            122 likes
          </span>
        </span>
        <Image
          src={BackgroundImg}
          alt="background"
          fill
          className="object-cover rounded-t-xl"
        />
      </div>
      <div className="flex flex-col p-3 gap-2 flex-grow justify-between">
        <div className="flex justify-between items-center ">
          <p className="text-[0.75rem] font-medium text-gray-light">
            By Samuel Jones
          </p>
          <TagComponent
            className="!py-0 !px-4 !text-[0.75rem] bg-learner-background"
            text={"Music"}
          />
        </div>
        <p className="font-medium text-black ">
          Understanding Different Learning Styles
        </p>
        <div className="flex flex-col gap-1">
          <p className="text-[0.75rem] font-medium text-gray-light">
            Difficulty Level
          </p>
          <p className="font-medium text-black text-sm">Beginner</p>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[0.75rem] font-medium text-learner-text underline">
            See more
          </span>
          <FlagIcon />
        </div>
      </div>
    </div>
  );
};

export default Card;
