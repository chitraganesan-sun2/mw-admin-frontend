"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Checkbox, Form, Input, Modal, Popconfirm, Switch, Table, Tag } from "antd";
import { DELETE_API, GET_API, POST_API, PUT_API } from "@/api/request";
import { endpoints } from "@/api/constants";
import { DeleteIcon } from "@/assets/icons";
import { useComponentStore } from "@/store/useComponenetStore";
import { usePathname } from "next/navigation";
import { getHeaderIcon } from "@/layouts/helper";
import { showToast } from "@/components/common/Toast";
import ErrorMsg from "@/components/common/Messages/ErrorMsg";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatDisplayDate } from "@/utils/moment";

interface Recipient {
  recipient_id: string;
  email: string;
  enabled: boolean;
  application_types: string[];
  events: string[];
  is_default: boolean;
}

interface LogRow {
  created_at: string;
  application_type: string;
  application_id: string;
  event: string;
  new_status?: string | null;
  outcome: string;
  recipient_count: number;
  sent_count: number;
  error?: string | null;
}

const TYPE_LABEL: Record<string, string> = { volunteer: "Volunteer applications", learner: "Learner applications" };
const EVENT_LABEL: Record<string, string> = {
  submitted: "New application",
  status_changed: "Status change",
  updated: "Application updated",
};
const OUTCOME_COLOR: Record<string, string> = {
  sent: "green",
  partial: "orange",
  failed: "red",
  no_recipients: "default",
  pending: "blue",
};
const OUTCOME_LABEL: Record<string, string> = {
  sent: "Sent",
  partial: "Partly sent",
  failed: "Failed",
  no_recipients: "No recipients",
  pending: "Sending",
};

