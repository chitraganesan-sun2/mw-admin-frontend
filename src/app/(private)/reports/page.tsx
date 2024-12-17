"use client";

import { endpoints } from "@/api/constants";
import { GET_API } from "@/api/request";
import Table from "@/components/Table";
import { getReportsColumns } from "@/constants/column";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";

interface PaginationParams {
  page: number;
  size: number;
}

interface TableReports {
  id: string;
  profile_name: string;
  reason: string;
  report_time: string;
  review_status: string;
  see_post: string;
}

export default function LearnersPage() {
  const [reportsData, setReportsData] = useState<TableReports[]>([]);
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    size: 10,
  });
  const [total, setTotal] = useState<number>(0);
  const handleSeePost = (id: string) => {
    console.log("See more details:", id);
    alert(id);
  };

  const columns = getReportsColumns(handleSeePost);

  const getAllReports = async ({ page, size }: PaginationParams) => {
    // const response: any = await GET_API(
    //   `${endpoints.volunteer.getAllVolunteers}?page=${page}&size=${size}`
    // );
    // return response.data;
  };

  const { data: reports, isLoading } = useQuery({
    queryKey: ["reports", pagination.page, pagination.size],
    queryFn: () => getAllReports(pagination),
  });

  // useEffect(() => {
  //   if (volunteers?.items) {
  //     const transformedData = volunteers.items.map((volunteer: any) => ({
  //       id: volunteer.volunteer_id,
  //       name: `${volunteer.volunteer_personal_info.volunteer_first_name} ${volunteer.volunteer_personal_info.volunteer_last_name}`,
  //       age: volunteer.volunteer_personal_info.volunteer_age,
  //       location: volunteer.volunteer_personal_info.volunteer_location,
  //     }));
  //     setVolunteerData(transformedData);
  //     setTotal(volunteers.total);
  //   }
  // }, [volunteers]);

  useEffect(() => {
    setReportsData([
      {
        id: "11",
        profile_name: "John Doe",
        reason: "Spamming",
        report_time: "12-12-2024",
        review_status: "Pending",
        see_post: "See post",
      },
      {
        id: "22",
        profile_name: "Jane Doe",
        reason: "Spamming",
        report_time: "12-12-2024",
        review_status: "Accepted",
        see_post: "See post",
      },
      {
        id: "33",
        profile_name: "John Doe",
        reason: "Spamming",
        report_time: "12-12-2024",
        review_status: "Removed",
        see_post: "See post",
      },
    ]);
  }, []);

  const handleTableChange = (pagination: any) => {
    setPagination({
      page: pagination.current,
      size: pagination.pageSize,
    });
  };

  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();

  const [_, setVolunteerId] = useQueryState("id", {
    shallow: true,
  });
  const [mode, setMode] = useQueryState("mode", {
    shallow: true,
  });

  const handleClose = () => {
    setVolunteerId(null);
    setMode(null);
  };

  useEffect(() => {
    setHeaderOptions({
      title: "Reports",
      titleIcon: getHeaderIcon(pathname),
    });
  }, [setHeaderOptions]);

  return (
    <div className="w-full h-full p-6 animate-fadeIn">
      <Table
        data={reportsData}
        columns={columns}
        loading={isLoading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.size,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        onChange={handleTableChange}
        handleSeePost={handleSeePost}
      />
    </div>
  );
}
