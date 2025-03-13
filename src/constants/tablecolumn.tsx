import React from "react";
import { Volunteer, Report, Learner } from "@/constants/column";
import ExpandableText from "@/components/common/Modals/ExpandableText";

export const getVolunteerColumns = (
  handleSeeMoreDetails?: (id: string) => void
) => [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: any, b: any) => a?.name?.localeCompare(b?.name),
      className:
        "px-6 !py-3 text-sm w-1/5 !font-semibold text-gray-900 !font-poppins",
    },
    {
      title: "Age",
      dataIndex: "age",
      key: "age",
      sorter: (a: any, b: any) => a?.age - b?.age,
      className:
        "px-6 !py-3 text-sm w-1/9 bg-gray-50 text-gray-900 !font-poppins",
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      sorter: false,
      className: "px-6 !py-3 w-1/5 text-sm text-gray-900 !font-poppins",
    },
    {
      title: "Requested Status",
      dataIndex: "onboarded_status",
      key: "onboarded_status",
      sorter: false,
      className: "!p-0 w-1/5 text-sm text-gray-900 !font-poppins",
      render: (_: unknown, record: Volunteer) => {
        if ("onboarded_status" in record) {
          return (
            <span
              className={`px-6 !py-3 w-1/5 !font-poppins ${record.onboarded_status === "verification_pending"
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
                  className={`w-2 h-2 rounded-full ${record.onboarded_status === "verification_pending"
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
            onClick={() => handleSeeMoreDetails?.(record?.volunteer_id)}
            className="!font-semibold text-gray-900 underline !font-poppins cursor-pointer"
          >
            See more details
          </p>
        </div>
      ),
      className: "!p-0",
    },
  ];

export const getLearnerColumns = (
  handleSeeMoreDetails?: (id: string) => void
) => [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: any, b: any) => a?.name?.localeCompare(b?.name),
      className:
        "p-6 text-sm w-1/3 !font-semibold text-gray-900 !font-poppins",
    },
    {
      title: "Age",
      dataIndex: "age",
      key: "age",
      sorter: (a: any, b: any) => a?.age - b?.age,
      className:
        "p-6 text-sm w-1/5 bg-gray-50 text-gray-900 !font-poppins",
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      sorter: false,
      className: "p-6 w-1/4 text-sm text-gray-900 !font-poppins",
    },
    {
      title: "",
      key: "actions",
      render: (_: unknown, record: Learner) => (
        <div className="flex items-center gap-2">
          <p
            onClick={() => handleSeeMoreDetails?.(record?.learner_id)}
            className="!font-semibold text-gray-900 underline !font-poppins cursor-pointer"
          >
            See more details
          </p>
        </div>
      ),
      className: "!p-0",
    },
  ];

export const getReportColumns = (handleSeePost?: (id: string, reportId?: string) => void) => [
  {
    title: "Title",
    dataIndex: "title",
    key: "title",
    sorter: true,
    className:
      "p-6 text-sm !w-1/5 !font-semibold text-gray-900 !font-poppins",
  },
  {
    title: "Reported By",
    dataIndex: "profile_name",
    key: "profile_name",
    sorter: true,
    className:
      "p-6 text-sm !w-1/5 !font-semibold text-gray-900 !font-poppins",
  },
  {
    title: "Reason",
    dataIndex: "reason",
    key: "reason",
    sorter: false,
    className:
      "p-6 text-sm !w-1/5 bg-gray-50 text-gray-900 !font-poppins",
    render: (_: unknown, record: Report) => (
      <div className="flex items-center gap-2">
        <ExpandableText text={record.reason} maxLength={120} />
      </div>
    ),
  },
  {
    title: "Reported On",
    dataIndex: "report_time",
    key: "report_time",
    sorter: true,
    className: "p-6 !w-1/9 text-sm text-gray-900 !font-poppins",
  },
  {
    title: "Review Status",
    dataIndex: "review_status",
    key: "review_status",
    sorter: false,
    className: "p-6 !w-1/9 text-sm text-gray-900 !font-poppins",
    render: (_: unknown, record: Report) => (
      <span
        className={`text-sm text-gray-900 !font-poppins ${record.report_status === "pending"
          ? "!text-warning"
          : record.report_status === "resolved"
            ? "!text-success"
            : record.report_status === "rejected"
              ? "!text-error"
              : "!text-gray-500"
          }`}
      >
        <span className="flex items-center gap-1">
          <div
            className={`!w-2 !h-2 !rounded-full ${record.report_status === "pending"
              ? "!bg-warning"
              : record.report_status === "resolved"
                ? "!bg-success"
                : record.report_status === "rejected"
                  ? "!bg-error"
                  : "!bg-gray-500"
              }`}
          ></div>
          {record.report_status}
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
          onClick={() => handleSeePost?.(record.docId, record.reportId)}
          className="!font-semibold text-gray-900 underline !font-poppins cursor-pointer"
        >
          See post
        </p>
      </div>
    ),
    className: "",
  },
];
