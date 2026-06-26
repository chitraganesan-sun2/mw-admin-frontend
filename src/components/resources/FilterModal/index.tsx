"use client";

import Input from "@/components/common/Input";
import SideModal from "@/components/common/Modals/SideModal";
import { z } from "zod";
import { ResourceFilterModalConstants } from "@/constants/modals";
import { useState, useEffect } from "react";
import { useQueryState } from "nuqs";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const meetingFormSchema = z.object({
    country: z.any().optional(),
    languages_known: z.any().optional(),
    subjects: z.array(z.string()).optional(),
    available_time: z.any(),
    available_days: z.any(),
});

type FilterData = z.infer<typeof meetingFormSchema>;

interface ResourceFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    isFilterApplying: boolean;
}

export default function ResourceFilterModal({ isOpen, isFilterApplying, onClose }: ResourceFilterModalProps) {
    const [language_ids, setLanguages] = useQueryState("language_ids");
    const [subject_ids, setSubjects] = useQueryState("subject_ids");
    const [country, setCountry] = useQueryState("country");
    const [start_time, setStartTime] = useQueryState("start_time");
    const [end_time, setEndTime] = useQueryState("end_time");
    const [start_date, setStartDate] = useQueryState("start_date");
    const [end_date, setEndDate] = useQueryState("end_date");

    const [filterData, setFilterData] = useState<FilterData>({});

    const convertToDate = (date: any) => date ? dayjs(date).format("YYYY-MM-DD") : null;
    const convertToTime = (time: any) => time ? time.format("HH:mm") : null;

    // Update form data when query state changes
    useEffect(() => {
        let from = start_time ? dayjs(start_time, "HH:mm") : null;
        let to = end_time ? dayjs(end_time, "HH:mm") : null;
        if (from && to && from.isAfter(to)) [from, to] = [to, from];

        setFilterData({
            languages_known: language_ids?.split(",") || [],
            subjects: subject_ids?.split(",") || [],
            country: country || null,
            available_days: [
                start_date ? dayjs(start_date) : null,
                end_date ? dayjs(end_date) : null,
            ],
            available_time: { from, to },
        });
    }, [language_ids, subject_ids, start_date, end_date, start_time, end_time]);

    const handleChange = (name: keyof FilterData, value: any) => {
        setFilterData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSave = () => {
        console.log("Data: ", filterData);

        setStartDate(convertToDate(filterData?.available_days?.[0]));
        setEndDate(convertToDate(filterData?.available_days?.[1]));

        setStartTime(convertToTime(filterData?.available_time?.from));
        setEndTime(convertToTime(filterData?.available_time?.to));

        setLanguages(filterData?.languages_known?.length ? filterData.languages_known.join(",") : null);
        setSubjects(filterData?.subjects?.length ? filterData.subjects.join(",") : null);
        setCountry(filterData?.country ? filterData?.country : null);

        onClose();
    };

    const handleClear = () => {
        setFilterData({});
    };

    return (
        <SideModal
            title="Resource Filters"
            onClose={onClose}
            isOpen={isOpen}
            saveButtonText="Apply Filters"
            cancelButtonText="Clear All"
            onSave={handleSave}
            isLoading={isFilterApplying}
            onCancel={handleClear}
        >
            <div className="flex flex-col px-5 mt-7">
                {ResourceFilterModalConstants.map((field: any) => (
                    <Input
                        key={field.name}
                        {...field}
                        onChange={(value: any) => handleChange(field.name as keyof FilterData, value)}
                        value={filterData[field.name as keyof FilterData]}
                    />
                ))}
            </div>
        </SideModal>
    );
}