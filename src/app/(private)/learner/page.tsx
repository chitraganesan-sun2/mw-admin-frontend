"use client";

import { endpoints } from "@/api/constants";
import { DELETE_API, GET_API } from "@/api/request";
import Table from "@/components/Table";
import { getLearnerColumns } from "@/constants/tablecolumn";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { calculateAge } from "@/utils/moment";
import { formatString } from "@/utils/stringFunctions";
import LearnerProfileDetails from "@/components/learner/ProfileDetails";
import AlertModal from "@/components/common/Modals/AlertModal";

interface PaginationParams {
  page: number | string;
  size: number | string;
}

interface TableVolunteer {
  id: string;
  name: string;
  age: number;
  location: string;
  details: string;
  requested_status: string;
}

export default function LearnersPage() {
  const [learnerData, setLearnerData] = useState<TableVolunteer[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [size, setSize] = useQueryState("size", { defaultValue: "10" });
  const [page, setPage] = useQueryState("page", { defaultValue: "1" });
  const [learnerId, setLearnerId] = useQueryState("learner_id");
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleteAlertLoading, setIsDeleteAlertLoading] = useState(false);
  const [learnerToDelete, setLearnerToDelete] = useState<string | null>(null);
  const [onboardedStatusFilter, setOnboardedStatusFilter] =
    useQueryState("onboarded_status");
  const [nameOrder, setNameOrder] = useQueryState("name_order");
  const [ageOrder, setAgeOrder] = useQueryState("age_order");

  const handleSeeMoreDetails = (id: string) => {
    setLearnerId(id);
  };

  const handleDeleteLearner = (id: string) => {
    setLearnerToDelete(id);
    setIsDeleteAlertOpen(true);
  };

  const handleOnboardedStatusFilter = () => {
    if (
      onboardedStatusFilter === null ||
      onboardedStatusFilter === "verification_rejected"
    ) {
      setOnboardedStatusFilter("verification_completed");
    } else if (onboardedStatusFilter === "verification_completed") {
      setOnboardedStatusFilter("verification_pending");
    } else if (onboardedStatusFilter === "verification_pending") {
      setOnboardedStatusFilter("partially_filled");
    } else if (onboardedStatusFilter === "partially_filled") {
      setOnboardedStatusFilter("details_pending");
    } else if (onboardedStatusFilter === "details_pending") {
      setOnboardedStatusFilter("verification_rejected");
    }
  };


  const handleModalConfirm = () => {
    setIsDeleteAlertLoading(true);
    handleDeleteEvent();
  };

  const columns = getLearnerColumns(
    handleSeeMoreDetails,
    handleDeleteLearner,
    handleOnboardedStatusFilter
  );

  const getAlllearners = async ({
    page,
    size,
    onboarded_status = "",
    name_order = "",
    age_order = "",
  }: PaginationParams & {
    onboarded_status?: string;
    name_order?: string;
    age_order?: string;
  }) => {
    try {
      let url = `${endpoints.learner.getAllLearners}?page=${page}&size=${size}`;
      if (onboardedStatusFilter) {
        url += `&onboarded_status=${onboardedStatusFilter}`;
      }
      if (name_order) {
        url += `&name_order=${name_order}`;
      }
      if (age_order) {
        url += `&age_order=${age_order}`;
      }
      const response: any = await GET_API(url);
      return {
        ...response.data,
        items: response.data.items,
        total: response.data.total,
      };
    } catch (error) {
      console.log(error);
      return {
        items: [],
        total: 0,
      };
    }
  };

  const {
    data: learners,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["learners", page, size, onboardedStatusFilter, nameOrder, ageOrder],
    queryFn: () =>
      getAlllearners({
        page,
        size,
        onboarded_status: onboardedStatusFilter as string,
        name_order: nameOrder as string,
        age_order: ageOrder as string,
      }),
  });

  useEffect(() => {
    if (learners?.items) {
      const transformedData = learners?.items?.map((learner: any) => ({
        learner_id: learner?.learner_id,
        name: learner?.learner_full_name || "-",
        age:
          calculateAge(learner?.learner_dob) === 0
            ? "Less than 1 year"
            : calculateAge(learner?.learner_dob) || "-",
        location: formatString(learner?.country) || "-",
        email: learner?.email?.toLowerCase() || "-",
        onboarded_status: learner?.onboarded_status,
      }));
      setLearnerData(transformedData);
      setTotal(learners?.total);
    }
  }, [learners]);

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setSize(pagination.pageSize);
    setPage(pagination.current);

    const sortInfo = Array.isArray(sorter) ? sorter[0] : sorter;
    
    if (sortInfo && sortInfo.order) {
      const order = sortInfo.order === "ascend" ? "asc" : sortInfo.order === "descend" ? "desc" : null;
      const field = sortInfo.field || sortInfo.columnKey;
      
      if (field === "name") {
        setNameOrder(order || null);
        if (order) {
          setAgeOrder(null);
        }
      } else if (field === "age") {
        setAgeOrder(order || null);
        if (order) {
          setNameOrder(null);
        }
      }
    } else {
      setNameOrder(null);
      setAgeOrder(null);
    }
  };

  const handleDeleteEvent = async () => {
    DELETE_API(endpoints.learner.deleteLearner(learnerToDelete || "")).then(
      (res) => {
        console.log(res, "res");
        setIsDeleteAlertOpen(false);
        setIsDeleteAlertLoading(false);
        refetch();
      }
    );
  };

  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();

  useEffect(() => {
    setHeaderOptions({
      title: "Learners List",
      titleIcon: getHeaderIcon(pathname),
    });
  }, [setHeaderOptions]);

  return (
    <div className="w-full h-auto p-6 animate-fadeIn">
      <AlertModal
        isOpen={isDeleteAlertOpen}
        onClose={() => setIsDeleteAlertOpen(false)}
        onPrimaryAction={handleModalConfirm}
        title="Delete Learner"
        description="Are you sure you want to delete this learner? Once deleted, it cannot be undone, and this action is irreversible. All associated data will be permanently removed, and you won't be able to recover it. Please confirm if you wish to proceed."
        primaryActionText="Yes, Delete"
        isLoading={isDeleteAlertLoading}
      />
      <LearnerProfileDetails />
      {/* Download Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            const csv = [
              ["Name", "Age", "Location", "Email", "Status"].join(","),
              ...learnerData.map((l: any) =>
                [l.name, l.age, l.location, l.email, l.onboarded_status].join(",")
              ),
            ].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `learners_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
        >
          Download CSV
        </button>
      </div>
      <Table
        key="learners"
        data={learnerData}
        columns={columns}
        loading={isFetching}
        pagination={{
          current: page,
          pageSize: size,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        onChange={handleTableChange}
        handleSeeMoreDetails={handleSeeMoreDetails}
        handleDelete={handleDeleteLearner}
      />
    </div>
  );
}
