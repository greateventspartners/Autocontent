"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import { useEffect, useCallback, useRef } from "react";
import EditorToolbar from "./EditorToolbar";

interface DocumentEditorProps {
  content: string;
  onChange: (content: string) => void;
  onUpdate?: (editor: {getJSON: () => unknown; getHTML: () => string}) => void;
  placeholder?: string;
  className?: string;
}

export default function DocumentEditor({
  content,
  onChange,
  onUpdate,
  placeholder = "Commencez à écrire...",
  className = "",
}: DocumentEditorProps) {
  const isInternalUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      Image.configure({ HTMLAttributes: { class: "rounded-xl max-w-full" } }),
      TaskList,
      TaskItem.configure({ HTMLAttributes: { class: "task-item" } }),
      Highlight.configure({ multicolor: true }),
      Typography,
    ],
    content: content || "",
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-sm max-w-none focus:outline-none min-h-[400px] px-8 py-6",
      },
    },
    onUpdate: ({ editor: e }) => {
      isInternalUpdate.current = true;
      const html = e.getHTML();
      onChange(html);
      onUpdate?.({ getJSON: () => e.getJSON(), getHTML: () => e.getHTML() });
    },
  });

  useEffect(() => {
    if (editor && !isInternalUpdate.current && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
    isInternalUpdate.current = false;
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
