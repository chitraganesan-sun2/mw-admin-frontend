"use client";

import Image from "next/image";
import DummyProfileImg from "@/assets/images/DummyProfileImg.png";
import TagComponent from "@/components/common/Tag";
import CommentIcon from "@/assets/icons/CommentIcon";
import { endpoints } from "@/api/constants";
import { DELETE_API, GET_API } from "@/api/request";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  DeleteCloseIcon,
  HeartLikeIcon,
  MenuDot,
} from "@/assets/icons";
import { useQueryState } from "nuqs";
import PostSkeleton from "./skeleton";
import { timesAgo } from "@/utils/timeFunctions";
import ErrorMsg from "@/components/common/Messages/ErrorMsg";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import AlertModal from "@/components/common/Modals/AlertModal";

interface FeedCardProps {
  onClick: (postId: string) => void;
  isManagePost?: boolean;
}

const FeedCard = ({ onClick, isManagePost = false }: FeedCardProps) => {
  const queryClient = useQueryClient();
  const [searchQuery] = useQueryState("query");

  const [currentDeletePostId, setCurrentDeletePostId] = useState<string | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState<boolean>(false);
  const [isDeleteAlertLoading, setIsDeleteAlertLoading] = useState<boolean>(false);

  const { ref, inView } = useInView();

  const getPosts = async ({ pageParam = 1 }) => {
    let endpoint = endpoints.post.getPosts;
    const response = await GET_API(
      `${endpoint}?page=${pageParam}&size=10&query=${searchQuery || ""}`
    );
    return response.data;
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isError,
  } = useInfiniteQuery({
    queryKey: ["get-posts", searchQuery],
    queryFn: getPosts,
    getNextPageParam: (lastPage) => {
      if (lastPage.items.length < 10) return undefined;
      return lastPage.page + 1;
    },
    initialPageParam: 1,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  const posts = data?.pages.flatMap((page) => page.items) ?? [];

  const handleCommentClick = (postId: string) => {
    onClick(postId);
  };

  const hanldeDeleteEvent = async () => {
    setIsDeleteAlertLoading(true);
    await DELETE_API(endpoints.post.deletePost(currentDeletePostId || "")).then(() => {
      queryClient.invalidateQueries({
        queryKey: ["get-posts"],
      });
    });
    setIsDeleteAlertOpen(false);
    setIsDeleteAlertLoading(false);
  };

  const handleTriggerDeleteEvent = (postId: string) => {
    setIsDeleteAlertOpen(true);
    setCurrentDeletePostId(postId);
  };

  if (isError) return <ErrorMsg />;

  return (
    <div className="flex flex-col gap-2 h-full md:p-0 relative">
      <AlertModal
        isOpen={isDeleteAlertOpen}
        onClose={() => setIsDeleteAlertOpen(false)}
        onPrimaryAction={hanldeDeleteEvent}
        title="Delete Post"
        description="Are you sure you want to delete this post? Once deleted, it cannot be undone, and this action is irreversible. All associated data will be permanently removed, and you won’t be able to recover it. Please confirm if you wish to proceed."
        primaryActionText="Yes, Delete"
        isLoading={isDeleteAlertLoading}
      />

      <h2 className="text-xl font-medium max-md:hidden">All Community Posts</h2>
      {isFetching ? (
        <PostSkeleton />
      ) : (
        <div className="flex flex-col gap-3 h-full divide-y divide-gray-200">
          {posts.map((post) => {
            const postImage = post?.images[0]?.image_url;
            const validImageUrl =
              postImage && postImage.startsWith("http") ? postImage : "";

            return (
              <div key={post.post_id} className="block w-full relative py-2">
                <div className="px-2 py-1 md:px-0">
                  {/* Profile and Name Section */}
                  <div className="flex items-start gap-2 md:gap-3 w-full p-2">
                    <div className="w-[40px] h-[40px] md:w-[40px] md:h-[40px] relative flex-shrink-0 flex items-center justify-center">
                      <Image
                        src={
                          post.author.profile_picture?.image_url ||
                          DummyProfileImg
                        }
                        alt="profile picture"
                        fill
                        className="rounded-full object-cover"
                        sizes="(max-width: 768px) 32px, 40px"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between w-full min-h-[32px] md:min-h-[40px]">
                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                          <p className="font-semibold text-sm md:text-base text-black">
                            {post?.author?.name}
                          </p>
                          <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-black"></div>
                          <div className="flex items-center gap-1 md:gap-2">
                            {isManagePost || (
                              <div className="flex items-center">
                                <TagComponent
                                  text={post?.created_by}
                                  className="w-fit text-xs md:text-sm"
                                />
                                <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                              </div>
                            )}
                            <p className="font-semibold text-sm md:text-base text-black">
                              {timesAgo(post?.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-4">
                            <div
                              onClick={() =>
                                handleTriggerDeleteEvent(post.post_id)
                              }
                              className="cursor-pointer"
                            >
                              <DeleteCloseIcon />
                            </div>
                            <div
                              onClick={() => onClick(post.post_id)}
                              className="cursor-pointer hidden md:block"
                            >
                              <MenuDot />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-0 md:mt-3 lg:mt-0 lg:!pl-[50px]">
                  <div className="px-3 md:px-0">
                    <p className="text-xs md:text-sm font-normal">
                      {post.description}
                      {post.description.length > 150 && (
                        <span
                          onClick={() => onClick(post.post_id)}
                          className="cursor-pointer text-primary font-medium text-[#ffac71]"
                        >
                          See More
                        </span>
                      )}
                    </p>
                  </div>

                  {post.images.length > 0 && (
                    <div className="mt-2 md:mt-3 w-full h-full min-h-[240px] max-h-[350px] md:min-h-[360px] md:max-h-[420px] 2xl:min-h-[400px] 2xl:max-h-[450px] relative">
                      <Image
                        src={validImageUrl}
                        alt="post image"
                        fill
                        onClick={() => onClick(post.post_id)}
                        className="object-cover cursor-pointer md:rounded-xl"
                      />
                    </div>
                  )}

                  <div className="p-2 md:pr-4 md:px-0 mt-2 md:mt-3">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-6">
                        {/* Like button section */}
                        <div className="flex items-center gap-1 cursor-pointer w-10">
                          <div>
                            <HeartLikeIcon />
                          </div>
                          {post?.total_likes}
                        </div>
                        {/* Comment button section */}
                        <div
                          onClick={() => handleCommentClick(post.post_id)}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <CommentIcon />
                          {post.total_comments}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading indicator */}
          {posts.length !== 0 && (
            <div ref={ref} className="w-full">
              {isFetchingNextPage ? (
                <PostSkeleton size={2} />
              ) : (
                <div className="w-full text-center font-semibold text-success mt-4 px-5">
                  You’ve reached the end. No more posts to show!
                </div>
              )}
            </div>
          )}

          {posts.length === 0 && (
            <div className="flex-center w-full h-full min-h-[50vh]">
              No Posts Found
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default FeedCard;
