"use client";

import { GET_API } from "@/api/request";
import GroupFilters from "@/components/common/Filters";
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
import { formatString } from "@/utils/stringFunctions";
import { getReportsByType } from "@/api/reports";
import PersonReportModal from "@/components/reports/PersonReportModal";
import type { Report } from "@/constants/column";
import ErrorMsg from "@/components/common/Messages/ErrorMsg";

interface PaginationParams {
  page: number;
  size: number;
}

const tabs = [
  { key: "resource", title: "Resource" },
  { key: "post", title: "Community" },
  { key: "user", title: "People" },
  { key: "message", title: "Messages" },
  { key: "session", title: "Sessions" },
];

// Reports about a person's conduct, reviewed in their own modal (no content to open).
const PERSON_TABS = ["user", "message", "session"];

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
  // The page belongs to a tab: a page picked on another tab reads as page 1 here, so a tab switch
  // (click, or browser back) can never request the new tab with the old tab's page number.
  const [paging, setPaging] = useState<{ tab: string; page: number; size: number }>({
    tab: currentTab,
    page: 1,
    size: 10,
  });
  const pagination: PaginationParams = {
    page: paging.tab === currentTab ? paging.page : 1,
    size: paging.size,
  };

  const handleViewAction = useCallback((id: string, reportId?: string) => {
    setMode("view");
    setReportId(reportId || null);
    setId(id);
  }, []);
  const isPersonTab = PERSON_TABS.includes(currentTab);
  const columns = useMemo(
    () => getReportColumns(handleViewAction, isPersonTab ? "Review" : "See post"),
    [handleViewAction, isPersonTab]
  );

  const getAllReports = useCallback(async () => {
    const response: any = await getReportsByType(currentTab, pagination);
    if (response.status === 200) {
      return {
        data: response.data?.items.map((item: any) => ({
          id: item.report_id,
          docId: item.report_type_id,
          reportId: item.report_id,
          title: item?.source_title,
          profile_name: item?.author?.name,
          reason: formatString(item?.report_description),
          // ISO passed through: the column formats it once. It was pre-formatted here and then
          // re-parsed by the column, which shows "-" in browsers that can't parse that string.
          report_time: item?.created_at,
          report_status: item?.report_status || "pending",
          reportType: item?.report_type,
          rawReason: item?.report_description,
          reportedUserId: item?.reported_user_id,
          reportedUserRole: item?.reported_user_role,
        })),
        total: response.data?.total || 0,
      };
    }
    return { data: [], total: 0 };
  }, [currentTab, pagination.page, pagination.size]);

  const { data, isFetching, isError, isPlaceholderData, refetch } = useQuery({
    queryKey: ["reports", currentTab, pagination.page, pagination.size],
    queryFn: getAllReports,
    // Keep the old rows while paging within a tab, but never show another tab's rows under this tab's columns.
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === currentTab ? previousData : undefined,
  });

  const handleTableChange = useCallback(
    (p: any) => {
      setPaging({ tab: currentTab, page: p.current, size: p.pageSize });
    },
    [currentTab]
  );

  // Resolving the last report on a page above 1 leaves that page out of range - step back.
  const rowCount = data?.data.length ?? 0;
  useEffect(() => {
    if (!isFetching && !isError && !isPlaceholderData && pagination.page > 1 && rowCount === 0) {
      setPaging({ tab: currentTab, page: pagination.page - 1, size: pagination.size });
    }
  }, [isFetching, isError, isPlaceholderData, pagination.page, pagination.size, rowCount, currentTab]);

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
    <div className="w-full p-6">
      {isPersonTab ? (
        <PersonReportModal
          key={`${currentTab}-${reportId}`}
          isOpen={mode === "view"}
          onClose={handleCloseModal}
          report={(data?.data as Report[] | undefined)?.find((r) => r.reportId === reportId)}
          onChanged={refetch}
        />
      ) : currentTab === "resource" ? (
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

      <GroupFilters
        tabButtons={tabs}
        currentTab={currentTab}
        handleTabClick={(tab: string) => {
          setPaging((p) => ({ ...p, tab, page: 1 }));
          setCurrentTab(tab);
        }}
        showSearch={true}
      />

      {isError ? (
        <ErrorMsg message="Couldn't load the reports." onRetry={() => refetch()} retrying={isFetching} />
      ) : (
        <Table
          key={`table-${currentTab}`}
          rootClassName="!opacity-100"
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
      )}
    </div>
  );
}