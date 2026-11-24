"use client";

import { endpoints } from "@/api/constants";
import { GET_API, DELETE_API } from "@/api/request";
import Table from "@/components/Table";
import { Button } from "antd";
import FilterBar from "@/components/common/Filters/FilterBar";
import ListSearch from "@/components/common/Filters/ListSearch";
import { getVolunteerColumns, nextStatusSort } from "@/constants/tablecolumn";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import ProfileDetailsModal from "@/components/volunteer/ProfileDetails";
import { calculateAge } from "@/utils/moment";
import { formatString } from "@/utils/stringFunctions";
import AlertModal from "@/components/common/Modals/AlertModal";
import { downloadCsv } from "@/utils/downloadCsv";
import { showToast } from "@/components/common/Toast";
import ErrorMsg from "@/components/common/Messages/ErrorMsg";
import { useCan } from "@/hooks/useStaff";
import { useInFlight } from "@/hooks/useInFlight";
import { withQuery } from "@/utils/query";
import { getApiErrorMessage } from "@/utils/apiError";

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
  const [volunteerData, setVolunteerData] = useState<TableVolunteer[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [size, setSize] = useQueryState("size", { defaultValue: "25" });
  const [page, setPage] = useQueryState("page", { defaultValue: "1" });
  const [onboardedStatusFilter, setOnboardedStatusFilter] =
    useQueryState("onboarded_status");
  const [nameOrder, setNameOrder] = useQueryState("name_order");
  const [ageOrder, setAgeOrder] = useQueryState("age_order");
  const [createdOnOrder, setCreatedOnOrder] = useQueryState("created_on_order");
  // Text search comes from the header search box (it writes ?query=); the API matches name and email.
  const [searchQuery] = useQueryState("query");
  const canManage = useCan("members.manage");
  const exporter = useInFlight();
  const remover = useInFlight();
  const [volunteerId, setVolunteerId] = useQueryState("volunteer_id");
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
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
    setOnboardedStatusFilter(nextStatusSort(onboardedStatusFilter));
    // A re-sort from page 5 used to leave you on page 5 of the new order.
    setPage("1");
  };


  const handleModalConfirm = () => {
    // One delete request even if the button is clicked twice.
    remover.run(handleDeleteEvent);
  };

  const getAllVolunteers = async ({
    page,
    size,
    onboarded_status = "",
    name_order = "",
    age_order = "",
    created_on_order = "",
  }: PaginationParams & {
    onboarded_status?: string;
    name_order?: string;
    age_order?: string;
    created_on_order?: string;
  }) => {
    const url = withQuery(endpoints.volunteer.getAllVolunteers, {
      page,
      size,
      onboarded_status,
      name_order,
      age_order,
      created_on_order,
      search_query: searchQuery?.trim(),
    });

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
    isError,
    refetch,
  } = useQuery({
    queryKey: ["volunteers", page, size, onboardedStatusFilter, nameOrder, ageOrder, createdOnOrder, searchQuery],
    queryFn: () =>
      getAllVolunteers({
        page,
        size,
        onboarded_status: onboardedStatusFilter as string,
        name_order: nameOrder as string,
        age_order: ageOrder as string,
        created_on_order: createdOnOrder as string,
      }),
  });

  // Deleting the last row on a page above 1 leaves that page out of range - step back one page.
  const loadedRowCount = volunteers?.items?.length;
  useEffect(() => {
    if (!isFetching && !isError && loadedRowCount === 0 && Number(page) > 1) setPage(String(Number(page) - 1));
  }, [isFetching, isError, loadedRowCount, page, setPage]);

  useEffect(() => {
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
        created_on: volunteer?.created_on,
      }));
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
          setCreatedOnOrder(null);
        }
      } else if (field === "age") {
        setAgeOrder(order || null);
        if (order) {
          setNameOrder(null);
          setCreatedOnOrder(null);
        }
      } else if (field === "created_on") {
        setCreatedOnOrder(order || null);
        if (order) {
          setNameOrder(null);
          setAgeOrder(null);
        }
      }
    } else {
      setNameOrder(null);
      setAgeOrder(null);
      setCreatedOnOrder(null);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      await DELETE_API(endpoints.volunteer.deleteVolunteer(volunteerToDelete || ""));
      showToast({ message: "Volunteer deleted" });
      refetch();
    } catch (err: any) {
      showToast({ message: getApiErrorMessage(err, "Couldn't delete the volunteer. Please try again."), type: "error" });
    } finally {
      setIsDeleteAlertOpen(false);
    }
  };

  // Deleting a member needs `members.manage`; accounts without it still get View but no trash icon.
  const columns = getVolunteerColumns(
    handleSeeMoreDetails,
    handleDeleteVolunteer,
    handleOnboardedStatusFilter,
    onboardedStatusFilter,
    canManage
  );

  useEffect(() => {
    setHeaderOptions({
      title: "Volunteers",
      titleIcon: getHeaderIcon(pathname),
      showSearch: false,
    });
  }, [setHeaderOptions]);

  // A new search starts from the first page (staying on page 5 of the old results would show nothing).
  const lastSearch = useRef(searchQuery);
  useEffect(() => {
    if (lastSearch.current !== searchQuery) {
      lastSearch.current = searchQuery;
      setPage("1");
    }
  }, [searchQuery, setPage]);

  return (
    <div className="w-full h-auto p-6 animate-fadeIn">
      <AlertModal
        isOpen={isDeleteAlertOpen}
        onClose={() => setIsDeleteAlertOpen(false)}
        onPrimaryAction={handleModalConfirm}
        title="Delete Volunteer"
        description="Delete this volunteer? This permanently removes their profile and all associated data. It can't be undone."
        primaryActionText="Yes, Delete"
        isLoading={remover.pending}
      />
      <ProfileDetailsModal />
      <FilterBar
        actions={
          /* Exporting every member's details needs `members.manage`. */
          canManage ? (
            <Button
              disabled={exporter.pending}
              aria-busy={exporter.pending}
              onClick={() => exporter.run(() => downloadCsv("admin/export/volunteers/csv", "volunteers_export.csv"))}
            >
              {exporter.pending ? "Preparing the file..." : "Download All Data (CSV)"}
            </Button>
          ) : null
        }
      >
        <ListSearch placeholder="Search by name or email" />
      </FilterBar>
      {isError ? (
        <ErrorMsg message="Couldn't load the list. Please try again." onRetry={() => refetch()} retrying={isFetching} />
      ) : (
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
            pageSizeOptions: [25, 50, 100],
          }}
          onChange={handleTableChange}
          handleSeeMoreDetails={handleSeeMoreDetails}
          handleDelete={handleDeleteVolunteer}
        />
      )}
    </div>
  );
}
