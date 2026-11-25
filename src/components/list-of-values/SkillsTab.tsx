"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useGuardedMutation } from "@/hooks/useGuardedMutation";
import { Button, Form, Input, Modal, Popconfirm, Select } from "antd";
import { FiSearch } from "react-icons/fi";
import Table from "@/components/Table";
import RefreshButton from "@/components/common/Filters/RefreshButton";
import StatusTag from "@/components/common/StatusTag";
import DeleteButton from "@/components/common/DeleteButton";
import { DELETE_API, GET_API, POST_API, PUT_API } from "@/api/request";
import { endpoints } from "@/api/constants";
import { showToast } from "@/components/common/Toast";
import ErrorMsg from "@/components/common/Messages/ErrorMsg";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatDisplayDate } from "@/utils/moment";

export interface SkillRow {
  skill_id: string;
  skill_name: string;
  category: "academic" | "non_academic" | null;
  status: "active" | "pending" | "disabled";
  source: "admin" | "user";
  created_at: string | null;
}

const CATEGORY_LABEL: Record<string, string> = { academic: "Academic", non_academic: "Non-Academic" };
const STATUS_META: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "green" },
  pending: { label: "Pending review", color: "gold" },
  disabled: { label: "Disabled", color: "red" },
};
const SOURCE_LABEL: Record<string, string> = { admin: "Admin", user: "User-submitted" };

// New skills arrive whenever someone types one into a form, so keep the tab fresh without a manual
// reload: poll, and refetch when the window regains focus.
const REFRESH_MS = 30 * 1000;

const mutationError = (fallback: string) => (err: any) =>
  showToast({ message: getApiErrorMessage(err, fallback), type: "error" });

/** How many user-submitted skills are waiting for review (shown on the tab label). */
export function usePendingSkillsCount() {
  const { data } = useQuery({
    queryKey: ["skills-catalog", "pending-count"],
    queryFn: async () => (await GET_API(endpoints.skills.list("status=pending")))?.data?.pending_count as number,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
  });
  return data ?? 0;
}

