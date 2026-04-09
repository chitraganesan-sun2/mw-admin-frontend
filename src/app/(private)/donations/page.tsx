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
import moment from "moment";
import { SearchIcon } from "@/assets/icons";

export default function DonationsPage() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [details, setDetails] = useState<DonationDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [modalKey, setModalKey] = useState<string | number>("");

  const getDonations = async ({ page, size, query }: { page: number; size: number; query?: string }) => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(size),
    });
    if (query) params.append("search_query", query);
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

  const { data: donationsData, isFetching, isLoading } = useQuery({
    queryKey: ["donations", page, pageSize, search],
    queryFn: () => getDonations({ page, size: pageSize, query: search || undefined })
  });

  const data: DonationRow[] = useMemo(() => {
    const raw = donationsData?.items;
    const items = Array.isArray(raw)
      ? raw
      : raw && typeof raw === "object"
        ? Object.values(raw as Record<string, any>)
        : [];
    return items.map((it: any) => {
      const donationDateRaw =
        it?.date || it?.donation_date || it?.transaction_time || it?.created_on || it?.createdAt || "";
      const normalizedDate = donationDateRaw
        ? moment(donationDateRaw, ["Do MMM, YYYY", moment.ISO_8601]).format("YYYY-MM-DD")
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
        id: it?.donation_id || it?.id || it?._id || String(it?.transaction_id || Math.random()),
        donor_name: donorName || "Anonymous",
        email: it?.email || it?.donor_email || "-",
        donation_date: normalizedDate,
        amount: amountNum,
      };
    });
  }, [donationsData]);

  // Pre-sort by date asc, then amount asc
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const dateDiff =
        new Date(a.donation_date).getTime() -
        new Date(b.donation_date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.amount - b.amount;
    });
  }, [data]);

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
      const normalizedDate = dateStr
        ? moment(dateStr, ["Do MMM, YYYY", moment.ISO_8601]).toISOString()
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

  const visibleData = useMemo(() => {
    return sortedData;
  }, [sortedData]);

  useEffect(() => {
    setHeaderOptions({
      title: "Donations",
      titleIcon: getHeaderIcon(pathname),
      showSearch: false,
    });
  }, [pathname, setHeaderOptions]);

  const columns = useMemo(() => getDonationColumns(handleViewMore), []);

  const handleTableChange = (pagination: any) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
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
            <SearchIcon/>
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
      <Table
        key="donations"
        data={visibleData}
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
    </div>
  );
}

