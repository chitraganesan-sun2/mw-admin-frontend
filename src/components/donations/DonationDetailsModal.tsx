"use client";

import ViewModal from "@/components/common/Modals/ViewModal";
import { FeedModalCloseIcon } from "@/assets/icons";
import React from "react";

export interface DonationDetails {
  amount: number;
  dateTime: string; // ISO
  status?: string;
  personal: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dob?: string;
  };
  billing: {
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  preferences?: {
    nameVisibility?: string;
    showOnDonorWall?: string;
    dedication?: string;
    campaign?: string;
    coverFees?: string;
    hearAboutUs?: string;
    message?: string;
  };
}

export default function DonationDetailsModal({
  isOpen,
  onClose,
  data,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: DonationDetails | null;
  isLoading?: boolean;
}) {
  const status = data?.status;
  const statusColor =
    status === "succeeded"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : status === "pending"
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : status === "failed"
          ? "bg-rose-100 text-rose-700 border-rose-200"
          : "bg-gray-100 text-gray-700 border-gray-200";

  const Skeleton = () => (
    <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6 hide-scrollbar">
      {/* header chip placeholder */}
      <div className="flex items-center gap-3">
        <div className="h-5 w-40 bg-gray-200 animate-pulse rounded" />
        <div className="h-5 w-16 bg-gray-200 animate-pulse rounded-full" />
      </div>

      {/* combined stat card */}
      <div className="border border-[#EDEDED] rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
            <div className="mt-3 h-8 w-32 bg-gray-200 animate-pulse rounded" />
          </div>
          <div>
            <div className="h-4 w-40 bg-gray-200 animate-pulse rounded" />
            <div className="mt-3 h-8 w-40 bg-gray-200 animate-pulse rounded" />
          </div>
        </div>
      </div>

      {/* section generator */}
      {["Personal Details", "Billing Address", "Donation Preferences"].map((section) => (
        <div key={section} className="border border-[#EDEDED] rounded-2xl p-6 space-y-4">
          <div className="h-5 w-48 bg-gray-200 animate-pulse rounded" />
          <div className="grid md:grid-cols-2 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-28 bg-gray-200 animate-pulse rounded" />
                <div className="h-5 w-56 bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <ViewModal modalOpen={isOpen} onClose={onClose} width={980} height="85vh" zIndex={100000}>
      <div className="flex flex-col h-full bg-white !font-poppins">
        <div className="flex items-center justify-between px-7 py-5">
          <div className="flex items-center gap-3">
            <p className="text-xl font-medium text-[#121212]">Donation Details</p>
            {status && (
              <span className={`text-xs px-2.5 py-1 border rounded-full ${statusColor}`}>
                {status}
              </span>
            )}
          </div>
          <span className="cursor-pointer" onClick={onClose}>
            <FeedModalCloseIcon />
          </span>
        </div>
        <div className="h-px bg-[#EEEEEE]" />

        {isLoading ? (
          <Skeleton />
        ) : !data ? (
          <div className="flex-1 flex items-center justify-center p-10 text-gray-500">No details available</div>
        ) : (
          <div className="flex-1 overflow-y-auto px-10 py-6 space-y-10 hide-scrollbar">
            {/* combined stat card */}
            <div className="border border-[#EDEDED] rounded-[20px] p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-[#4F4F4F]">Amount Donated</p>
                  <p className="mt-2 text-[28px] font-semibold text-[#000000]">${data.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-[#4F4F4F]">Date and Time</p>
                  <p className="mt-2 text-[28px] font-semibold text-[#000000]">
                    {new Date(data.dateTime).toLocaleString(undefined, {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-[#EDEDED] rounded-[20px] p-6 space-y-10">
              <p className="text-[20px] font-medium text-[#000000]">Personal Details</p>
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-5 mt-4">
                <Field label="First Name" value={data.personal.firstName} />
                <Field label="Last Name" value={data.personal.lastName} />
                <Field label="Email Address" value={data.personal.email} />
                <Field label="Phone Number" value={data.personal.phone} />
              </div>
            </div>

            <div className="border border-[#EDEDED] rounded-[20px] p-6 space-y-10">
              <p className="text-[20px] font-medium text-[#000000]">Billing Address</p>
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-5 mt-4">
                <Field label="Address Line 1" value={data.billing.address1} />
                <Field label="Address Line 2" value={data.billing.address2} />
                <Field label="City" value={data.billing.city} />
                <Field label="State" value={data.billing.state} />
                <Field label="ZIP Code" value={data.billing.zip} />
                <Field label="Country" value={data.billing.country} />
              </div>
            </div>

            {!!data.preferences && (
              <div className="border border-[#EDEDED] rounded-[20px] p-6 space-y-10">
                <p className="text-[20px] font-medium text-[#000000]">Donation Preferences</p>
                <div className="grid md:grid-cols-2 gap-x-12 gap-y-5 mt-4">
                  <Field label="Name Visibility" value={data.preferences.nameVisibility} />
                  <Field label="Show my name on the donor wall" value={data.preferences.showOnDonorWall} />
                  <Field label="Dedication (Optional)" value={data.preferences.dedication} />
                  <Field label="Campaign/Fund Designation" value={data.preferences.campaign} />
                  <Field label="Cover processing fees" value={data.preferences.coverFees} />
                  <Field label="How did you hear about us? (Optional)" value={data.preferences.hearAboutUs} />
                </div>
                {data.preferences.message && (
                  <div className="pt-2">
                    <p className="text-sm text-[#4F4F4F]">Leave a Message (Optional)</p>
                    <p className="mt-2 text-[#121212] text-sm leading-6">{data.preferences.message}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </ViewModal>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-[#4F4F4F]">{label}</p>
      <p className="text-[#121212] text-base font-medium">{value || "-"}</p>
    </div>
  );
}

