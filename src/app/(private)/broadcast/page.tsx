"use client";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Select from "@/components/common/Input/Select";
import ClickInput from "@/components/common/Input/ClickInput";
import Button from "@/components/common/Button";
import { RiAttachment2 } from "react-icons/ri";
import { TiDelete } from "react-icons/ti";
import { Checkbox } from "antd";
import SelectionModal from "@/components/LearnerSelectionModal";
import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/api/constants";
import { GET_API, POST_FORM_API } from "@/api/request";
import toast from "react-hot-toast";
import TextEditor from "@/components/RichTextEditor";
import Loader from "@/components/common/Loader";

const locationOptions = [
  { label: "All", value: "all" },
  { label: "Location 1", value: "location1" },
  { label: "Location 2", value: "location2" },
  { label: "Location 3", value: "location3" },
];

const languageOptions = [
  { label: "English", value: "english" },
  { label: "Hindi", value: "hindi" },
  { label: "Marathi", value: "marathi" },
];

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
    const response: any = await GET_API(endpoints.comment.getLocation);
    const locations = response.data.map((location: any) => ({
      label: location.country_name,
      value: location.country_id,
    }));
    setAllLocations(locations);
    setIsLocationLoading(false);
    return locations;
  };

  const getLanguage = async () => {
    setIsLanguageLoading(true);
    const response: any = await GET_API(endpoints.comment.getLanguage);
    const languages = response.data.map((language: any) => ({
      label: language,
      value: language,
    }));
    setAllLanguages(languages);
    setIsLanguageLoading(false);
    return languages;
  };

  const getRecipients = async () => {
    try {
      const recipientEndpoints = `${endpoints.broadcast.getRecipients}?country=${location}&language=${language}`;
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
    } catch (error) {
      console.log(error);
    }
  };

  const { data: locationData, isFetching: isFetchingLocation } = useQuery({
    queryKey: ["location_data"],
    queryFn: () => getLocation(),
  });

  const { data: languageData, isFetching: isFetchingLanguage } = useQuery({
    queryKey: ["language_data"],
    queryFn: () => getLanguage(),
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
    }
    if (!subject.trim()) newErrors.subject = "Subject is required";
    if (!message.trim()) newErrors.message = "Message is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendEmail = () => {
    if (!validate()) return;
    console.log(message, "message here");
    setIsLoading(true);
    const allEmails = [...volunteers, ...learners].join(",");

    // with attachment
    if (attachFiles.length > 0) {
      var formdataAttachment = new FormData();
      if (attachFiles.length > 0) {
        attachFiles.forEach((file) => {
          formdataAttachment.append("files", file);
        });
      }
      formdataAttachment.append("emails", allEmails);
      formdataAttachment.append("subject", subject);
      formdataAttachment.append("body", message);
      POST_FORM_API(
        endpoints.broadcast.sendEmailWithAttachment,
        formdataAttachment
      )
        .then(() => {
          setIsLoading(false);
          handleReset();
          toast.success("Email sent successfully");
        })
        .catch((err) => {
          setIsLoading(false);
        });
    } else {
      // without attachment
      var formData = new FormData();
      formData.append("emails", allEmails);
      formData.append("subject", subject);
      formData.append("body", message);
      POST_FORM_API(endpoints.broadcast.sendEmail, formData)
        .then(() => {
          handleReset();
          setIsLoading(false);
          toast.success("Email sent successfully");
        })
        .catch((err) => {
          setIsLoading(false);
        });
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
    <div className="p-10 flex flex-col gap-5">
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
      <div className="bg-white border border-stroke  w-full rounded-2xl p-5 grid grid-cols-2 gap-5">
        <div>
          <Select
            label="Location"
            name="location"
            inputType="select"
            options={allLocations}
            placeholder="Select Location"
            value={location}
            onChange={(value) => handleSelectLocation(value as string)}
          />
          {errors.location && (
            <div className="text-red-500 text-xs mt-1">{errors.location}</div>
          )}
        </div>
        <div>
          <Select
            label="Language"
            name="language"
            inputType="select"
            options={allLanguages}
            placeholder="Select Language"
            value={language}
            onChange={(value) => handleSelectLanguage(value as string)}
          />
          {errors.language && (
            <div className="text-red-500 text-xs mt-1">{errors.language}</div>
          )}
        </div>
        {allVolunteers.length > 0 && (
          <div>
            <ClickInput
              label="Select Volunteers"
              selectedItems={volunteers.length}
              availableItems={allVolunteers.length}
              onClick={handleSelectVolunteers}
            />
            <div className="flex items-center gap-2 mt-2">
              <Checkbox
                checked={
                  volunteers.length === allVolunteers.length &&
                  allVolunteers.length > 0
                }
                onChange={handleSelectAllVolunteers}
              />
              <span className="text-sm font-normal text-gray-500">
                Select all volunteers
              </span>
            </div>
            {errors.volunteers && (
              <div className="text-red-500 text-xs mt-1">
                {errors.volunteers}
              </div>
            )}
          </div>
        )}
        {allLearners.length > 0 && (
          <div>
            <ClickInput
              label="Select Learners"
              selectedItems={learners.length}
              availableItems={allLearners?.length}
              onClick={handleSelectLearners}
            />
            <div className="flex items-center gap-2 mt-2">
              <Checkbox
                checked={
                  learners.length === allLearners?.length &&
                  allLearners?.length > 0
                }
                onChange={handleSelectAllLearners}
              />
              <span className="text-sm font-normal text-gray-500">
                Select all learners
              </span>
            </div>
            {errors.learners && (
              <div className="text-red-500 text-xs mt-1">{errors.learners}</div>
            )}
          </div>
        )}
        {isNoData && (
          <div className="text-sm font-normal text-center text-gray-500 col-span-2">
            No volunteers or learners found
          </div>
        )}
      </div>

      <div className="bg-white border border-stroke  w-full rounded-2xl p-5 flex flex-col gap-5">
        <div>
          <input
            type="text"
            placeholder="Subject"
            className="w-full border border-stroke rounded-lg p-2 bg-background outline-none"
            value={subject}
            onChange={(e) => handleSelectSubject(e.target.value)}
          />
          {errors.subject && (
            <div className="text-red-500 text-xs mt-1">{errors.subject}</div>
          )}
        </div>
        <div>
          <TextEditor
            value={message}
            onChange={handleSelectMessage}
            placeholder="Type details here"
          />
          {errors.message && (
            <div className="text-red-500 text-xs mt-1">{errors.message}</div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <Button
            className="bg-black px-12 h-[40px] font-poppins text-white rounded-xl font-normal"
            onClick={handleSendEmail}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Email"}
          </Button>
          <div className="flex flex-col items-end text-sm gap-2">
            {attachFiles.map((file, idx) => (
              <span
                key={idx}
                className="text-sm flex items-center text-gray-500"
              >
                {file.name}
                <TiDelete
                  className="text-red-500 text-xl cursor-pointer ml-2"
                  onClick={() => {
                    setAttachFiles((prev) => prev.filter((_, i) => i !== idx));
                  }}
                />
              </span>
            ))}
            <label className="text-sm font-normal text-black flex items-center border border-stroke rounded-xl p-2 gap-2 cursor-pointer ml-2">
              <RiAttachment2 className="text-black text-lg" />
              <span>Attach File</span>
              <input
                type="file"
                className="hidden"
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Broadcast;
