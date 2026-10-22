"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Modal, Switch, Tag } from "antd";
import { GET_API, PUT_API } from "@/api/request";
import { endpoints } from "@/api/constants";
import { showToast } from "@/components/common/Toast";
import { getApiErrorMessage } from "@/utils/apiError";
import type { StaffRole } from "@/constants/access";

export interface AccessAccount {
  user_id: string;
  username: string;
  role: StaffRole;
  permissions: string[];
  custom_permissions: boolean;
}

interface Catalog {
  permissions: { key: string; label: string; description: string }[];
  role_defaults: Record<StaffRole, string[]>;
}

/** The part that is mounted per open (so its switches always start from the account's saved access). */
function AccessForm({ account, onClose }: { account: AccessAccount; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set(account.permissions));

  const { data: catalog, isLoading, isError } = useQuery({
    queryKey: ["permission-catalog"],
    queryFn: async () => (await GET_API(endpoints.accounts.catalog))?.data as Catalog,
    staleTime: 10 * 60 * 1000,
  });

  const save = useMutation({
    mutationFn: (permissions: string[] | null) => PUT_API(endpoints.accounts.permissions(account.user_id), { permissions }),
    onSuccess: (_res, permissions) => {
      queryClient.invalidateQueries({ queryKey: ["staff-accounts"] });
      showToast({ message: permissions === null ? "Access reset to the role defaults" : "Access updated" });
      onClose();
    },
    onError: (err: any) => showToast({ message: getApiErrorMessage(err, "Couldn't update access. Please try again."), type: "error" }),
  });

  const defaults = new Set(catalog?.role_defaults?.[account.role] ?? []);
  const toggle = (key: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  const ordered = (catalog?.permissions ?? []).map((p) => p.key).filter((k) => selected.has(k));
  const matchesDefaults = ordered.length === defaults.size && ordered.every((k) => defaults.has(k));

  return (
    <>
      <p className="text-sm text-gray-600 mb-3">
        Choose which parts of the portal <strong>{account.username}</strong> can open and use. Changes apply on their next
        request. {account.role === "admin" ? "Admins always keep account management." : "Account management is only available to admins."}
      </p>
      {isError ? (
        <p className="text-red-700">Couldn&apos;t load the list of access options. Close this and try again.</p>
      ) : isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <ul className="max-h-[50vh] overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-lg" aria-label="Access">
          {catalog?.permissions.map((p) => (
            <li key={p.key} className="flex items-start justify-between gap-4 p-3">
              <div className="min-w-0">
                <p className="font-medium text-[#121212]">
                  {p.label}
                  {defaults.has(p.key) && (
                    <Tag className="ml-2" bordered={false}>
                      {account.role} default
                    </Tag>
                  )}
                </p>
                <p className="text-xs text-gray-600">{p.description}</p>
              </div>
              <Switch
                checked={selected.has(p.key)}
                onChange={(on) => toggle(p.key, on)}
                aria-label={`${p.label} for ${account.username}`}
              />
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Button
          onClick={() => save.mutate(null)}
          disabled={!account.custom_permissions || save.isPending}
          title={account.custom_permissions ? undefined : "Already using the role defaults"}
        >
          Reset to {account.role} defaults
        </Button>
        <div className="flex gap-2">
          <Button onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button
            type="primary"
            loading={save.isPending}
            disabled={isLoading || isError}
            onClick={() => save.mutate(matchesDefaults && !account.custom_permissions ? null : ordered)}
          >
            Save access
          </Button>
        </div>
      </div>
    </>
  );
}

export default function AccessDialog({ account, onClose }: { account: AccessAccount | null; onClose: () => void }) {
  return (
    <Modal
      title={account ? `Access for ${account.username}` : "Access"}
      open={!!account}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={600}
    >
      {account && <AccessForm key={account.user_id} account={account} onClose={onClose} />}
    </Modal>
  );
}
