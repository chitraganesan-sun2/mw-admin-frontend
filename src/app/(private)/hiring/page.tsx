"use client";

import Table from "@/components/Table";
import ApplicationDetailsModal, {
  ApplicationDetails,
} from "@/components/hiring/ApplicationDetailsModal";
import {
  getHiringColumns,
  HiringApplicationRow,
} from "@/constants/tablecolumn";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GET_API } from "@/api/request";
import { endpoints } from "@/api/constants";
import moment from "moment";
import { SearchIcon } from "@/assets/icons";

const ROLE_MAPPINGS: Record<string, { title: string; description: string; responsibilities: string[] }> = {
  social_media_intern: {
    title: "Social Media Intern",
    description:
      "Help grow MelodyWings’ online presence by creating engaging content and sharing stories from our community.",
    responsibilities: [
      "Creating posts for Instagram, TikTok, and other platforms",
      "Designing simple graphics or short videos",
      "Helping highlight volunteer stories and learner experiences",
      "Assisting with campaigns that promote MelodyWings sessions and events",
    ],
  },
};

const formatRoleName = (roleStr: string) => {
  if (!roleStr) return "-";
  return roleStr.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const toYesNo = (value: unknown) => {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "-";
};

const normalizeEmail = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim().toLowerCase() : "";

const mapAppToHiringRow = (app: any): HiringApplicationRow => ({
  id: app.application_id,
  applicant_name: app.full_name,
  email: normalizeEmail(app?.email),
  submission_date: moment(app.created_on).format("Do MMM, YYYY"),
  submission_timestamp: new Date(app.created_on).getTime(),
});

const matchesHiringSearch = (row: HiringApplicationRow, q: string) => {
  const needle = q.toLowerCase();
  return (
    row.applicant_name?.toLowerCase().includes(needle) ||
    row.email?.toLowerCase().includes(needle) ||
    row.submission_date?.toLowerCase().includes(needle)
  );
};

export default function HiringPage() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [selectedDetails, setSelectedDetails] =
    useState<ApplicationDetails | null>(null);

  useEffect(() => {
    setHeaderOptions({
      title: "Hiring",
      titleIcon: getHeaderIcon(pathname),
      showSearch: false,
    });
  }, [pathname, setHeaderOptions]);

  const detailsTemplate: Omit<ApplicationDetails, "id" | "basicInfo" | "appliedFor"> = useMemo(
    () => ({
      applicationQuestions: [
        {
          question: "Are you looking for an internship opportunity",
          answer: "Yes",
        },
        {
          question: "Why are you interested in this opportunity with MelodyWings?",
          answer:
            "Yes – Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        },
        {
          question: "What relevant experience do you have for this role?",
          answer:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        },
        {
          question: "What skills would you bring to this role?",
          answer:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        },
        {
          question: "How many hours per week are you available?",
          answer: "40 hrs",
        },
        {
          question: "When would you be available to start?",
          answer: "In 15 Days",
        },
        {
          question:
            "Have you previously volunteered or worked with children or neurodivergent learners? If yes, please describe.",
          answer:
            "Yes – Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.",
        },
        {
          question: "Is there anything else you would like us to know about you?",
          answer:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.",
        },
      ],
      legalAndSafety: [
        {
          title: "1. Criminal Background Check",
          items: [
            {
              question: "Have you ever been convicted of a felony or misdemeanor?",
              answer: "No",
            },
            {
              question:
                "Have you ever been involved in any criminal activity or legal proceedings, including pending charges or arrests?",
              answer: "No",
            },
            {
              question:
                "Have you been convicted of any crime involving minors, abuse, or neglect?",
              answer: "Yes",
            },
            {
              question:
                "Please describe the circumstances behind the 'yes' answer above.",
              answer:
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.",
            },
          ],
        },
        {
          title: "2. Sex Offender Registry Check",
          items: [
            {
              question: "Are you listed on any state or national sex offender registries?",
              answer: "No",
            },
            {
              question:
                "Please describe the circumstances behind the 'yes' answer above.",
              answer: "NIL",
            },
          ],
        },
        {
          title: "3. Disciplinary History",
          items: [
            {
              question:
                "Have you ever been terminated or asked to resign from a volunteer or employment position for reasons related to misconduct or inappropriate behavior?",
              answer: "No",
            },
            {
              question:
                "Have you ever been involved in any dispute with an employer or organization related to safety or ethical issues?",
              answer: "No",
            },
            {
              question:
                "Have you ever faced dismissal, suspension, probation, or any other disciplinary or academic misconduct action from a college, university, or professional school?",
              answer: "No",
            },
            {
              question:
                "Please describe the circumstances behind the 'yes' answer above.",
              answer: "NIL",
            },
          ],
        },
        {
          title: "4. Health and Safety Information",
          items: [
            {
              question:
                "Do you have any physical or mental health conditions that may affect your ability to perform volunteer duties?",
              answer: "No",
            },
            {
              question:
                "Please describe the circumstances behind the 'yes' answer above.",
              answer: "NIL",
            },
          ],
        },
        {
          title: "5. Consents",
          items: [
            {
              question:
                "Do you consent to child abuse registry and sex offender checks if needed?",
              answer: "Yes",
            },
            {
              question:
                "Do you agree to follow the organization's policies on confidentiality, behavior, and safeguarding procedures?*",
              answer: "Yes",
            },
            {
              question:
                "Do you understand that your volunteer role may be terminated based on any criminal activity or failure to adhere to the organization's policies?*",
              answer: "Yes",
            },
            {
              question: "Please describe the circumstances behind the 'no' answer above.",
              answer: "NIL",
            },
          ],
        },
        {
          title: "6. Previous Volunteer Experience",
          items: [
            {
              question:
                "Have you ever been involved in any incidents or complaints during previous volunteer roles?",
              answer: "Yes",
            },
            {
              question:
                "Please describe the circumstances behind the 'yes' answer above.",
              answer:
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.",
            },
          ],
        },
      ],
      consent: {
        photoVideoConsent: "Yes",
        body:
          "I consent to MW collecting, using and/or sharing my personal information as mentioned in the Privacy Policy.\n\nBy accepting the Terms of Service, either by clicking a box indicating your acceptance or by using and navigating through our platform through our website, you agree that (a) you have read and understood the agreement; (b) you represent that you are at least 18 years old; (c) you can form a binding contract; and (d) you accept this agreement and agree that you are legally bound by its terms. Individuals under the age of 18 or those with mental developmental disabilities of any age may access the services only when accompanied by a parent or legal guardian. Parents or guardians can navigate such users, by accepting the Terms of Service, either by clicking a box indicating your acceptance or by using and navigating through our platform through our website, (a) by have read and understood the agreement; (b) you represent that you are the parent or legal guardian of such individual (c) your acceptance of these terms on behalf of the individual will form a binding contract; and (d) you accept this agreement on behalf of the individual and agree that the individual is legally bound by its terms.",
      },
    }),
    []
  );

  const getAllApplications = async ({
    page,
    size,
    searchQuery,
  }: {
    page: string | number;
    size: string | number;
    searchQuery?: string | null;
  }) => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    const trimmed = (searchQuery ?? "").trim();
    if (trimmed) {
      params.append("search", trimmed);
      params.append("search_query", trimmed);
    }
    const url = `${endpoints.hiring.getAllApplications}?${params.toString()}`;
    const response: any = await GET_API(url);
    const raw = response?.data ?? response ?? {};
    const payload = raw?.data !== undefined ? raw.data : raw;
    let items: any =
      payload?.items ??
      payload?.results ??
      payload?.applications ??
      (Array.isArray(payload) ? payload : []);
    if (items && !Array.isArray(items) && typeof items === "object") {
      items = Object.values(items);
    }
    const total =
      payload?.total ??
      payload?.total_count ??
      payload?.count ??
      raw?.total ??
      (Array.isArray(items) ? items.length : 0);
    return { items, total };
  };

  /** Join-us list API does not filter by search like donations; load all pages and filter client-side when searching. */
  const fetchEveryApplicationPage = async () => {
    const batchSize = 100;
    const all: any[] = [];
    let p = 1;
    while (true) {
      const { items, total } = await getAllApplications({
        page: p,
        size: batchSize,
        searchQuery: undefined,
      });
      if (!items?.length) break;
      all.push(...items);
      if (typeof total === "number" && total > 0 && all.length >= total) break;
      if (items.length < batchSize) break;
      p += 1;
      if (p > 500) break;
    }
    return all;
  };

  const trimmedSearch = search.trim();
  const isSearchActive = trimmedSearch.length > 0;

  const { data: listData, isFetching: listFetching, isLoading: listLoading } = useQuery({
    queryKey: ["applications", "paginated", page, pageSize],
    queryFn: () =>
      getAllApplications({
        page,
        size: pageSize,
        searchQuery: undefined,
      }),
    enabled: !isSearchActive,
  });

  const { data: searchData, isFetching: searchFetching, isLoading: searchLoading } = useQuery({
    queryKey: ["applications", "globalSearch", trimmedSearch],
    queryFn: async () => {
      const raw = await fetchEveryApplicationPage();
      const rows = raw.map(mapAppToHiringRow);
      const filtered = rows.filter((row) => matchesHiringSearch(row, trimmedSearch));
      return { filtered, total: filtered.length };
    },
    enabled: isSearchActive,
  });

  const isLoading = isSearchActive ? searchLoading : listLoading;
  const isFetching = isSearchActive ? searchFetching : listFetching;

  const pagedData: HiringApplicationRow[] = useMemo(() => {
    if (isSearchActive) {
      const filtered = searchData?.filtered ?? [];
      const start = (page - 1) * pageSize;
      return filtered.slice(start, start + pageSize);
    }
    if (!listData?.items) return [];
    return listData.items.map(mapAppToHiringRow);
  }, [isSearchActive, searchData, listData, page, pageSize]);

  const totalCount = isSearchActive
    ? searchData?.total ?? 0
    : listData?.total ?? 0;

  const handleTableChange = (paginationConfig: any) => {
    setPage(paginationConfig.current ?? 1);
    setPageSize(paginationConfig.pageSize ?? 10);
  };

  const handleViewApplication = async (row: HiringApplicationRow) => {
    setIsDetailsOpen(true);
    setIsDetailsLoading(true);
    try {
      const response: any = await GET_API(endpoints.hiring.getApplication(row.id));
      const resData = response.data;

      console.log("API DETAILS RESPONSE:", resData);

      const roleCode = resData?.selected_position || "";
      let appliedForData;

      if (resData?.position) {
        appliedForData = {
          title: resData.position.title || formatRoleName(roleCode),
          description: resData.position.description || resData?.custom_role_description || "-",
          responsibilities: resData.position.responsibilities || [],
        };
      } else if (ROLE_MAPPINGS[roleCode]) {
        appliedForData = {
          ...ROLE_MAPPINGS[roleCode],
          description: resData?.custom_role_description || ROLE_MAPPINGS[roleCode].description,
        };
      } else {
        appliedForData = {
          title: formatRoleName(roleCode),
          description: resData?.custom_role_description || "-",
          responsibilities: resData?.responsibilities || [],
        };
      }

      setSelectedDetails({
        id: row.id,
        appliedFor: appliedForData,
        basicInfo: {
          fullName: resData?.full_name || "-",
          email: normalizeEmail(resData?.email) || "-",
          phoneNo: resData?.phone ? `${resData.phone.country_code} ${resData.phone.number}` : "-",
          dob: resData?.date_of_birth || "-",
          country: resData?.address?.country || "-",
          state: resData?.address?.state || "-",
          linkedInOrPortfolio: resData?.linkedin_or_portfolio_url || "-",
          schoolOrUniversity: resData?.education?.school_or_university || "-",
          gradeLevelOrYear: resData?.education?.grade_level_or_year || "-",
          currentEmploymentDetails: resData?.current_employment_details || "-",
          compensationExpectation: resData?.compensation_expectation || "-",
          acknowledgement: `This internship is currently unpaid and designed as a volunteer or learning opportunity. MelodyWings is a nonprofit organization, and while compensation cannot be guaranteed at this time, stipends or honorariums may be offered in the future if donations or funding become available.\n\nPlease confirm that you understand and are comfortable with this arrangement.\n\nYes, I understand and am willing to participate under these conditions`,
        },
        applicationQuestions: [
          {
            question: "Are you looking for an internship opportunity",
            answer: toYesNo(resData?.application_questions?.looking_for_internship),
          },
          { question: "Why are you interested in this opportunity with MelodyWings?", answer: resData?.application_questions?.interest_in_melodywings || "-" },
          { question: "What relevant experience do you have for this role?", answer: resData?.application_questions?.relevant_experience || "-" },
          { question: "What skills would you bring to this role?", answer: resData?.application_questions?.skills_for_role || "-" },
          { question: "How many hours per week are you available?", answer: resData?.application_questions?.hours_per_week || "-" },
          { question: "When would you be available to start?", answer: resData?.application_questions?.available_start_date || "-" },
          { question: "Have you previously volunteered or worked with children or neurodivergent learners? If yes, please describe.", answer: resData?.application_questions?.children_or_neurodivergent_experience || "-" },
          { question: "Is there anything else you would like us to know about you?", answer: resData?.application_questions?.additional_information || "-" },
        ],
        legalAndSafety: [
          {
            title: "1. Criminal Background Check",
            items: [
              {
                question: "Have you ever been convicted of a felony or misdemeanor?",
                answer: toYesNo(
                  resData?.legal_and_safety?.criminal_background_check
                    ?.convicted_of_felony_or_misdemeanor
                ),
              },
              {
                question:
                  "Have you ever been involved in any criminal activity or legal proceedings, including pending charges or arrests?",
                answer: toYesNo(
                  resData?.legal_and_safety?.criminal_background_check
                    ?.involved_in_criminal_activity
                ),
              },
              {
                question: "Have you been convicted of any crime involving minors, abuse, or neglect?",
                answer: toYesNo(
                  resData?.legal_and_safety?.criminal_background_check
                    ?.convicted_of_crimes_involving_minors
                ),
              },
              { question: "Please describe the circumstances behind the 'yes' answer above.", answer: resData?.legal_and_safety?.criminal_background_check?.details_if_yes || "NIL" },
            ],
          },
          {
            title: "2. Sex Offender Registry Check",
            items: [
              {
                question: "Are you listed on any state or national sex offender registries?",
                answer: toYesNo(
                  resData?.legal_and_safety?.sex_offender_registry_check
                    ?.listed_on_sex_offender_registry
                ),
              },
              { question: "Please describe the circumstances behind the 'yes' answer above.", answer: resData?.legal_and_safety?.sex_offender_registry_check?.details_if_yes || "NIL" },
            ],
          },
          {
            title: "3. Disciplinary History",
            items: [
              {
                question:
                  "Have you ever been terminated or asked to resign from a volunteer or employment position for reasons related to misconduct or inappropriate behavior?",
                answer: toYesNo(
                  resData?.legal_and_safety?.disciplinary_history
                    ?.terminated_for_misconduct
                ),
              },
              {
                question:
                  "Have you ever been involved in any dispute with an employer or organization related to safety or ethical issues?",
                answer: toYesNo(
                  resData?.legal_and_safety?.disciplinary_history
                    ?.dispute_related_to_safety_or_ethics
                ),
              },
              {
                question:
                  "Have you ever faced dismissal, suspension, probation, or any other disciplinary or academic misconduct action from a college, university, or professional school?",
                answer: toYesNo(
                  resData?.legal_and_safety?.disciplinary_history
                    ?.academic_or_professional_disciplinary_action
                ),
              },
              { question: "Please describe the circumstances behind the 'yes' answer above.", answer: resData?.legal_and_safety?.disciplinary_history?.details_if_yes || "NIL" },
            ],
          },
          {
            title: "4. Health and Safety Information",
            items: [
              {
                question:
                  "Do you have any physical or mental health conditions that may affect your ability to perform volunteer duties?",
                answer: toYesNo(
                  resData?.legal_and_safety?.health_and_safety
                    ?.condition_affecting_volunteer_duties
                ),
              },
              { question: "Please describe the circumstances behind the 'yes' answer above.", answer: resData?.legal_and_safety?.health_and_safety?.details_if_yes || "NIL" },
            ],
          },
          {
            title: "5. Consents",
            items: [
              {
                question:
                  "Do you consent to child abuse registry and sex offender checks if needed?",
                answer: toYesNo(
                  resData?.legal_and_safety?.consents
                    ?.agree_child_abuse_and_registry_checks
                ),
              },
              {
                question:
                  "Do you agree to follow the organization's policies on confidentiality, behavior, and safeguarding procedures?*",
                answer: toYesNo(
                  resData?.legal_and_safety?.consents
                    ?.agree_confidentiality_behavior_safeguarding_policies
                ),
              },
              {
                question:
                  "Do you understand that your volunteer role may be terminated based on any criminal activity or failure to adhere to the organization's policies?*",
                answer: toYesNo(
                  resData?.legal_and_safety?.consents
                    ?.understand_role_termination_if_policy_breach_or_criminal_activity
                ),
              },
              { question: "Please describe the circumstances behind the 'no' answer above.", answer: resData?.legal_and_safety?.consents?.details_if_no || "NIL" },
            ],
          },
          {
            title: "6. Previous Volunteer Experience",
            items: [
              {
                question:
                  "Have you ever been involved in any incidents or complaints during previous volunteer roles?",
                answer: toYesNo(
                  resData?.legal_and_safety?.previous_volunteer_experience
                    ?.involved_in_incidents_or_complaints
                ),
              },
              { question: "Please describe the circumstances behind the 'yes' answer above.", answer: resData?.legal_and_safety?.previous_volunteer_experience?.details_if_yes || "NIL" },
            ],
          },
        ],
        consent: {
          photoVideoConsent: toYesNo(resData?.permissions?.photo_video_consent),
          body: detailsTemplate.consent.body,
        },
      });
    } catch (error) {
      console.error("Failed to fetch application details:", error);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const columns = useMemo(
    () => getHiringColumns(handleViewApplication),
    [handleViewApplication]
  );

  return (
    <div className="w-full h-auto p-6 animate-fadeIn">
      <ApplicationDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        data={selectedDetails}
        isLoading={isDetailsLoading}
      />
      <div className="w-full mb-4 flex items-center justify-between gap-4">
        <h2 className="text-[20px] font-medium text-[#121212] !font-poppins">Applications</h2>
        <div className="relative w-full max-w-[280px]">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#9CA3AF]">
            <SearchIcon />
          </span>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search"
            className="w-full h-10 rounded-[100px] border border-[#E0E0E0] bg-white pl-10 pr-4 text-[16px] font-normal text-[#121212] placeholder:text-[#9CA3AF] focus:outline-none"
          />
        </div>
      </div>
      {!isLoading && !isFetching && pagedData.length === 0 ? (
        <div className="w-full py-10 text-center text-[#6B7280]">No records available</div>
      ) : (
        <Table
          key="hiring-applications"
          data={pagedData}
          columns={columns}
          loading={isLoading || isFetching}
          rootClassName="[&_thead_th]:!bg-[#FAFAFA] [&_thead_th]:font-medium [&_tbody_td]:font-normal [&_thead_th.ant-table-column-sort]:!bg-[#FAFAFA] [&_tbody_tr:hover>td]:!bg-[#FAFAFA] [&_tbody_td.ant-table-column-sort]:!bg-transparent [&_tbody_tr:hover>td.ant-table-column-sort]:!bg-[#FAFAFA] [&_.ant-table-column-sorter]:!text-[#9CA3AF] [&_.ant-table-column-sorters_.ant-table-column-sorter-up]:!text-[#9CA3AF] [&_.ant-table-column-sorters_.ant-table-column-sorter-down]:!text-[#9CA3AF] [&_.ant-table-column-sorters_.ant-table-column-sorter-up.active]:!text-[#9CA3AF] [&_.ant-table-column-sorters_.ant-table-column-sorter-down.active]:!text-[#9CA3AF]"
          onRow={(record: HiringApplicationRow) => ({
            onClick: () => handleViewApplication(record),
            className: "cursor-pointer",
          })}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: totalCount,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          onChange={handleTableChange}
        />
      )}
    </div>
  );
}
