"use client";

import ViewModal from "@/components/common/Modals/ViewModal";
import Image from "next/image";
import TagComponent from "@/components/common/Tag";
import Divider from "@/components/common/Divider";
import CommentCard from "@/components/community/CommentCard";
import { DeleteCloseIcon, FeedModalCloseIcon } from "@/assets/icons";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/api/constants";
import { GET_API, DELETE_API } from "@/api/request";
import React, { useState } from "react";
import LottieLoader from "@/components/common/Loader/Lottie";
import CommentSkeleton from "../CommentCard/skeleton";
import ErrorMsg from "@/components/common/Messages/ErrorMsg";
import { useQueryState } from "nuqs";
import AlertModal from "@/components/common/Modals/AlertModal";
import { rejectReport, resolveReport } from "@/api/reports";
import { usePathname } from "next/navigation";
import { showToast } from "@/components/common/Toast";
import Button from "@/components/common/Button";
import { IoCheckmark, IoClose } from "react-icons/io5";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const CustomNextArrow = (props: any) => {
  const { onClick } = props;
  return (
    <div
      onClick={onClick}
      className="bg-white !z-50 absolute right-3 top-1/2 transform -translate-y-1/2 text-primary border border-primary p-2 rounded-full shadow-md cursor-pointer"
    >
      <FaChevronRight className="text-xs md:text-lg" />
    </div>
  );
};

const CustomPrevArrow = (props: any) => {
  const { onClick } = props;
  return (
    <div
      onClick={onClick}
      className="bg-white !z-50 absolute left-3 top-1/2 transform -translate-y-1/2 text-primary border border-primary p-2 rounded-full shadow-md cursor-pointer"
    >
      <FaChevronLeft className="text-xs md:text-lg" />
    </div>
  );
};

const sliderSettings = {
  infinite: true,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 3000,
  speed: 1000,
  arrows: true,
  adaptiveHeight: false,
  nextArrow: <CustomNextArrow />,
  prevArrow: <CustomPrevArrow />,
};

type FeedViewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  refetch?: () => void;
};

interface PostData {
  description: string;
  images: {
    image_url: string;
    image_id: string;
  }[];
  created_by: string;
  post_id: string;
  author: {
    name: string;
    profile_picture: {
      image_url: string;
      image_id: string;
    };
  };
  created_at: string;
  is_liked: boolean;
  is_saved: boolean;
  total_likes: number;
  total_comments: number;
}

