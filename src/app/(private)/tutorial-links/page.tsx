"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useGuardedMutation } from "@/hooks/useGuardedMutation";
import { GET_API, POST_API, PUT_API, DELETE_API } from "@/api/request";
import { endpoints } from "@/api/constants";
import { Button, Input, Select, Modal, Form, Popconfirm } from "antd";
import { FiExternalLink } from "react-icons/fi";
import Table from "@/components/Table";
import StatusTag from "@/components/common/StatusTag";
import DeleteButton from "@/components/common/DeleteButton";
import PageHeader from "@/components/common/PageHeader";
import { useComponentStore } from "@/store/useComponenetStore";
import { usePathname } from "next/navigation";
import { getHeaderIcon } from "@/layouts/helper";
import { showToast } from "@/components/common/Toast";
import { isHttpUrl, safeHref } from "@/utils/safeHref";
import ErrorMsg from "@/components/common/Messages/ErrorMsg";
import { getApiErrorMessage } from "@/utils/apiError";

const mutationError = (fallback: string) => (err: any) =>
  showToast({ message: getApiErrorMessage(err, fallback), type: "error" });

interface TutorialLink {
  link_id: string;
  title: string;
  url: string;
  category: string;
  description?: string;
}

// learner_demo / volunteer_demo drive the tutorial-video link on the learner/volunteer
// approval emails (controllers/v1/tutorial_links.py: get_demo_link on the backend) -
// video/doc/guide remain the general-purpose dashboard tutorial list.
const CATEGORY_LABELS: Record<string, string> = {
  video: "Video",
  doc: "Document",
  guide: "Guide",
  learner_demo: "Learner Demo Video",
  volunteer_demo: "Volunteer Demo Video",
};

export default function TutorialLinksPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();

  useEffect(() => {
    setHeaderOptions({
      title: "Tutorial Links",
      titleIcon: getHeaderIcon(pathname),
    });
  }, [setHeaderOptions, pathname]);
  const [editingLink, setEditingLink] = useState<TutorialLink | null>(null);
  const [form] = Form.useForm();

  const { data: links = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["tutorial-links"],
    queryFn: async () => (await GET_API(endpoints.tutorialLinks.getAll))?.data || [],
  });

  const createMutation = useGuardedMutation({
    mutationFn: (data: any) => POST_API(endpoints.tutorialLinks.create, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutorial-links"] });
      setIsModalOpen(false);
      form.resetFields();
      showToast({ message: "Tutorial link created" });
    },
    onError: mutationError("Couldn't create the tutorial link. Please try again."),
  });

  const updateMutation = useGuardedMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      PUT_API(endpoints.tutorialLinks.update(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutorial-links"] });
      setIsModalOpen(false);
      setEditingLink(null);
      form.resetFields();
      showToast({ message: "Tutorial link updated" });
    },
    onError: mutationError("Couldn't update the tutorial link. Please try again."),
  });

  const deleteMutation = useGuardedMutation({
    mutationFn: (id: string) => DELETE_API(endpoints.tutorialLinks.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutorial-links"] });
      showToast({ message: "Tutorial link deleted" });
    },
    onError: mutationError("Couldn't delete the tutorial link. Please try again."),
  });

  const handleSubmit = (rawValues: any) => {
    const trimmed = (v: unknown) => (typeof v === "string" ? v.trim() : v);
    const values = { ...rawValues, url: trimmed(rawValues.url), title: trimmed(rawValues.title) };
    if (editingLink) {
      updateMutation.mutate({ id: editingLink.link_id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (link: TutorialLink) => {
    setEditingLink(link);
    form.setFieldsValue(link);
    setIsModalOpen(true);
  };

  // The description column only earns its width when at least one link has one.
  const hasDescriptions = links.some((l: TutorialLink) => !!l.description);

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 260,
      ellipsis: true,
      className: "font-medium",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 190,
      render: (cat: string) => <StatusTag tone="neutral">{CATEGORY_LABELS[cat] || cat}</StatusTag>,
    },
    {
      title: "Link",
      dataIndex: "url",
      key: "url",
      width: 240,
      render: (url: string) => {
        const href = safeHref(url);
        // Show where it goes (the domain) rather than a raw underlined URL; the full URL is the tooltip.
        let host = url;
        try {
          host = new URL(url).hostname.replace(/^www\./, "");
        } catch {
          /* keep the raw text */
        }
        return href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={url}
            aria-label={`Open ${host} in a new tab`}
            className="inline-flex max-w-full items-center gap-1.5 font-medium !normal-case text-brand-ink hover:underline"
          >
            <span className="truncate">{host}</span>
            <FiExternalLink aria-hidden className="shrink-0" />
          </a>
        ) : (
          <span className="block truncate !normal-case text-ink-2" title={url}>
            {url}
          </span>
        );
      },
    },
    ...(hasDescriptions
      ? [
          {
            title: "Description",
            dataIndex: "description",
            key: "description",
            width: 260,
            render: (desc: string) => desc || "-",
          },
        ]
      : []),
    {
      title: "Actions",
      key: "actions",
      width: 140,
      fixed: "right" as const,
      render: (_: any, record: TutorialLink) => (
        <div className="flex items-center gap-2">
          <Button size="small" onClick={() => handleEdit(record)}>Edit</Button>
          <Popconfirm title="Delete this link?" onConfirm={() => deleteMutation.mutate(record.link_id)}>
            <DeleteButton label={`Delete ${record.title}`} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        className="mb-4"
        actions={
          <Button type="primary" onClick={() => { setEditingLink(null); form.resetFields(); setIsModalOpen(true); }}>
            + Add Link
          </Button>
        }
      />
      <h2 className="sr-only">Tutorial Links</h2>

      {isError ? (
        <ErrorMsg message="Couldn't load the tutorial links." onRetry={() => refetch()} retrying={isFetching} />
      ) : (
        <Table
          data={links}
          columns={columns}
          rowKey="link_id"
          loading={isLoading}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          emptyText="No tutorial links yet."
        />
      )}

      <Modal
        title={editingLink ? "Edit Tutorial Link" : "Add Tutorial Link"}
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); setEditingLink(null); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required" }]}>
            <Input placeholder="e.g. How to schedule a session" />
          </Form.Item>
          <Form.Item
            name="url"
            label="URL"
            rules={[
              { required: true, message: "URL is required" },
              {
                validator: (_, v) =>
                  !v || isHttpUrl(v) ? Promise.resolve() : Promise.reject(new Error("Enter a valid http:// or https:// URL")),
              },
            ]}
          >
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]} initialValue="video">
            <Select options={[
              { label: "Video", value: "video" },
              { label: "Document", value: "doc" },
              { label: "Guide", value: "guide" },
              { label: "Learner Demo Video", value: "learner_demo" },
              { label: "Volunteer Demo Video", value: "volunteer_demo" },
            ]} />
          </Form.Item>
          <Form.Item name="description" label="Description (optional)">
            <Input.TextArea placeholder="Add a short description (optional)" rows={2} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending} block>
            {editingLink ? "Update" : "Create"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
