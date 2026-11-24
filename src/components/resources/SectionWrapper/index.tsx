"use client";

import { cn } from "@/utils/merge-class";
import EmptyState from "@/components/common/EmptyState";

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

  return (
    <div hidden={hideSectionHeader} className="w-full">
      {/* Title Section */}
      <div
        className={cn(
          "flex items-center justify-between mb-4 px-4",
          title ? "" : "hidden"
        )}
      >
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        <div className="flex gap-2">
        </div>
      </div>

      <div
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
        <EmptyState title="No resources found" description="Resources will appear here once they are published." />
      )}
    </div>
  );
};
export default SectionWrapper;
