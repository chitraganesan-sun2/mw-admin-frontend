"use client";

import React, { useRef, useState } from "react";
import { Button, Input } from "antd";
import { MdDescription } from "react-icons/md";
import {
  TRANSCRIPT_MAX_CHARS,
  TRANSCRIPT_MIN_CHARS,
  validateFile,
  validateTranscriptText,
} from "./uploadRules";

interface TranscriptInputProps {
  onAdd: (text: string, displayName: string) => void;
}

/** Paste (or load from a .txt file) a transcript and queue it for analysis. */
export default function TranscriptInput({ onAdd }: TranscriptInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loadError, setLoadError] = useState("");

  const trimmedLength = text.trim().length;
  const validationMessage = trimmedLength > 0 ? validateTranscriptText(text) : null;
  const canAdd = trimmedLength > 0 && !validationMessage;

  const loadFromFile = async (file: File) => {
    setLoadError("");
    const problem = validateFile(file, "transcript-file");
    if (problem) {
      setLoadError(problem);
      return;
    }
    try {
      setText(await file.text());
      if (!displayName.trim()) setDisplayName(file.name);
    } catch {
      setLoadError(`Couldn't read "${file.name}". Try again or paste the text instead.`);
    }
  };

  const submit = () => {
    if (!canAdd) return;
    onAdd(text.trim(), displayName.trim());
    setText("");
    setDisplayName("");
    setLoadError("");
  };

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="safety-transcript-name" className="block text-sm font-medium mb-1">
          Display name <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <Input
          id="safety-transcript-name"
          value={displayName}
          maxLength={200}
          placeholder="e.g. session_2026-10-29.txt"
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>

      <div className="mb-1">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <label htmlFor="safety-transcript-text" className="text-sm font-medium">
            Transcript
          </label>
          <Button size="small" icon={<MdDescription aria-hidden="true" />} onClick={() => fileInputRef.current?.click()}>
            Load from .txt file
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            tabIndex={-1}
            accept=".txt"
            aria-label="Load a transcript from a .txt file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void loadFromFile(file);
            }}
          />
        </div>
        <Input.TextArea
          id="safety-transcript-text"
          rows={12}
          value={text}
          placeholder="Paste or type the conversation transcript here"
          status={validationMessage ? "error" : undefined}
          onChange={(e) => setText(e.target.value)}
          aria-describedby="safety-transcript-count"
        />
      </div>

      <p
        id="safety-transcript-count"
        className={validationMessage ? "text-sm text-red-600 mt-1 mb-3" : "text-sm text-gray-500 mt-1 mb-3"}
      >
        {validationMessage ??
          `${trimmedLength.toLocaleString()} / ${TRANSCRIPT_MAX_CHARS.toLocaleString()} characters (at least ${TRANSCRIPT_MIN_CHARS}).`}
      </p>
      {loadError && (
        <p role="alert" className="text-sm text-red-600 mt-0 mb-3">
          {loadError}
        </p>
      )}

      <Button type="primary" disabled={!canAdd} onClick={submit}>
        Add to queue
      </Button>
    </div>
  );
}
