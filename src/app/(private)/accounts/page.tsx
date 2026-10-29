"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, Modal, Popconfirm, Select, Table, Tag } from "antd";
import { GET_API, POST_API, PUT_API } from "@/api/request";
import { endpoints } from "@/api/constants";
import { useComponentStore } from "@/store/useComponenetStore";
import { usePathname } from "next/navigation";
import { getHeaderIcon } from "@/layouts/helper";
import { showToast } from "@/components/common/Toast";
import ErrorMsg from "@/components/common/Messages/ErrorMsg";
import { getApiErrorMessage } from "@/utils/apiError";
import { useStaff } from "@/hooks/useStaff";
import type { StaffRole } from "@/constants/access";
import AccessDialog from "@/components/accounts/AccessDialog";

interface Account {
  user_id: string;
  username: string;
  role: StaffRole;
  disabled: boolean;
  permissions: string[];
  custom_permissions: boolean;
}

const ROLE_OPTIONS: { label: string; value: StaffRole }[] = [
  { label: "Support", value: "support" },
  { label: "Admin", value: "admin" },
];
const ROLE_HELP: Record<StaffRole, string> = {
  admin: "Full access to the admin portal, including donations, notifications, skills and accounts.",
  support: "Volunteer and learner applications, careers applications and resumes, and profile changes.",
};
const MIN_PASSWORD = 12;
const MIN_USERNAME = 3;

// The sign-in/create routes answer some failures with { message } instead of { detail }.
const errorText = (err: any, fallback: string) =>
  getApiErrorMessage(err, "") || (typeof err?.data?.message === "string" ? err.data.message : "") || fallback;

