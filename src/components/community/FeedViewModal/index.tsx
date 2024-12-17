"use client";

import ViewModal from "@/components/common/Modals/ViewModal";
import FeedImg from "@/assets/images/FeedImage.png";
import DummyProfileImg from "@/assets/images/DummyProfileImg.png";
import Image from "next/image";
import TagComponent from "@/components/common/Tag";
import Divider from "@/components/common/Divider";
import CommentCard from "@/components/community/CommentCard";
import { FeedModalCloseIcon, FeedModalMenuIcon } from "@/assets/icons";

type FeedViewModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const FeedViewModal = ({ isOpen, onClose }: FeedViewModalProps) => {
  const handleCloseModal = () => {
    onClose();
  };

  return (
    <ViewModal
      modalOpen={isOpen}
      onClose={handleCloseModal}
      width={1200}
      height="720px"
    >
      <div className="grid grid-cols-[1fr,0.7fr] h-full">
        <div className="relative w-full h-[720px]">
          <Image src={FeedImg} alt="feed image" fill className="object-cover" />
        </div>
        <div className="flex flex-col gap-3 ">
          <div className="flex justify-end items-center px-5 pb-2 pt-5 gap-3">
            <FeedModalMenuIcon className="cursor-pointer" />
            <FeedModalCloseIcon
              className="cursor-pointer"
              onClick={handleCloseModal}
            />
          </div>
          <Divider />
          <div className="px-7  flex flex-col gap-3">
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <div className="w-[40px] h-[40px] relative flex-shrink-0">
                  <Image
                    src={DummyProfileImg}
                    alt="profile picture"
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
                <div className="ml-3 flex-1 flex flex-col gap-3">
                  <div className="flex items-center gap-3 w-full min-h-[40px]">
                    <p className="font-semibold text-black">Vinoth Kumar</p>
                    <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                    <TagComponent text="Volunteer" className="w-fit" />
                    <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                    <p className="font-semibold text-black">1d</p>
                  </div>

                  <p className="text-sm font-normal">
                    Hey everyone! 😊 I'm diving into the world of music and
                    wanted to share some fundamentals I’ve been exploring.
                    Whether you’re new to music or just brushing up, here are
                    some basic concepts I’ve found super helpful basic concepts{" "}
                    <span className="text-primary cursor-pointer font-medium text-[#ffac71]">
                      See More
                    </span>
                  </p>
                </div>
              </div>
              <Divider />
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-semibold text-black">Comments</h3>
              <div className="flex flex-col gap-3 overflow-y-auto hide-scrollbar max-h-[380px] pb-8 pr-3">
                <CommentCard />
                <CommentCard reply />
                <CommentCard />
                <CommentCard />
                <CommentCard reply />
                <CommentCard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ViewModal>
  );
};

export default FeedViewModal;
