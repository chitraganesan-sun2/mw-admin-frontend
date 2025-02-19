import React, { useState } from "react";
import Image from "next/image";
import DummyProfileImg from "@/assets/images/DummyProfileImg.png";
import TagComponent from "@/components/common/Tag";
import { HeartLikeIcon } from "@/assets/icons";

import { DeleteCloseIcon } from "@/assets/icons";
import { timesAgo } from "@/utils/timeFunctions";

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
            <div className="flex items-center gap-2 w-full">
              <p className="font-semibold text-black text-sm">
                {comment.author.name}
              </p>
              <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
              <TagComponent
                text={comment.created_by}
                className="w-fit text-[12px] capitalize"
              />
              <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
              <p className="font-semibold text-black text-sm">
                {timesAgo(comment.created_at)}
              </p>
          <div className="flex items-center gap-2 ml-auto">
            {onDelete && (
              <button
                onClick={() => onDelete(comment.comment_id)}
                className="text-red-600 hover:text-red-700"
              >
                <DeleteCloseIcon height={15} width={15} />
              </button>
            )}
          </div>
            </div>
            <p className="text-[12px] font-normal">{comment.comment_text}</p>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="cursor-pointer scale-75">
            <HeartLikeIcon height={20} width={20} />
          </div>
          {likesCount}
        </div>
      </div>
    </div>
  );
};

export default CommentCard;
