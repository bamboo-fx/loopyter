import { useRef } from "react";
import {
  Upload,
  PlayCircle,
  Plus,
  Code2,
  FileText,
  Trash2,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NotebookToolbarProps {
  csvFileName: string | null;
  isUsingDemoData: boolean;
  hasUploadedData: boolean;
  pyodideReady: boolean;
  isRunning: boolean;
  onUploadCSV: () => void;
  onLoadDemoData: () => void;
  onAddCodeCell: () => void;
  onAddMarkdownCell: () => void;
  onRunAll: () => void;
  onClearOutputs: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function NotebookToolbar({
  csvFileName,
  isUsingDemoData,
  hasUploadedData,
  pyodideReady,
  isRunning,
  onUploadCSV,
  onLoadDemoData,
  onAddCodeCell,
  onAddMarkdownCell,
  onRunAll,
  onClearOutputs,
  fileInputRef,
  onFileChange,
}: NotebookToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={onFileChange}
        className="hidden"
      />

      {/* Add Cell Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Cell
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={onAddCodeCell}>
            <Code2 className="h-4 w-4 mr-2" />
            Code Cell
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onAddMarkdownCell}>
            <FileText className="h-4 w-4 mr-2" />
            Markdown Cell
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6" />

      {/* Run All */}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={onRunAll}
        disabled={!pyodideReady || isRunning}
      >
        <PlayCircle className="h-4 w-4" />
        Run All
      </Button>

      {/* Clear Outputs */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground"
        onClick={onClearOutputs}
      >
        <Trash2 className="h-4 w-4" />
        Clear Outputs
      </Button>

      <div className="flex-1" />

      {/* Data Section */}
      <div className="flex items-center gap-2">
        {(hasUploadedData || isUsingDemoData) && (
          <Badge
            variant="secondary"
            className={cn(
              "gap-1.5",
              isUsingDemoData && "bg-amber-500/20 text-amber-400 border-amber-500/30"
            )}
          >
            <Database className="h-3 w-3" />
            {csvFileName || "data.csv"}
            {isUsingDemoData && " (demo)"}
          </Badge>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Upload className="h-4 w-4" />
              Data
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onUploadCSV}>
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLoadDemoData}>
              <Database className="h-4 w-4 mr-2" />
              Load Demo Data (Iris)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
