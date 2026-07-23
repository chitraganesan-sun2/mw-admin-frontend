"use client";

import Table from "@/components/Table";
import { getDonationColumns, DonationRow } from "@/constants/tablecolumn";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import { usePathname } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import DonationDetailsModal, { DonationDetails } from "@/components/donations/DonationDetailsModal";
import { useQuery } from "@tanstack/react-query";
import { GET_API } from "@/api/request";
import { endpoints } from "@/api/constants";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import advancedFormat from "dayjs/plugin/advancedFormat";

dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);

/** Try multiple common date formats for backward compatibility with legacy data */
const SUPPORTED_DATE_FORMATS = [
  "YYYY-MM-DDTHH:mm:ss.SSSSSSZ",  // ISO with microseconds + offset
  "YYYY-MM-DDTHH:mm:ss.SSSZ",     // ISO with milliseconds + offset
  "YYYY-MM-DDTHH:mm:ssZ",         // ISO without fractional seconds
  "YYYY-MM-DD HH:mm:ss.SSSSSS",   // Python datetime str (no T, no Z)
  "YYYY-MM-DD HH:mm:ss",          // Simple datetime
  "YYYY-MM-DD",                    // Date only
  "Do MMM, YYYY",                  // Legacy format (e.g., "1st Jan, 2025")
  "DD MMM YYYY",                   // "01 Jan 2025"
  "DD-MM-YYYY",                    // "01-01-2025"
];

const parseDate = (raw: string): dayjs.Dayjs => {
  // dayjs() default parser handles ISO 8601 well
  const d = dayjs(raw);
  if (d.isValid()) return d;
  // Fallback: try explicit formats for non-standard legacy strings
  for (const fmt of SUPPORTED_DATE_FORMATS) {
    const parsed = dayjs(raw, fmt, true);
    if (parsed.isValid()) return parsed;
  }
  // Log warning in development for debugging unparseable dates
  if (process.env.NODE_ENV === "development") {
    console.warn(`[parseDate] Unable to parse date: "${raw}". No format matched.`);
  }
  return d; // Return invalid dayjs — callers guard with empty-string fallback
};

import { SearchIcon } from "@/assets/icons";

type DonationSortField = "donation_date" | "amount" | null;
type DonationSortOrder = "ascend" | "descend" | null;

