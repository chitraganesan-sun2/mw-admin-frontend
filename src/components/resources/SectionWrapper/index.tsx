"use client";

// import Button from "@/components/common/Button";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { useRef } from "react";
import { cn } from "@/utils/merge-class";

const SCROLL_AMOUNT = 300;

type SectionWrapperProps = {
  data: any[];
  title?: string;
  renderItem: (item: any, index: number) => React.ReactNode;
  hideSectionHeader?: boolean;
  placeHolderComponent?: React.ReactNode;
  onPlaceHolderClick?: () => void;
  contentClassName?: string;
};

const SectionWrapper = ({
  data,
  title,
  renderItem,
  hideSectionHeader = false,
  placeHolderComponent,
  onPlaceHolderClick,
  contentClassName,
}: SectionWrapperProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = SCROLL_AMOUNT; // Adjust scroll amount as needed
      const newScrollPosition =
        scrollContainerRef.current.scrollLeft +
        (direction === "left" ? -scrollAmount : scrollAmount);

      scrollContainerRef.current.scrollTo({
        left: newScrollPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div hidden={hideSectionHeader} className="w-full">
      {/* Title Section */}
      <div
        className={cn(
          "flex items-center justify-between mb-4 px-4",
          title ? "" : "hidden"
        )}
      >
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        <div className="flex gap-2">
        </div>
      </div>

      {/* Scrollable Content Section */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-hide flex relative"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div className={`flex gap-4 px-4 pb-4 ${contentClassName}`}>
          {Array.isArray(data) && data?.map((item, index) => (
            <div key={item?.id || index} className="w-full">
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
      {title === "Resources" && (data?.length === 0 || !Array.isArray(data)) && (
        <span className="min-w-[250px] min-h-[275px] h-full w-full flex-center">
          No Resource Found
        </span>
      )}
    </div>
  );
};
export default SectionWrapper;
