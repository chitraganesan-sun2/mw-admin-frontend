"use client";

import { endpoints } from "@/api/constants";
import { GET_API, DELETE_API } from "@/api/request";
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
import { formatString } from "@/utils/stringFunctions";
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
  const [volunteerData, setVolunteerData] = useState<TableVolunteer[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [size, setSize] = useQueryState("size", { defaultValue: "10" });
  const [page, setPage] = useQueryState("page", { defaultValue: "1" });
  const [onboardedStatusFilter, setOnboardedStatusFilter] =
    useQueryState("onboarded_status");
  const [nameOrder, setNameOrder] = useQueryState("name_order");
  const [ageOrder, setAgeOrder] = useQueryState("age_order");
  const [volunteerId, setVolunteerId] = useQueryState("volunteer_id");
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();
  const [isFilterOn, setIsFilterOn] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleteAlertLoading, setIsDeleteAlertLoading] = useState(false);
  const [volunteerToDelete, setVolunteerToDelete] = useState<string | null>(
    null
  );

  const handleSeeMoreDetails = (id: string) => {
    setVolunteerId(id);
  };

  const handleDeleteVolunteer = (id: string) => {
    setVolunteerToDelete(id);
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

  const getAllVolunteers = async ({
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
    let url = `${endpoints.volunteer.getAllVolunteers}?page=${page}&size=${size}`;

    // Add onboarded_status filter if it exists
    if (onboarded_status) {
      url += `&onboarded_status=${onboarded_status}`;
    }

    // Add name_order if it exists
    if (name_order) {
      url += `&name_order=${name_order}`;
    }

    // Add age_order if it exists
    if (age_order) {
      url += `&age_order=${age_order}`;
    }

    const response: any = await GET_API(url);

    // Return the data as is, since the API should handle pagination
    return {
      ...response.data,
      items: response.data.items,
      total: response.data.total,
    };
  };

  const {
    data: volunteers,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["volunteers", page, size, onboardedStatusFilter, nameOrder, ageOrder],
    queryFn: () =>
      getAllVolunteers({
        page,
        size,
        onboarded_status: onboardedStatusFilter as string,
        name_order: nameOrder as string,
        age_order: ageOrder as string,
      }),
  });

  useEffect(() => {
    console.log("Volunteers Query Result:", volunteers);
    console.log("Volunteers Items:", volunteers?.items);
    if (volunteers?.items) {
      const transformedData = volunteers.items.map((volunteer: any) => ({
        volunteer_id: volunteer.volunteer_id,
        name:
          volunteer.volunteer_first_name && volunteer.volunteer_last_name
            ? `${volunteer.volunteer_first_name} ${volunteer.volunteer_last_name}`
            : "-",
        age: calculateAge(volunteer?.volunteer_birth_date) || "-",
        location: formatString(volunteer?.country) || "-",
        onboarded_status: volunteer.onboarded_status,
        email: volunteer?.email?.toLowerCase() || "-",
      }));
      console.log("Transformed Data:", transformedData);
      setVolunteerData(transformedData);
      setTotal(volunteers.total);
    }
  }, [volunteers]);

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
    DELETE_API(
      endpoints.volunteer.deleteVolunteer(volunteerToDelete || "")
    ).then((res) => {
      console.log(res, "res");
      setIsDeleteAlertOpen(false);
      setIsDeleteAlertLoading(false);
      refetch();
    });
  };

  const columns = getVolunteerColumns(
    handleSeeMoreDetails,
    handleDeleteVolunteer,
    handleOnboardedStatusFilter
  );

  useEffect(() => {
    setHeaderOptions({
      title: "Volunteers Request",
      titleIcon: getHeaderIcon(pathname),
    });
  }, [setHeaderOptions]);

  return (
    <div className="w-full h-auto p-6 animate-fadeIn">
      <AlertModal
        isOpen={isDeleteAlertOpen}
        onClose={() => setIsDeleteAlertOpen(false)}
        onPrimaryAction={handleModalConfirm}
        title="Delete Volunteer"
        description="Are you sure you want to delete this volunteer? Once deleted, it cannot be undone, and this action is irreversible. All associated data will be permanently removed, and you won't be able to recover it. Please confirm if you wish to proceed."
        primaryActionText="Yes, Delete"
        isLoading={isDeleteAlertLoading}
      />
      <ProfileDetailsModal />
      <VolunteerFilterModal
        isFilterApplying={false}
        isOpen={isFilterOn}
        onClose={() => setIsFilterOn(false)}
      />
      {/* Download Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            const csv = [
              ["Name", "Age", "Location", "Email", "Status"].join(","),
              ...volunteerData.map((v: any) =>
                [v.name, v.age, v.location, v.email, v.onboarded_status].join(",")
              ),
            ].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `volunteers_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
        >
          Download CSV
        </button>
      </div>
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
        handleDelete={handleDeleteVolunteer}
      />
    </div>
  );
}
