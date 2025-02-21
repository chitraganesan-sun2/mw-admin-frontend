"use client";

import { endpoints } from "@/api/constants";
import { GET_API } from "@/api/request";
import Table from "@/components/Table";
import { getLearnerColumns } from "@/constants/tablecolumn";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { calculateAge } from "@/utils/moment";
import { formatString } from "@/utils/stringFunctions";
import LearnerProfileDetails from "@/components/learner/ProfileDetails";

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
  const router = useRouter();
  const [learnerData, setLearnerData] = useState<TableVolunteer[]>([]);

  const [total, setTotal] = useState<number>(0);
  const [size, setSize] = useQueryState("size", { defaultValue: "10" });
  const [page, setPage] = useQueryState("page", { defaultValue: "1" });
  const [learnerId, setLearnerId] = useQueryState("learner_id");

  const handleSeeMoreDetails = (id: string) => {
    setLearnerId(id);
  };
  const columns = getLearnerColumns(handleSeeMoreDetails);

  const getAlllearners = async ({ page, size }: PaginationParams) => {
    try{
      const response: any = await GET_API(
        `${endpoints.learner.getAllLearners}?page=${page}&size=${size}`
      );

      const filteredItems = response?.data?.items;

      return {
        ...response.data,
        items: filteredItems.slice(0, size),
      }
    } catch (error) {
      console.log(error);
      return {
        items: [],
        total: 0,
      };
    }
  };

  const { data: learners, isFetching } = useQuery({
    queryKey: ["learners", page, size],
    queryFn: () => getAlllearners({ page, size }),
  });

  useEffect(() => {
    if (learners?.items) {
      const transformedData = learners?.items?.map((learner: any) => ({
        learner_id: learner?.learner_id,
        name: learner?.learner_full_name,
        age: calculateAge(learner?.learner_dob) || "-",
        location: formatString(learner?.country) || "-",
      }));
      setLearnerData(transformedData);
      setTotal(learners?.total);
    }
  }, [learners]);

  const handleTableChange = (pagination: any) => {
    setSize(pagination.pageSize);
    setPage(pagination.current);
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
      <LearnerProfileDetails />
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
      />
    </div>
  );
}
