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
import { rejectReport, resolveReport } from "@/api/reports";
import LottieLoader from "@/components/common/Loader/Lottie";
import { queryClient } from "@/api/query-client";
import { useMemo } from "react";
import ErrorMsg from "@/components/common/Messages/ErrorMsg";

const curatedLinks = [
  { title: "Guitar Tuning Guide", link: "https://example.com/guitar-tuning" },
  { title: "Finger Placement Tips", link: "https://example.com/guitar-tuning" },
];

type DetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const DetailModal = ({ isOpen, onClose }: DetailModalProps) => {
  const pathname = usePathname();
  const isReportsPage = pathname.includes("reports");

  const [resourceId] = useQueryState("id");
  const [reportId] = useQueryState("reportId");

  const { data: resource, isFetching } = useQuery({
    queryKey: ["resource-single", resourceId],
    queryFn: () => (resourceId ? getSingleResource(resourceId) : null),
    enabled: !!resourceId,
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: [isReportsPage ? "resource-reports" : "resources"] });
  };

  const handleDelete = async () => {
    if (!resourceId) return;
    try {
      if (isReportsPage && reportId) await resolveReport(reportId);
      const res = await deleteResource(resourceId);

      if (res === 200) {
        showToast({ message: "Resource Deleted" });
        invalidateQueries();
        onClose();
      } else {
        showToast({ message: "Resource not deleted", type: "error" });
      }
    } catch (error) {
      showToast({ message: "An error occurred", type: "error" });
    }
  };

  const handleKeepResource = async () => {
    if (!reportId) return;

    try {
      const res = await rejectReport(reportId);
      if (res === 200) {
        showToast({ message: "Resource Kept" });
        invalidateQueries();
        onClose();
      } else {
        showToast({ message: "Resource not kept", type: "error" });
      }
    } catch (error) {
      showToast({ message: "An error occurred", type: "error" });
    }
  };

  const renderCuratedLinks = useMemo(
    () =>
      curatedLinks.map((item, index) => (
        <p key={index}>
          {index + 1}. {item.title} -{" "}
          <Link href={item.link} target="_blank" className="text-primary underline">
            {item.link}
          </Link>
        </p>
      )),
    []
  );

  const renderSkills = useMemo(
    () =>
      resource?.resource_skills?.map((item: any, index: number) => (
        <TagComponent key={index} text={item?.skill_name} className="!py-0 !px-4 !text-[0.75rem] w-fit" />
      )),
    [resource?.resource_skills]
  );

  if (!resourceId) return null;

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
                <p className="font-medium text-black">Skills you gain</p>
                <div className="flex flex-wrap gap-y-2">{renderSkills}</div>
              </div>
              <Divider />
              <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto">
                <p className="font-medium text-black">Curated Links</p>
                <div className="flex flex-col gap-2">{renderCuratedLinks}</div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t px-5 py-3">
            <Button onClick={handleDelete} btnVariant="error" icon={<IoClose size={18} />} title="Remove Resource" />
            {isReportsPage && (
              <Button onClick={handleKeepResource} btnVariant="success" icon={<IoCheckmark size={18} />} title="Keep Resource" />
            )}
          </div>
        </div>
      )}
    </ViewModal>
  );
};

export default DetailModal;