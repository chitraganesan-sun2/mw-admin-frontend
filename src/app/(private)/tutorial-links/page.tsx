"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GET_API, POST_API, PUT_API, DELETE_API } from "@/api/request";
import { endpoints } from "@/api/constants";
import { Button, Input, Select, Table, Modal, Form, Popconfirm, Tag } from "antd";
import { DeleteIcon } from "@/assets/icons";
import { useComponentStore } from "@/store/useComponenetStore";
import { usePathname } from "next/navigation";
import { getHeaderIcon } from "@/layouts/helper";

interface TutorialLink {
  link_id: string;
  title: string;
  url: string;
  category: string;
  description?: string;
}

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

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["tutorial-links"],
    queryFn: async () => (await GET_API(endpoints.tutorialLinks.getAll))?.data || [],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => POST_API(endpoints.tutorialLinks.create, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutorial-links"] });
      setIsModalOpen(false);
      form.resetFields();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      PUT_API(endpoints.tutorialLinks.update(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutorial-links"] });
      setIsModalOpen(false);
      setEditingLink(null);
      form.resetFields();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => DELETE_API(endpoints.tutorialLinks.delete(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tutorial-links"] }),
  });

  const handleSubmit = (values: any) => {
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

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      className: "font-medium",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (cat: string) => (
        <Tag color={cat === "video" ? "blue" : cat === "doc" ? "green" : "orange"}>
          {cat}
        </Tag>
      ),
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      render: (url: string) => (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline truncate max-w-[200px] block">
          {url}
        </a>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (desc: string) => desc || "-",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: TutorialLink) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => handleEdit(record)}>Edit</Button>
          <Popconfirm title="Delete this link?" onConfirm={() => deleteMutation.mutate(record.link_id)}>
            <Button size="small" danger><DeleteIcon /></Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Tutorial Links</h1>
        <Button type="primary" onClick={() => { setEditingLink(null); form.resetFields(); setIsModalOpen(true); }}>
          + Add Link
        </Button>
      </div>

      <Table
        dataSource={links}
        columns={columns}
        rowKey="link_id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />

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
          <Form.Item name="url" label="URL" rules={[{ required: true, message: "URL is required" }]}>
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]} initialValue="video">
            <Select options={[
              { label: "Video", value: "video" },
              { label: "Document", value: "doc" },
              { label: "Guide", value: "guide" },
            ]} />
          </Form.Item>
          <Form.Item name="description" label="Description (optional)">
            <Input.TextArea placeholder="Brief description..." rows={2} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending} block>
            {editingLink ? "Update" : "Create"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
