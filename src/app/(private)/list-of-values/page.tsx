"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GET_API, POST_API, PUT_API, DELETE_API } from "@/api/request";
import { endpoints } from "@/api/constants";
import { Button, Input, Select, Table, Modal, Form, Popconfirm, Tabs, Tag } from "antd";
import { DeleteIcon } from "@/assets/icons";

const COLLECTION_TYPES = [
  { key: "skills", label: "Skills" },
  { key: "subjects", label: "Subjects" },
  { key: "languages", label: "Languages" },
];

const NAME_MAP: Record<string, string> = {
  skills: "skill_name",
  subjects: "subject_name",
  languages: "language_name",
};

const ID_MAP: Record<string, string> = {
  skills: "skill_id",
  subjects: "subject_id",
  languages: "language_id",
};

export default function ListOfValuesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("skills");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["lov", activeTab],
    queryFn: async () =>
      (await GET_API(endpoints.listOfValues.getAll(activeTab) + "?include_hidden=true"))?.data || [],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => POST_API(endpoints.listOfValues.create(activeTab), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lov", activeTab] });
      setIsModalOpen(false);
      form.resetFields();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      PUT_API(endpoints.listOfValues.update(activeTab, id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lov", activeTab] });
      setIsModalOpen(false);
      setEditingItem(null);
      form.resetFields();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => DELETE_API(endpoints.listOfValues.delete(activeTab, id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lov", activeTab] }),
  });

  const handleSubmit = (values: any) => {
    if (editingItem) {
      const payload: any = { name: values.name };
      if (activeTab === "skills") payload.category = values.category || null;
      if (values.is_global !== undefined) payload.is_global = values.is_global;
      updateMutation.mutate({ id: editingItem[ID_MAP[activeTab]], data: payload });
    } else {
      const payload: any = { name: values.name };
      if (activeTab === "skills" && values.category) payload.category = values.category;
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    form.setFieldsValue({
      name: item[NAME_MAP[activeTab]],
      category: item.category,
      is_global: item.global,
    });
    setIsModalOpen(true);
  };

  const columns = [
    {
      title: "Name",
      key: "name",
      render: (_: any, record: any) => record[NAME_MAP[activeTab]],
      className: "font-medium",
    },
    ...(activeTab === "skills"
      ? [
          {
            title: "Category",
            dataIndex: "category",
            key: "category",
            render: (cat: string) =>
              cat ? (
                <Tag color={cat === "academic" ? "blue" : "purple"}>{cat}</Tag>
              ) : (
                <Tag>Uncategorized</Tag>
              ),
          },
        ]
      : []),
    {
      title: "Visible",
      dataIndex: "global",
      key: "global",
      render: (val: boolean) => (
        <Tag color={val ? "green" : "red"}>{val ? "Yes" : "Hidden"}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this item?"
            onConfirm={() => deleteMutation.mutate(record[ID_MAP[activeTab]])}
          >
            <Button size="small" danger>
              <DeleteIcon />
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">List of Values</h1>
        <Button
          type="primary"
          onClick={() => {
            setEditingItem(null);
            form.resetFields();
            setIsModalOpen(true);
          }}
        >
          + Add {COLLECTION_TYPES.find((c) => c.key === activeTab)?.label?.slice(0, -1)}
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={COLLECTION_TYPES.map((t) => ({ key: t.key, label: t.label }))}
      />

      <Table
        dataSource={items}
        columns={columns}
        rowKey={(record) => record[ID_MAP[activeTab]]}
        loading={isLoading}
        pagination={{ pageSize: 15 }}
      />

      <Modal
        title={editingItem ? "Edit Item" : `Add New ${COLLECTION_TYPES.find((c) => c.key === activeTab)?.label?.slice(0, -1)}`}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingItem(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder={`e.g. ${activeTab === "skills" ? "Mathematics" : activeTab === "subjects" ? "Physics" : "English"}`} />
          </Form.Item>
          {activeTab === "skills" && (
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
          )}
          {editingItem && (
            <Form.Item name="is_global" label="Visible to users">
              <Select
                options={[
                  { label: "Yes (visible)", value: true },
                  { label: "No (hidden)", value: false },
                ]}
              />
            </Form.Item>
          )}
          <Button
            type="primary"
            htmlType="submit"
            loading={createMutation.isPending || updateMutation.isPending}
            block
          >
            {editingItem ? "Update" : "Create"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
