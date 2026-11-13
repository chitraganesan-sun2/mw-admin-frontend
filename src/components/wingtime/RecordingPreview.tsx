"use client";

import { useState } from "react";
import { IoPlay } from "react-icons/io5";
import { driveEmbedUrl } from "@/utils/drivePreview";

type Props = {
  /** The Google Drive link of the recording. */
  url?: string | null;
  title: string;
  /** Before publishing the file is private: only a browser signed in to the organizer account can play it. */
  isPrivate: boolean;
};

/**
 * Click-to-play preview for an admin reviewing a recorded WingTime. Nothing from Google loads until
 * play is pressed. A private (not yet published) file only plays when this browser is signed in to
 * the Google account that organizes WingTimes, so the Drive link stays right below as the fallback.
 */
export default function RecordingPreview({ url, title, isPrivate }: Props) {
  const [playing, setPlaying] = useState(false);
  const embed = driveEmbedUrl(url);
  if (!url) return null;

  return (
    <div className="flex flex-col gap-2">
      {embed && (
        <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-[#0F172A]">
          {playing ? (
            <iframe
              src={embed}
              title={`Recording: ${title}`}
              className="absolute inset-0 h-full w-full border-0"
              allow="autoplay; fullscreen"
              allowFullScreen
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Play recording: ${title}`}
              className="group absolute inset-0 flex w-full cursor-pointer flex-col items-center justify-center gap-2 border-0 bg-gradient-to-br from-[#1E3A8A] via-[#4C1D95] to-[#BE185D] p-4 text-white"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(255,255,255,0.95)] text-[#1E3A8A] shadow-lg transition-transform group-hover:scale-110">
                <IoPlay size={26} className="ml-1" />
              </span>
              <span className="text-sm font-medium">Preview recording</span>
              <span className="text-[0.7rem] text-[rgba(255,255,255,0.7)]">Plays from Google Drive</span>
            </button>
          )}
        </div>
      )}
      <p className="text-xs text-gray-medium">
        {isPrivate
          ? "Not published yet: it only plays here if this browser is signed in to the WingTime organizer's Google account."
          : "Published: anyone with the link can watch it, but not download it."}{" "}
        <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-gray-dark">
          Open in Google Drive
        </a>
      </p>
    </div>
  );
}
