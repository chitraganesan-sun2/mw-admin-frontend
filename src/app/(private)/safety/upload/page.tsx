"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Alert, Button } from "antd";
import clsx from "clsx";
import { MdAudiotrack, MdDescription, MdEditNote, MdVideocam } from "react-icons/md";
import { useComponentStore } from "@/store/useComponenetStore";
import { getHeaderIcon } from "@/layouts/helper";
import { analyzeAudio, analyzeTranscriptFile, analyzeTranscriptText, analyzeVideo } from "@/api/safety";
import { getApiErrorMessage } from "@/utils/apiError";
import SafetyTabs from "@/components/safety/SafetyTabs";
import LinkFields from "@/components/safety/upload/LinkFields";
import TranscriptInput from "@/components/safety/upload/TranscriptInput";
import UploadDropzone from "@/components/safety/upload/UploadDropzone";
import UploadQueueItem from "@/components/safety/upload/UploadQueueItem";
import {
  FILE_RULES,
  MAX_CONCURRENT_UPLOADS,
  QueueItem,
  UploadKind,
  formatBytes,
  validateFile,
} from "@/components/safety/upload/uploadRules";

const DEFAULT_TRANSCRIPT_FILENAME = "transcript_input.txt";

const MODES: Array<{ kind: UploadKind; label: string; icon: React.ReactNode }> = [
  { kind: "audio", label: "Audio file", icon: <MdAudiotrack aria-hidden="true" /> },
  { kind: "video", label: "Video file", icon: <MdVideocam aria-hidden="true" /> },
  { kind: "transcript-file", label: "Transcript file", icon: <MdDescription aria-hidden="true" /> },
  { kind: "transcript-text", label: "Paste transcript", icon: <MdEditNote aria-hidden="true" /> },
];

const MODE_COPY: Record<Exclude<UploadKind, "transcript-text">, { prompt: string; description: string }> = {
  audio: {
    prompt: "Click or drag audio files here",
    description: "Audio is transcribed, then scanned for grooming patterns and risks.",
  },
  video: {
    prompt: "Click or drag video files here",
    description: "The audio track is extracted automatically, then analysed.",
  },
  "transcript-file": {
    prompt: "Click or drag .txt transcripts here",
    description: "Skips transcription and runs the full analysis on the text.",
  },
};

const limitHint = (kind: Exclude<UploadKind, "transcript-text">) => {
  const rule = FILE_RULES[kind];
  return `${rule.extensions.join(", ")} · up to ${formatBytes(rule.maxBytes)} each`;
};

