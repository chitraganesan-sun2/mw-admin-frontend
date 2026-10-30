"use client";

import React, { useRef, useState } from "react";
import clsx from "clsx";
import { MdCloudUpload } from "react-icons/md";

interface UploadDropzoneProps {
  /** Extensions the picker should offer, e.g. [".mp3", ".wav"]. */
  extensions: string[];
  /** Human text under the prompt, e.g. "Max 200 MB". */
  hint: string;
  prompt: string;
  onFiles: (files: File[]) => void;
}

export default function UploadDropzone({ extensions, hint, prompt, onFiles }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const openPicker = () => inputRef.current?.click();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${prompt}. ${hint}`}
      onClick={openPicker}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPicker();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files ?? []);
        if (files.length) onFiles(files);
      }}
      className={clsx(
        "flex flex-col items-center justify-center gap-1 text-center rounded-xl border-2 border-dashed px-4 py-10 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F2937]",
        isDragging ? "border-[#1F2937] bg-gray-50" : "border-gray-300 hover:bg-gray-50"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        tabIndex={-1}
        accept={extensions.join(",")}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          // Reset so picking the same file again after removing it still fires onChange.
          e.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
      <MdCloudUpload size={40} className="text-gray-400" aria-hidden="true" />
      <p className="font-medium text-gray-800 m-0">{prompt}</p>
      <p className="text-sm text-gray-500 m-0">{hint}</p>
    </div>
  );
}