const mutationError = (fallback: string) => (err: any) => showToast({ message: errorText(err, fallback), type: "error" });

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();
  const { data: me } = useStaff();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  // The role picked in the dialog (for the help text under it) and a role change awaiting
  // confirmation. A declarative Modal is used, not Modal.confirm: antd's static helpers throw on
  // this app's React version.
  const [newRole, setNewRole] = useState<StaffRole>("support");
  const [formKey, setFormKey] = useState(0);
  const [accessFor, setAccessFor] = useState<Account | null>(null);
  const [pendingRole, setPendingRole] = useState<{ account: Account; role: StaffRole } | null>(null);

  useEffect(() => {
    setHeaderOptions({ title: "Accounts", titleIcon: getHeaderIcon(pathname) });
  }, [setHeaderOptions, pathname]);

  const { data: accounts = [], isLoading, isError } = useQuery({
    queryKey: ["staff-accounts"],
    queryFn: async () => ((await GET_API(endpoints.accounts.list))?.data ?? []) as Account[],
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["staff-accounts"] });
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const createMutation = useMutation({
    mutationFn: (body: { username: string; password: string; role: StaffRole }) => POST_API(endpoints.accounts.create, body),
    onSuccess: (_res, vars) => {
      refresh();
      closeModal();
      showToast({ message: `Account "${vars.username}" created` });
    },
    onError: mutationError("Couldn't create the account. Please try again."),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: StaffRole }) => PUT_API(endpoints.accounts.role(id), { role }),
    onSuccess: () => {
      refresh();
      showToast({ message: "Role updated" });
    },
    onError: mutationError("Couldn't change the role. Please try again."),
  });

  const disableMutation = useMutation({
    mutationFn: ({ id, disabled }: { id: string; disabled: boolean }) => PUT_API(endpoints.accounts.disabled(id), { disabled }),
    onSuccess: (_res, vars) => {
      refresh();
      showToast({ message: vars.disabled ? "Account disabled" : "Account enabled" });
    },
    onError: mutationError("Couldn't update the account. Please try again."),
  });

  const columns = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      render: (name: string, a: Account) => (
        <span className="font-medium !normal-case">
          {name} {a.user_id === me?.user_id && <Tag className="ml-1">You</Tag>}
        </span>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (r: StaffRole, a: Account) => {
        const isMe = a.user_id === me?.user_id;
        return (
          <Select
            size="small"
            value={r}
            options={ROLE_OPTIONS}
            style={{ width: 120 }}
            aria-label={`Role for ${a.username}`}
            // Nobody can change their own role (the API refuses it too).
            disabled={isMe || (roleMutation.isPending && roleMutation.variables?.id === a.user_id)}
            onChange={(next) => {
              if (next === r) return;
              setPendingRole({ account: a, role: next });
            }}
          />
        );
      },
    },
    {
      title: "Access",
      key: "access",
      render: (_: unknown, a: Account) => {
        const isMe = a.user_id === me?.user_id;
        return (
          <div className="flex items-center gap-2">
            <Tag color={a.custom_permissions ? "blue" : "default"}>{a.custom_permissions ? "Custom" : "Role defaults"}</Tag>
            <span className="text-xs text-gray-600">{a.permissions.length} areas</span>
            <Button
              size="small"
              onClick={() => setAccessFor(a)}
              disabled={isMe}
              title={isMe ? "You can't change your own access" : undefined}
              aria-label={`Edit access for ${a.username}`}
            >
              Edit access
            </Button>
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "disabled",
      key: "disabled",
      render: (d: boolean) => <Tag color={d ? "red" : "green"}>{d ? "Disabled" : "Active"}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, a: Account) => {
        const isMe = a.user_id === me?.user_id;
        const busy = disableMutation.isPending && disableMutation.variables?.id === a.user_id;
        return a.disabled ? (
          <Button size="small" type="primary" loading={busy} onClick={() => disableMutation.mutate({ id: a.user_id, disabled: false })}>
            Enable
          </Button>
        ) : (
          <Popconfirm
            title={`Disable ${a.username}?`}
            description="They are signed out immediately and can't log in until you enable the account again."
            okText="Disable"
            okButtonProps={{ danger: true }}
            disabled={isMe}
            onConfirm={() => disableMutation.mutate({ id: a.user_id, disabled: true })}
          >
            <Button size="small" danger disabled={isMe} loading={busy} title={isMe ? "You can't disable your own account" : undefined}>
              Disable
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-semibold">Accounts</h2>
        <Button
          type="primary"
          onClick={() => {
            setNewRole("support");
            setFormKey((k) => k + 1);
            setIsModalOpen(true);
          }}
        >
          + Add account
        </Button>
      </div>
      <p className="text-gray-600 mb-6 max-w-3xl">
        People who can sign in to this portal. A role gives the starting access (<strong>Support</strong> works on applications;{" "}
        <strong>Admin</strong> can do everything), and <strong>Edit access</strong> switches individual areas on or off for one
        person. Changes apply on the person&apos;s next request.
      </p>

      {isError ? (
        <ErrorMsg />
      ) : (
        <Table
          dataSource={[...accounts].sort((a, b) => a.username.localeCompare(b.username))}
          columns={columns}
          rowKey="user_id"
          loading={isLoading}
          pagination={{ pageSize: 15, hideOnSinglePage: true }}
          locale={{ emptyText: "No accounts." }}
          scroll={{ x: "max-content" }}
        />
      )}

      <Modal
        title={pendingRole ? `Make ${pendingRole.account.username} ${pendingRole.role === "admin" ? "an admin" : "support"}?` : ""}
        open={!!pendingRole}
        okText="Change role"
        confirmLoading={roleMutation.isPending}
        onCancel={() => setPendingRole(null)}
        onOk={() => {
          if (!pendingRole) return;
          roleMutation.mutate({ id: pendingRole.account.user_id, role: pendingRole.role }, { onSettled: () => setPendingRole(null) });
        }}
      >
        {pendingRole && <p>{ROLE_HELP[pendingRole.role]}</p>}
      </Modal>

      <AccessDialog account={accessFor} onClose={() => setAccessFor(null)} />

      <Modal title="Add account" open={isModalOpen} onCancel={closeModal} footer={null} destroyOnClose>
        <Form
          key={formKey}
          form={form}
          layout="vertical"
          initialValues={{ role: "support" }}
          onValuesChange={(changed) => changed.role && setNewRole(changed.role)}
          onFinish={(v) => createMutation.mutate({ username: v.username.trim(), password: v.password, role: v.role })}
          requiredMark
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, whitespace: true, message: "Username is required" },
              { min: MIN_USERNAME, message: `Username must be at least ${MIN_USERNAME} characters` },
              { max: 64, message: "Username must be 64 characters or fewer" },
            ]}
          >
            <Input autoComplete="off" placeholder="e.g. jane.support" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            extra={`At least ${MIN_PASSWORD} characters. Share it with the person securely - it can't be viewed again.`}
            rules={[
              { required: true, message: "Password is required" },
              { min: MIN_PASSWORD, message: `Password must be at least ${MIN_PASSWORD} characters` },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="Confirm password"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm the password" },
              ({ getFieldValue }) => ({
                validator: (_, v) => (!v || getFieldValue("password") === v ? Promise.resolve() : Promise.reject(new Error("The passwords don't match"))),
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true, message: "Choose a role" }]} extra={ROLE_HELP[newRole]}>
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={createMutation.isPending} block>
            Create account
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
