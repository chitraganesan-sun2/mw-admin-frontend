"use client";

import { GET_API } from "@/api/request";
import GroupFilters from "@/components/common/Filters";
import ResourceFilterModal from "@/components/resources/FilterModal";
import Table from "@/components/Table";
import { getReportColumns } from "@/constants/tablecolumn";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useState, useCallback, useMemo } from "react";
import CommunityModal from "@/components/community/FeedViewModal";
import ResourceModal from "@/components/resources/DetailModal";
import { toUserTimeZone } from "@/utils/timeFunctions";
import { formatString } from "@/utils/stringFunctions";
import { getReportsByType } from "@/api/reports";

interface PaginationParams {
  page: number;
  size: number;
}

const tabs = [
  { key: "resource", title: "Resource" },
  { key: "post", title: "Community" },
];

export default function ReportsPage() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();

  // Query State
  const [id, setId] = useQueryState("id", { shallow: true });
  const [reportId, setReportId] = useQueryState("reportId", { shallow: true });
  const [mode, setMode] = useQueryState("mode", { shallow: true });
  const [currentTab, setCurrentTab] = useQueryState("tab", {
    shallow: true,
    defaultValue: "resource",
  });

  // State Management
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    size: 10,
  });
  const [isFilterOn, setIsFilterOn] = useState(false);
  const [debouncedTab, setDebouncedTab] = useState(currentTab);

  // Debounce effect for tab switching
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedTab(currentTab);
    }, 300);
    return () => clearTimeout(timeout);
  }, [currentTab]);

  const handleViewAction = useCallback((id: string, reportId?: string) => {
    setMode("view");
    setReportId(reportId || null);
    setId(id);
  }, []);
  const columns = useMemo(() => getReportColumns(handleViewAction), []);

  const getAllReports = useCallback(async () => {
    const response: any = await getReportsByType(debouncedTab, pagination);
    if (response.status === 200) {
      return {
        data: response.data?.items.map((item: any) => ({
          id: item.report_id,
          docId: item.report_type_id,
          reportId: item.report_id,
          title: item?.source_title,
          profile_name: item?.author?.name,
          reason: formatString(item?.report_description),
          report_time: toUserTimeZone({ date: item?.created_at, format: "h:mm A, DD MMM YYYY",}),
          report_status: item?.report_status || "pending",
        })),
        total: response.data?.total || 0,
      };
    }
    return { data: [], total: 0 };
  }, [debouncedTab, pagination]);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["reports", debouncedTab, pagination.page, pagination.size],
    queryFn: getAllReports,
    placeholderData: (previousData) => previousData, 
  });

  const handleTableChange = useCallback((pagination: any) => {
    setPagination({ page: pagination.current, size: pagination.pageSize });
  }, []);

  useEffect(() => {
    setHeaderOptions({
      title: "Reports",
      titleIcon: getHeaderIcon(pathname),
    });
  }, [pathname]);

  const handleCloseModal = () => {
    setMode(null);
    setId(null);
    setReportId(null);
  };

  return (
    <div className="w-full px-6">
      {currentTab === "resource" ? (
        <ResourceModal
          key={`${currentTab}-${reportId}`}
          isOpen={mode === "view"}
          onClose={handleCloseModal}
          refetch={refetch}
        />
      ) : (
        <CommunityModal
          key={`${currentTab}-${reportId}`}
          isOpen={mode === "view"}
          onClose={handleCloseModal}
          refetch={refetch}
        />
      )}

      <ResourceFilterModal
        isFilterApplying={false}
        isOpen={isFilterOn}
        onClose={() => setIsFilterOn(false)}
      />

      <GroupFilters
        tabButtons={tabs}
        currentTab={currentTab}
        handleTabClick={setCurrentTab}
        showFilters={true}
        handleFilterClick={() => setIsFilterOn(true)}
        showSearch={true}
      />

      <Table
        key={`table-${currentTab}`}
        rootClassName="!opcacity-100"
        data={data?.data || []}
        columns={columns}
        loading={isFetching}
        pagination={{
          current: pagination.page,
          pageSize: pagination.size,
          total: data?.total || 0,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        onChange={handleTableChange}
        handleSeePost={handleViewAction}
      />
    </div>
  );
}