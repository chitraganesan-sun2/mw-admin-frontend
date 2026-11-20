"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { labelToolbar } from "./labelToolbar";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface TextEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  height?: string | number;
}

const TextEditor: React.FC<TextEditorProps> = ({
  value,
  onChange,
  placeholder = "Write your message here",
  className = "",
  height = "200px",
}) => {
  const [editorContent, setEditorContent] = useState(value || "");
  const containerRef = useRef<HTMLDivElement>(null);

  // Give the icon-only toolbar controls and the editing area accessible names (Quill builds them
  // after mount, so watch the container until they exist).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    labelToolbar(el);
    const observer = new MutationObserver(() => labelToolbar(el));
    observer.observe(el, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setEditorContent(value || "");
  }, [value]);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ size: ["small", false, "large", "huge"] }],
          ["bold", "italic", "underline", "strike"],
          [{ align: [] }],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link"],
        ],
      },
    }),
    []
  );

  const formats = [
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "align",
    "list", // covers both ordered and bullet lists in Quill 2 - "bullet" isn't a format
    "link",
  ];

  const handleChange = (content: string) => {
    setEditorContent(content);
    if (onChange) {
      onChange(content);
    }
  };

  return (
    <div ref={containerRef} className={`text-editor-container ${className}`}>
      <style jsx global>{`
        .ql-container {
          font-family: "Poppins", sans-serif !important;
          font-size: 16px;
          min-height: 300px;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          background-color: #f8f9fa;
        }
        .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background-color: #fff;
        }
        .ql-editor {
          min-height: 300px;
          font-family: "Poppins", sans-serif !important;
        }
        .ql-editor p {
          margin-bottom: 0.5em;
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={editorContent}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
};

export default TextEditor;
