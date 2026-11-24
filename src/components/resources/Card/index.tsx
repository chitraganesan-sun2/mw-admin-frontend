"use client";

import Image from "next/image";
import TagComponent from "@/components/common/Tag";
import FlagIcon from "@/assets/icons/FlagIcon";
import TrendArrow from "@/assets/icons/TrendArrow";
import { FiFileText } from "react-icons/fi";

type CardProps = {
  className?: string;
  imgClassName?: string;
  resource?: any;
  onClick: () => void;
  handleReportClick?: (id: string) => void;
};

const Card = ({
  className,
  imgClassName,
  resource,
  onClick,
  handleReportClick,
}: CardProps) => {
  const resourceImage = resource?.resource_image?.image_url;

  const hasImage = !!resourceImage && (resourceImage?.startsWith("http") || resourceImage?.startsWith("https"));
  const likes = resource?.total_likes ?? 0;

  // Standard card: white, 16px radius, 1px border, no shadow. The thumbnail slot always has content (a type
  // icon tile when there is no image), the like count sits in a dark chip that reads on any background, the
  // title is clamped to two lines and the footer is pinned to the bottom, so every card lines up.
  return (
    <div
      className={`w-[359px] md:w-[259px] min-h-[313px] overflow-hidden rounded-2xl border border-stroke bg-white flex flex-col ${className}`}
    >
      <div className="w-full h-[120px] relative shrink-0">
        {hasImage ? (
          <Image
            src={resourceImage}
            alt=""
            fill
            className={`object-cover ${imgClassName}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-brand-tint text-brand-ink" aria-hidden>
            <FiFileText size={36} />
          </div>
        )}
        <span className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-ink/80 px-2 py-0.5 text-white">
          <TrendArrow />
          <span className="text-xs font-medium text-white">
            {likes} {likes === 1 ? "like" : "likes"}
          </span>
        </span>
      </div>
      <div className="flex flex-col p-4 gap-3 flex-grow">
        <div className="flex justify-between items-center gap-2">
          <p className="min-w-0 truncate text-xs font-medium text-gray-light">
            By {resource?.author?.name}
          </p>
          <TagComponent
            className="!py-0 !px-3 !text-xs shrink-0 max-w-[50%]"
            text={resource?.resource_category?.category_name || ""}
          />
        </div>
        <button
          type="button"
          onClick={onClick}
          className="min-h-[48px] line-clamp-2 font-medium text-ink cursor-pointer appearance-none border-0 bg-transparent p-0 text-left"
        >
          {resource?.resource_title}
        </button>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-gray-light">Difficulty Level</p>
          <p className="font-medium text-ink text-sm capitalize">{resource?.difficulty_level}</p>
        </div>
        <div className="mt-auto flex justify-between items-center">
          <button
            type="button"
            onClick={onClick}
            className="min-h-8 text-sm font-medium text-brand-ink underline cursor-pointer appearance-none border-0 bg-transparent p-0"
          >
            See more
          </button>
          {handleReportClick && (
            <button
              type="button"
              aria-label="Report"
              onClick={() => handleReportClick(resource?.resource_id)}
              className="flex h-8 w-8 items-center justify-center cursor-pointer appearance-none border-0 bg-transparent p-0 leading-none"
            >
              <FlagIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="w-[359px] md:max-w-[259px] md:max-h-[313px] lg:!w-full rounded-2xl overflow-hidden border border-stroke bg-white flex flex-col justify-between">
      <div className="w-full h-[120px] relative">
        <div className="w-full h-full bg-line-soft animate-pulse" />
      </div>
      <div className="flex flex-col p-3 gap-4 flex-grow">
        <div className="flex justify-between items-center gap-2">
          <div className="w-20 h-3 bg-line-soft animate-pulse rounded-md" />
          <div className="w-10 h-4 bg-line-soft animate-pulse rounded-md" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="w-full h-3 bg-line-soft animate-pulse rounded-md" />
          <div className="w-3/4 h-3 bg-line-soft animate-pulse rounded-md" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="w-1/4 h-2 bg-line-soft animate-pulse rounded-md" />
          <div className="w-3/4 h-2 bg-line-soft animate-pulse rounded-md" />
        </div>
        <div className="flex justify-between items-center gap-2">
          <div className="w-20 h-2 bg-line-soft animate-pulse rounded-md" />
          <div className="w-3 h-3 bg-line-soft animate-pulse rounded-md" />
        </div>
      </div>
    </div>
  );
};

export default Card;
