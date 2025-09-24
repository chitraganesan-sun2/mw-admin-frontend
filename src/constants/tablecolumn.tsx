import React from "react";
import { Volunteer, Report, Learner } from "@/constants/column";
import ExpandableText from "@/components/common/Modals/ExpandableText";
import { Button } from "antd";
import { DeleteIcon } from "@/assets/icons";
import { FaSort } from "react-icons/fa";
import moment from "moment";

export const getVolunteerColumns = (
  handleSeeMoreDetails?: (id: string) => void,
  handleDeleteVolunteer?: (id: string) => void,
  handleOnboardedStatusFilter?: () => void
) => [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
    sorter: (a: any, b: any) => a?.name?.localeCompare(b?.name),
    className:
      "px-6 !py-3 text-sm w-[200px]  !font-semibold text-gray-900 !font-poppins",
  },
  {
    title: "Age",
    dataIndex: "age",
    key: "age",
    sorter: (a: any, b: any) => a?.age - b?.age,
    className:
      "px-6 !py-3 text-sm w-[100px]  bg-gray-50 text-gray-900 !font-poppins",
  },
  {
    title: "Location",
    dataIndex: "location",
    key: "location",
    sorter: false,
    className: "px-6 !py-3 w-[100px]  text-sm text-gray-900 !font-poppins",
  },
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
    sorter: false,
    className:
      "px-6 !py-3 w-[100px] !lowercase text-sm text-gray-900 !font-poppins",
  },
  {
    title: (
      <div
        onClick={handleOnboardedStatusFilter}
        style={{ cursor: "pointer" }}
        className="w-full h-full flex items-center pr-5 gap-2 justify-between"
      >
        Requested Status
        <FaSort className="text-gray-400 " />
      </div>
    ),
    dataIndex: "onboarded_status",
    key: "onboarded_status",
    onFilter: (value: string, record: Volunteer) =>
      record.onboarded_status === value,
    sorter: false,
    className: "!p-0 w-[150px]  text-sm text-gray-900 !font-poppins",
    render: (_: unknown, record: Volunteer) => {
      if ("onboarded_status" in record) {
        return (
          <span
            className={`px-6 !py-3 w-[100px] !font-poppins ${
              record.onboarded_status === "verification_pending"
                ? "text-warning"
                : record.onboarded_status === "verification_completed"
                ? "text-success"
                : record.onboarded_status === "verification_rejected"
                ? "text-error"
                : record.onboarded_status === "details_pending"
                ? "text-blue-500"
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
                    : record.onboarded_status === "details_pending"
                    ? "bg-blue-500"
                    : "bg-gray-500"
                }`}
              ></div>
              {record.onboarded_status === "verification_pending"
                ? "Pending"
                : record.onboarded_status === "verification_completed"
                ? "Completed"
                : record.onboarded_status === "verification_rejected"
                ? "Rejected"
                : record.onboarded_status === "partially_filled"
                ? "Details Pending"
                : "Form Incompleted"}
            </span>
          </span>
        );
      }
      return null;
    },
  },
  {
    title: "Details",
    key: "details",
    className: "!p-0 w-[150px]  text-sm text-gray-900 !font-poppins",

    render: (_: unknown, record: Volunteer) => (
      <div className="flex items-center gap-2">
        {record.onboarded_status === "details_pending" ? (
          <span>-</span>
        ) : (
          <p
            onClick={() => handleSeeMoreDetails?.(record?.volunteer_id)}
            className="!font-semibold text-gray-900 underline !font-poppins cursor-pointer"
          >
            See more details
          </p>
        )}
      </div>
    ),
  },
  {
    title: "ACTIONS",
    key: "actions",
    className: "!p-0 !w-[200px] text-sm text-gray-900 !font-poppins",
    render: (_: any, record: any) => (
      <div className="flex space-x-4 justify-center w-full">
        <div
          onClick={() => handleDeleteVolunteer?.(record.volunteer_id)}
          className="cursor-pointer"
        >
          <DeleteIcon />
        </div>
      </div>
    ),
    width: 200,
    align: "center",
  },
];

