"use client";

import Image from "next/image";
import DummyProfileImg from "@/assets/images/DummyProfileImg.png";
import TagComponent from "@/components/common/Tag";
import { Dropdown } from "antd";
import { FiHeart, FiMessageCircle, FiMoreHorizontal } from "react-icons/fi";
import EmptyState from "@/components/common/EmptyState";
import { endpoints } from "@/api/constants";
import { DELETE_API, GET_API } from "@/api/request";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { createInFlightGuard } from "@/utils/inflight";
import { withQuery } from "@/utils/query";
import { useQueryState } from "nuqs";
import PostSkeleton from "./skeleton";
import { timesAgo } from "@/utils/timeFunctions";
import ErrorMsg from "@/components/common/Messages/ErrorMsg";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import AlertModal from "@/components/common/Modals/AlertModal";
import { showToast } from "@/components/common/Toast";
import { getApiErrorMessage } from "@/utils/apiError";

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
      withQuery(endpoint, { page: pageParam, size: 10, query: searchQuery?.trim() })
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
    refetch,
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

  // A second click on "Yes, Delete" before the dialog re-renders must not send a second request.
  const flight = useRef(createInFlightGuard());
  const hanldeDeleteEvent = () => flight.current.run(deletePostNow);

  const deletePostNow = async () => {
    setIsDeleteAlertLoading(true);
    try {
      await DELETE_API(endpoints.post.deletePost(currentDeletePostId || ""));
      queryClient.invalidateQueries({ queryKey: ["get-posts"] });
      showToast({ message: "Post deleted" });
    } catch (err: any) {
      showToast({ message: getApiErrorMessage(err, "Couldn't delete the post. Please try again."), type: "error" });
    } finally {
      setIsDeleteAlertOpen(false);
      setIsDeleteAlertLoading(false);
    }
  };

  const handleTriggerDeleteEvent = (postId: string) => {
    setIsDeleteAlertOpen(true);
    setCurrentDeletePostId(postId);
  };

  if (isError) return <ErrorMsg message="Couldn't load the posts." onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-2 h-full md:p-0 relative">
      <AlertModal
        isOpen={isDeleteAlertOpen}
        onClose={() => setIsDeleteAlertOpen(false)}
        onPrimaryAction={hanldeDeleteEvent}
        title="Delete Post"
        description="Delete this post? This permanently removes it and all associated data. It can't be undone."
        primaryActionText="Yes, Delete"
        isLoading={isDeleteAlertLoading}
      />

      <h2 className="text-xl font-medium max-md:hidden">All Community Posts</h2>
      {isFetching ? (
        <PostSkeleton />
      ) : (
        <div className="flex flex-col gap-3 h-full divide-y divide-line-soft">
          {posts.map((post) => {
            const postImage = post?.images?.[0]?.image_url;
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
                          post?.author?.profile_picture?.image_url ||
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
                        {/* One 32px actions button; Delete lives in the menu (it still asks for confirmation). */}
                        <Dropdown
                          trigger={["click"]}
                          placement="bottomRight"
                          menu={{
                            items: [
                              { key: "open", label: "Open post" },
                              { key: "delete", label: "Delete post", danger: true },
                            ],
                            onClick: ({ key }) => {
                              if (key === "open") onClick(post.post_id);
                              if (key === "delete") handleTriggerDeleteEvent(post.post_id);
                            },
                          }}
                        >
                          <button
                            type="button"
                            aria-label="Post actions"
                            aria-haspopup="menu"
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-ink-2 hover:bg-background"
                          >
                            <FiMoreHorizontal aria-hidden size={18} />
                          </button>
                        </Dropdown>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-0 md:mt-3 lg:mt-0 lg:!pl-[50px]">
                  <div className="px-3 md:px-0">
                    <p className="text-sm font-normal">
                      {post?.description ?? ""}
                      {(post?.description?.length ?? 0) > 150 && (
                        <button
                          type="button"
                          onClick={() => onClick(post.post_id)}
                          className="cursor-pointer font-medium text-brand-ink underline bg-transparent border-0 p-0 inline"
                        >
                          See more
                        </button>
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
                        <div className="flex items-center gap-1.5 text-sm text-ink-2" aria-label={`${post?.total_likes ?? 0} likes`}>
                          <FiHeart aria-hidden size={16} />
                          {post?.total_likes}
                        </div>
                        {/* Comment button section */}
                        <button
                          type="button"
                          aria-label="View comments"
                          onClick={() => handleCommentClick(post.post_id)}
                          className="flex items-center gap-1.5 text-sm text-ink-2 cursor-pointer bg-transparent border-0 p-0"
                        >
                          <FiMessageCircle aria-hidden size={16} />
                          {post.total_comments}
                        </button>
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
                  You&apos;ve reached the end. No more posts to show!
                </div>
              )}
            </div>
          )}

          {posts.length === 0 && (
            <EmptyState
              title={searchQuery?.trim() ? "No posts match your search" : "No posts yet"}
              description={searchQuery?.trim() ? "Try a different search." : "Community posts will appear here."}
            />
          )}

        </div>
      )}
    </div>
  );
};

export default FeedCard;
