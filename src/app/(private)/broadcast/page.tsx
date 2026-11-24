"use client";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import React, { useEffect, useRef, useState } from "react";
import { createInFlightGuard } from "@/utils/inflight";
import { withQuery } from "@/utils/query";
import { usePathname } from "next/navigation";
import Select from "@/components/common/Input/Select";
import ClickInput from "@/components/common/Input/ClickInput";
import Button from "@/components/common/Button";
import { RiAttachment2 } from "react-icons/ri";
import { TiDelete } from "react-icons/ti";
import { Checkbox, Input } from "antd";
import SelectionModal from "@/components/LearnerSelectionModal";
import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/api/constants";
import { GET_API, POST_FORM_API } from "@/api/request";
import toast from "react-hot-toast";
import TextEditor from "@/components/RichTextEditor";
import Loader from "@/components/common/Loader";
import AlertModal from "@/components/common/Modals/AlertModal";
import { getApiErrorMessage } from "@/utils/apiError";
import { showToast } from "@/components/common/Toast";

// Mirrors MAX_RECIPIENTS in the backend's routes/v1/admin/mail.py.
const MAX_RECIPIENTS = 500;

// The rich-text editor emits "<p><br></p>" for an empty body, which passed a plain
// `.trim()` check and sent blank emails.
const hasVisibleText = (html: string) =>
  html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0;

