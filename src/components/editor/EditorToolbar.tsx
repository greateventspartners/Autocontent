"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, ListChecks, Quote, Minus, Link2, Image as ImageIcon,
  Highlighter, Undo2, Redo2, RemoveFormatting,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor;
}

function ToolBtn({
  onClick,
  active = false,
  disabled = false,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${
        active
          ? "bg-primary/20 text-primary"
          : disabled
          ? "text-muted-foreground/30 cursor-not-allowed"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-white/10 mx-0.5" />;
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const setLink = () => {
    const url = window.prompt("URL du lien :", editor.getAttributes("link").href || "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("URL de l'image :", "");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="flex items-center gap-0.5 px-4 py-2 border-b border-white/5 overflow-x-auto scrollbar-hide">
      <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Annuler">
        <Undo2 size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Rétablir">
        <Redo2 size={15} />
      </ToolBtn>

      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Titre 1">
        <Heading1 size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Titre 2">
        <Heading2 size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Titre 3">
        <Heading3 size={15} />
      </ToolBtn>

      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Gras">
        <Bold size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italique">
        <Italic size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Barré">
        <Strikethrough size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Code inline">
        <Code size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHighlight({ color: "#fbbf24" }).run()} active={editor.isActive("highlight")} title="Surligner">
        <Highlighter size={15} />
      </ToolBtn>

      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Liste à puces">
        <List size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Liste numérotée">
        <ListOrdered size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="Liste de tâches">
        <ListChecks size={15} />
      </ToolBtn>

      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Citation">
        <Quote size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Ligne horizontale">
        <Minus size={15} />
      </ToolBtn>
      <ToolBtn onClick={setLink} active={editor.isActive("link")} title="Lien">
        <Link2 size={15} />
      </ToolBtn>
      <ToolBtn onClick={addImage} title="Image">
        <ImageIcon size={15} />
      </ToolBtn>

      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Effacer le formatage">
        <RemoveFormatting size={15} />
      </ToolBtn>
    </div>
  );
}