export default function DonationsPage() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [details, setDetails] = useState<DonationDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [modalKey, setModalKey] = useState<string | number>("");
  const [sortField, setSortField] = useState<DonationSortField>(null);
  const [sortOrder, setSortOrder] = useState<DonationSortOrder>(null);

  const getDonations = async ({
    page,
    size,
    query,
    sortField: sf,
    sortOrder: so,
  }: {
    page: number;
    size: number;
    query?: string;
    sortField?: DonationSortField;
    sortOrder?: DonationSortOrder;
  }) => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(size),
    });
    if (query) params.append("search_query", query);
    if (sf && so) {
      params.append("sort_field", sf);
      params.append("sort_order", so);
    }
    const url = `${endpoints.donations.list}?${params.toString()}`;
    const response: any = await GET_API(url);
    const payload = response?.data ?? response ?? {};
    // Prefer exact shape: { success, data: { donations: [...], total_count, ... } }
    let items: any =
      payload?.data?.donations ??
      payload?.donations ??
      payload?.items ??
      payload?.results ??
      payload?.data ??
      [];
    if (items && !Array.isArray(items) && typeof items === "object") {
      items = Object.values(items);
    }
    const total =
      payload?.data?.total_count ??
      payload?.total_count ??
      payload?.total ??
      payload?.count ??
      (Array.isArray(items) ? items.length : 0);
    return { items, total };
  };

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data: donationsData, isFetching, isLoading } = useQuery({
    queryKey: ["donations", page, pageSize, debouncedSearch, sortField, sortOrder],
    queryFn: () =>
      getDonations({
        page,
        size: pageSize,
        query: debouncedSearch || undefined,
        sortField,
        sortOrder,
      }),
  });

  const data: DonationRow[] = useMemo(() => {
    const raw = donationsData?.items;
    const items = Array.isArray(raw)
      ? raw
      : raw && typeof raw === "object"
        ? Object.values(raw as Record<string, any>)
        : [];
    return items.map((it: any, index: number) => {
      const donationDateRaw =
        it?.date || it?.donation_date || it?.transaction_time || it?.created_on || it?.createdAt || "";
      const parsedDate = donationDateRaw ? parseDate(donationDateRaw) : null;
      const normalizedDate = parsedDate?.isValid()
        ? parsedDate.format("YYYY-MM-DD")
        : "";
      const amountNum =
        typeof it?.final_amount === "number"
          ? it.final_amount
          : typeof it?.amount === "number"
            ? it.amount
            : Number(it?.amount_usd ?? it?.amount ?? it?.final_amount ?? 0);
      const donorName =
        it?.donor_name || it?.donor || it?.full_name || (it?.name_visibility === "anonymous" ? "Anonymous" : "Anonymous");
      return {
        id: String(it?.donation_id ?? it?.id ?? it?._id ?? it?.transaction_id ?? `row-${index}`),
        donor_name: donorName || "Anonymous",
        email: it?.email || it?.donor_email || "-",
        donation_date: normalizedDate,
        amount: amountNum,
      };
    });
  }, [donationsData]);

  const handleViewMore = async (row: DonationRow) => {
    try {
      // Reset previous state immediately to avoid flash of old data
      setModalKey(row.id);
      setDetails(null);
      setDetailsLoading(true);
      setIsDetailsOpen(true);
      // Fetch receipt/details by donation_id
      const res: any = await GET_API(endpoints.donations.getReceipt(row.id));
      const payload = res?.data ?? res ?? {};
      const d = payload?.data ?? payload;

      const amount = d?.final_amount ?? d?.amount ?? row.amount ?? 0;
      const dateStr =
        d?.created_at ?? d?.createdAt ?? d?.date ?? d?.donation_date ?? row.donation_date;
      const parsedDetailDate = dateStr ? parseDate(dateStr) : null;
      const normalizedDate = parsedDetailDate?.isValid()
        ? parsedDetailDate.toISOString()
        : row.donation_date
          ? new Date(row.donation_date).toISOString()
          : new Date().toISOString();

      const details: DonationDetails = {
        amount: Number(amount) || 0,
        dateTime: normalizedDate,
        status: (d?.payment_status || "").toString().toLowerCase(),
        personal: {
          firstName: d?.first_name || (row.donor_name && row.donor_name !== "Anonymous" ? row.donor_name.split(" ")[0] : ""),
          lastName: d?.last_name || (row.donor_name && row.donor_name !== "Anonymous" ? row.donor_name.split(" ").slice(1).join(" ") : ""),
          email: d?.email || row.email || "-",
          phone: d?.phone || d?.phone_number || "-",
          dob: d?.date_of_birth || "-",
        },
        billing: {
          address1: d?.address_line_1 || "-",
          address2: d?.address_line_2 || "-",
          city: d?.city || "-",
          state: d?.state || "-",
          zip: d?.zip_code || "-",
          country: d?.country || "-",
        },
        preferences: {
          nameVisibility: d?.name_visibility || (d?.show_don_initi ? "Show full name" : "Hide full name"),
          showOnDonorWall: d?.show_on_donor_wall ? "Yes" : "No",
          dedication: d?.dedication || "No Dedication",
          campaign: d?.fund_destination || "Melody Wings Fund",
          coverFees: (typeof d?.cover_processing_fee === "boolean" ? d.cover_processing_fee : d?.cover_processing_fees) ? "Yes" : "No",
          hearAboutUs: d?.how_did_you_hear || d?.heard_from || "-",
          message: d?.message || "",
        },
      };

      setDetails(details);
    } catch (e) {
      // fallback to row if API fails
      setDetails({
        amount: row.amount,
        dateTime: row.donation_date ? new Date(row.donation_date).toISOString() : new Date().toISOString(),
        status: "pending",
        personal: {
          firstName: row.donor_name === "Anonymous" ? "" : row.donor_name?.split(" ")[0],
          lastName: row.donor_name === "Anonymous" ? "" : row.donor_name?.split(" ").slice(1).join(" "),
          email: row.email || "-",
          phone: "-",
          dob: "-",
        },
        billing: {
          address1: "-",
          address2: "-",
          city: "-",
          state: "-",
          zip: "-",
          country: "-",
        },
        preferences: {
          nameVisibility: row.donor_name === "Anonymous" ? "Hide full name" : "Show full name",
          showOnDonorWall: "Yes",
          dedication: "No Dedication",
          campaign: "Melody Wings Fund",
          coverFees: "No",
          hearAboutUs: "-",
          message: "",
        },
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    setHeaderOptions({
      title: "Donations",
      titleIcon: getHeaderIcon(pathname),
      showSearch: false,
    });
  }, [pathname, setHeaderOptions]);

  const columns = useMemo(() => {
    const baseColumns: any[] = getDonationColumns(handleViewMore);
    return baseColumns.map((column: any) => {
      if (column.key === "donation_date") {
        return {
          ...column,
          sorter: true,
          sortOrder: sortField === "donation_date" ? sortOrder : null,
          sortDirections: ["descend", "ascend"],
        };
      }
      if (column.key === "amount") {
        return {
          ...column,
          sorter: true,
          sortOrder: sortField === "amount" ? sortOrder : null,
          sortDirections: ["descend", "ascend"],
        };
      }
      return column;
    });
  }, [handleViewMore, sortField, sortOrder]);

  const handleTableChange = (pagination: any, _filters?: any, sorter?: any) => {
    const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    const field = ((currentSorter?.order ?? null) ? currentSorter?.field : null) as DonationSortField;
    const order = (currentSorter?.order ?? null) as DonationSortOrder;

    // Sorting now happens server-side across the full dataset (not just the current
    // page), so changing sort resets back to page 1 to avoid landing out of range.
    if (field !== sortField || order !== sortOrder) {
      setPage(1);
    } else {
      setPage(pagination.current);
    }
    setPageSize(pagination.pageSize);
    setSortField(field);
    setSortOrder(field ? order : null);
  };

  return (
    <div className="w-full h-auto p-10 animate-fadeIn">
      <DonationDetailsModal
        key={modalKey}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        data={details}
        isLoading={detailsLoading}
      />
      <div className="w-full mb-6">
        <div className="relative w-full">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
            {/* search icon */}
            <SearchIcon />
          </span>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search"
            className="w-full h-10 rounded-[100px] border border-[#E0E0E0] bg-white pl-12 pr-4 text-base text-[#121212] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E0E0E0]"
          />
        </div>
      </div>
      {!isLoading && !isFetching && data.length === 0 ? (
        <div className="w-full py-10 text-center text-[#6B7280]">No records available</div>
      ) : (
        <Table
          key="donations"
          data={data}
          columns={columns}
          loading={isLoading || isFetching}
          rootClassName="[&_thead_th]:!bg-[#FAFAFA] [&_thead_th]:font-medium [&_tbody_td]:font-normal [&_thead_th.ant-table-column-sort]:!bg-[#FAFAFA] [&_tbody_tr:hover>td]:!bg-[#FAFAFA] [&_tbody_td.ant-table-column-sort]:!bg-transparent [&_tbody_tr:hover>td.ant-table-column-sort]:!bg-[#FAFAFA] [&_.ant-table-column-sorter]:!text-[#9CA3AF] [&_.ant-table-column-sorters_.ant-table-column-sorter-up]:!text-[#9CA3AF] [&_.ant-table-column-sorters_.ant-table-column-sorter-down]:!text-[#9CA3AF] [&_.ant-table-column-sorters_.ant-table-column-sorter-up.active]:!text-[#9CA3AF] [&_.ant-table-column-sorters_.ant-table-column-sorter-down.active]:!text-[#9CA3AF]"
          pagination={{
            current: page,
            pageSize: pageSize,
            total: donationsData?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          onChange={handleTableChange}
        />
      )}
    </div>
  );
}

