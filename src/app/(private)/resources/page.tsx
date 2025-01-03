"use client";

import Card from "@/components/resources/Card";
import DetailModal from "@/components/resources/DetailModal";
import SectionWrapper from "@/components/resources/SectionWrapper";
import TopicCard from "@/components/resources/TopicCard";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import { usePathname } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect } from "react";
import { IoIosArrowBack } from "react-icons/io";

type ShowModalType = "view" | "edit" | "create" | null;

//TODO: Needs to be deleted
const TopicData = [
  {
    title: "Basic",
  },
];

//TODO: Needs to be deleted
const ResourceData = [
  {
    id: "1",
    title: "Resource 1",
  },
];

export default function ResourcesPage() {
  const { setHeaderOptions } = useComponentStore();
  const [category, setCategory] = useQueryState("category");
  const [_, setId] = useQueryState("id");
  const [mode, setMode] = useQueryState("mode");

  const pathname = usePathname();

  const handleTopicClick = (title: string) => {
    setCategory(title);
  };

  const handleMyResourcesClick = () => {
    setCategory("my-resources");
  };

  const handleBackClick = () => {
    setCategory(null);
  };

  // * Used to set topbar options
  useEffect(() => {
    const headerTitle = category || "Resources";
    const titleIcon =
      category !== null ? (
        <IoIosArrowBack className="text-lg" />
      ) : (
        getHeaderIcon(pathname)
      );

    //* Used zustand to update the props of common header component
    setHeaderOptions({
      title: headerTitle,
      titleIcon,
      showSearch: true,
    });
  }, [category, pathname, setHeaderOptions]);

  const handleAddResourceClick = () => {
    setMode("create");
  };

  const handleCloseModal = () => {
    setMode(null);
    setId(null);
  };

  const handleViewOrEditResource = (mode: ShowModalType, id: string) => {
    setMode(mode);
    setId(id);
  };

  return (
    <div className="w-full h-full pt-8 flex flex-col gap-2 p-4 animate-fadeIn">
      <DetailModal isOpen={mode === "view"} onClose={handleCloseModal} />
      <SectionWrapper
        hideSectionHeader={category !== null}
        data={TopicData}
        title="Topics"
        renderItem={(item, index) => (
          <TopicCard
            onClick={() => handleTopicClick(item.title)}
            index={index}
            item={item}
          />
        )}
      />
      <SectionWrapper
        onPlaceHolderClick={handleAddResourceClick}
        data={ResourceData}
        title={category !== null ? undefined : "Resources"}
        renderItem={(item, index) => (
          <Card onClick={() => handleViewOrEditResource("view", item?.id)} />
        )}
      />
    </div>
  );
}
