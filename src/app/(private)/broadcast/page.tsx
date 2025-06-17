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

const learnerMails = [
  { learner_id: "L001", email: "alex.smith@example.com" },
  { learner_id: "L002", email: "bob.jones@example.com" },
  { learner_id: "L003", email: "chen.liu@example.com" },
  { learner_id: "L004", email: "david.miller@example.com" },
  { learner_id: "L005", email: "elena.popov@example.com" },
  { learner_id: "L006", email: "frank.zhang@example.com" },
  { learner_id: "L007", email: "gabriela.silva@example.com" },
  { learner_id: "L008", email: "hans.mueller@example.com" },
  { learner_id: "L009", email: "ivan.petrov@example.com" },
  { learner_id: "L010", email: "julia.kowalski@example.com" },
  { learner_id: "L011", email: "kim.park@example.com" },
  { learner_id: "L012", email: "luis.garcia@example.com" },
  { learner_id: "L013", email: "maria.santos@example.com" },
  { learner_id: "L014", email: "nadia.hassan@example.com" },
  { learner_id: "L015", email: "omar.abdullah@example.com" },
  { learner_id: "L016", email: "pedro.martinez@example.com" },
  { learner_id: "L017", email: "quinn.o'brien@example.com" },
  { learner_id: "L018", email: "raj.patel@example.com" },
  { learner_id: "L019", email: "sarah.cohen@example.com" },
  { learner_id: "L020", email: "tomas.novak@example.com" },
  { learner_id: "L021", email: "uma.krishnan@example.com" },
  { learner_id: "L022", email: "viktor.ivanov@example.com" },
  { learner_id: "L023", email: "wei.wang@example.com" },
  { learner_id: "L024", email: "xavier.dupont@example.com" },
  { learner_id: "L025", email: "yuki.tanaka@example.com" },
  { learner_id: "L026", email: "zara.ahmed@example.com" },
];

