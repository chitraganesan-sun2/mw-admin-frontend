"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  placeholder = "Type your message here...",
  className = "",
  height = "200px",
}) => {
  const [editorContent, setEditorContent] = useState(value || "");

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
    "list",
    "bullet",
    "link",
  ];

  const handleChange = (content: string) => {
    setEditorContent(content);
    if (onChange) {
      onChange(content);
    }
  };

  return (
    <div className={`text-editor-container ${className}`}>
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
