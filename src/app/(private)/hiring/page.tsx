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
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";

const mockApplications: HiringApplicationRow[] = [
  {
    id: "1",
    applicant_name: "John Doe",
    email: "johndoe22@gmail.com",
    submission_date: "12th Nov, 2024",
  },
  {
    id: "2",
    applicant_name: "Jane Doe",
    email: "janedoe22@gmail.com",
    submission_date: "12th Nov, 2024",
  },
  {
    id: "3",
    applicant_name: "Alex Smith",
    email: "alexsmith@gmail.com",
    submission_date: "13th Nov, 2024",
  },
  {
    id: "4",
    applicant_name: "Priya Kumar",
    email: "priya.kumar@gmail.com",
    submission_date: "14th Nov, 2024",
  },
  {
    id: "5",
    applicant_name: "Maria Garcia",
    email: "maria.garcia@gmail.com",
    submission_date: "15th Nov, 2024",
  },
  {
    id: "6",
    applicant_name: "Chen Wei",
    email: "chen.wei@gmail.com",
    submission_date: "16th Nov, 2024",
  },
  {
    id: "7",
    applicant_name: "Fatima Noor",
    email: "fatima.noor@gmail.com",
    submission_date: "17th Nov, 2024",
  },
  {
    id: "8",
    applicant_name: "Samuel Johnson",
    email: "sam.johnson@gmail.com",
    submission_date: "18th Nov, 2024",
  },
  {
    id: "9",
    applicant_name: "Aisha Khan",
    email: "aisha.khan@gmail.com",
    submission_date: "19th Nov, 2024",
  },
  {
    id: "10",
    applicant_name: "Rahul Verma",
    email: "rahul.verma@gmail.com",
    submission_date: "20th Nov, 2024",
  },
  {
    id: "11",
    applicant_name: "John Doe",
    email: "johndoe22@gmail.com",
    submission_date: "12th Nov, 2024",
  },
  {
    id: "12",
    applicant_name: "John Doe",
    email: "johndoe22@gmail.com",
    submission_date: "12th Nov, 2024",
  },
];

export default function HiringPage() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();

  const [query] = useQueryState("query");
  const [size, setSize] = useQueryState("size", { defaultValue: "10" });
  const [page, setPage] = useQueryState("page", { defaultValue: "1" });

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] =
    useState<ApplicationDetails | null>(null);

  useEffect(() => {
    setHeaderOptions({
      title: "Applications",
      titleIcon: getHeaderIcon(pathname),
      showSearch: true,
    });
  }, [pathname, setHeaderOptions]);

  const detailsTemplate: Omit<ApplicationDetails, "id" | "basicInfo"> = useMemo(
    () => ({
      appliedFor: {
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

  const filtered = useMemo(() => {
    const q = (query ?? "").trim().toLowerCase();
    if (!q) return mockApplications;
    return mockApplications.filter((row) => {
      const haystack =
        `${row.applicant_name} ${row.email} ${row.submission_date}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query]);

  const pagination = useMemo(() => {
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSize = Math.max(1, Number(size) || 10);
    return { pageNum, pageSize };
  }, [page, size]);

  const pagedData = useMemo(() => {
    const start = (pagination.pageNum - 1) * pagination.pageSize;
    return filtered.slice(start, start + pagination.pageSize);
  }, [filtered, pagination.pageNum, pagination.pageSize]);

  const handleTableChange = (paginationConfig: any) => {
    setSize(String(paginationConfig.pageSize ?? 10));
    setPage(String(paginationConfig.current ?? 1));
  };

  const handleViewApplication = (row: HiringApplicationRow) => {
    setSelectedDetails({
      ...detailsTemplate,
      id: row.id,
      basicInfo: {
        fullName: row.applicant_name,
        email: row.email,
        phoneNo: "9876543210",
        dob: "23/04/2004",
        country: "INDIA",
        state: "Maharashtra",
        linkedInOrPortfolio: "www.portfolio.com",
        schoolOrUniversity: "Indian Institute of Technology",
        gradeLevelOrYear: "Final Year",
        currentEmploymentDetails: "NIL",
        compensationExpectation: "NIL",
        acknowledgement: `This internship is currently unpaid and designed as a volunteer or learning opportunity. MelodyWings is a nonprofit organization, and while compensation cannot be guaranteed at this time, stipends or honorariums may be offered in the future if donations or funding become available.

Please confirm that you understand and are comfortable with this arrangement.

Yes, I understand and am willing to participate under these conditions`,
      },
    });
    setIsDetailsOpen(true);
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
      />
      <Table
        key="hiring-applications"
        data={pagedData}
        columns={columns}
        loading={false}
        onRow={(record: HiringApplicationRow) => ({
          onClick: () => handleViewApplication(record),
          className: "cursor-pointer",
        })}
        pagination={{
          current: pagination.pageNum,
          pageSize: pagination.pageSize,
          total: filtered.length,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        onChange={handleTableChange}
      />
    </div>
  );
}
