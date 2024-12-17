import Image from "next/image";
import DummyProfileImg from "@/assets/images/DummyProfileImg.png";
import TagComponent from "@/components/common/Tag";

import FeedImg from "@/assets/images/FeedImage.png";

import { FlagIcon, CommentIcon, SaveIcon, HeartLikeIcon } from "@/assets/icons";

interface FeedCardProps {
  onClick: () => void;
}

const FeedCard = ({ onClick }: FeedCardProps) => {
  return (
    <div className="flex w-full">
      <div className="w-[40px] h-[40px] relative flex-shrink-0">
        <Image
          src={DummyProfileImg}
          alt="profile picture"
          fill
          className="rounded-full object-cover"
        />
      </div>
      <div className="ml-3 flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between w-full min-h-[40px]">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-black">Vinoth Kumar</p>
            <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
            <TagComponent
              text="Volunteer"
              className="w-fit bg-learner-background"
            />
            <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
            <p className="font-semibold text-black">1d</p>
          </div>
          <FlagIcon />
        </div>
        <p className="text-sm font-normal">
          Hey everyone! 😊 I’m diving into the world of music and wanted to
          share some fundamentals I’ve been exploring. Whether you’re new to
          music or just brushing up, here are some basic concepts I’ve found
          super helpful basic concepts{" "}
          <span className="text-primary font-medium text-[#ffac71]">
            See More
          </span>
        </p>
        <div className="w-full h-[360px] 2xl:h-[400px]  mx-auto relative">
          <Image
            src={FeedImg}
            alt="background"
            fill
            onClick={onClick}
            className="object-cover rounded-xl"
          />
        </div>
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1 cursor-pointer">
              <HeartLikeIcon />
              <p className="font-medium text-[#EF4444]">12</p>
            </div>
            <div className="flex items-center gap-1 cursor-pointer">
              <CommentIcon />
              <p className="font-medium text-black">12</p>
            </div>
          </div>
          <SaveIcon />
        </div>
      </div>
    </div>
  );
};

export default FeedCard;
