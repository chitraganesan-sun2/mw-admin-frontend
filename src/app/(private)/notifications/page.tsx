"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useGuardedMutation } from "@/hooks/useGuardedMutation";
import { Button, Checkbox, Form, Input, Modal, Popconfirm, Popover, Switch } from "antd";
import Table from "@/components/Table";
import StatusTag from "@/components/common/StatusTag";
import DeleteButton from "@/components/common/DeleteButton";
import PageHeader from "@/components/common/PageHeader";
import { DELETE_API, GET_API, POST_API, PUT_API } from "@/api/request";
import { endpoints } from "@/api/constants";
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
  alert_types: string[];
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

const TYPE_LABEL: Record<string, string> = { volunteer: "Volunteer Applications", learner: "Learner Applications" };
const EVENT_LABEL: Record<string, string> = {
  submitted: "New application",
  status_changed: "Status change",
  updated: "Application updated",
};
const ALERT_LABEL: Record<string, string> = {
  ai_red_alert: "AI Red alert",
  message_red_alert: "Inappropriate message alert",
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
  const [formInitial, setFormInitial] = useState<Record<string, any>>({});
  const [formKey, setFormKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Recipient | null>(null);

  useEffect(() => {
    setHeaderOptions({ title: "Notifications", titleIcon: getHeaderIcon(pathname) });
  }, [setHeaderOptions, pathname]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["notification-recipients"],
    queryFn: async () => (await GET_API(endpoints.notificationRecipients.list))?.data as {
      recipients: Recipient[];
      application_types: string[];
      events: string[];
      alert_types: string[];
    },
  });
  const recipients = data?.recipients ?? [];
  const allTypes = data?.application_types ?? ["volunteer", "learner"];
  const allEvents = data?.events ?? ["submitted", "status_changed", "updated"];
  const allAlerts = data?.alert_types ?? ["ai_red_alert", "message_red_alert"];

  const { data: log = [], isLoading: logLoading, isError: logError, refetch: refetchLog, isFetching: logFetching } = useQuery({
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
  };

  const createMutation = useGuardedMutation({
    mutationFn: (body: any) => POST_API(endpoints.notificationRecipients.create, body),
    onSuccess: () => {
      refresh();
      closeModal();
      showToast({ message: "Recipient added" });
    },
    onError: mutationError("Couldn't add the recipient. Please try again."),
  });

  const updateMutation = useGuardedMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => PUT_API(endpoints.notificationRecipients.update(id), body),
    onSuccess: () => {
      refresh();
      // A toggle from the table has no modal; only close when we came from the form.
      if (isModalOpen) closeModal();
      showToast({ message: "Recipient updated" });
    },
    onError: mutationError("Couldn't update the recipient. Please try again."),
  });

  const deleteMutation = useGuardedMutation({
    mutationFn: (id: string) => DELETE_API(endpoints.notificationRecipients.delete(id)),
    onSuccess: () => {
      refresh();
      showToast({ message: "Recipient removed" });
    },
    onError: mutationError("Couldn't remove the recipient. Please try again."),
  });

  const openAdd = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
    setFormInitial({ email: "", enabled: true, application_types: allTypes, events: allEvents, alert_types: [] });
    setIsModalOpen(true);
  };
  const openEdit = (r: Recipient) => {
    setEditing(r);
    setFormKey((k) => k + 1);
    setFormInitial({ email: r.email, enabled: r.enabled, application_types: r.application_types, events: r.events, alert_types: r.alert_types ?? [] });
    setIsModalOpen(true);
  };

  const onSubmit = (values: any) => {
    const body = {
      email: values.email.trim(),
      enabled: values.enabled,
      application_types: values.application_types,
      events: values.events,
      alert_types: values.alert_types ?? [],
    };
    if (editing) updateMutation.mutate({ id: editing.recipient_id, body });
    else createMutation.mutate(body);
  };

  // Applications + Events + Red alerts used to be three wide tag columns that pushed Edit/Remove off-screen; they are
  // one "Sends for" column now (tags wrap), so the table fits and the actions stay visible.
  const columns = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 270,
      render: (email: string, r: Recipient) => (
        <span className="flex items-center gap-2 font-medium !normal-case">
          <span className="truncate" title={email}>
            {email}
          </span>
          {r.is_default && <StatusTag>Default</StatusTag>}
        </span>
      ),
    },
    {
      title: "Sends for",
      key: "sends_for",
      width: 420,
      render: (_: unknown, r: Recipient) => {
        const types = r.application_types ?? [];
        const alerts = r.alert_types ?? [];
        if (!types.length && !alerts.length) return "-";
        return (
          <div className="flex flex-wrap gap-1.5">
            {types.map((t) => (
              <StatusTag key={`t-${t}`}>{TYPE_LABEL[t] || t}</StatusTag>
            ))}
            {types.length
              ? (r.events ?? []).map((e) => (
                  <StatusTag key={`e-${e}`} tone="info">
                    {EVENT_LABEL[e] || e}
                  </StatusTag>
                ))
              : null}
            {alerts.map((a) => (
              <StatusTag key={`a-${a}`} tone="danger">
                {ALERT_LABEL[a] || a}
              </StatusTag>
            ))}
          </div>
        );
      },
    },
    {
      title: "Enabled",
      dataIndex: "enabled",
      key: "enabled",
      width: 100,
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
      width: 130,
      fixed: "right" as const,
      render: (_: unknown, r: Recipient) => (
        <div className="flex items-center gap-2">
          <Button size="small" onClick={() => openEdit(r)}>
            Edit
          </Button>
          <Popconfirm
            title="Remove this recipient?"
            description={r.is_default ? "This is the default support address. You can add it back later." : undefined}
            onConfirm={() => deleteMutation.mutate(r.recipient_id)}
          >
            <DeleteButton label={`Remove ${r.email}`} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const logColumns = [
    { title: "When", dataIndex: "created_at", key: "when", width: 130, className: "whitespace-nowrap", render: (v: string) => (v ? formatDisplayDate(v) : "-") },
    { title: "Application", key: "app", width: 180, render: (_: unknown, r: LogRow) => `${TYPE_LABEL[r.application_type]?.split(" ")[0] ?? r.application_type} · ${r.application_id.slice(0, 8)}` },
    { title: "Event", dataIndex: "event", key: "event", width: 180, render: (e: string) => EVENT_LABEL[e] || e },
    {
      title: "Result",
      dataIndex: "outcome",
      key: "outcome",
      width: 190,
      render: (o: string, r: LogRow) => (
        <span className="flex items-center gap-2">
          <StatusTag dot color={OUTCOME_COLOR[o]}>
            {OUTCOME_LABEL[o] || o}
          </StatusTag>
          {o !== "no_recipients" && r.recipient_count > 0 && (
            <span className="text-ink-2 text-xs">
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
      width: 300,
      render: (e?: string | null) => (e ? <span className="text-xs text-error">{e}</span> : "-"),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        className="mb-6"
        description={
          <>
            These addresses are emailed about volunteer and learner applications and the red alerts you tick for them.{" "}
            <Popover
              trigger="click"
              placement="bottomLeft"
              title="How alerts work"
              content={
                <p className="m-0 max-w-sm text-sm text-ink-2">
                  Addresses are emailed when a volunteer or learner application is submitted, changes status, or is
                  updated, and for the red alerts they tick: an AI Red alert (a session the safety analysis flags) or an
                  Inappropriate message alert (a chat message that trips the safety rules). Changes apply to the next
                  event - nothing needs to be deployed. The support address is the default recipient until you change
                  it.
                </p>
              }
            >
              <button type="button" className="cursor-pointer border-0 bg-transparent p-0 font-medium text-brand-ink underline">
                How alerts work
              </button>
            </Popover>
          </>
        }
        actions={
          <Button type="primary" onClick={openAdd}>
            + Add recipient
          </Button>
        }
      />
      <h2 className="sr-only">Email Notifications</h2>

      {isError ? (
        <ErrorMsg message="Couldn't load the recipients." onRetry={() => refetch()} retrying={isFetching} />
      ) : (
        <Table
          data={recipients}
          columns={columns}
          rowKey="recipient_id"
          loading={isLoading}
          pagination={false}
          emptyText="No recipients. Nobody will be emailed about new applications until you add one."
        />
      )}

      <h3 className="mt-10 mb-3 text-xl font-semibold text-ink">Recent Notifications</h3>
      {logError ? (
        <ErrorMsg compact message="Couldn't load the recent notifications. This is not the same as nothing having been sent." onRetry={() => refetchLog()} retrying={logFetching} />
      ) : (
        <Table
          data={log}
          columns={logColumns}
          rowKey={(r: LogRow) => `${r.created_at}-${r.application_id}-${r.event}`}
          loading={logLoading}
          pagination={false}
          emptyText="Nothing has been sent yet."
        />
      )}

      <Modal
        title={editing ? "Edit recipient" : "Add recipient"}
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
      >
        <Form key={formKey} form={form} layout="vertical" onFinish={onSubmit} initialValues={formInitial} requiredMark>
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
            dependencies={["alert_types"]}
            rules={[
              ({ getFieldValue }) => ({
                validator: (_, v) =>
                  (v && v.length) || (getFieldValue("alert_types") || []).length
                    ? Promise.resolve()
                    : Promise.reject(new Error("Choose at least one application type or red alert")),
              }),
            ]}
          >
            <Checkbox.Group options={allTypes.map((t) => ({ label: TYPE_LABEL[t] || t, value: t }))} />
          </Form.Item>
          <Form.Item name="events" label="Events" rules={[{ required: true, type: "array", min: 1, message: "Choose at least one" }]}>
            <Checkbox.Group options={allEvents.map((e) => ({ label: EVENT_LABEL[e] || e, value: e }))} />
          </Form.Item>
          <Form.Item name="alert_types" label="Red alerts">
            <Checkbox.Group options={allAlerts.map((a) => ({ label: ALERT_LABEL[a] || a, value: a }))} />
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
