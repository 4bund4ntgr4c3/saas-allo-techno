import { useRef, useCallback } from "react";
import { Bold, Italic, Heading2, List, Quote, Minus, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

function execCmd(cmd: string, value?: string) {
  document.execCommand(cmd, false, value);
}

export function RichTextEditor({ value, onChange, placeholder, className }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const toolbarBtn = (cmd: string, icon: React.ReactNode, label: string, val?: string) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      title={label}
      onMouseDown={(e) => {
        e.preventDefault();
        editorRef.current?.focus();
        execCmd(cmd, val);
      }}
    >
      {icon}
    </Button>
  );

  return (
    <div className={`rounded-sm border border-border bg-card ${className ?? ""}`}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1">
        {toolbarBtn("bold", <Bold className="size-3.5" />, "Bold")}
        {toolbarBtn("italic", <Italic className="size-3.5" />, "Italic")}
        {toolbarBtn("formatBlock", <Heading2 className="size-3.5" />, "Heading", "<h2>")}
        {toolbarBtn("insertUnorderedList", <List className="size-3.5" />, "List")}
        {toolbarBtn("formatBlock", <Quote className="size-3.5" />, "Quote", "<blockquote>")}
        {toolbarBtn("insertHorizontalRule", <Minus className="size-3.5" />, "Separator")}
        <div className="mx-1 h-4 w-px bg-border" />
        {toolbarBtn("undo", <Undo2 className="size-3.5" />, "Undo")}
        {toolbarBtn("redo", <Redo2 className="size-3.5" />, "Redo")}
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[14rem] p-4 text-sm leading-relaxed focus:outline-none prose prose-sm prose-headings:font-semibold prose-a:text-primary prose-a:underline max-w-none [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-lg [&_hr]:my-4 [&_hr]:border-border [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-2"
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={handleInput}
        data-placeholder={placeholder}
      />
    </div>
  );
}