const Broadcast = () => {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [language, setLanguage] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [allLearners, setAllLearners] = useState<any[]>([]);
  const [allVolunteers, setAllVolunteers] = useState<any[]>([]);
  const [allLocations, setAllLocations] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<string[]>([]);
  const [learners, setLearners] = useState<string[]>([]);
  const [attachFiles, setAttachFiles] = useState<File[]>([]);
  const [isLearnerSelectionOpen, setIsLearnerSelectionOpen] = useState(false);
  const [isVolunteerSelectionOpen, setIsVolunteerSelectionOpen] =
    useState(false);
  const [allLanguages, setAllLanguages] = useState<any[]>([]);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isLanguageLoading, setIsLanguageLoading] = useState(false);
  const [isNoData, setIsNoData] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [errors, setErrors] = useState({
    location: "",
    language: "",
    volunteers: "",
    learners: "",
    subject: "",
    message: "",
  });

  const getLocation = async () => {
    setIsLocationLoading(true);
    try {
      const response: any = await GET_API(endpoints.comment.getLocation);
      const locations = response.data.map((location: any) => ({
        label: location.country_name,
        value: location.country_id,
      }));
      setAllLocations(locations);
      return locations;
    } catch {
      showToast({ message: "Couldn't load the countries. Please try again.", type: "error" });
      return [];
    } finally {
      // Always clear the flag: a failed fetch used to leave the whole form on the loader forever.
      setIsLocationLoading(false);
    }
  };

  const getLanguage = async () => {
    setIsLanguageLoading(true);
    try {
      const response: any = await GET_API(endpoints.comment.getLanguage);
      const languages = response.data.map((language: any) => ({
        label: language,
        value: language,
      }));
      setAllLanguages(languages);
      return languages;
    } catch {
      showToast({ message: "Couldn't load the languages. Please try again.", type: "error" });
      return [];
    } finally {
      setIsLanguageLoading(false);
    }
  };

  const getRecipients = async () => {
    try {
      const recipientEndpoints = withQuery(endpoints.broadcast.getRecipients, { country: location, language });
      const response: any = await GET_API(recipientEndpoints);
      setAllVolunteers(
        response.data.volunteer_recipients_list.map((vol: any) => ({
          volunteer_id: vol.volunteer_id,
          email: vol.volunteer_email,
        }))
      );
      setAllLearners(
        response.data.learner_recipients_list.map((learner: any) => ({
          learner_id: learner.learner_id,
          email: learner.learner_email,
        }))
      );
      if (
        response.data.volunteer_recipients_list.length === 0 &&
        response.data.learner_recipients_list.length === 0
      ) {
        setIsNoData(true);
      } else {
        setIsNoData(false);
      }
    } catch (error: any) {
      // Previously silent - allVolunteers/allLearners just stayed at their prior (empty)
      // value with no indication anything failed, indistinguishable from "no recipients
      // for this location/language."
      console.error(error);
      toast.error(getApiErrorMessage(error, "Couldn't load the recipients. Please try again."));
    }
  };

  const { data: locationData, isFetching: isFetchingLocation } = useQuery({
    queryKey: ["location_data"],
    queryFn: () => getLocation(),
    staleTime: 24 * 60 * 60 * 1000, // countries essentially never change
  });

  const { data: languageData, isFetching: isFetchingLanguage } = useQuery({
    queryKey: ["language_data"],
    queryFn: () => getLanguage(),
    staleTime: 24 * 60 * 60 * 1000, // languages essentially never change
  });

  const handleSelectVolunteers = () => {
    setIsVolunteerSelectionOpen(true);
  };

  const handleSelectLearners = () => {
    setIsLearnerSelectionOpen(true);
  };

  const handleSelectLocation = (value: string) => {
    setLocation(value);
  };

  const handleSelectLanguage = (value: string) => {
    setLanguage(value);
  };

  const handleSelectSubject = (value: string) => {
    setSubject(value);
  };

  const handleSelectMessage = (value: string) => {
    setMessage(value);
  };

  const handleSelectAttachFile = (value: any) => {
    setAttachFiles(value);
  };

  const handleDeleteAttachFile = () => {
    setAttachFiles([]);
  };

  const handleSelectLearnerMail = (email: string) => {
    setLearners((prev) =>
      prev.includes(email)
        ? prev.filter((lemail) => lemail !== email)
        : [...prev, email]
    );
  };

  const handleSelectVolunteerMail = (email: string) => {
    setVolunteers((prev) =>
      prev.includes(email)
        ? prev.filter((vemail) => vemail !== email)
        : [...prev, email]
    );
  };

  const handleSelectAllVolunteers = () => {
    if (volunteers.length === allVolunteers.length) {
      setVolunteers([]);
    } else {
      setVolunteers(allVolunteers.map((v) => v.email));
    }
  };

  const handleSelectAllLearners = () => {
    if (learners.length === allLearners.length) {
      setLearners([]);
    } else {
      setLearners(allLearners.map((l) => l.email));
    }
  };

  const validate = () => {
    const newErrors: any = {};
    if (!location) newErrors.location = "Location is required";
    if (!language) newErrors.language = "Language is required";
    if (volunteers.length === 0 && learners.length === 0) {
      newErrors.volunteers = "Select at least one volunteer or learner";
    } else if (volunteers.length + learners.length > MAX_RECIPIENTS) {
      newErrors.volunteers = `At most ${MAX_RECIPIENTS} recipients per broadcast`;
    }
    if (!subject.trim()) newErrors.subject = "Subject is required";
    if (!hasVisibleText(message)) newErrors.message = "Message is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const recipientCount = volunteers.length + learners.length;

  // Sending is irreversible and can reach hundreds of people, so it goes through a
  // confirmation showing exactly how many and what subject.
  const handleSendClick = () => {
    if (!validate()) return;
    setIsConfirmOpen(true);
  };

  // Sending reaches hundreds of people and can't be recalled: one send at a time, even if the
  // confirmation button is clicked twice before the dialog re-renders.
  const sendFlight = useRef(createInFlightGuard());
  const handleSendEmail = () => sendFlight.current.run(sendNow);

  const sendNow = async () => {
    setIsLoading(true);
    const queuedMessage = `Email queued for ${recipientCount} recipient${recipientCount === 1 ? "" : "s"}`;
    const allEmails = [...volunteers, ...learners].join(",");

    const formData = new FormData();
    formData.append("emails", allEmails);
    formData.append("subject", subject);
    formData.append("body", message);
    const withAttachments = attachFiles.length > 0;
    attachFiles.forEach((file) => formData.append("files", file));

    try {
      await POST_FORM_API(
        withAttachments ? endpoints.broadcast.sendEmailWithAttachment : endpoints.broadcast.sendEmail,
        formData
      );
      handleReset();
      toast.success(queuedMessage);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "Couldn't send the email. Please try again."));
    } finally {
      setIsLoading(false);
      setIsConfirmOpen(false);
    }
  };

  const handleReset = () => {
    setLanguage("");
    setLocation("");
    setSubject("");
    setMessage("");
    setAttachFiles([]);
    setVolunteers([]);
    setLearners([]);
    setAllVolunteers([]);
    setAllLearners([]);
  };

  useEffect(() => {
    if (location && language) {
      getRecipients();
      setVolunteers([]);
      setLearners([]);
    }
  }, [location, language]);

  useEffect(() => {
    setHeaderOptions({
      title: "Email Broadcast",
      titleIcon: getHeaderIcon(pathname),
    });
  }, [setHeaderOptions]);

  if (isLocationLoading || isLanguageLoading) {
    return <Loader />;
  }

  return (
    <div className="p-6 flex flex-col gap-5">
      <AlertModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onPrimaryAction={handleSendEmail}
        type="warning"
        title="Send Broadcast?"
        description={`"${subject.trim()}" will be emailed to ${recipientCount} recipient${recipientCount === 1 ? "" : "s"} (${volunteers.length} volunteer${volunteers.length === 1 ? "" : "s"}, ${learners.length} learner${learners.length === 1 ? "" : "s"}). This cannot be undone.`}
        primaryActionText="Yes, Send"
        isLoading={isLoading}
      />
      <SelectionModal
        isOpen={isLearnerSelectionOpen}
        onClose={() => setIsLearnerSelectionOpen(false)}
        handleCheck={handleSelectAllLearners}
        items={allLearners?.map((learner: any) => ({
          id: learner.email,
          label: learner.email,
        }))}
        selectedItems={learners}
        onSelectItem={handleSelectLearnerMail}
        onSave={() => setIsLearnerSelectionOpen(false)}
        type="learner"
      />
      <SelectionModal
        isOpen={isVolunteerSelectionOpen}
        onClose={() => setIsVolunteerSelectionOpen(false)}
        handleCheck={handleSelectAllVolunteers}
        items={allVolunteers.map((volunteer) => ({
          id: volunteer.email,
          label: volunteer.email,
        }))}
        selectedItems={volunteers}
        onSelectItem={handleSelectVolunteerMail}
        onSave={() => setIsVolunteerSelectionOpen(false)}
        type="volunteer"
      />
      <div className="bg-white border border-stroke  w-full rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <Select
            label="Location"
            name="location"
            inputType="select"
            options={allLocations}
            placeholder="Select a location"
            value={location}
            onChange={(value) => handleSelectLocation(value as string)}
          />
          {errors.location && (
            <div className="text-error text-xs mt-1">{errors.location}</div>
          )}
        </div>
        <div>
          <Select
            label="Language"
            name="language"
            inputType="select"
            options={allLanguages}
            placeholder="Select a language"
            value={language}
            onChange={(value) => handleSelectLanguage(value as string)}
          />
          {errors.language && (
            <div className="text-error text-xs mt-1">{errors.language}</div>
          )}
        </div>
        {allVolunteers.length > 0 && (
          <div>
            <ClickInput
              label="Select volunteers"
              selectedItems={volunteers.length}
              availableItems={allVolunteers.length}
              onClick={handleSelectVolunteers}
            />
            <div className="flex items-center gap-2 mt-2">
              <Checkbox
                aria-label="Select all volunteers"
                checked={
                  volunteers.length === allVolunteers.length &&
                  allVolunteers.length > 0
                }
                onChange={handleSelectAllVolunteers}
              />
              <span className="text-sm font-normal text-ink-2">
                Select all volunteers
              </span>
            </div>
            {errors.volunteers && (
              <div className="text-error text-xs mt-1">
                {errors.volunteers}
              </div>
            )}
          </div>
        )}
        {allLearners.length > 0 && (
          <div>
            <ClickInput
              label="Select learners"
              selectedItems={learners.length}
              availableItems={allLearners?.length}
              onClick={handleSelectLearners}
            />
            <div className="flex items-center gap-2 mt-2">
              <Checkbox
                aria-label="Select all learners"
                checked={
                  learners.length === allLearners?.length &&
                  allLearners?.length > 0
                }
                onChange={handleSelectAllLearners}
              />
              <span className="text-sm font-normal text-ink-2">
                Select all learners
              </span>
            </div>
            {errors.learners && (
              <div className="text-error text-xs mt-1">{errors.learners}</div>
            )}
          </div>
        )}
        {isNoData && (
          <div className="text-sm font-normal text-center text-ink-2 md:col-span-2">
            No volunteers or learners found
          </div>
        )}
      </div>

      <div className="bg-white border border-stroke  w-full rounded-2xl p-5 flex flex-col gap-5">
        <div>
          <Input
            placeholder="Subject"
            aria-label="Subject"
            value={subject}
            onChange={(e) => handleSelectSubject(e.target.value)}
          />
          {errors.subject && (
            <div className="text-error text-xs mt-1">{errors.subject}</div>
          )}
        </div>
        <div>
          <TextEditor
            value={message}
            onChange={handleSelectMessage}
            placeholder="Write your message here"
          />
          {errors.message && (
            <div className="text-error text-xs mt-1">{errors.message}</div>
          )}
        </div>
        {attachFiles.length > 0 && (
          <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm text-ink-2" aria-label="Attached files">
            {attachFiles.map((file, idx) => (
              <li key={idx} className="flex items-center">
                {file.name}
                <button
                  type="button"
                  aria-label={`Remove attachment ${file.name}`}
                  className="bg-transparent border-0 p-0 ml-2 cursor-pointer flex"
                  onClick={() => {
                    setAttachFiles((prev) => prev.filter((_, i) => i !== idx));
                  }}
                >
                  <TiDelete className="text-red-500 text-xl" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {/* Attach on the left, audience + the one primary action on the right. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-stroke bg-white px-4 text-sm font-medium text-ink hover:border-brand-ink">
            <RiAttachment2 className="text-lg" aria-hidden />
            <span>Attach File</span>
            <input
              type="file"
              className="sr-only"
              multiple
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  setAttachFiles((prev) =>
                    [...prev, ...Array.from(files)].filter(
                      (file, idx, arr) =>
                        arr.findIndex(
                          (f) => f.name === file.name && f.size === file.size
                        ) === idx
                    )
                  );
                }
              }}
            />
          </label>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-2" aria-live="polite">
              {recipientCount} recipient{recipientCount === 1 ? "" : "s"} selected
            </span>
            <Button
              customClassName="px-8"
              onClick={handleSendClick}
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Broadcast;
