"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getReports,
  getAnalytics,
  analyzeTranscript,
  deleteReport,
  type SafetyReport,
  type SafetyAnalytics,
  type ReportsListResponse,
} from "@/api/safety";
import { Button, Table, Tag, Modal, Input, Upload, message, Card, Statistic, Row, Col, Select, Tooltip } from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import type { ColumnsType } from "antd/es/table";

const { TextArea } = Input;
const { confirm } = Modal;

// ── Severity color mapping ───────────────────────────────────────────────────

const severityColor: Record<string, string> = {
  Safe: "green",
  Low: "blue",
  Moderate: "gold",
  High: "orange",
  Critical: "red",
};

const statusColor: Record<string, string> = {
  PROCESSING: "processing",
  COMPLETED: "success",
  FAILED: "error",
};

// ── Main Page Component ──────────────────────────────────────────────────────

export default function SafetyDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");
  const [transcriptFilename, setTranscriptFilename] = useState("");

  // ── Queries ────────────────────────────────────────────────────────────────

  const {
    data: reportsData,
    isLoading: reportsLoading,
  } = useQuery({
    queryKey: ["safety-reports", page, pageSize],
    queryFn: async () => {
      const res = await getReports({ skip: (page - 1) * pageSize, limit: pageSize });
      return (res as any)?.data as ReportsListResponse;
    },
  });

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
  } = useQuery({
    queryKey: ["safety-analytics"],
    queryFn: async () => {
      const res = await getAnalytics();
      return (res as any)?.data as SafetyAnalytics;
    },
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const submitTranscript = useMutation({
    mutationFn: async () => {
      return analyzeTranscript({
        transcript: transcriptText,
        filename: transcriptFilename || "manual_submission.txt",
      });
    },
    onSuccess: () => {
      message.success("Analysis started! Check back in a few minutes.");
      setShowUploadModal(false);
      setTranscriptText("");
      setTranscriptFilename("");
      queryClient.invalidateQueries({ queryKey: ["safety-reports"] });
    },
    onError: () => {
      message.error("Failed to submit transcript. Is the safety service running?");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (reportId: number) => deleteReport(reportId),
    onSuccess: () => {
      message.success("Report deleted");
      queryClient.invalidateQueries({ queryKey: ["safety-reports"] });
      queryClient.invalidateQueries({ queryKey: ["safety-analytics"] });
    },
    onError: () => {
      message.error("Failed to delete report");
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleDelete = (reportId: number) => {
    confirm({
      title: "Delete Safety Report",
      icon: <ExclamationCircleOutlined />,
      content: "This will permanently delete the report and all associated data. Are you sure?",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => deleteMutation.mutate(reportId),
    });
  };

  // ── Table Columns ──────────────────────────────────────────────────────────

  const columns: ColumnsType<SafetyReport> = [
    {
      title: "ID",
      dataIndex: "meeting_id",
      key: "meeting_id",
      width: 70,
    },
    {
      title: "File",
      dataIndex: "filename",
      key: "filename",
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span className="flex items-center gap-1">
            <FileTextOutlined />
            {text}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <Tag color={statusColor[status] || "default"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      width: 110,
      render: (severity: string) =>
        severity ? (
          <Tag color={severityColor[severity] || "default"}>{severity}</Tag>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: "Risk Score",
      dataIndex: "risk_score",
      key: "risk_score",
      width: 100,
      render: (score: number) =>
        score != null ? (
          <span className="font-mono">{score.toFixed(1)}</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) : "—",
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: any, record: SafetyReport) => (
        <div className="flex gap-2">
          <Tooltip title="View Report">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/safety/${record.meeting_id}`)}
              disabled={record.status !== "COMPLETED"}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.meeting_id)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Safety Monitor</h1>
          <p className="text-gray-500 mt-1">
            AI-powered grooming detection for tutoring sessions
          </p>
        </div>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={() => setShowUploadModal(true)}
          size="large"
        >
          Analyze New
        </Button>
      </div>

      {/* Analytics Cards */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card loading={analyticsLoading}>
            <Statistic
              title="Total Reports"
              value={analyticsData?.total_reports || 0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={analyticsLoading}>
            <Statistic
              title="Avg Risk Score"
              value={analyticsData?.avg_risk_score || 0}
              precision={1}
              suffix="/ 100"
              valueStyle={{
                color: (analyticsData?.avg_risk_score || 0) > 50 ? "#cf1322" : "#3f8600",
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={analyticsLoading}>
            <Statistic
              title="High/Critical"
              value={
                (analyticsData?.severity_distribution?.High || 0) +
                (analyticsData?.severity_distribution?.Critical || 0)
              }
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={analyticsLoading}>
            <Statistic
              title="Total Findings"
              value={analyticsData?.total_findings || 0}
            />
          </Card>
        </Col>
      </Row>

      {/* Reports Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={reportsData?.reports || []}
          loading={reportsLoading}
          rowKey="meeting_id"
          pagination={{
            current: page,
            pageSize: pageSize,
            total: reportsData?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `${total} reports`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      {/* Upload/Analyze Modal */}
      <Modal
        title="Submit for Safety Analysis"
        open={showUploadModal}
        onCancel={() => setShowUploadModal(false)}
        footer={null}
        width={640}
      >
        <div className="space-y-4 pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filename (optional)
            </label>
            <Input
              placeholder="e.g. session_2024_01_15.txt"
              value={transcriptFilename}
              onChange={(e) => setTranscriptFilename(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transcript Text
            </label>
            <TextArea
              rows={10}
              placeholder="Paste the session transcript here..."
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setShowUploadModal(false)}>Cancel</Button>
            <Button
              type="primary"
              onClick={() => submitTranscript.mutate()}
              loading={submitTranscript.isPending}
              disabled={!transcriptText.trim() || transcriptText.trim().length < 10}
            >
              Start Analysis
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
