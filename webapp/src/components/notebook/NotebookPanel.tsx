import { useRef } from "react";
import { Plus, Code2, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotebookCell } from "./NotebookCell";
import { NotebookToolbar } from "./NotebookToolbar";
import { useNotebookCellsContext } from "@/hooks/NotebookCellsContext";
import { usePyodideContext } from "@/hooks/PyodideContext";

const NotebookPanel = () => {
  const {
    pyodideState,
    uploadCsv,
    loadDemoData,
    csvFileName,
    hasUploadedData,
    isUsingDemoData,
  } = usePyodideContext();

  const {
    cells,
    activeCellId,
    addCell,
    deleteCell,
    updateCellContent,
    moveCell,
    setActiveCell,
    convertCellType,
    runCell,
    runAllCells,
    clearAllOutputs,
  } = useNotebookCellsContext();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if any cell is running
  const isAnyRunning = cells.some((c) => c.isRunning);

  const handleUploadCSV = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      uploadCsv(content, file.name);
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    event.target.value = "";
  };

  const handleAddCodeCell = () => {
    addCell("code", activeCellId || undefined);
  };

  const handleAddMarkdownCell = () => {
    addCell("markdown", activeCellId || undefined);
  };

  // Show loading overlay while Pyodide initializes
  if (pyodideState.isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-8 rounded-lg bg-card border border-border">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {pyodideState.loadingMessage || "Initializing Python..."}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This may take a moment on first load
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if Pyodide failed to load
  if (pyodideState.error) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-8 rounded-lg bg-destructive/10 border border-destructive">
          <p className="text-sm font-medium text-destructive">
            Failed to load Python environment
          </p>
          <p className="text-xs text-muted-foreground">{pyodideState.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <NotebookToolbar
        csvFileName={csvFileName}
        isUsingDemoData={isUsingDemoData}
        hasUploadedData={hasUploadedData}
        pyodideReady={pyodideState.isReady}
        isRunning={isAnyRunning}
        onUploadCSV={handleUploadCSV}
        onLoadDemoData={loadDemoData}
        onAddCodeCell={handleAddCodeCell}
        onAddMarkdownCell={handleAddMarkdownCell}
        onRunAll={runAllCells}
        onClearOutputs={clearAllOutputs}
        fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
        onFileChange={handleFileChange}
      />

      {/* Cells */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {cells.map((cell, index) => (
            <NotebookCell
              key={cell.id}
              cell={cell}
              isActive={cell.id === activeCellId}
              isFirst={index === 0}
              isLast={index === cells.length - 1}
              pyodideReady={pyodideState.isReady}
              onSelect={() => setActiveCell(cell.id)}
              onContentChange={(content) => updateCellContent(cell.id, content)}
              onRun={() => runCell(cell.id)}
              onDelete={() => deleteCell(cell.id)}
              onMoveUp={() => moveCell(cell.id, "up")}
              onMoveDown={() => moveCell(cell.id, "down")}
              onConvertType={(type) => convertCellType(cell.id, type)}
            />
          ))}

          {/* Add Cell Button at Bottom */}
          <div className="flex justify-center gap-2 py-4">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={handleAddCodeCell}
            >
              <Plus className="h-4 w-4" />
              <Code2 className="h-4 w-4" />
              Code
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={handleAddMarkdownCell}
            >
              <Plus className="h-4 w-4" />
              <FileText className="h-4 w-4" />
              Markdown
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default NotebookPanel;
