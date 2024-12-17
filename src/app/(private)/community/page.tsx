"use client";

import FeedCard from "@/components/community/FeedCard";
import FeedViewModal from "@/components/community/FeedViewModal";
import NotificationCard from "@/components/community/NotificationCard";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import { usePathname } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect } from "react";

export default function CommunityPage() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();
  const [mode, setMode] = useQueryState("mode");
  const [_, setId] = useQueryState("id");
  const [activeTab] = useQueryState("tab");

  const handleAddNewPost = () => {
    setMode("add");
  };

  useEffect(() => {
    setHeaderOptions({
      searchPlaceholder: "Search",
      actionButtonTitle: "Add new post",
      actionButtonOnClick: handleAddNewPost,
      actionButtonClassName:
        "!bg-background-secondary hover:!border-none !text-black !rounded-xl hover:!bg-background-secondary hover:!text-black !h-[35px] !text-xs !py-2 px-4",
      actionButtonPlacement: "right",
      showButton: true,
      title: "Community",
      titleIcon: getHeaderIcon(pathname),
    });
  }, [pathname, setHeaderOptions]);

  const posts: any = [
    {
      id: "1",
      title: "Post 1",
      description: "Description 1",
      image: "https://via.placeholder.com/150",
    },
    {
      id: "1",
      title: "Post 1",
      description: "Description 1",
      image: "https://via.placeholder.com/150",
    },
    {
      id: "1",
      title: "Post 1",
      description: "Description 1",
      image: "https://via.placeholder.com/150",
    },
  ];

  const handleCloseModal = () => {
    setMode(null);
    setId(null);
  };

  const handleFeedCardClick = (id: string) => {
    setId(id);
    setMode("view");
  };

  return (
    <div className="p-6 w-[75%] mx-auto h-full overflow-hidden animate-fadeIn">
      <FeedViewModal isOpen={mode === "view"} onClose={handleCloseModal} />
      <div className="w-full bg-white rounded-3xl mb-6 h-full overflow-auto no-scrollbar hide-scrollbar p-6 flex flex-col gap-4">
        <h2>All Posts</h2>
        <div className="flex flex-col gap-10">
          {posts.map((post: any, index: number) => (
            <FeedCard
              key={index}
              onClick={() => handleFeedCardClick(post.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
