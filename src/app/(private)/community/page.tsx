"use client";

import FeedCard from "@/components/community/FeedCard";
import FeedViewModal from "@/components/community/FeedViewModal";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import { usePathname } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect } from "react";
import FilterBar from "@/components/common/Filters/FilterBar";
import ListSearch from "@/components/common/Filters/ListSearch";

export default function CommunityPage() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();
  const [mode, setMode] = useQueryState("mode");
  const [_, setId] = useQueryState("id");

  useEffect(() => {
    setHeaderOptions({
      title: "Community",
      titleIcon: getHeaderIcon(pathname),
      showSearch: false,
    });
  }, [pathname, setHeaderOptions]);

  const handleCloseModal = () => {
    setMode(null);
    setId(null);
  };

  const handleFeedCardClick = (id: string) => {
    setId(id);
    setMode("view");
  };

  return (
    <div className="p-6 w-full max-w-[880px] mx-auto h-full overflow-hidden animate-fadeIn flex flex-col">
      <FeedViewModal isOpen={mode === "view"} onClose={handleCloseModal} />
      <FilterBar className="shrink-0">
        <ListSearch placeholder="Search posts" />
      </FilterBar>
      <div className="w-full bg-white rounded-2xl border border-stroke mb-6 min-h-0 flex-1 overflow-auto no-scrollbar hide-scrollbar p-6 flex flex-col gap-4">
        <div className="flex flex-col min-h-0 flex-grow h-full">
          <FeedCard onClick={handleFeedCardClick} />
        </div>
      </div>
    </div>
  );
}
