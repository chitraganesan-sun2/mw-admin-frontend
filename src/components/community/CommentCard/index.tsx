import React, { useState } from "react";
import Image from "next/image";
import DummyProfileImg from "@/assets/images/DummyProfileImg.png";
import TagComponent from "@/components/common/Tag";
import { timesAgo } from "@/utils/timeFunctions";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { RiCloseCircleFill } from "react-icons/ri";

interface CommentCardProps {
  comment: any;
  reply?: boolean;
  onDelete?: (commentId: string) => void;
}

const CommentCard = ({
  comment,
  reply = false,
  onDelete,
}: CommentCardProps) => {
  const [likesCount] = useState(comment?.total_likes || 0);

  // If no comment data is provided, return null or a placeholder
  if (!comment) return null;

  return (
    <div className={`${reply ? "ml-9" : ""}`}>
      <div className="flex justify-between gap-2">
        <div className="flex gap-1">
          <div className="w-[32px] h-[32px] relative flex-shrink-0">
            <Image
              src={comment.author.profile_picture.image_url || DummyProfileImg}
              alt="profile picture"
              fill
              className="rounded-full object-cover"
            />
          </div>
          <div className="ml-1 flex-1 flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2 w-full">
              <p className="font-semibold text-black text-base">
                {comment.author.name}
              </p>
              <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
              <div className="flex items-center gap-2">
                <TagComponent
                  text={comment.created_by}
                  className="w-fit text-[12px] capitalize"
                  tagClassName={comment?.created_by === "volunteer" ? "!bg-[#FFE9D4]" : "!bg-[#DFF5FF]"}
                />
                <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                <p className="font-semibold text-black text-sm">
                  {timesAgo(comment.created_at)}
                </p>
              </div>
            </div>
            <p className="text-sm font-normal break-word">{comment.comment_text}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <div className="flex flex-col items-center">
            <div className="cursor-pointer">
              {
                likesCount > 0 ? (
                  <FaHeart className="text-lg text-red-500" />
                ) : (
                  <FaRegHeart className="text-lg" />
                )
              }
            </div>
            {likesCount}
          </div>
          <div>
            {onDelete && (
              <span
                onClick={() => onDelete(comment.comment_id)}
                className="cursor-pointer text-red-600 hover:text-red-700 h-auto"
              >
                <RiCloseCircleFill className="text-xl" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentCard;
