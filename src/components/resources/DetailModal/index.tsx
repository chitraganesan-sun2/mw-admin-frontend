"use client";
import ModalCloseIcon from "@/assets/icons/ModalCloseIcon";
import ReportIcon from "@/assets/icons/ReportIcon";
import BackgroundImg from "@/assets/images/BackgroundImg.jpeg";
import Divider from "@/components/common/Divider";
import TagComponent from "@/components/common/Tag";
import Image from "next/image";
import Link from "next/link";
import ViewModal from "@/components/common/Modals/ViewModal";
import { useQueryState } from "nuqs";
// import Button from "@/components/common/Button";
import { IoTrashOutline } from "react-icons/io5";
import { MdClose, MdEdit } from "react-icons/md";
import { IoMdCheckmark } from "react-icons/io";
import Button from "@/components/common/Button";

type DetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const DetailModal = ({ isOpen, onClose }: DetailModalProps) => {
  const [category] = useQueryState("category");
  const [_, setMode] = useQueryState("mode");
  const isMyResource = category === "my-resources";

  const skillYouGain = [
    "Basic",
    "Guitar Tuning",
    "Strumming Techniques",
    "Simple Songs",
    "Basic",
    "Guitar Tuning",
    "Strumming Techniques",
  ];

  const curatedLinks = [
    {
      title: "Guitar Tuning Guide",
      link: "https://example.com/guitar-tuning",
    },
    {
      title: "Finger Placement Tips",
      link: "https://example.com/guitar-tuning",
    },
    {
      title: "Guitar Tuning Guide",
      link: "https://example.com/guitar-tuning",
    },
    {
      title: "Finger Placement Tips",
      link: "https://example.com/guitar-tuning",
    },
    {
      title: "Finger Placement Tips",
      link: "https://example.com/guitar-tuning",
    },
    {
      title: "Guitar Tuning Guide",
      link: "https://example.com/guitar-tuning",
    },
    {
      title: "Finger Placement Tips",
      link: "https://example.com/guitar-tuning",
    },
  ];

  const handleDelete = () => {
    console.log("delete");
  };

  const handleAccept = () => {
    console.log("accept");
  };

  return (
    <ViewModal
      modalOpen={isOpen}
      onClose={onClose}
      width={800}
      height="740px"
      isFooterButtonsNeeded
      onAccept={handleAccept}
      onReject={handleDelete}
    >
      <div className="relative w-full h-[260px] rounded-t-xl">
        <Image
          src={BackgroundImg}
          fill
          className="object-cover"
          alt="background"
        />
        <div className="flex items-center gap-4 w-fit absolute top-4 right-4">
          <span onClick={onClose} className="cursor-pointer opacity-80">
            <ModalCloseIcon />
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-4 px-8 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-2xl font-medium text-black ">Basics of Guitar</p>
            <span className="text-sm font-medium text-gray-light">
              By Samuel Jones
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-light">
              Level : Beginner
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-medium text-black">Description</p>
          <p className="text-sm text-gray-light">
            The Basics of Guitar course introduces beginners to foundational
            guitar skills. You’ll learn how to tune the guitar, basic chord
            shapes, strumming techniques, and simple songs to get you playing in
            no time. This course is structured to make learning the guitar fun
            and easy, whether you’re picking up the instrument for the first
            time or looking to brush up on your basics.
          </p>
        </div>
        <Divider />
        <div className="flex flex-col gap-2">
          <p className="font-medium text-black">Skills you gain</p>
          <div className="flex flex-wrap gap-y-2">
            {skillYouGain.map((item, index) => (
              <TagComponent
                key={index}
                text={item}
                className="!py-0 !px-4 !text-[0.75rem] w-fit !bg-[#e0e0e0]"
              />
            ))}
          </div>
        </div>
        <Divider />
        <div className="flex flex-col gap-2 max-h-[72px] overflow-y-auto hide-scrollbar">
          <p className="font-medium text-black">Curated Links</p>
          <div className="flex flex-col gap-2">
            {curatedLinks.map((item, index) => (
              <p key={index}>
                {index + 1}. {item.title} -{" "}
                <Link
                  href={item.link}
                  target="_blank"
                  className="text-black font-medium underline"
                >
                  {item.link}
                </Link>
              </p>
            ))}
          </div>
        </div>
        <div className="">
          <Divider />
          <div className="flex items-center gap-2 justify-end py-4">
            <Button
              onClick={handleDelete}
              icon={<MdClose className="text-[1.1rem]" />}
              className="w-fit text-sm h-9 !bg-error-light !border-none rounded-xl  py-2 !text-error"
            >
              Remove Resource
            </Button>
            <Button
              key="submit"
              onClick={handleAccept}
              icon={<IoMdCheckmark className="text-[1.1rem]" />}
              className="w-fit text-sm h-9 !bg-[#DCFCE7] !border-none rounded-xl  py-2 !text-success "
            >
              Keep Resource
            </Button>
          </div>
        </div>
      </div>
    </ViewModal>
  );
};

export default DetailModal;
