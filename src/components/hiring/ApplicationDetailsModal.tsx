import { FeedModalCloseIcon } from "@/assets/icons";
import Divider from "@/components/common/Divider";
import ViewModal from "@/components/common/Modals/ViewModal";
import React from "react";

export type QA = { question: string; answer: string };

export interface ApplicationDetails {
  id: string;
  appliedFor: {
    title: string;
    description: string;
    responsibilities: string[];
  };
  basicInfo: {
    fullName: string;
    email: string;
    phoneNo: string;
    dob: string;
    country: string;
    state: string;
    linkedInOrPortfolio: string;
    schoolOrUniversity: string;
    gradeLevelOrYear: string;
    currentEmploymentDetails: string;
    compensationExpectation: string;
    acknowledgement: string;
  };
  applicationQuestions: QA[];
  legalAndSafety: Array<{
    title: string;
    items: QA[];
  }>;
  consent: {
    photoVideoConsent: string;
    body: string;
  };
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <p className="text-[14px] text-[#4F4F4F]">{label}</p>
    <p className="text-[16px] font-medium text-[#121212]">{value || "-"}</p>
  </div>
);

const QAItem = ({ question, answer }: QA) => (
  <div className="flex flex-col gap-1">
    <p className="text-[14px] text-[#4F4F4F]">{question}</p>
    <p className="text-[16px] font-medium text-[#121212]">{answer || "-"}</p>
  </div>
);

export default function ApplicationDetailsModal({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: ApplicationDetails | null;
}) {
  if (!data) return null;

  return (
    <ViewModal modalOpen={isOpen} onClose={onClose} width={920} height="80vh" zIndex={100000}>
      <div className="flex flex-col h-full !font-poppins bg-white">
        <div className="flex items-center justify-between px-7 py-5">
          <p className="text-xl font-medium text-gray-900">Application Form</p>
          <span className="cursor-pointer" onClick={onClose}>
            <FeedModalCloseIcon />
          </span>
        </div>
        <Divider />

        <div className="flex-1 overflow-y-auto px-7 py-6">
          <div className="border border-stroke-light rounded-2xl p-5">
            <p className="text-[20px] font-medium text-gray-900">Applied For</p>
            <div className="mt-3">
              <p className="text-[16px] font-medium text-gray-900">
                {data.appliedFor.title}
              </p>
              <p className="text-[14px] text-[#4F4F4F] mt-1">
                {data.appliedFor.description}
              </p>
              <div className="mt-3">
                <p className="text-[12px] text-[#121212] font-medium">
                  Responsibilities may include:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-[12px] text-[#121212]">
                  {data.appliedFor.responsibilities.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-7">
            <p className="text-[20px] font-medium text-[#000000]">
              Basic Information
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-6 mt-5">
              <Field label="Full Name" value={data.basicInfo.fullName} />
              <Field label="Email Address" value={data.basicInfo.email} />
              <Field label="Phone No" value={data.basicInfo.phoneNo} />
              <Field label="Date of Birth" value={data.basicInfo.dob} />
              <Field label="Country of Residence*" value={data.basicInfo.country} />
              <Field label="State" value={data.basicInfo.state} />
              <Field
                label="LinkedIn or Portfolio"
                value={data.basicInfo.linkedInOrPortfolio}
              />
              <Field
                label="School / University"
                value={data.basicInfo.schoolOrUniversity}
              />
              <Field
                label="Grade Level/ Year"
                value={data.basicInfo.gradeLevelOrYear}
              />
              <Field
                label="Current Employment Details"
                value={data.basicInfo.currentEmploymentDetails}
              />
              <Field
                label="Compensation / Stipend Expectation"
                value={data.basicInfo.compensationExpectation}
              />
            </div>

            <p className="text-[14px] text-[#4F4F4F] mt-6 leading-5 whitespace-pre-line">
              {data.basicInfo.acknowledgement}
            </p>
            <div className="mt-6">
              <Divider />
            </div>
          </div>

          <div className="mt-10">
            <p className="text-[20px] font-medium text-[#000000]">
              Application Questions
            </p>

            <div className="mt-5 space-y-5">
              {data.applicationQuestions.map((qa) => (
                <QAItem key={qa.question} {...qa} />
              ))}
            </div>
            <div className="mt-8">
              <Divider />
            </div>
          </div>

          <div className="mt-10">
            <p className="text-base font-semibold text-gray-900">
              Legal and Safety Information
            </p>

            <div className="mt-5 space-y-5">
              {data.legalAndSafety.map((section) => (
                <div
                  key={section.title}
                  className="border border-stroke-light rounded-2xl p-5"
                >
                  <p className="text-[20px] font-medium text-[#000000]">
                    {section.title}
                  </p>
                  <div className="mt-4 space-y-4">
                    {section.items.map((qa) => (
                      <QAItem key={qa.question} {...qa} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Divider />
            </div>
          </div>

          <div className="mt-10 pb-4">
            <p className="text-[20px] font-medium text-[#000000]">
              Consent and Permissions
            </p>

            <div className="mt-5 space-y-4">
              <QAItem
                question="Photo/Video Consent (for use in program materials or promotional content)"
                answer={data.consent.photoVideoConsent}
              />
              <p className="text-[14px] text-[#121212] leading-5">{data.consent.body}</p>
            </div>
          </div>
        </div>
      </div>
    </ViewModal>
  );
}