export default function SafetyUploadPage() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();

  useEffect(() => {
    setHeaderOptions({ title: "Safety Monitoring", titleIcon: getHeaderIcon(pathname) });
  }, [setHeaderOptions, pathname]);

  const [mode, setMode] = useState<UploadKind>("audio");
  const [items, setItems] = useState<QueueItem[]>([]);
  const [rejections, setRejections] = useState<string[]>([]);
  const [links, setLinks] = useState<SafetyAnalysisLinks>({});

  // The queue lives in a ref as well as state: uploads finish asynchronously and the scheduler
  // has to see the latest queue, not the one from the render that started it.
  const itemsRef = useRef<QueueItem[]>([]);
  const mountedRef = useRef(true);
  const counterRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const commit = useCallback((update: (list: QueueItem[]) => QueueItem[]) => {
    itemsRef.current = update(itemsRef.current);
    setItems(itemsRef.current);
  }, []);

  const patch = useCallback(
    (key: string, changes: Partial<QueueItem>) =>
      commit((list) => list.map((item) => (item.key === key ? { ...item, ...changes } : item))),
    [commit]
  );

  const send = useCallback(
    (item: QueueItem) => {
      const options = { links: item.links, onProgress: (progress: number) => patch(item.key, { progress }) };
      switch (item.kind) {
        case "audio":
          return analyzeAudio(item.file as File, options);
        case "video":
          return analyzeVideo(item.file as File, options);
        case "transcript-file":
          return analyzeTranscriptFile(item.file as File, options);
        default:
          return analyzeTranscriptText(item.text ?? "", item.filename ?? DEFAULT_TRANSCRIPT_FILENAME, item.links);
      }
    },
    [patch]
  );

  // Starts waiting items until MAX_CONCURRENT_UPLOADS are in flight; called again as each finishes.
  const pump = useCallback(() => {
    if (!mountedRef.current) return;
    let free = MAX_CONCURRENT_UPLOADS - itemsRef.current.filter((item) => item.status === "uploading").length;
    for (const item of itemsRef.current) {
      if (free <= 0) break;
      if (item.status !== "waiting" || !item.started) continue;
      free -= 1;
      patch(item.key, { status: "uploading", progress: 0, error: undefined });
      send(item)
        .then((accepted) => patch(item.key, { status: "accepted", progress: 100, reportId: accepted.report_id }))
        .catch((err) => {
          const message = getApiErrorMessage(err, "");
          patch(item.key, {
            status: "failed",
            error:
              message ||
              (err?.status === 413
                ? "The server rejected this file as too large."
                : "Couldn't upload this file. Check your connection and try again. Very large files can time out."),
          });
        })
        .finally(pump);
    }
  }, [patch, send]);

  const addFiles = (files: File[], kind: Exclude<UploadKind, "transcript-text">) => {
    const problems: string[] = [];
    const accepted: QueueItem[] = [];
    for (const file of files) {
      const problem = validateFile(file, kind);
      if (problem) {
        problems.push(problem);
        continue;
      }
      const duplicate = [...itemsRef.current, ...accepted].some(
        (item) => item.kind === kind && item.name === file.name && item.size === file.size && item.status !== "failed"
      );
      if (duplicate) {
        problems.push(`"${file.name}" is already in the queue.`);
        continue;
      }
      counterRef.current += 1;
      accepted.push({
        key: `file-${counterRef.current}`,
        kind,
        name: file.name,
        size: file.size,
        file,
        status: "waiting",
        started: false,
        progress: 0,
        links: {},
      });
    }
    setRejections(problems);
    if (accepted.length) commit((list) => [...list, ...accepted]);
  };

  const addTranscript = (text: string, displayName: string) => {
    counterRef.current += 1;
    setRejections([]);
    commit((list) => [
      ...list,
      {
        key: `text-${counterRef.current}`,
        kind: "transcript-text",
        name: displayName || "Pasted transcript",
        size: new Blob([text]).size,
        text,
        filename: displayName || DEFAULT_TRANSCRIPT_FILENAME,
        status: "waiting",
        started: false,
        progress: 0,
        links: {},
      },
    ]);
  };

  const startAnalysis = () => {
    // The link fields are read once, now, so editing them while a long queue drains can't change
    // which session a file already submitted belongs to.
    const snapshot: SafetyAnalysisLinks = {};
    (["session_id", "volunteer_id", "learner_id"] as const).forEach((key) => {
      const value = links[key]?.trim();
      if (value) snapshot[key] = value;
    });
    commit((list) =>
      list.map((item) => (item.status === "waiting" && !item.started ? { ...item, started: true, links: snapshot } : item))
    );
    pump();
  };

  const retry = (key: string) => {
    patch(key, { status: "waiting", started: true, error: undefined, progress: 0 });
    pump();
  };

  const remove = (key: string) => commit((list) => list.filter((item) => item.key !== key));

  const clearAccepted = () => commit((list) => list.filter((item) => item.status !== "accepted"));

  const unstartedCount = items.filter((item) => item.status === "waiting" && !item.started).length;
  const acceptedCount = items.filter((item) => item.status === "accepted").length;
  const busy = items.some((item) => item.status === "uploading" || (item.status === "waiting" && item.started));

  // Leaving mid-upload would abandon the files that haven't been sent yet.
  useEffect(() => {
    if (!busy) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  return (
    <div className="p-6">
      <SafetyTabs />

      <section className="bg-white rounded-xl p-6 mb-6" aria-labelledby="safety-upload-heading">
        <h2 id="safety-upload-heading" className="text-lg font-semibold mt-0 mb-1">
          New analysis
        </h2>
        <p className="text-sm text-gray-500 mt-0 mb-4">
          Scan a recording or transcript for grooming patterns. Each file becomes its own report, and a failed analysis
          never blocks the rest of the queue.
        </p>

        <div role="group" aria-label="Input type" className="flex flex-wrap gap-2 mb-5">
          {MODES.map((option) => (
            <button
              key={option.kind}
              type="button"
              aria-pressed={mode === option.kind}
              onClick={() => setMode(option.kind)}
              className={clsx(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors",
                mode === option.kind
                  ? "bg-[#1F2937] text-white border-[#1F2937]"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              )}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>

        {mode === "transcript-text" ? (
          <TranscriptInput onAdd={addTranscript} />
        ) : (
          <>
            <p className="text-sm text-gray-600 mt-0 mb-3">{MODE_COPY[mode].description}</p>
            <UploadDropzone
              key={mode}
              extensions={FILE_RULES[mode].extensions}
              prompt={MODE_COPY[mode].prompt}
              hint={limitHint(mode)}
              onFiles={(files) => addFiles(files, mode)}
            />
          </>
        )}

        {rejections.length > 0 && (
          <Alert
            className="mt-4"
            type="error"
            showIcon
            closable
            onClose={() => setRejections([])}
            message={rejections.length === 1 ? "This file wasn't added" : `${rejections.length} files weren't added`}
            description={
              <ul className="m-0 pl-4">
                {rejections.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            }
          />
        )}
      </section>

      <div className="mb-6">
        <LinkFields value={links} onChange={setLinks} />
      </div>

      <section className="bg-white rounded-xl p-6" aria-labelledby="safety-queue-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h2 id="safety-queue-heading" className="text-lg font-semibold m-0">
            Queue{items.length > 0 ? ` (${items.length})` : ""}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {acceptedCount > 0 && <Button onClick={clearAccepted}>Clear submitted</Button>}
            <Button type="primary" disabled={unstartedCount === 0} onClick={startAnalysis}>
              {unstartedCount > 0 ? `Start analysis (${unstartedCount})` : "Start analysis"}
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-gray-500 my-6 text-center">
            Nothing queued yet. Add files or a transcript above, then start the analysis.
          </p>
        ) : (
          <ul className="list-none m-0 p-0">
            {items.map((item) => (
              <UploadQueueItem key={item.key} item={item} onRemove={remove} onRetry={retry} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