const volunteerMails = [
  { volunteer_id: "V001", email: "alex.smith@example.com" },
  { volunteer_id: "V002", email: "bob.jones@example.com" },
  { volunteer_id: "V003", email: "chen.liu@example.com" },
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
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [learners, setLearners] = useState<string[]>([]);
  const [attachFile, setAttachFile] = useState<any>(null);
  const [isLearnerSelectionOpen, setIsLearnerSelectionOpen] = useState(false);
  const [isVolunteerSelectionOpen, setIsVolunteerSelectionOpen] =
    useState(false);

  const [errors, setErrors] = useState({
    location: "",
    language: "",
    volunteers: "",
    learners: "",
    subject: "",
    message: "",
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
    setAttachFile(value);
  };

  const handleDeleteAttachFile = () => {
    setAttachFile(null);
  };

  const handleSelectLearnerMail = (id: string) => {
    setLearners((prev) =>
      prev.includes(id) ? prev.filter((lid) => lid !== id) : [...prev, id]
    );
  };

  const handleSelectVolunteerMail = (id: string) => {
    setVolunteers((prev) =>
      prev.includes(id) ? prev.filter((vid) => vid !== id) : [...prev, id]
    );
  };

  const handleSelectAllVolunteers = () => {
    if (volunteers.length === volunteerMails.length) {
      setVolunteers([]);
    } else {
      setVolunteers(volunteerMails.map((v) => v.volunteer_id));
    }
  };

  const handleSelectAllLearners = () => {
    if (learners.length === learnerMails.length) {
      setLearners([]);
    } else {
      setLearners(learnerMails.map((l) => l.learner_id));
    }
  };

  const validate = () => {
    const newErrors: any = {};
    if (!location) newErrors.location = "Location is required";
    if (!language) newErrors.language = "Language is required";
    if (volunteers.length === 0)
      newErrors.volunteers = "Select at least one volunteer";
    if (learners.length === 0)
      newErrors.learners = "Select at least one learner";
    if (!subject.trim()) newErrors.subject = "Subject is required";
    if (!message.trim()) newErrors.message = "Message is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendEmail = () => {
    if (!validate()) return;
    console.log(
      "send email",
      volunteers,
      learners,
      location,
      language,
      subject,
      message,
      attachFile
    );
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  useEffect(() => {
    setHeaderOptions({
      title: "Email Broadcast",
      titleIcon: getHeaderIcon(pathname),
    });
  }, [setHeaderOptions]);

  return (
    <div className="p-10 flex flex-col gap-5">
      <SelectionModal
        isOpen={isLearnerSelectionOpen}
        onClose={() => setIsLearnerSelectionOpen(false)}
        handleCheck={handleSelectLearners}
        items={learnerMails.map((learner) => ({
          id: learner.learner_id,
          label: learner.email,
        }))}
        selectedItems={learners}
        onSelectItem={handleSelectLearnerMail}
        type="learner"
      />
      <SelectionModal
        isOpen={isVolunteerSelectionOpen}
        onClose={() => setIsVolunteerSelectionOpen(false)}
        handleCheck={handleSelectVolunteers}
        items={volunteerMails.map((volunteer) => ({
          id: volunteer.volunteer_id,
          label: volunteer.email,
        }))}
        selectedItems={volunteers}
        onSelectItem={handleSelectVolunteerMail}
        type="volunteer"
      />
      <div className="bg-white border border-stroke  w-full rounded-2xl p-5 grid grid-cols-2 gap-5">
        <div>
          <Select
            label="Location"
            name="location"
            inputType="select"
            options={locationOptions}
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
            options={languageOptions}
            placeholder="Select Language"
            value={language}
            onChange={(value) => handleSelectLanguage(value as string)}
          />
          {errors.language && (
            <div className="text-red-500 text-xs mt-1">{errors.language}</div>
          )}
        </div>
        <div>
          <ClickInput
            label="Select Volunteers"
            selectedItems={volunteers.length}
            availableItems={volunteerMails.length}
            onClick={handleSelectVolunteers}
          />
          <div className="flex items-center gap-2 mt-2">
            <Checkbox
              checked={
                volunteers.length === volunteerMails.length &&
                volunteerMails.length > 0
              }
              indeterminate={
                volunteers.length > 0 &&
                volunteers.length < volunteerMails.length
              }
              onChange={handleSelectAllVolunteers}
            />
            <span className="text-sm font-normal text-gray-500">
              Select all volunteers
            </span>
          </div>
          {errors.volunteers && (
            <div className="text-red-500 text-xs mt-1">{errors.volunteers}</div>
          )}
        </div>
        <div>
          <ClickInput
            label="Select Learners"
            selectedItems={learners.length}
            availableItems={learnerMails.length}
            onClick={handleSelectLearners}
          />
          <div className="flex items-center gap-2 mt-2">
            <Checkbox
              checked={
                learners.length === learnerMails.length &&
                learnerMails.length > 0
              }
              indeterminate={
                learners.length > 0 && learners.length < learnerMails.length
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
      </div>
      <div className="bg-white border border-stroke  w-full rounded-2xl p-5 flex flex-col gap-5">
        <div>
          <input
            type="text"
            placeholder="Subject"
            className="w-full border border-stroke rounded-lg p-2 bg-background"
            value={subject}
            onChange={(e) => handleSelectSubject(e.target.value)}
          />
          {errors.subject && (
            <div className="text-red-500 text-xs mt-1">{errors.subject}</div>
          )}
        </div>
        <div>
          <textarea
            placeholder="Type details here"
            className="w-full border border-stroke rounded-lg p-2 bg-background"
            rows={10}
            value={message}
            onChange={(e) => handleSelectMessage(e.target.value)}
          ></textarea>
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
          <div className="flex items-center text-sm gap-2">
            {attachFile && (
              <span className=" text-sm flex items-center text-gray-500">
                {attachFile.name}
                <TiDelete
                  className="text-red-500 text-xl cursor-pointer ml-2"
                  onClick={handleDeleteAttachFile}
                />
              </span>
            )}
            <label className="text-sm font-normal text-black flex items-center border border-stroke rounded-xl p-2 gap-2 cursor-pointer ml-2">
              <RiAttachment2 className="text-black text-lg" />
              <span>Attach File</span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setAttachFile(e.target.files[0]);
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
