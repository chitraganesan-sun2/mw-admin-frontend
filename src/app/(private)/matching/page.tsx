"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GET_API, POST_API } from "@/api/request";
import { endpoints } from "@/api/constants";
import { Button, Select, Table, Tag } from "antd";
import { useComponentStore } from "@/store/useComponenetStore";
import { usePathname } from "next/navigation";
import { getHeaderIcon } from "@/layouts/helper";
import { showToast } from "@/components/common/Toast";

type TriggerSide = "learner" | "volunteer";

export default function MatchingPage() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [side, setSide] = useState<TriggerSide>("learner");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setHeaderOptions({
      title: "Matching",
      titleIcon: getHeaderIcon(pathname),
    });
  }, [setHeaderOptions, pathname]);

  const { data: learnerOptions = [] } = useQuery({
    queryKey: ["matching-learners-picker"],
    queryFn: async () => {
      const res: any = await GET_API(
        `${endpoints.learner.getAllLearners}?page=1&size=100&onboarded_status=verification_completed`
      );
      return (res?.data?.items || [])
        .filter((l: any) => l.onboarded_status === "verification_completed")
        .map((l: any) => ({
          value: l.learner_id,
          label: l.learner_full_name || l.learner_id,
        }));
    },
  });

  const { data: volunteerOptions = [] } = useQuery({
    queryKey: ["matching-volunteers-picker"],
    queryFn: async () => {
      const res: any = await GET_API(
        `${endpoints.volunteer.getAllVolunteers}?page=1&size=100&onboarded_status=verification_completed`
      );
      return (res?.data?.items || [])
        .filter((v: any) => v.onboarded_status === "verification_completed")
        .map((v: any) => ({
          value: v.volunteer_id,
          label:
            v.volunteer_first_name && v.volunteer_last_name
              ? `${v.volunteer_first_name} ${v.volunteer_last_name}`
              : v.volunteer_id,
        }));
    },
  });

  const {
    data: matches = [],
    isLoading: isMatchesLoading,
  } = useQuery({
    queryKey: ["matches"],
    queryFn: async () => (await GET_API(endpoints.match.getAll))?.data?.items || [],
  });

  const triggerMutation = useMutation({
    mutationFn: (payload: { learner_id?: string; volunteer_id?: string }) =>
      POST_API(endpoints.match.trigger, payload),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      setSelectedId(null);
      if (res?.data?.status === "no_match_found") {
        showToast({ type: "info", message: "No eligible candidate found for this match." });
      } else {
        showToast({ type: "success", message: "Match triggered successfully." });
      }
    },
    onError: () => {
      showToast({ type: "error", message: "Failed to trigger match." });
    },
  });

  const handleTrigger = () => {
    if (!selectedId) return;
    triggerMutation.mutate(
      side === "learner" ? { learner_id: selectedId } : { volunteer_id: selectedId }
    );
  };

  const columns = [
    {
      title: "Learner ID",
      dataIndex: "learner_id",
      key: "learner_id",
      render: (id: string | null) => id || "—",
    },
    {
      title: "Volunteer ID",
      dataIndex: "volunteer_id",
      key: "volunteer_id",
      render: (id: string | null) => id || "—",
    },
    {
      title: "Analytical",
      dataIndex: "analytical_score",
      key: "analytical_score",
      render: (v: number) => v?.toFixed(1),
    },
    {
      title: "Compatibility",
      dataIndex: "compatibility_score",
      key: "compatibility_score",
      render: (v: number) => v?.toFixed(2),
    },
    {
      title: "Combined",
      dataIndex: "combined_score",
      key: "combined_score",
      render: (v: number) => v?.toFixed(1),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "notified" ? "green" : "orange"}>
          {status === "notified" ? "Matched" : "No Match Found"}
        </Tag>
      ),
    },
    {
      title: "Session Status",
      dataIndex: "session_status",
      key: "session_status",
      render: (sessionStatus: string | null) => {
        if (!sessionStatus) {
          return <Tag color="default">No Session Yet</Tag>;
        }
        const colorByStatus: Record<string, string> = {
          accepted: "green",
          completed: "blue",
          pending: "gold",
          rejected: "red",
          cancelled: "red",
        };
        return (
          <Tag color={colorByStatus[sessionStatus] || "default"}>
            {sessionStatus.charAt(0).toUpperCase() + sessionStatus.slice(1)}
          </Tag>
        );
      },
    },
    {
      title: "Triggered By",
      dataIndex: "triggered_by",
      key: "triggered_by",
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (v: string) => new Date(v).toLocaleString(),
    },
  ];

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl p-6 mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Match on behalf of</label>
          <Select
            value={side}
            onChange={(v) => {
              setSide(v);
              setSelectedId(null);
            }}
            style={{ width: 160 }}
            options={[
              { value: "learner", label: "A Learner" },
              { value: "volunteer", label: "A Volunteer" },
            ]}
          />
        </div>
        <div className="flex-1 min-w-[240px]">
          <label className="block text-sm font-medium mb-1">
            {side === "learner" ? "Select Learner" : "Select Volunteer"}
          </label>
          <Select
            showSearch
            allowClear
            value={selectedId}
            onChange={setSelectedId}
            style={{ width: "100%" }}
            placeholder={side === "learner" ? "Search learners..." : "Search volunteers..."}
            options={side === "learner" ? learnerOptions : volunteerOptions}
            filterOption={(input, option) =>
              (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
            }
          />
        </div>
        <Button
          type="primary"
          disabled={!selectedId}
          loading={triggerMutation.isPending}
          onClick={handleTrigger}
        >
          Trigger Match
        </Button>
      </div>

      <Table
        dataSource={matches}
        columns={columns}
        rowKey="match_id"
        loading={isMatchesLoading}
        pagination={{ pageSize: 15 }}
      />
    </div>
  );
}