const mutationError = (fallback: string) => (err: any) =>
  showToast({ message: getApiErrorMessage(err, fallback), type: "error" });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Recipient | null>(null);

  useEffect(() => {
    setHeaderOptions({ title: "Notifications", titleIcon: getHeaderIcon(pathname) });
  }, [setHeaderOptions, pathname]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["notification-recipients"],
    queryFn: async () => (await GET_API(endpoints.notificationRecipients.list))?.data as {
      recipients: Recipient[];
      application_types: string[];
      events: string[];
    },
  });
  const recipients = data?.recipients ?? [];
  const allTypes = data?.application_types ?? ["volunteer", "learner"];
  const allEvents = data?.events ?? ["submitted", "status_changed", "updated"];

  const { data: log = [], isLoading: logLoading } = useQuery({
    queryKey: ["notification-log"],
    queryFn: async () => ((await GET_API(endpoints.notificationRecipients.log(20)))?.data ?? []) as LogRow[],
    refetchInterval: 30 * 1000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["notification-recipients"] });
    queryClient.invalidateQueries({ queryKey: ["notification-log"] });
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const createMutation = useMutation({
    mutationFn: (body: any) => POST_API(endpoints.notificationRecipients.create, body),
    onSuccess: () => {
      refresh();
      closeModal();
      showToast({ message: "Recipient added" });
    },
    onError: mutationError("Couldn't add the recipient. Please try again."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => PUT_API(endpoints.notificationRecipients.update(id), body),
    onSuccess: () => {
      refresh();
      // A toggle from the table has no modal; only close when we came from the form.
      if (isModalOpen) closeModal();
      showToast({ message: "Recipient updated" });
    },
    onError: mutationError("Couldn't update the recipient. Please try again."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => DELETE_API(endpoints.notificationRecipients.delete(id)),
    onSuccess: () => {
      refresh();
      showToast({ message: "Recipient removed" });
    },
    onError: mutationError("Couldn't remove the recipient. Please try again."),
  });

  const openAdd = () => {
    setEditing(null);
    form.setFieldsValue({ email: "", enabled: true, application_types: allTypes, events: allEvents });
    setIsModalOpen(true);
  };
  const openEdit = (r: Recipient) => {
    setEditing(r);
    form.setFieldsValue({ email: r.email, enabled: r.enabled, application_types: r.application_types, events: r.events });
    setIsModalOpen(true);
  };

  const onSubmit = (values: any) => {
    const body = {
      email: values.email.trim(),
      enabled: values.enabled,
      application_types: values.application_types,
      events: values.events,
    };
    if (editing) updateMutation.mutate({ id: editing.recipient_id, body });
    else createMutation.mutate(body);
  };

  const columns = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email: string, r: Recipient) => (
        <span className="font-medium !normal-case">
          {email} {r.is_default && <Tag className="ml-1">Default</Tag>}
        </span>
      ),
    },
    {
      title: "Applications",
      dataIndex: "application_types",
      key: "types",
      render: (types: string[]) => types.map((t) => <Tag key={t}>{TYPE_LABEL[t] || t}</Tag>),
    },
    {
      title: "Events",
      dataIndex: "events",
      key: "events",
      render: (events: string[]) => events.map((e) => <Tag key={e}>{EVENT_LABEL[e] || e}</Tag>),
    },
    {
      title: "Enabled",
      dataIndex: "enabled",
      key: "enabled",
      render: (enabled: boolean, r: Recipient) => (
        <Switch
          checked={enabled}
          aria-label={`${enabled ? "Disable" : "Enable"} notifications for ${r.email}`}
          loading={updateMutation.isPending && updateMutation.variables?.id === r.recipient_id}
          onChange={(checked) => updateMutation.mutate({ id: r.recipient_id, body: { enabled: checked } })}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, r: Recipient) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => openEdit(r)}>
            Edit
          </Button>
          <Popconfirm
            title="Remove this recipient?"
            description={r.is_default ? "This is the default support address. You can add it back later." : undefined}
            onConfirm={() => deleteMutation.mutate(r.recipient_id)}
          >
            <Button size="small" danger aria-label={`Remove ${r.email}`}>
              <DeleteIcon />
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const logColumns = [
    { title: "When", dataIndex: "created_at", key: "when", render: (v: string) => (v ? formatDisplayDate(v) : "-") },
    { title: "Application", key: "app", render: (_: unknown, r: LogRow) => `${TYPE_LABEL[r.application_type]?.split(" ")[0] ?? r.application_type} · ${r.application_id.slice(0, 8)}` },
    { title: "Event", dataIndex: "event", key: "event", render: (e: string) => EVENT_LABEL[e] || e },
    {
      title: "Result",
      dataIndex: "outcome",
      key: "outcome",
      render: (o: string, r: LogRow) => (
        <span>
          <Tag color={OUTCOME_COLOR[o] || "default"}>{OUTCOME_LABEL[o] || o}</Tag>
          {o !== "no_recipients" && r.recipient_count > 0 && (
            <span className="text-gray-500 text-xs">
              {r.sent_count}/{r.recipient_count}
            </span>
          )}
        </span>
      ),
    },
    {
      title: "Detail",
      dataIndex: "error",
      key: "error",
      render: (e?: string | null) => (e ? <span className="text-xs text-red-700">{e}</span> : "-"),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-semibold">Email notifications</h2>
        <Button type="primary" onClick={openAdd}>
          + Add recipient
        </Button>
      </div>
      <p className="text-gray-600 mb-6 max-w-3xl">
        These addresses are emailed when a volunteer or learner application is submitted, changes status, or is
        updated. Changes apply to the next event - nothing needs to be deployed. The support address is the default
        recipient until you change it.
      </p>

      {isError ? (
        <ErrorMsg />
      ) : (
        <Table
          dataSource={recipients}
          columns={columns}
          rowKey="recipient_id"
          loading={isLoading}
          pagination={false}
          locale={{ emptyText: "No recipients. Nobody will be emailed about new applications until you add one." }}
          scroll={{ x: "max-content" }}
        />
      )}

      <h3 className="text-lg font-medium mt-10 mb-3">Recent notifications</h3>
      <Table
        dataSource={log}
        columns={logColumns}
        rowKey={(r: LogRow) => `${r.created_at}-${r.application_id}-${r.event}`}
        loading={logLoading}
        pagination={false}
        size="small"
        locale={{ emptyText: "Nothing has been sent yet." }}
        scroll={{ x: "max-content" }}
      />

      <Modal
        title={editing ? "Edit recipient" : "Add recipient"}
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark>
          <Form.Item
            name="email"
            label="Email address"
            rules={[
              { required: true, message: "Email address is required" },
              { max: 254, message: "That email address is too long" },
              { validator: (_, v) => (!v || EMAIL_RE.test(String(v).trim()) ? Promise.resolve() : Promise.reject(new Error("Enter a valid email address"))) },
            ]}
          >
            <Input type="email" placeholder="name@example.org" autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="application_types"
            label="Applications"
            rules={[{ required: true, type: "array", min: 1, message: "Choose at least one" }]}
          >
            <Checkbox.Group options={allTypes.map((t) => ({ label: TYPE_LABEL[t] || t, value: t }))} />
          </Form.Item>
          <Form.Item name="events" label="Events" rules={[{ required: true, type: "array", min: 1, message: "Choose at least one" }]}>
            <Checkbox.Group options={allEvents.map((e) => ({ label: EVENT_LABEL[e] || e, value: e }))} />
          </Form.Item>
          <Form.Item name="enabled" label="Enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending} block>
            {editing ? "Save changes" : "Add recipient"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
