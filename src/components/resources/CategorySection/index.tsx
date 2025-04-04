import { getResourcesByCategory } from "@/api/resources";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import React from "react";
import Card, { CardSkeleton } from "../Card";

type CategorySectionProps = {
  topicSingleTitle: string;
  isFetching?: boolean;
  handleViewOrEditResource: (mode: ShowModalType, resourceId: string) => void;
};

const CategorySection = ({
  topicSingleTitle,
  handleViewOrEditResource,
}: CategorySectionProps) => {
  const [category] = useQueryState("category");
  const [searchQuery] = useQueryState("query");

  const { data: categories, isFetching } = useQuery({
    queryKey: ["resources-by-category", category, searchQuery],
    queryFn: async () => {
      const resources = await getResourcesByCategory(category || "", {
        query: searchQuery || "",
      });
      return resources?.items || [];
    },
  });

  return (
    <div className="flex flex-col px-5">
      <h2 className="mb-5 lg:mb-8 font-medium text-xl">
        Resources {">"} {topicSingleTitle}
      </h2>
      {isFetching ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 7 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <>
          {categories?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories &&
                categories?.length > 0 &&
              categories?.map((resource: any, index: number) => (
                <div
                  key={resource?.resource_id || index}
                  className="col-span-1"
                >
                  <Card
                    resource={resource}
                    className="w-full h-full"
                    onClick={() =>
                      handleViewOrEditResource("view", resource?.resource_id)
                    }
                  />
                </div>
              ))}
          </div>
          ):  (
            <span className="min-w-[250px] min-h-[50vh] !h-full !w-full flex-center">
              No Resource Found
            </span>
          )}
        </>
      )}
    </div>
  );
};

export default CategorySection;
