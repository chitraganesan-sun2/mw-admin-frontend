"use client";

import { endpoints } from "@/api/constants";
import { GET_API } from "@/api/request";
import { getResources } from "@/api/resources";
import Card, { CardSkeleton } from "@/components/resources/Card";
import CategorySection from "@/components/resources/CategorySection";
import DetailModal from "@/components/resources/DetailModal";
import SectionWrapper from "@/components/resources/SectionWrapper";
import TopicCard from "@/components/resources/TopicCard";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { IoIosArrowBack } from "react-icons/io";

type ShowModalType = "view" | "edit" | "create" | null;

export default function ResourcesPage() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();

  const [category, setCategory] = useQueryState("category");
  const [searchQuery] = useQueryState("query");
  const [resourceId, setResourceId] = useQueryState("id");
  const [mode, setMode] = useQueryState("mode");

  const { data: ResourceCategories} =
    useQuery({
      queryKey: ["resource-categories"],
      queryFn: async () =>
        (await GET_API(endpoints.resources.getCategories))?.data || [],
    });

  const { data: resources, isFetching: isFetchingResources } = useQuery({
    queryKey: ["resources", searchQuery],
    queryFn: async () =>
      (await getResources({ query: searchQuery || "" }))?.items || [],
    enabled: !category,
  });

  const pageTitle = useMemo(
    () =>
      ResourceCategories?.find((c: any) => c?.category_id === category)?.category_name || "Resources",
    [ResourceCategories, category]
  );

  useEffect(() => {
    setHeaderOptions({
      title: pageTitle,
      titleIcon: category ? (
        <IoIosArrowBack className="text-lg" />
      ) : (
        getHeaderIcon(pathname)
      ),
      titleIconClick: () => setCategory(null),
      showSearch: true,
    });
  }, [category, pathname, setHeaderOptions, pageTitle]);

  const handleViewOrEditResource = (mode: ShowModalType, id: string) => {
    setMode(mode);
    setResourceId(id);
  };

  const handleCloseModal = () => {
    setMode(null);
    setResourceId(null);
  };

  return (
    <div className="w-full h-full pt-8 flex flex-col gap-2 p-4 animate-fadeIn">
      <DetailModal isOpen={mode === "view"} onClose={handleCloseModal} />

      {category && pageTitle !== "Resources" ? (
        <CategorySection
          topicSingleTitle={pageTitle}
          handleViewOrEditResource={handleViewOrEditResource}
        />
      ) : (
        <>
          {ResourceCategories?.length > 0 && (
            <SectionWrapper
              data={ResourceCategories}
              title="Topics"
              renderItem={(item, index) => (
                <TopicCard
                  key={item.category_id}
                  onClick={() => setCategory(item.category_id)}
                  index={index}
                  label={item.category_name}
                />
              )}
            />
          )}

          {isFetchingResources ? (
            <SectionWrapper
              onPlaceHolderClick={() => setMode("create")}
              data={Array(5).fill(null)}
              title={pageTitle}
              contentClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 w-full"
              renderItem={(item, index) => <CardSkeleton key={index} />}
            />
          ) : (
            <SectionWrapper
              data={resources}
              title={pageTitle}
              contentClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 w-full"
              renderItem={(item, index) => (
                <Card
                  key={item?.resource_id || index}
                  className="!w-full"
                  resource={item}
                  onClick={() =>
                    handleViewOrEditResource("view", item?.resource_id)
                  }
                />
              )}
            />
          )}
        </>
      )}
    </div>
  );
}
