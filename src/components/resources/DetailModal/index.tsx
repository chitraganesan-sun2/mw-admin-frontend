"use client";

import ModalCloseIcon from "@/assets/icons/ModalCloseIcon";
import Divider from "@/components/common/Divider";
import TagComponent from "@/components/common/Tag";
import Image from "next/image";
import Link from "next/link";
import ViewModal from "@/components/common/Modals/ViewModal";
import { useQueryState } from "nuqs";
import Button from "@/components/common/Button";
import { IoCheckmark, IoClose } from "react-icons/io5";
import { useQuery } from "@tanstack/react-query";
import { deleteResource, getSingleResource } from "@/api/resources";
import { showToast } from "@/components/common/Toast";
import { usePathname } from "next/navigation";
import { getReportStatus, rejectReport, resolveReport } from "@/api/reports";
import LottieLoader from "@/components/common/Loader/Lottie";
import { queryClient } from "@/api/query-client";
import { useMemo, useState } from "react";
import ErrorMsg from "@/components/common/Messages/ErrorMsg";

const curatedLinks = [
  { title: "Guitar Tuning Guide", link: "https://example.com/guitar-tuning" },
  { title: "Finger Placement Tips", link: "https://example.com/guitar-tuning" },
];

type DetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  refetch?: () => void;
};

const DetailModal = ({ isOpen, onClose, refetch }: DetailModalProps) => {
  const pathname = usePathname();
  const isReportsPage = pathname.includes("reports");

  const [resourceId] = useQueryState("id");
  const [reportId] = useQueryState("reportId");

  const [isDeleting, setIsDeleting] = useState(false);
  const [isKeeping, setIsKeeping] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const { data: resource, isFetching } = useQuery({
    queryKey: ["resource-single", resourceId],
    queryFn: () => (resourceId ? getSingleResource(resourceId) : null),
    enabled: !!resourceId,
  });

  const { data: ReportStatus } = useQuery({
    queryKey: ["report-status", reportId],
    queryFn: () => (reportId ? getReportStatus(reportId) : null),
    enabled: !!reportId,
  });

  console.log(ReportStatus);
  

  const invalidateQueries = () => {
    if (isReportsPage) {
      refetch?.();
    } else {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    }
  };
  const handleAction = async (action: any, id: any, successMessage: any, errorMessage: any, setLoading: any) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await action(id);
      if (res === 200) {
        showToast({ message: successMessage });
        invalidateQueries();
        onClose();
      } else {
        showToast({ message: errorMessage, type: "error" });
      }
    } catch (error) {
      showToast({ message: "An error occurred", type: "error" });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = () => handleAction(deleteResource, resourceId, "Resource Deleted", "Resource not deleted", setIsDeleting);
  const handleKeepResource = () => handleAction(resolveReport, reportId, "Resource Kept", "Resource not kept", setIsKeeping);
  const handleRejectReport = () => handleAction(rejectReport, reportId, "Resource Rejected", "Resource not rejected", setIsRejecting);
  

  const renderSkills = () =>
    resource?.resource_skills?.map((item: any, index: number) => (
        <TagComponent
            key={index}
            text={item?.skill_name}
            className="!py-0 !px-4 !text-[0.75rem] w-fit"
        />
    ));

  const renderCuratedLinks = () =>
    resource?.curated_links?.map((item: any, index: number) => (
        <p key={index}>
            {index + 1}. {item?.title} -{" "}
            <Link href={item?.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                {item?.url}
            </Link>
        </p>
    ));

  if (!resourceId) return null;

  const isLoading = isDeleting || isKeeping || isRejecting;
  return (
    <ViewModal modalOpen={isOpen} onClose={onClose} width={800} height="100%">
      {isFetching ? (
        <div className="w-full flex-center min-h-[90vh]">
          <LottieLoader isLoading={true} />
        </div>
      ) : !resource ? (
        <ErrorMsg />
      ) : (
        <div className="flex flex-col max-h-[90vh]">
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="relative h-[260px] rounded-t-xl">
              <Image src={resource?.resource_image?.image_url || "/placeholder.png"} fill className="object-cover" alt="Resource" />
              <div className="flex items-center gap-4 w-fit absolute top-4 right-4">
                <span onClick={onClose} className="block cursor-pointer">
                  <ModalCloseIcon />
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-4 px-8 py-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-medium text-black">{resource?.resource_title}</p>
                  <span className="text-sm font-medium text-gray-light">By {resource?.author?.name}</span>
                </div>
                <p className="text-sm font-medium text-gray-light capitalize">Level: {resource?.difficulty_level || "N/A"}</p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="font-medium text-black">Description</p>
                <p className="text-sm text-gray-light">{resource?.resource_description || "No description provided."}</p>
              </div>
              <Divider />
              <div className="flex flex-col gap-2">
                <p className="font-medium text-black">Skills Gained</p>
                <div className="flex flex-wrap gap-y-2">{renderSkills()}</div>
              </div>
              <Divider />
              <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto">
                <p className="font-medium text-black">Curated Links</p>
                {resource?.curated_links?.length > 0 ? (
                  <div className="flex flex-col gap-2">{renderCuratedLinks()}</div>
                ) : (
                  <p className="text-sm text-gray-light">
                    No curated links provided.
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t px-5 py-3">
            {isReportsPage && (
              <>
                <Button loading={isKeeping} onClick={isLoading ? undefined : handleKeepResource} btnVariant="success" icon={<IoCheckmark size={18} />} title="Keep Resource" />
                <Button loading={isRejecting} onClick={isLoading ? undefined : handleRejectReport} btnVariant="warning" icon={<IoClose size={18} />} title="Reject Report" />
              </>
            )}
            <Button loading={isDeleting} onClick={isLoading ? undefined : handleDelete} btnVariant="error" icon={<IoClose size={18} />} title="Remove Resource" />
          </div>
        </div>
      )}
    </ViewModal>
  );
};

export default DetailModal;