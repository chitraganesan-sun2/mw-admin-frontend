"use client";

import { endpoints } from "@/api/constants";
import { GET_API } from "@/api/request";
import Table from "@/components/Table";
import { getVolunteerColumns } from "@/constants/tablecolumn";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import ProfileDetailsModal from "@/components/volunteer/ProfileDetails";
import { calculateAge } from "@/utils/moment";
import GroupFilters from "@/components/common/Filters";
import VolunteerFilterModal from "@/components/volunteer/VolunteerFilterModal";

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

const tabs = [
  {
    key: "all-volunteers",
    title: "All Volunteers",
  },
  {
    key: "pending-volunteer-request",
    title: "Pending Volunteer Request",
  },
  {
    key: "approved-volunteers",
    title: "Approved Volunteers",
  },
];

export default function LearnersPage() {
  const router = useRouter();
  const [volunteerData, setVolunteerData] = useState<TableVolunteer[]>([]);

  const [total, setTotal] = useState<number>(0);
  const [size, setSize] = useQueryState("size", { defaultValue: "10" });
  const [page, setPage] = useQueryState("page", { defaultValue: "1" });

  const [isFilterOn, setIsFilterOn] = useState(false);

  const handleSeeMoreDetails = (id: string) => {
    console.log("See more details:", id);
    router.push(`/volunteer?volunteer_id=${id}`);
  };
  const columns = getVolunteerColumns(handleSeeMoreDetails);

  const getAllVolunteers = async ({ page, size }: PaginationParams) => {
    const response: any = await GET_API(
      `${endpoints.volunteer.getAllVolunteers}?page=${page}&size=${size}`
    );

    const filteredItems = response.data.items.filter(
      (volunteer: any) => volunteer.onboarded_status !== "details_pending"
    );

    return {
      ...response.data,
      items: filteredItems.slice(0, size),
      total: response.data.items.filter(
        (volunteer: any) => volunteer.onboarded_status !== "details_pending"
      ).length,
    };
  };

  const { data: volunteers, isFetching } = useQuery({
    queryKey: ["volunteers", page, size],
    queryFn: () => getAllVolunteers({ page, size }),
  });

  useEffect(() => {
    console.log(volunteers, "volunteers ");
    if (volunteers?.items) {
      const transformedData = volunteers.items.map((volunteer: any) => ({
        volunteer_id: volunteer.volunteer_id,
        name: `${volunteer.volunteer_first_name} ${volunteer.volunteer_last_name}`,
        age: calculateAge(volunteer?.volunteer_birth_date) || "-",
        location: volunteer?.country || "-",
        onboarded_status: volunteer.onboarded_status,
      }));
      setVolunteerData(transformedData);
      setTotal(volunteers.total);
    }
  }, [volunteers]);

  const handleTableChange = (pagination: any) => {
    setSize(pagination.pageSize);
    setPage(pagination.current);
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
      title: "Volunteers Request",
      titleIcon: getHeaderIcon(pathname),
    });
  }, [setHeaderOptions]);

  return (
    <div className="w-full h-auto p-6 animate-fadeIn">
      <ProfileDetailsModal />
      <VolunteerFilterModal
        isFilterApplying={false}
        isOpen={isFilterOn}
        onClose={() => setIsFilterOn(false)}
      />
      {/* <GroupFilters
        tabButtons={tabs}
        currentTab={currentTab}
        handleTabClick={(tab) => setCurrentTab(tab)}
        showFilters={true}
        handleFilterClick={() => setIsFilterOn(true)}
        showSearch={true}
      /> */}
      <Table
        key="volunteers"
        data={volunteerData}
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
