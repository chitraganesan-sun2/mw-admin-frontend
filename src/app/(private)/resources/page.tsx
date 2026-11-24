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
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Button } from "antd";
import { usePathname } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { IoIosArrowBack } from "react-icons/io";
import ErrorMsg from "@/components/common/Messages/ErrorMsg";
import FilterBar from "@/components/common/Filters/FilterBar";
import ListSearch from "@/components/common/Filters/ListSearch";

const RESOURCES_PAGE_SIZE = 20;

type ShowModalType = "view" | "edit" | "create" | null;

export default function ResourcesPage() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();

  const [category, setCategory] = useQueryState("category");
  const [searchQuery] = useQueryState("query");
  const [resourceId, setResourceId] = useQueryState("id");
  const [mode, setMode] = useQueryState("mode");

  const { data: ResourceCategories, isError: isErrorCategories, refetch: refetchCategories } =
    useQuery({
      queryKey: ["resource-categories"],
      queryFn: async () =>
        (await GET_API(endpoints.resources.getCategories))?.data || [],
    });

  // The API pages its answer; asking for one page used to silently drop everything after it.
  const {
    data: resourcePages,
    isFetching: isFetchingResources,
    isError: isErrorResources,
    refetch: refetchResources,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["resources", searchQuery],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => await getResources({ query: searchQuery || "", page: String(pageParam), size: String(RESOURCES_PAGE_SIZE) }),
    getNextPageParam: (last: any, pages) => {
      const loaded = pages.reduce((n: number, p: any) => n + (p?.items?.length ?? 0), 0);
      const total = typeof last?.total === "number" ? last.total : undefined;
      if (!last?.items?.length) return undefined;
      if (total !== undefined) return loaded < total ? pages.length + 1 : undefined;
      return last.items.length >= RESOURCES_PAGE_SIZE ? pages.length + 1 : undefined;
    },
    enabled: !category,
  });
  const resources = useMemo(() => resourcePages?.pages.flatMap((p: any) => p?.items ?? []) ?? [], [resourcePages]);

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
      showSearch: false,
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
      <FilterBar className="px-4 !mb-2">
        <ListSearch placeholder="Search resources" />
      </FilterBar>

      {category && pageTitle !== "Resources" ? (
        <CategorySection
          topicSingleTitle={pageTitle}
          handleViewOrEditResource={handleViewOrEditResource}
        />
      ) : isErrorCategories || isErrorResources ? (
        <ErrorMsg
          message="Couldn't load the resources."
          onRetry={() => {
            refetchCategories();
            refetchResources();
          }}
          retrying={isFetchingResources}
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

          {isFetchingResources && !isFetchingNextPage ? (
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
          {hasNextPage && !(isFetchingResources && !isFetchingNextPage) ? (
            <div className="flex justify-center py-4">
              <Button onClick={() => fetchNextPage()} loading={isFetchingNextPage} disabled={isFetchingNextPage}>
                Show more resources
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
