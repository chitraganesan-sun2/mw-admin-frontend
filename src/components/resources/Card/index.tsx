"use client";

import Image from "next/image";
import TagComponent from "@/components/common/Tag";
import FlagIcon from "@/assets/icons/FlagIcon";
import TrendArrow from "@/assets/icons/TrendArrow";

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

  return (
    <div
      className={`w-[359px] md:w-[259px] md:h-[313px] rounded-xl shadow-md border border-[#f7f7f7] flex flex-col justify-between ${className}`}
    >
      <div className="w-full h-[120px] relative">
        <span className="absolute top-2 right-2 flex items-center gap-1 text-white z-10">
          <TrendArrow />
          <span className="text-[0.75rem] font-medium text-white">
            {resource?.total_likes}{" "}
            {resource?.total_likes > 1 ? "likes" : "like"}
          </span>
        </span>
        {resourceImage &&
          (resourceImage?.startsWith("http") ||
            resourceImage?.startsWith("https")) && (
            <Image
              src={resourceImage}
              alt="background"
              fill
              className={`object-cover rounded-t-xl ${imgClassName}`}
            />
          )}
      </div>
      <div className="flex flex-col p-3 gap-4 flex-grow">
        <div className="flex justify-between items-center gap-2">
          <p className="text-[0.75rem] font-medium text-gray-light">
            By {resource?.author?.name}
          </p>
          <TagComponent
            className="!py-0 !px-4 !text-[0.75rem]"
            text={resource?.resource_category?.category_name || ""}
          />
        </div>
        <p
          onClick={onClick}
          className="font-medium text-black cursor-pointer flex flex-row gap-2"
        >
          {resource?.resource_title}
        </p>
        <div className="flex flex-col gap-1">
          <p className="text-[0.75rem] font-medium text-gray-light">
            Difficulty Level
          </p>

          <p className="font-medium text-black text-sm capitalize flex gap-4 justify-between">
            {resource?.difficulty_level}
            <span
              onClick={onClick}
              className="text-[0.75rem] font-medium text-primary underline cursor-pointer md:hidden"
            >
              See more
            </span>
          </p>
        </div>
        <div className="flex justify-between items-center">
          <span
            onClick={onClick}
            className="text-[0.75rem] font-medium text-primary underline cursor-pointer hidden md:block"
          >
            See more
          </span>
          {handleReportClick && (
            <span
              onClick={() => handleReportClick(resource?.resource_id)}
              className="cursor-pointer hidden md:block"
            >
              <FlagIcon />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="w-[359px] md:max-w-[259px] md:max-h-[313px] lg:!w-full rounded-xl shadow-md border border-[#f7f7f7] flex flex-col justify-between">
      <div className="w-full h-[120px] relative">
        <div className="w-full h-full bg-gray-400 animate-pulse rounded-t-xl" />
      </div>
      <div className="flex flex-col p-3 gap-4 flex-grow">
        <div className="flex justify-between items-center gap-2">
          <div className="w-20 h-3 bg-gray-400 animate-pulse rounded-md" />
          <div className="w-10 h-4 bg-gray-400 animate-pulse rounded-md" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="w-full h-3 bg-gray-400 animate-pulse rounded-md" />
          <div className="w-3/4 h-3 bg-gray-400 animate-pulse rounded-md" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="w-1/4 h-2 bg-gray-400 animate-pulse rounded-md" />
          <div className="w-3/4 h-2 bg-gray-400 animate-pulse rounded-md" />
        </div>
        <div className="flex justify-between items-center gap-2">
          <div className="w-20 h-2 bg-gray-400 animate-pulse rounded-md" />
          <div className="w-3 h-3 bg-gray-400 animate-pulse rounded-md" />
        </div>
      </div>
    </div>
  );
};

export default Card;
