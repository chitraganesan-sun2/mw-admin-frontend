"use client";
import DummyProfileImg from "@/assets/images/DummyProfileImg.png";
import TagComponent from "@/components/common/Tag";
import Image from "next/image";
import Link from "next/link";

const Avatar = () => {
  return (
    <Link href={"profile"} className="flex flex-col items-center gap-2 p-2">
      <Image src={DummyProfileImg} alt="avatar" width={80} height={80} />
      <p className="font-medium">Alexander Harris</p>
      <TagComponent text={"Admin"} className="!bg-[#e0e0e0]" />
    </Link>
  );
};

export default Avatar;
