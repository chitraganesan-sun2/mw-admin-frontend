"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, Modal, Popconfirm, Select, Table, Tag } from "antd";
import { DELETE_API, GET_API, POST_API, PUT_API } from "@/api/request";
import { endpoints } from "@/api/constants";
import { DeleteIcon } from "@/assets/icons";
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
    form.resetFields();
  };

  const createMutation = useMutation({
    mutationFn: (body: any) => POST_API(endpoints.skills.create, body),
    onSuccess: () => {
      refresh();
      closeModal();
      showToast({ message: "Skill added" });
    },
    onError: mutationError("Couldn't add the skill. Please try again."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any; message: string }) => PUT_API(endpoints.skills.update(id), body),
    onSuccess: (_res, vars) => {
      refresh();
      closeModal();
      showToast({ message: vars.message });
    },
    onError: mutationError("Couldn't update the skill. Please try again."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => DELETE_API(endpoints.skills.delete(id)),
    onSuccess: () => {
      refresh();
      showToast({ message: "Skill removed" });
    },
    onError: mutationError("Couldn't remove the skill. Please try again."),
  });

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setIsModalOpen(true);
  };
  const openEdit = (row: SkillRow) => {
    setEditing(row);
    form.setFieldsValue({ name: row.skill_name, category: row.category ?? undefined });
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
    { title: "Skill", dataIndex: "skill_name", key: "name", render: (n: string) => <span className="font-medium">{n}</span> },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (c: string | null) =>
        c ? <Tag color={c === "academic" ? "blue" : "purple"}>{CATEGORY_LABEL[c] || c}</Tag> : <Tag>Uncategorized</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: string) => <Tag color={STATUS_META[s]?.color}>{STATUS_META[s]?.label || s}</Tag>,
    },
    { title: "Added by", dataIndex: "source", key: "source", render: (s: string) => SOURCE_LABEL[s] || s },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (v: string | null) => (v ? formatDisplayDate(v) : "-"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, row: SkillRow) => (
        <div className="flex flex-wrap gap-2">
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
            <Button size="small" danger aria-label={`Remove ${row.skill_name}`}>
              <DeleteIcon />
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const hasFilters = Boolean(debouncedSearch || category || status || source);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Input.Search
          allowClear
          placeholder="Search skills"
          aria-label="Search skills"
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
        <Button onClick={() => refetch()} loading={isFetching && !isLoading}>
          Refresh
        </Button>
        <div className="ml-auto">
          <Button type="primary" onClick={openAdd}>
            + Add Skill
          </Button>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3">
        Skills people type into forms are saved here automatically as <strong>Pending review</strong> and stay hidden
        from everyone else until you approve them. This list refreshes by itself.
      </p>

      {isError ? (
        <ErrorMsg />
      ) : (
        <Table
          dataSource={items}
          columns={columns}
          rowKey="skill_id"
          loading={isLoading}
          pagination={{ pageSize: 15, hideOnSinglePage: true }}
          locale={{ emptyText: hasFilters ? "No skills match these filters." : "No skills yet." }}
          scroll={{ x: "max-content" }}
        />
      )}

      <Modal title={editing ? "Edit skill" : "Add skill"} open={isModalOpen} onCancel={closeModal} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={onSubmit}>
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
