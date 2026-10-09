"use client";

import { useState } from "react";
import CenterModal from "@/components/common/Modals/CenterModal";

export type ProfileChangeDiffItem = {
  path: string[];
  section: string;
  label: string;
  old: string | null;
  new: string | null;
};

export type ProfileChangeDetails = {
  request_id: string;
  role: "learner" | "volunteer";
  name?: string | null;
  status: string;
  change_count: number;
  created_on?: string;
  reviewed_on?: string;
  rejection_reason?: string | null;
  diff: ProfileChangeDiffItem[];
};

type Props = {
  isOpen: boolean;
  isLoading: boolean;
  data: ProfileChangeDetails | null;
  acceptLoading: boolean;
  rejectLoading: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
};

const NOT_SET = "Not set";

const ProfileChangeDetailsModal = ({ isOpen, isLoading, data, acceptLoading, rejectLoading, onClose, onApprove, onReject }: Props) => {
  const [reason, setReason] = useState("");
  const isPending = data?.status === "pending" || data?.status === "processing";

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const sections = (data?.diff ?? []).reduce<Record<string, ProfileChangeDiffItem[]>>((acc, item) => {
    (acc[item.section] ||= []).push(item);
    return acc;
  }, {});

  return (
    <CenterModal
      isOpen={isOpen}
      onClose={handleClose}
      title={data ? `Profile changes — ${data.name || "Unknown"} (${data.role})` : "Profile changes"}
      width={720}
      hideFooter={!isPending || isLoading}
      actionLoading={acceptLoading || rejectLoading}
      acceptLoading={acceptLoading}
      rejectLoading={rejectLoading}
      onAccept={onApprove}
      onReject={() => onReject(reason.trim())}
    >
      {isLoading || !data ? (
        <p className="text-sm text-gray-medium">Loading...</p>
      ) : (
        <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto pr-1">
          {Object.entries(sections).map(([section, items]) => (
            <div key={section}>
              <p className="text-sm font-medium text-gray-medium uppercase tracking-wide mb-2">{section}</p>
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <div key={item.path.join(".")} className="rounded-xl border border-gray-200 p-3">
                    <p className="text-sm font-medium text-gray-dark mb-2">{item.label}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-medium mb-1">Current</p>
                        <p className="text-sm text-gray-dark break-words bg-red-50 rounded-lg px-3 py-2">{item.old ?? NOT_SET}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-medium mb-1">Requested</p>
                        <p className="text-sm text-gray-dark break-words bg-green-50 rounded-lg px-3 py-2">{item.new ?? NOT_SET}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {isPending ? (
            <div>
              <p className="text-sm font-medium text-gray-medium mb-2">Rejection reason (optional)</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={2000}
                placeholder="Tell the member why these changes weren't approved. It's included in the email and shown on their profile."
                className="w-full min-h-[80px] rounded-lg border border-gray-200 p-3 text-sm text-gray-dark focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
          ) : (
            data.rejection_reason && (
              <p className="text-sm text-gray-dark">
                <span className="font-medium">Rejection reason:</span> {data.rejection_reason}
              </p>
            )
          )}
        </div>
      )}
    </CenterModal>
  );
};

export default ProfileChangeDetailsModal;
