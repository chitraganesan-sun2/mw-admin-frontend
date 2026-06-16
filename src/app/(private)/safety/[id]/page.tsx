"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { getReportDetail, downloadReportPdf, type SafetyReportDetail } from "@/api/safety";
import { Button, Card, Tag, Descriptions, Collapse, Spin, Empty, Typography } from "antd";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  ExclamationCircleFilled,
  CheckCircleFilled,
  InfoCircleFilled,
} from "@ant-design/icons";

const { Panel } = Collapse;
const { Text, Paragraph } = Typography;

// ── Severity styling ─────────────────────────────────────────────────────────

const severityConfig: Record<string, { color: string; icon: React.ReactNode; bg: string }> = {
  Safe: { color: "green", icon: <CheckCircleFilled style={{ color: "#52c41a" }} />, bg: "bg-green-50" },
  Low: { color: "blue", icon: <InfoCircleFilled style={{ color: "#1890ff" }} />, bg: "bg-blue-50" },
  Moderate: { color: "gold", icon: <ExclamationCircleFilled style={{ color: "#faad14" }} />, bg: "bg-yellow-50" },
  High: { color: "orange", icon: <ExclamationCircleFilled style={{ color: "#fa8c16" }} />, bg: "bg-orange-50" },
  Critical: { color: "red", icon: <ExclamationCircleFilled style={{ color: "#ff4d4f" }} />, bg: "bg-red-50" },
};

// ── Main Component ───────────────────────────────────────────────────────────

export default function SafetyReportPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = Number(params.id);

  const { data: report, isLoading, error } = useQuery({
    queryKey: ["safety-report", reportId],
    queryFn: async () => {
      const res = await getReportDetail(reportId);
      return (res as any)?.data as SafetyReportDetail;
    },
    enabled: !!reportId,
  });

  const handleDownloadPdf = async () => {
    try {
      const res = await downloadReportPdf(reportId);
      const blob = new Blob([(res as any)?.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `safety_report_${reportId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // PDF might not be available
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spin size="large" tip="Loading report..." />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-8">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          Back
        </Button>
        <div className="mt-8">
          <Empty description="Report not found or service unavailable" />
        </div>
      </div>
    );
  }

  const severity = report.severity || "Safe";
  const config = severityConfig[severity] || severityConfig.Safe;

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              Report #{reportId}
            </h1>
            <p className="text-gray-500 text-sm">{report.filename}</p>
          </div>
        </div>
        <Button icon={<DownloadOutlined />} onClick={handleDownloadPdf}>
          Download PDF
        </Button>
      </div>

      {/* Risk Overview Card */}
      <Card className={`mb-6 ${config.bg}`}>
        <div className="flex items-center gap-4">
          <div className="text-3xl">{config.icon}</div>
          <div>
            <div className="flex items-center gap-3">
              <Tag color={config.color} className="text-base px-3 py-1">
                {severity}
              </Tag>
              <span className="text-2xl font-bold">
                {report.risk_score?.toFixed(1) || "0.0"} / 100
              </span>
            </div>
            <p className="text-gray-600 mt-1">Risk Score</p>
          </div>
        </div>
      </Card>

      {/* Report Info */}
      <Card title="Report Details" className="mb-6">
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Status">
            <Tag color={report.status === "COMPLETED" ? "success" : "processing"}>
              {report.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Report ID">{reportId}</Descriptions.Item>
          {report.session_id && (
            <Descriptions.Item label="Session ID">{report.session_id}</Descriptions.Item>
          )}
          {report.volunteer_id && (
            <Descriptions.Item label="Volunteer ID">{report.volunteer_id}</Descriptions.Item>
          )}
          {report.learner_id && (
            <Descriptions.Item label="Learner ID">{report.learner_id}</Descriptions.Item>
          )}
          {report.created_at && (
            <Descriptions.Item label="Analyzed">
              {new Date(report.created_at).toLocaleString()}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Summary */}
      {(report.llm_summary || report.rule_summary) && (
        <Card title="Analysis Summary" className="mb-6">
          <Paragraph>
            {report.llm_summary || report.rule_summary}
          </Paragraph>
        </Card>
      )}

      {/* Findings */}
      {report.findings && report.findings.length > 0 && (
        <Card title={`Findings (${report.findings.length})`} className="mb-6">
          <Collapse accordion>
            {report.findings.map((finding: any, idx: number) => (
              <Panel
                key={idx}
                header={
                  <div className="flex items-center gap-2">
                    <Tag color={severityConfig[finding.severity]?.color || "default"}>
                      {finding.severity || "unknown"}
                    </Tag>
                    <span className="text-sm">
                      {finding.categories?.join(", ") || finding.category || "Uncategorized"}
                    </span>
                    <span className="text-gray-400 text-xs ml-auto">
                      Confidence: {((finding.confidence || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                }
              >
                <div className="space-y-2">
                  {finding.evidence && (
                    <div>
                      <Text strong>Evidence: </Text>
                      <Text>{finding.evidence}</Text>
                    </div>
                  )}
                  {finding.matched_text && (
                    <div>
                      <Text strong>Matched: </Text>
                      <Text code>{finding.matched_text}</Text>
                    </div>
                  )}
                  {finding.context_type && (
                    <div>
                      <Text strong>Context: </Text>
                      <Tag>{finding.context_type}</Tag>
                    </div>
                  )}
                </div>
              </Panel>
            ))}
          </Collapse>
        </Card>
      )}

      {/* Statistics */}
      {report.stats && (
        <Card title="Statistics" className="mb-6">
          <Descriptions column={2} size="small">
            {report.stats.word_count && (
              <Descriptions.Item label="Word Count">
                {report.stats.word_count.toLocaleString()}
              </Descriptions.Item>
            )}
            {report.stats.categories && (
              <Descriptions.Item label="Categories Detected">
                {Object.keys(report.stats.categories).length}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Transcript (collapsible) */}
      {report.transcript && (
        <Collapse className="mb-6">
          <Panel header="Full Transcript" key="transcript">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 max-h-96 overflow-y-auto">
              {report.transcript}
            </pre>
          </Panel>
        </Collapse>
      )}
    </div>
  );
}