export const getLearnerColumns = (
  handleSeeMoreDetails?: (id: string) => void,
  handleDeleteLearner?: (id: string) => void,
  handleOnboardedStatusFilter?: () => void
) => [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
    sorter: (a: any, b: any) => a?.name?.localeCompare(b?.name),
    className:
      "p-6 text-sm w-[200px] !font-semibold text-gray-900 !font-poppins",
  },
  {
    title: "Age",
    dataIndex: "age",
    key: "age",
    sorter: (a: any, b: any) => a?.age - b?.age,
    className: "p-6 text-sm w-[100px] bg-gray-50 text-gray-900 !font-poppins",
  },
  {
    title: "Location",
    dataIndex: "location",
    key: "location",
    sorter: false,
    className: "p-6 w-[100px] text-sm text-gray-900 !font-poppins",
  },
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
    sorter: false,
    className: "p-6 w-[100px] !lowercase text-sm text-gray-900 !font-poppins",
    render: (_: unknown, record: Learner) => (
      <span className="text-gray-900 !font-poppins">
        {record?.email?.toLowerCase() || "-"}
      </span>
    ),
  },
  {
    title: (
      <div
        onClick={handleOnboardedStatusFilter}
        style={{ cursor: "pointer" }}
        className="w-full h-full flex pr-5 items-center gap-2 justify-between"
      >
        Requested Status
        <FaSort className="text-gray-400"  />
      </div>
    ),
    dataIndex: "onboarded_status",
    key: "onboarded_status",
    onFilter: (value: string, record: Learner) =>
      record.onboarded_status === value,
    onFilterChange: handleOnboardedStatusFilter,
    sorter: false,
    className: "!p-0 w-[150px]  text-sm text-gray-900 !font-poppins",
    render: (_: unknown, record: Volunteer) => {
      if ("onboarded_status" in record) {
        return (
          <span
            className={`px-6 !py-3 w-[100px] !font-poppins ${
              record.onboarded_status === "verification_pending"
                ? "text-warning"
                : record.onboarded_status === "verification_completed"
                ? "text-success"
                : record.onboarded_status === "verification_rejected"
                ? "text-error"
                : record.onboarded_status === "details_pending"
                ? "text-blue-500"
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
                    : record.onboarded_status === "details_pending"
                    ? "bg-blue-500"
                    : "bg-gray-500"
                }`}
              ></div>
              {record.onboarded_status === "verification_pending"
                ? "Pending"
                : record.onboarded_status === "verification_completed"
                ? "Completed"
                : record.onboarded_status === "verification_rejected"
                ? "Rejected"
                : record.onboarded_status === "partially_filled"
                ? "Details Pending"
                : "Form Incompleted"}
            </span>
          </span>
        );
      }
      return null;
    },
  },
  {
    title: "Details",
    key: "details",
    className: "!p-0 w-[150px]  text-sm text-gray-900 !font-poppins",
    render: (_: unknown, record: Learner) => (
      <div className="flex items-center gap-2">
        {record.onboarded_status === "details_pending" ? (
          <span>-</span>
        ) : (
          <p
            onClick={() => handleSeeMoreDetails?.(record?.learner_id)}
            className="!font-semibold text-gray-900 underline !font-poppins cursor-pointer"
          >
            See more details
          </p>
        )}
      </div>
    ),
  },
  {
    title: "ACTIONS",
    key: "actions",
    className: "!p-0 !w-[200px] text-sm text-gray-900 !font-poppins",
    render: (_: any, record: any) => (
      <div className="flex space-x-4 justify-center w-full">
        <div
          onClick={() => handleDeleteLearner?.(record.learner_id)}
          className="cursor-pointer"
        >
          <DeleteIcon />
        </div>
      </div>
    ),
    width: 200,
    align: "center",
  },
];

export const getReportColumns = (
  handleSeePost?: (id: string, reportId?: string) => void
) => [
  {
    title: "Title",
    dataIndex: "title",
    key: "title",
    sorter: true,
    className:
      "!w-[20%] p-6 text-sm !font-semibold text-gray-900 !font-poppins whitespace-nowrap overflow-hidden",
  },
  {
    title: "Reported By",
    dataIndex: "profile_name",
    key: "profile_name",
    sorter: true,
    className:
      "!w-[15%] p-6 text-sm !font-semibold text-gray-900 !font-poppins whitespace-nowrap overflow-hidden",
  },
  {
    title: "Reason",
    dataIndex: "reason",
    key: "reason",
    sorter: false,
    className:
      "!w-[25%] !max-w-[40vw] p-6 text-sm bg-gray-50 text-gray-900 !font-poppins overflow-hidden",
    render: (_: unknown, record: Report) => (
      <div className="flex items-center gap-2 overflow-hidden">
        <ExpandableText
          text={record.reason}
          maxLength={120}
          actionLabel="read&nbsp;more"
        />
      </div>
    ),
  },
  {
    title: "Reported On",
    dataIndex: "report_time",
    key: "report_time",
    sorter: true,
    className:
      "!w-[10%] p-6 text-sm text-gray-900 !font-poppins whitespace-nowrap overflow-hidden",
    render: (_: unknown, record: Report) => {
      if (!record.report_time) return "-";
      return moment(record.report_time).format("DD-MMM-YYYY").toLowerCase();
    },
  },
  {
    title: "Review Status",
    dataIndex: "review_status",
    key: "review_status",
    sorter: false,
    className:
      "!w-[10%] p-6 text-sm text-gray-900 !font-poppins whitespace-nowrap overflow-hidden",
    render: (_: unknown, record: Report) => (
      <span
        className={`text-sm text-gray-900 !font-poppins ${
          record.report_status === "pending"
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
            className={`!w-2 !h-2 !rounded-full ${
              record.report_status === "pending"
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
    className: "!w-[10%]",
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
  },
];
