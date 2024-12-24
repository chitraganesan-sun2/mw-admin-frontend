"use client";

import { endpoints } from "@/api/constants";
import { GET_API } from "@/api/request";
import CenterModal from "@/components/common/Modals/CenterModal";
import ViewModal from "@/components/common/Modals/ViewModal";
import Table from "@/components/Table";
import { getVolunteerColumns } from "@/constants/tablecolumn";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import ProfileDetailsModal from "@/components/volunteer/ProfileDetails";

interface PaginationParams {
  page: number;
  size: number;
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
  const [volunteerData, setVolunteerData] = useState<TableVolunteer[]>([]);
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    size: 10,
  });
  const [total, setTotal] = useState<number>(0);
  const router = useRouter();

  const handleSeeMoreDetails = (id: string) => {
    console.log("See more details:", id);
    router.push(`/volunteer?volunteer_id=${id}`);
  };
  const columns = getVolunteerColumns(handleSeeMoreDetails);

  const getAllVolunteers = async ({ page, size }: PaginationParams) => {
    const response: any = await GET_API(
      `${endpoints.volunteer.getAllVolunteers}?page=${page}&size=${size}`
    );
    return response.data;
  };

  const { data: volunteers, isLoading } = useQuery({
    queryKey: ["volunteers", pagination.page, pagination.size],
    queryFn: () => getAllVolunteers(pagination),
  });

  useEffect(() => {
    console.log(volunteers, "volunteers ");
    if (volunteers?.items) {
      const transformedData = volunteers.items.map((volunteer: any) => ({
        volunteer_id: volunteer.volunteer_id,
        name: `${volunteer.volunteer_first_name} ${volunteer.volunteer_last_name}`,
        onboarded_status: volunteer.onboarded_status,
        // location: volunteer.volunteer_location,
      }));
      const volunteerDetails = transformedData.filter(
        (volunteer: any) => volunteer.onboarded_status !== "details_pending"
      );
      setVolunteerData(volunteerDetails);
      setTotal(volunteers.total);
    }
  }, [volunteers]);

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

  useEffect(() => {
    setHeaderOptions({
      title: "Volunteers",
      titleIcon: getHeaderIcon(pathname),
    });
  }, [setHeaderOptions]);

  console.log(volunteerData, "volunteerData TABLE");
  return (
    <div className="w-full h-full p-6 animate-fadeIn">
      <ProfileDetailsModal />
      <Table
        data={volunteerData}
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
        handleSeeMoreDetails={handleSeeMoreDetails}
      />
    </div>
  );
}
