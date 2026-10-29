"use client";

import CenterModal from "@/components/common/Modals/CenterModal";
import { whenInHostZone, type AdminWingTime, type RosterParticipant } from "@/utils/wingtime";

type Props = {
  isOpen: boolean;
  isLoading: boolean;
  isError: boolean;
  wingtime: AdminWingTime | null;
  participants: RosterParticipant[];
  onClose: () => void;
};

export default function WingTimeRosterModal({ isOpen, isLoading, isError, wingtime, participants, onClose }: Props) {
  return (
    <CenterModal
      isOpen={isOpen}
      onClose={onClose}
      title={wingtime ? `Participants - ${wingtime.topic}` : "Participants"}
      width={520}
      hideFooter
    >
      {isError ? (
        <p className="text-sm text-gray-medium">Couldn&apos;t load the participants. Please try again.</p>
      ) : isLoading || !wingtime ? (
        <p className="text-sm text-gray-medium">Loading...</p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-dark">{whenInHostZone(wingtime)}</p>
          {participants.length === 0 ? (
            <p className="text-sm text-gray-medium">Nobody has signed up yet.</p>
          ) : (
            <ol className="flex flex-col gap-1 max-h-[45vh] overflow-y-auto list-decimal pl-5" aria-label="Participants">
              {participants.map((p) => (
                <li key={p.learner_id} className="text-sm text-gray-dark">
                  {p.name}
                </li>
              ))}
            </ol>
          )}
          <p className="text-xs text-gray-medium">
            {participants.length} of {wingtime.capacity} spots filled. Viewing this list is recorded in the audit log.
          </p>
        </div>
      )}
    </CenterModal>
  );
}
