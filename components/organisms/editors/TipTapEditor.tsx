"use client";

import { useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Youtube from "@tiptap/extension-youtube";
import { createLowlight } from "lowlight";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Code, Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Minus, Link as LinkIcon, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Table as TableIcon, Youtube as YoutubeIcon, CheckSquare,
  Highlighter, Palette, Undo, Redo, RemoveFormatting,
  ChevronDown, Type, Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const lowlight = createLowlight();
lowlight.register("javascript", javascript);
lowlight.register("typescript", typescript);
lowlight.register("python", python);
lowlight.register("css", css);
lowlight.register("xml", xml);

interface TipTapEditorProps {
  content?: string | Record<string, unknown>;
  placeholder?: string;
  onChange?: (data: {
    html: string;
    plaintext: string;
    json: Record<string, unknown>;
    wordCount: number;
    charCount: number;
  }) => void;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
}

// ─── Toolbar Button ────────────────────────────────────────────────────────────

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

function ToolbarButton({ onClick, isActive, disabled, title, children, className }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={isActive}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md transition-all text-sm",
        "hover:bg-primary/10 hover:text-primary",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        isActive ? "bg-primary/15 text-primary" : "text-muted-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

// ─── TipTap Editor ────────────────────────────────────────────────────────────

export function TipTapEditor({
  content,
  placeholder = "Mulai menulis konten berita...",
  onChange,
  className,
  minHeight = 400,
  maxHeight = 800,
}: TipTapEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline cursor-pointer" },
      }),
      Image.configure({
        HTMLAttributes: { class: "rounded-xl max-w-full mx-auto my-4 shadow-md" },
        allowBase64: true,
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: "rounded-xl bg-muted/80 border border-border/50 text-sm my-4",
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Youtube.configure({
        HTMLAttributes: { class: "w-full aspect-video rounded-xl my-4 shadow-md" },
      }),
    ],
    content: typeof content === "string" ? content : content || "",
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm sm:prose max-w-none focus:outline-none px-6 py-5",
          "text-foreground leading-relaxed",
          "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6",
          "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5",
          "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4",
          "[&_h4]:text-lg [&_h4]:font-medium [&_h4]:mb-2 [&_h4]:mt-3",
          "[&_p]:mb-3 [&_p]:leading-relaxed",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3",
          "[&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
          "[&_a]:text-primary [&_a]:underline",
          "[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono",
          "[&_hr]:border-border/50 [&_hr]:my-6",
          "[&_table]:border-collapse [&_table]:w-full",
          "[&_td]:border [&_td]:border-border [&_td]:p-2",
          "[&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted/50 [&_th]:font-semibold",
        ),
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange({
          html: editor.getHTML(),
          plaintext: editor.getText(),
          json: editor.getJSON() as Record<string, unknown>,
          wordCount: editor.storage.characterCount.words(),
          charCount: editor.storage.characterCount.characters(),
        });
      }
    },
    immediatelyRender: false,
  });

  // Sync external content change
  useEffect(() => {
    if (!editor || !content) return;
    const currentJson = JSON.stringify(editor.getJSON());
    const newContent = typeof content === "string" ? content : JSON.stringify(content);
    if (currentJson !== newContent) {
      editor.commands.setContent(content as string);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL Link:", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addYoutube = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("YouTube URL:");
    if (url) editor.commands.setYoutubeVideo({ src: url });
  }, [editor]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        editor.chain().focus().setImage({ src: event.target.result as string }).run();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [editor]);

  const addTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) return null;

  const wordCount = editor.storage.characterCount.words();
  const charCount = editor.storage.characterCount.characters();

  return (
    <div className={cn("flex flex-col rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm", className)}>
      {/* ── Toolbar ── */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-border/50 bg-card/95 backdrop-blur-sm px-3 py-2">

        {/* History */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Hapus Format">
          <RemoveFormatting className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Headings Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary">
              <Type className="h-3.5 w-3.5" />
              {editor.isActive("heading", { level: 1 }) ? "H1"
                : editor.isActive("heading", { level: 2 }) ? "H2"
                  : editor.isActive("heading", { level: 3 }) ? "H3"
                    : editor.isActive("heading", { level: 4 }) ? "H4"
                      : "Teks"}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44 border-border/50 bg-card/95 backdrop-blur-xl">
            <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()} className={cn("gap-2 cursor-pointer", editor.isActive("paragraph") && "bg-primary/10 text-primary")}>
              <Type className="h-4 w-4" /> Paragraf
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={cn("gap-2 cursor-pointer", editor.isActive("heading", { level: 1 }) && "bg-primary/10 text-primary")}>
              <Heading1 className="h-4 w-4" /> Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={cn("gap-2 cursor-pointer", editor.isActive("heading", { level: 2 }) && "bg-primary/10 text-primary")}>
              <Heading2 className="h-4 w-4" /> Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={cn("gap-2 cursor-pointer", editor.isActive("heading", { level: 3 }) && "bg-primary/10 text-primary")}>
              <Heading3 className="h-4 w-4" /> Heading 3
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} className={cn("gap-2 cursor-pointer", editor.isActive("heading", { level: 4 }) && "bg-primary/10 text-primary")}>
              <Hash className="h-4 w-4" /> Heading 4
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Text Formatting */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title="Bold (Ctrl+B)">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title="Italic (Ctrl+I)">
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} title="Underline">
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} title="Strikethrough">
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive("code")} title="Inline Code">
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>

        {/* Highlight */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn("flex h-8 w-8 items-center justify-center rounded-md transition-all hover:bg-primary/10 hover:text-primary",
                editor.isActive("highlight") ? "bg-primary/15 text-primary" : "text-muted-foreground")}
              title="Highlight"
            >
              <Highlighter className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="border-border/50 bg-card/95 backdrop-blur-xl p-2">
            <div className="grid grid-cols-5 gap-1">
              {["#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff", "#fed7aa", "#f0abfc", "#a5f3fc", "remove"].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    if (color === "remove") editor.chain().focus().unsetHighlight().run();
                    else editor.chain().focus().setHighlight({ color }).run();
                  }}
                  className={cn("h-6 w-6 rounded border border-border/50 cursor-pointer hover:scale-110 transition-transform",
                    color === "remove" ? "flex items-center justify-center text-xs text-muted-foreground border-dashed" : "")}
                  style={{ backgroundColor: color !== "remove" ? color : undefined }}
                  title={color === "remove" ? "Hapus highlight" : color}
                >
                  {color === "remove" && "✕"}
                </button>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Text Color */}
        <label title="Warna Teks" className={cn("flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-all hover:bg-primary/10 text-muted-foreground hover:text-primary")}>
          <Palette className="h-3.5 w-3.5" />
          <input type="color" className="sr-only"
            value={editor.getAttributes("textStyle").color || "#000000"}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
        </label>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Lists */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} title="Bullet List">
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} title="Ordered List">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive("taskList")} title="Task List">
          <CheckSquare className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} title="Blockquote">
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Alignment */}
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} title="Rata Kiri">
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} title="Rata Tengah">
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} title="Rata Kanan">
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("justify").run()} isActive={editor.isActive({ textAlign: "justify" })} title="Rata Penuh">
          <AlignJustify className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Insert */}
        <ToolbarButton onClick={setLink} isActive={editor.isActive("link")} title="Insert Link">
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => imageInputRef.current?.click()} title="Insert Image">
          <ImageIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={addTable} title="Insert Table">
          <TableIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={addYoutube} title="Embed YouTube">
          <YoutubeIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Garis Pemisah">
          <Minus className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive("codeBlock")} title="Code Block">
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {/* ── Bubble Menu (on text selection) ── */}
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}
        className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-card/95 p-1 shadow-xl backdrop-blur-xl"
      >
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")}>
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")}>
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")}>
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={setLink} isActive={editor.isActive("link")}>
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()} isActive={editor.isActive("highlight")}>
          <Highlighter className="h-3.5 w-3.5" />
        </ToolbarButton>
      </BubbleMenu>

      {/* Hidden image input */}
      <input ref={imageInputRef} type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />

      {/* ── Editor Area ── */}
      <div
        className="overflow-y-auto cursor-text"
        style={{ minHeight, maxHeight }}
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between border-t border-border/40 bg-muted/20 px-4 py-2">
        <p className="text-xs text-muted-foreground">
          <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">Enter</kbd> paragraf baru ·{" "}
          <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">Shift+Enter</kbd> baris baru
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{wordCount.toLocaleString("id-ID")} kata</span>
          <span className="text-border">·</span>
          <span>{charCount.toLocaleString("id-ID")} karakter</span>
        </div>
      </div>
    </div>
  );
}