const FeedViewModal = ({ isOpen, onClose, refetch }: FeedViewModalProps) => {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [id] = useQueryState("id");
  const [mode] = useQueryState("mode");
  const isReportsPage = pathname.includes("reports");
  const [reportId] = useQueryState("reportId");

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState<boolean>(false);
  const [isDeleteAlertLoading, setIsDeleteAlertLoading] =
    useState<boolean>(false);
  const [currentDeletePostId, setCurrentDeletePostId] = useState<string | null>(
    null
  );

  const [isCommentDeleteAlertOpen, setIsCommentDeleteAlertOpen] =
    useState<boolean>(false);
  const [isCommentDeleteLoading, setIsCommentDeleteLoading] =
    useState<boolean>(false);
  const [currentDeleteCommentId, setCurrentDeleteCommentId] = useState<
    string | null
  >(null);

  const getIndividualPost = async () => {
    const response = await GET_API(endpoints.post.getSinglePost(id as string));
    return response.data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["get-single-post", id],
    queryFn: getIndividualPost,
    enabled: !!id && mode === "view",
  });

  const getPostComments = async () => {
    const response = await GET_API(
      endpoints.comment.getPostComments(id as string)
    );
    return response.data;
  };

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["get-post-comments", id],
    queryFn: getPostComments,
    enabled: !!id,
  });

  const post = data as PostData;

  const handleCloseModal = () => {
    onClose();
  };

  const invalidateQueries = () => {
    if (isReportsPage) {
      refetch?.();
    } else {
      queryClient.invalidateQueries({ queryKey: ["get-posts"] });
    }
  };

  const [isKeeping, setIsKeeping] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleKeepPost = async () => {
    if (!reportId) return;
    try {
        setIsKeeping(true);
        await resolveReport(reportId).then((res) => {
        if (res === 200) {
          showToast({ message: "Resource Kept" });
          invalidateQueries();
          onClose();
        } else {
          showToast({ message: "Resource not kept", type: "error" });
        }
      }).finally(() => setIsKeeping(false));
    } catch (error) {
      showToast({ message: "An error occurred", type: "error" });
      setIsKeeping(false);
    }
  };

  const hanldeDeleteEvent = async () => {
    setIsDeleteAlertLoading(true);
    if (isReportsPage && reportId) {
      const res = await resolveReport(reportId);
    }
    await DELETE_API(endpoints.post.deletePost(currentDeletePostId as string))
      .then(() => {
        invalidateQueries();
      })
      .finally(() => {
        setIsDeleteAlertOpen(false);
        setIsDeleteAlertLoading(false);
        onClose();
      });
  };

  const handleRejectReport = async () => {
    if (!reportId) return;
    try {
      setIsRejecting(true);
      await rejectReport(reportId).then((res) => {
        if (res === 200) {
          showToast({ message: "Resource Rejected" });
          invalidateQueries();
          onClose();
        } else {
          showToast({ message: "Resource not rejected", type: "error" });
        }
      }).finally(() => setIsRejecting(false));
    } catch (error) {
      showToast({ message: "An error occurred", type: "error" });
      setIsRejecting(false);
    }
  };

  const handleTriggerDeleteEvent = (postId: string) => {
    setIsDeleteAlertOpen(true);
    setCurrentDeletePostId(postId);
  };

  const handleDeleteComment = async () => {
    setIsCommentDeleteLoading(true);
    try {
      await DELETE_API(
        endpoints.comment.deleteComment(currentDeleteCommentId || "")
      );
      queryClient.invalidateQueries({
        queryKey: ["get-post-comments", id],
      });
      setIsCommentDeleteAlertOpen(false);
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
    setIsCommentDeleteLoading(false);
  };

  const handleTriggerCommentDelete = (commentId: string) => {
    setIsCommentDeleteAlertOpen(true);
    setCurrentDeleteCommentId(commentId);
  };

  const isBtnDisabled = isDeleteAlertLoading || isKeeping || isRejecting;

  return (
    <>
      <AlertModal
        isOpen={isOpen && isDeleteAlertOpen}
        onClose={() => setIsDeleteAlertOpen(false)}
        onPrimaryAction={hanldeDeleteEvent}
        title="Delete Post"
        description="Are you sure you want to delete this post? Once deleted, it cannot be undone, and this action is irreversible."
        isLoading={isDeleteAlertLoading}
      />
      <AlertModal
        isOpen={isCommentDeleteAlertOpen}
        onClose={() => setIsCommentDeleteAlertOpen(false)}
        onPrimaryAction={handleDeleteComment}
        title="Delete Comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        isLoading={isCommentDeleteLoading}
      />
      <ViewModal
        className="md:!h-[90vh] lg:!h-[720px] md:!rounded-xl"
        modalOpen={isOpen}
        onClose={handleCloseModal}
        width={1200}
        height="720px"
        showCloseIcon={isError}
      >
        {isLoading ? (
          <div className="h-full w-full min-h-[80vh] flex-center">
            <LottieLoader isLoading={true} />
          </div>
        ) : isError ? (
          <ErrorMsg />
        ) : (
          <div className="grid lg:grid-cols-[1fr,0.7fr] h-[720px]">
            <div className="relative bg-gray-300 w-full md:h-[250px] lg:h-[720px] overflow-hidden">
              <Slider className="flex gap-20" {...sliderSettings}>
                {post?.images?.map((image) => (
                  <div key={image?.image_id} className="relative w-full h-[300px] md:h-[400px] lg:h-[720px]">
                    <Image
                      src={image?.image_url}
                      alt="feed image"
                      fill
                      className="object-contain"
                    />
                  </div>
                ))}
              </Slider>
            </div>
            <div className="flex flex-col lg:h-[720px] relative">
              <div className="flex justify-end items-center px-5 pb-2 pt-5 gap-3">

                {isReportsPage && (
                  <>
                    <Button isLoading={isKeeping} onClick={isBtnDisabled ? undefined : handleKeepPost} btnVariant="success" icon={<IoCheckmark size={18} />} title="Keep Post" />
                    <Button isLoading={isRejecting} onClick={isBtnDisabled ? undefined : handleRejectReport} btnVariant="warning" icon={<IoClose size={18} />} title="Reject Report" />
                  </>
                )}
                <FeedModalCloseIcon
                  className="cursor-pointer"
                  onClick={handleCloseModal}
                />
              </div>
              <Divider />
              <div className="px-7 flex flex-col flex-1 overflow-hidden mt-3">
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <div className="w-[40px] h-[40px] relative flex-shrink-0">
                      <Image
                        src={post?.author?.profile_picture?.image_url}
                        alt="profile picture"
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div className="ml-3 flex-1 flex flex-col ">
                      <div className="flex items-center gap-3 w-full min-h-[40px]">
                        <p className="font-semibold text-black">
                          {post?.author?.name}
                        </p>
                        <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                        <TagComponent
                          text={post?.created_by}
                          className="w-fit capitalize"
                        />
                        <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                        <p className="font-semibold text-black">
                          {new Date(post?.created_at).toLocaleDateString()}
                        </p>
                        <button
                          onClick={() =>
                            handleTriggerDeleteEvent(post?.post_id)
                          }
                        >
                          <DeleteCloseIcon />
                        </button>
                      </div>

                      <p className="text-sm font-normal">{post?.description}</p>
                    </div>
                  </div>
                  <Divider />
                </div>
                <div className="flex flex-col flex-1 overflow-hidden mt-3">
                  <h3 className="text-xl font-semibold text-black mb-3">
                    Comments
                  </h3>
                  <div className="flex flex-col gap-3 overflow-y-auto flex-1 pb-[75px] pr-3 hide-scrollbar">
                    {commentsLoading ? (
                      <div className="flex flex-col gap-3">
                        <CommentSkeleton size={8} />
                      </div>
                    ) : (
                      commentsData?.items.map((comment: any) => (
                        <React.Fragment key={comment.comment_id}>
                          <CommentCard
                            comment={comment}
                            onDelete={() =>
                              handleTriggerCommentDelete(comment.comment_id)
                            }
                          />
                          {comment.replies?.map((reply: any) => (
                            <CommentCard
                              key={reply.comment_id}
                              comment={reply}
                              reply
                              onDelete={() =>
                                handleTriggerCommentDelete(reply.comment_id)
                              }
                            />
                          ))}
                        </React.Fragment>
                      ))
                    )}
                    {commentsData?.items.length === 0 && (
                      <div className="flex-center h-full w-full">
                        <p className="text-md font-normal text-center">
                          No comments yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </ViewModal>
    </>
  );
};

export default FeedViewModal;
