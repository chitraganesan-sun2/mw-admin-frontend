import { ColumnsType } from "antd/es/table";
import React from "react";
import { Volunteer, Report } from "@/constants/column";

export const getVolunteerColumns = (
  handleSeeMoreDetails?: (id: string) => void
) => [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
    sorter: true,
    className:
      "px-6 !py-3 text-sm w-1/5 !font-semibold text-gray-900 !font-poppins",
  },
  // {
  //   title: "Age",
  //   dataIndex: "age",
  //   key: "age",
  //   sorter: true,
  //   className:
  //     "px-6 !py-3 text-sm w-1/9 bg-gray-50 text-gray-900 !font-poppins",
  // },
  // {
  //   title: "Location",
  //   dataIndex: "location",
  //   key: "location",
  //   sorter: false,
  //   className: "px-6 !py-3 w-1/5 text-sm text-gray-900 !font-poppins",
  // },
  {
    title: "Requested Status",
    dataIndex: "onboarded_status",
    key: "onboarded_status",
    sorter: false,
    className: "px-6 !py-3 w-1/5 text-sm text-gray-900 !font-poppins",
    render: (_: unknown, record: Volunteer) => {
      if ("onboarded_status" in record) {
        return (
          <span
            className={`px-6 !py-3 w-1/5 !font-poppins ${
              record.onboarded_status === "verification_pending"
                ? "text-warning"
                : record.onboarded_status === "verification_completed"
                ? "text-success"
                : record.onboarded_status === "verification_rejected"
                ? "text-error"
                : "text-gray-500"
            }`}
          >
            <span className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  record.onboarded_status === "verification_pending"
                    ? "bg-warning"
                    : record.onboarded_status === "verification_completed"
                    ? "bg-success"
                    : record.onboarded_status === "verification_rejected"
                    ? "bg-error"
                    : "bg-gray-500"
                }`}
              ></div>
              {record.onboarded_status === "verification_pending"
                ? "Pending"
                : record.onboarded_status === "verification_completed"
                ? "Completed"
                : record.onboarded_status === "verification_rejected"
                ? "Rejected"
                : "Details Pending"}
            </span>
          </span>
        );
      }
      return null;
    },
  },
  {
    title: "",
    key: "actions",
    render: (_: unknown, record: Volunteer) => (
      <div className="flex items-center gap-2">
        <p
          onClick={() => handleSeeMoreDetails?.(record.volunteer_id)}
          className="!font-semibold text-gray-900 underline !font-poppins cursor-pointer"
        >
          See more details
        </p>
      </div>
    ),
    className: "px-6 py-4",
  },
];

export const getReportColumns = (handleSeePost?: (id: string) => void) => [
  {
    title: "Profile Name",
    dataIndex: "profile_name",
    key: "profile_name",
    sorter: true,
    className:
      "px-6 !py-3 text-sm w-1/5 !font-semibold text-gray-900 !font-poppins",
  },
  {
    title: "Reason",
    dataIndex: "reason",
    key: "reason",
    sorter: false,
    className:
      "px-6 !py-3 text-sm w-1/9 bg-gray-50 text-gray-900 !font-poppins",
  },
  {
    title: "Report Time",
    dataIndex: "report_time",
    key: "report_time",
    sorter: true,
    className: "px-6 !py-3 w-1/5 text-sm text-gray-900 !font-poppins",
  },
  {
    title: "Review Status",
    dataIndex: "review_status",
    key: "review_status",
    sorter: false,
    className: "px-6 !py-3 w-1/5 text-sm text-gray-900 !font-poppins",
    render: (_: unknown, record: Report) => (
      <span
        className={`px-6 !py-3 w-1/5 text-sm text-gray-900 !font-poppins ${
          record.review_status === "verification_pending"
            ? "text-warning"
            : record.review_status === "verification_completed"
            ? "text-success"
            : record.review_status === "verification_rejected"
            ? "text-error"
            : "text-gray-500"
        }`}
      >
        <span className="flex items-center gap-1">
          <div
            className={`w-2 h-2 rounded-full ${
              record.review_status === "verification_pending"
                ? "bg-warning"
                : record.review_status === "verification_completed"
                ? "bg-success"
                : record.review_status === "verification_rejected"
                ? "bg-error"
                : "bg-gray-500"
            }`}
          ></div>
          {record.review_status}
        </span>
      </span>
    ),
  },
  {
    title: "",
    key: "actions",
    render: (_: unknown, record: Report) => (
      <div className="flex items-center gap-2">
        <p
          onClick={() => handleSeePost?.(record.id)}
          className="!font-semibold text-gray-900 underline !font-poppins cursor-pointer"
        >
          See post
        </p>
      </div>
    ),
    className: "px-6 py-4",
  },
];