export default function SkillsTab() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [formInitial, setFormInitial] = useState<Record<string, any>>({});
  const [formKey, setFormKey] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [source, setSource] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<SkillRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const params = new URLSearchParams();
  if (debouncedSearch) params.set("search", debouncedSearch);
  if (category) params.set("category", category);
  if (status) params.set("status", status);
  if (source) params.set("source", source);
  const query = params.toString();

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["skills-catalog", "list", query],
    queryFn: async () => (await GET_API(endpoints.skills.list(query)))?.data as { items: SkillRow[]; total: number },
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
  });
  const items = data?.items ?? [];

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["skills-catalog"] });
  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
  };

  const createMutation = useGuardedMutation({
    mutationFn: (body: any) => POST_API(endpoints.skills.create, body),
    onSuccess: () => {
      refresh();
      closeModal();
      showToast({ message: "Skill added" });
    },
    onError: mutationError("Couldn't add the skill. Please try again."),
  });

  const updateMutation = useGuardedMutation({
    mutationFn: ({ id, body }: { id: string; body: any; message: string }) => PUT_API(endpoints.skills.update(id), body),
    onSuccess: (_res, vars) => {
      refresh();
      closeModal();
      showToast({ message: vars.message });
    },
    onError: mutationError("Couldn't update the skill. Please try again."),
  });

  const deleteMutation = useGuardedMutation({
    mutationFn: (id: string) => DELETE_API(endpoints.skills.delete(id)),
    onSuccess: () => {
      refresh();
      showToast({ message: "Skill removed" });
    },
    onError: mutationError("Couldn't remove the skill. Please try again."),
  });

  const openAdd = () => {
    setEditing(null);
    setFormInitial({});
    setFormKey((k) => k + 1);
    setIsModalOpen(true);
  };
  const openEdit = (row: SkillRow) => {
    setEditing(row);
    setFormKey((k) => k + 1);
    setFormInitial({ name: row.skill_name, category: row.category ?? undefined });
    setIsModalOpen(true);
  };

  const onSubmit = (values: { name: string; category?: string }) => {
    if (editing) {
      updateMutation.mutate({
        id: editing.skill_id,
        body: { name: values.name, category: values.category ?? null },
        message: "Skill updated",
      });
    } else {
      createMutation.mutate({ name: values.name, category: values.category ?? null });
    }
  };

  const columns = [
    { title: "Skill", dataIndex: "skill_name", key: "name", width: 220, ellipsis: true, render: (n: string) => <span className="font-medium">{n}</span> },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 160,
      render: (c: string | null) =>
        c ? <StatusTag tone="neutral">{CATEGORY_LABEL[c] || c}</StatusTag> : <StatusTag tone="neutral">Uncategorized</StatusTag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 170,
      render: (s: string) => (
        <StatusTag dot color={STATUS_META[s]?.color}>
          {STATUS_META[s]?.label || s}
        </StatusTag>
      ),
    },
    { title: "Added By", dataIndex: "source", key: "source", width: 130, render: (s: string) => SOURCE_LABEL[s] || s },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      width: 130,
      className: "whitespace-nowrap",
      render: (v: string | null) => (v ? formatDisplayDate(v) : "-"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 260,
      fixed: "right" as const,
      render: (_: unknown, row: SkillRow) => (
        <div className="flex items-center gap-2">
          <Button size="small" onClick={() => openEdit(row)}>
            Edit
          </Button>
          {row.status === "active" ? (
            <Button
              size="small"
              loading={updateMutation.isPending && updateMutation.variables?.id === row.skill_id}
              onClick={() => updateMutation.mutate({ id: row.skill_id, body: { enabled: false }, message: "Skill disabled" })}
            >
              Disable
            </Button>
          ) : (
            <Button
              size="small"
              type="primary"
              loading={updateMutation.isPending && updateMutation.variables?.id === row.skill_id}
              onClick={() => updateMutation.mutate({ id: row.skill_id, body: { enabled: true }, message: "Skill enabled" })}
            >
              {row.status === "pending" ? "Approve" : "Enable"}
            </Button>
          )}
          <Popconfirm
            title="Remove this skill?"
            description="It disappears from every list. People who already picked it keep it on their profile and sessions. Disabling instead hides it from new choices only."
            okText="Remove"
            onConfirm={() => deleteMutation.mutate(row.skill_id)}
          >
            <DeleteButton label={`Remove ${row.skill_name}`} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const hasFilters = Boolean(debouncedSearch || category || status || source);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <Input
          allowClear
          placeholder="Search skills"
          aria-label="Search skills"
          prefix={<FiSearch className="text-ink-3" aria-hidden />}
          className="max-w-[240px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          allowClear
          placeholder="Category"
          aria-label="Filter by category"
          className="min-w-[150px]"
          value={category}
          onChange={setCategory}
          options={[
            { label: "Academic", value: "academic" },
            { label: "Non-Academic", value: "non_academic" },
            { label: "Uncategorized", value: "uncategorized" },
          ]}
        />
        <Select
          allowClear
          placeholder="Status"
          aria-label="Filter by status"
          className="min-w-[150px]"
          value={status}
          onChange={setStatus}
          options={[
            { label: "Active", value: "active" },
            { label: "Pending review", value: "pending" },
            { label: "Disabled", value: "disabled" },
          ]}
        />
        <Select
          allowClear
          placeholder="Added by"
          aria-label="Filter by who added it"
          className="min-w-[150px]"
          value={source}
          onChange={setSource}
          options={[
            { label: "User-submitted", value: "user" },
            { label: "Admin", value: "admin" },
          ]}
        />
        <RefreshButton onClick={() => refetch()} loading={isFetching && !isLoading} />
        <div className="ml-auto">
          <Button type="primary" onClick={openAdd}>
            + Add Skill
          </Button>
        </div>
      </div>
      <p className="text-sm text-ink-2 mb-4 max-w-2xl">
        Skills people type into forms are saved here automatically as <strong>Pending review</strong> and stay hidden
        from everyone else until you approve them. This list refreshes by itself.
      </p>

      {isError ? (
        <ErrorMsg message="Couldn't load the skills." onRetry={() => refetch()} retrying={isFetching} />
      ) : (
        <Table
          data={items}
          columns={columns}
          rowKey="skill_id"
          loading={isLoading}
          pagination={{ pageSize: 15, hideOnSinglePage: true }}
          emptyText={hasFilters ? "No skills match these filters." : "No skills yet."}
        />
      )}

      <Modal title={editing ? "Edit skill" : "Add skill"} open={isModalOpen} onCancel={closeModal} footer={null} destroyOnClose>
        <Form key={formKey} form={form} layout="vertical" onFinish={onSubmit} initialValues={formInitial}>
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, whitespace: true, message: "Name is required" },
              { max: 80, message: "Name must be 80 characters or fewer" },
            ]}
          >
            <Input placeholder="e.g. Mathematics" maxLength={80} />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Select
              allowClear
              placeholder="Select category"
              options={[
                { label: "Academic", value: "academic" },
                { label: "Non-Academic", value: "non_academic" },
              ]}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending} block>
            {editing ? "Save changes" : "Add skill"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
