import { useState } from "react";
import {
  Play,
  Trash2,
  ChevronUp,
  ChevronDown,
  Code2,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CodeEditor } from "./CodeEditor";
import { CellOutput } from "./CellOutput";
import type { Cell, CellType } from "@/hooks/useNotebookCells";
import ReactMarkdown from "react-markdown";

interface NotebookCellProps {
  cell: Cell;
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
  pyodideReady: boolean;
  onSelect: () => void;
  onContentChange: (content: string) => void;
  onRun: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onConvertType: (type: CellType) => void;
}

export function NotebookCell({
  cell,
  isActive,
  isFirst,
  isLast,
  pyodideReady,
  onSelect,
  onContentChange,
  onRun,
  onDelete,
  onMoveUp,
  onMoveDown,
  onConvertType,
}: NotebookCellProps) {
  const [isEditing, setIsEditing] = useState(cell.type === "code");

  const handleDoubleClick = () => {
    if (cell.type === "markdown") {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    if (cell.type === "markdown") {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Run cell with Shift+Enter
    if (e.shiftKey && e.key === "Enter" && cell.type === "code") {
      e.preventDefault();
      onRun();
    }
    // Exit markdown edit mode with Escape
    if (e.key === "Escape" && cell.type === "markdown") {
      setIsEditing(false);
    }
  };

  const getCellBorderColor = () => {
    if (cell.isRunning) return "border-l-green-500";
    if (isActive) return "border-l-blue-500";
    return "border-l-transparent";
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "group relative border border-border rounded-md overflow-hidden transition-all",
          "border-l-4",
          getCellBorderColor(),
          isActive && "ring-1 ring-blue-500/30"
        )}
        onClick={onSelect}
      >
        {/* Cell Toolbar */}
        <div className={cn(
          "flex items-center justify-between px-2 py-1.5 bg-muted/30 border-b border-border",
          "opacity-50 group-hover:opacity-100 transition-opacity"
        )}>
          <div className="flex items-center gap-1">
            {cell.type === "code" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRun();
                    }}
                    disabled={!pyodideReady || cell.isRunning}
                  >
                    {cell.isRunning ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Run cell (Shift+Enter)</p>
                </TooltipContent>
              </Tooltip>
            )}

            <span className="text-xs text-muted-foreground px-2">
              {cell.type === "code" ? "Code" : "Markdown"}
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveUp();
                  }}
                  disabled={isFirst}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Move up</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveDown();
                  }}
                  disabled={isLast}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Move down</p>
              </TooltipContent>
            </Tooltip>

            <div className="w-px h-4 bg-border mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConvertType(cell.type === "code" ? "markdown" : "code");
                  }}
                >
                  {cell.type === "code" ? (
                    <FileText className="h-3.5 w-3.5" />
                  ) : (
                    <Code2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Convert to {cell.type === "code" ? "Markdown" : "Code"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Delete cell</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Cell Content */}
        <div
          onDoubleClick={handleDoubleClick}
          onKeyDown={handleKeyDown}
        >
          {cell.type === "code" ? (
            <div className="min-h-[60px]">
              <CodeEditor
                code={cell.content}
                onChange={onContentChange}
              />
            </div>
          ) : isEditing ? (
            <div className="min-h-[60px]" onBlur={handleBlur}>
              <textarea
                className="w-full min-h-[60px] p-3 bg-[#1e1e1e] text-foreground font-mono text-sm resize-none border-none outline-none"
                value={cell.content}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="# Markdown content..."
                autoFocus
              />
            </div>
          ) : (
            <div className="min-h-[40px] p-3 prose prose-invert prose-sm max-w-none">
              {cell.content ? (
                <ReactMarkdown>{cell.content}</ReactMarkdown>
              ) : (
                <p className="text-muted-foreground italic">
                  Double-click to edit markdown
                </p>
              )}
            </div>
          )}
        </div>

        {/* Cell Output (only for code cells) */}
        {cell.type === "code" && (
          <CellOutput
            output={cell.output}
            error={cell.error}
            isRunning={cell.isRunning}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
