import { useState } from "react";
import { Trophy, Clock, Sparkles, Terminal, Grid3X3, FileCode, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotebook } from "@/hooks/useNotebook";
import { useNotebookCellsContext } from "@/hooks/NotebookCellsContext";
import { cn } from "@/lib/utils";

// Type for the Run from useNotebook
interface Run {
  id: string;
  sessionId: string;
  name: string;
  code: string;
  accuracy: number;
  precision: number | null;
  recall: number | null;
  f1Score: number | null;
  modelType: string;
  datasetRows: number | null;
  datasetColumns: number | null;
  datasetFeatures: string | null;
  confusionMatrix: string | null;
  stdout: string | null;
  error: string | null;
  isImproved: boolean;
  explanation: string | null;
  createdAt: string;
}

// Helper to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hr ago`;
  } else {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }
}

// Helper to get rank display with medal emoji
function getRankDisplay(rank: number): React.ReactNode {
  if (rank === 1) {
    return <span className="text-yellow-500 font-bold">1st</span>;
  } else if (rank === 2) {
    return <span className="text-gray-400 font-bold">2nd</span>;
  } else if (rank === 3) {
    return <span className="text-amber-600 font-bold">3rd</span>;
  }
  return <span className="text-muted-foreground">{rank}th</span>;
}

// Confusion Matrix display component
function ConfusionMatrixDisplay({ matrix }: { matrix: number[][] }) {
  return (
    <div className="grid grid-cols-2 gap-1 w-fit">
      {matrix.map((row, i) =>
        row.map((cell, j) => (
          <div
            key={`${i}-${j}`}
            className={cn(
              "w-12 h-12 flex items-center justify-center text-sm font-mono rounded",
              i === j
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            )}
          >
            {cell}
          </div>
        ))
      )}
    </div>
  );
}

const RunsPanel = () => {
  const { runs } = useNotebook();
  const { cellResults, cells } = useNotebookCellsContext();
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [selectedDetectedRun, setSelectedDetectedRun] = useState<{
    cellId: string;
    modelType: string | null;
    accuracy: number;
    precision: number | null;
    recall: number | null;
    f1Score: number | null;
    confusionMatrix: number[][] | null;
    summary: string;
    code: string;
    output: string;
  } | null>(null);

  // Combine saved runs with detected runs from cells
  const { detectedRuns } = cellResults;

  // Get cell code and output for detected runs
  const detectedRunsWithDetails = detectedRuns.map((dr) => {
    const cell = cells.find((c) => c.id === dr.cellId);
    return {
      ...dr,
      code: cell?.content || '',
      output: cell?.output || '',
    };
  });

  // Sort runs by accuracy descending
  const sortedRuns = [...runs].sort((a, b) => b.accuracy - a.accuracy);

  // Calculate best accuracy across both saved runs and detected runs
  const savedBestAccuracy = sortedRuns.length > 0 ? sortedRuns[0].accuracy : 0;
  const detectedBestAccuracy = detectedRunsWithDetails.length > 0
    ? Math.max(...detectedRunsWithDetails.map(r => r.accuracy))
    : 0;
  const bestAccuracy = Math.max(savedBestAccuracy, detectedBestAccuracy);

  const totalRuns = sortedRuns.length + detectedRunsWithDetails.length;

  // Parse confusion matrix from JSON string
  const parseConfusionMatrix = (matrixStr: string | null): number[][] | null => {
    if (!matrixStr) return null;
    try {
      return JSON.parse(matrixStr);
    } catch {
      return null;
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-auto">
      {/* Leaderboard Header */}
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-accent" />
        <h3 className="text-lg font-semibold text-foreground">
          Model Leaderboard
        </h3>
        {totalRuns > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {totalRuns} model{totalRuns > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Detected Models from Current Session */}
      {detectedRunsWithDetails.length > 0 && (
        <Card className="border-border bg-card border-cyan-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-cyan-400" />
              <CardTitle className="text-sm font-medium">
                Detected Models (Current Session)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground w-16">Rank</TableHead>
                  <TableHead className="text-muted-foreground">Model Type</TableHead>
                  <TableHead className="text-muted-foreground w-24">R² / Accuracy</TableHead>
                  <TableHead className="text-muted-foreground">Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detectedRunsWithDetails
                  .sort((a, b) => b.accuracy - a.accuracy)
                  .map((run, index) => {
                    const rank = index + 1;
                    const isBest = run.accuracy === bestAccuracy;

                    return (
                      <TableRow
                        key={run.cellId}
                        className={cn(
                          "border-border cursor-pointer transition-colors",
                          isBest && "bg-accent/5 border-l-2 border-l-accent",
                          "hover:bg-muted/50"
                        )}
                        onClick={() => setSelectedDetectedRun(run)}
                      >
                        <TableCell className="font-medium">
                          {getRankDisplay(rank)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {run.modelType || "Unknown Model"}
                            </span>
                            <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-400/30">
                              <Brain className="h-3 w-3 mr-0.5" />
                              Auto-detected
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "font-mono",
                              isBest ? "font-bold text-accent" : "text-foreground"
                            )}
                          >
                            {(run.accuracy * 100).toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                          {run.summary}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Saved Runs Table */}
      <Card className="flex-1 border-border bg-card overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {sortedRuns.length > 0 ? "Saved Runs" : "No models detected yet"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100%-60px)]">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground w-16">Rank</TableHead>
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground w-24">Accuracy</TableHead>
                  <TableHead className="text-muted-foreground w-32">Model</TableHead>
                  <TableHead className="text-muted-foreground w-24">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRuns.length === 0 && detectedRunsWithDetails.length === 0 ? (
                  <TableRow className="border-border">
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Clock className="h-8 w-8 mb-2 opacity-50" />
                        <p className="font-medium">No models detected yet</p>
                        <p className="text-sm">
                          Run code with a model to see results here
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedRuns.length === 0 ? (
                  <TableRow className="border-border">
                    <TableCell colSpan={5} className="h-16 text-center text-muted-foreground text-sm">
                      No saved runs - use AI tab to save improved experiments
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedRuns.map((run, index) => {
                    const rank = index + 1;
                    const isBest = run.accuracy === bestAccuracy;

                    return (
                      <TableRow
                        key={run.id}
                        className={cn(
                          "border-border cursor-pointer transition-colors",
                          isBest && "bg-accent/5 border-l-2 border-l-accent",
                          "hover:bg-muted/50"
                        )}
                        onClick={() => setSelectedRun(run)}
                      >
                        <TableCell className="font-medium">
                          {getRankDisplay(rank)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {run.name}
                            </span>
                            {run.isImproved && (
                              <Badge
                                variant="default"
                                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-1.5 py-0"
                              >
                                <Sparkles className="h-3 w-3 mr-0.5" />
                                AI
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "font-mono",
                              isBest ? "font-bold text-accent" : "text-foreground"
                            )}
                          >
                            {(run.accuracy * 100).toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {run.modelType}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatRelativeTime(run.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Run Details Sheet */}
      <Sheet open={!!selectedRun} onOpenChange={(open) => !open && setSelectedRun(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-hidden flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedRun?.name}
              {selectedRun?.isImproved && (
                <Badge
                  variant="default"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Improved
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription>
              {selectedRun?.modelType} - {selectedRun ? formatRelativeTime(selectedRun.createdAt) : ""}
            </SheetDescription>
          </SheetHeader>

          {selectedRun && (
            <Tabs defaultValue="metrics" className="flex-1 flex flex-col overflow-hidden mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="output">Output</TabsTrigger>
              </TabsList>

              {/* Metrics Tab */}
              <TabsContent value="metrics" className="flex-1 overflow-auto">
                <div className="space-y-6 py-4">
                  {/* Main Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Accuracy
                      </p>
                      <p className="text-2xl font-bold text-accent mt-1">
                        {(selectedRun.accuracy * 100).toFixed(2)}%
                      </p>
                    </div>
                    {selectedRun.precision !== null && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Precision
                        </p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {(selectedRun.precision * 100).toFixed(2)}%
                        </p>
                      </div>
                    )}
                    {selectedRun.recall !== null && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Recall
                        </p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {(selectedRun.recall * 100).toFixed(2)}%
                        </p>
                      </div>
                    )}
                    {selectedRun.f1Score !== null && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          F1 Score
                        </p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {(selectedRun.f1Score * 100).toFixed(2)}%
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confusion Matrix */}
                  {selectedRun.confusionMatrix && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-sm font-medium text-foreground">
                          Confusion Matrix
                        </h4>
                      </div>
                      {(() => {
                        const matrix = parseConfusionMatrix(selectedRun.confusionMatrix);
                        return matrix ? (
                          <ConfusionMatrixDisplay matrix={matrix} />
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Unable to parse confusion matrix
                          </p>
                        );
                      })()}
                    </div>
                  )}

                  {/* AI Explanation */}
                  {selectedRun.explanation && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                        <h4 className="text-sm font-medium text-foreground">
                          AI Explanation
                        </h4>
                      </div>
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
                        {selectedRun.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Code Tab */}
              <TabsContent value="code" className="flex-1 overflow-hidden">
                <div className="h-full py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileCode className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium text-foreground">
                      Code Used
                    </h4>
                  </div>
                  <ScrollArea className="h-[calc(100%-40px)] rounded-lg border border-border bg-background/50">
                    <pre className="p-4 text-sm font-mono text-foreground whitespace-pre-wrap">
                      {selectedRun.code}
                    </pre>
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Output Tab */}
              <TabsContent value="output" className="flex-1 overflow-hidden">
                <div className="h-full py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Terminal className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium text-foreground">
                      Standard Output
                    </h4>
                  </div>
                  <ScrollArea className="h-[calc(100%-40px)] rounded-lg border border-border bg-background/50">
                    <pre className="p-4 text-sm font-mono text-foreground whitespace-pre-wrap">
                      {selectedRun.stdout || "No output"}
                    </pre>
                  </ScrollArea>
                  {selectedRun.error && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-red-400 mb-2">
                        Errors
                      </h4>
                      <ScrollArea className="h-32 rounded-lg border border-red-500/30 bg-red-500/10">
                        <pre className="p-4 text-sm font-mono text-red-400 whitespace-pre-wrap">
                          {selectedRun.error}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>

      {/* Detected Run Details Sheet */}
      <Sheet open={!!selectedDetectedRun} onOpenChange={(open) => !open && setSelectedDetectedRun(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-hidden flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedDetectedRun?.modelType || "Model Analysis"}
              <Badge variant="outline" className="text-cyan-400 border-cyan-400/30">
                <Brain className="h-3 w-3 mr-1" />
                Auto-detected
              </Badge>
            </SheetTitle>
            <SheetDescription>
              AI-detected model metrics from cell output
            </SheetDescription>
          </SheetHeader>

          {selectedDetectedRun && (
            <Tabs defaultValue="metrics" className="flex-1 flex flex-col overflow-hidden mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="output">Output</TabsTrigger>
              </TabsList>

              {/* Metrics Tab */}
              <TabsContent value="metrics" className="flex-1 overflow-auto">
                <div className="space-y-6 py-4">
                  {/* AI Summary */}
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-cyan-400" />
                      <span className="text-xs text-cyan-400 uppercase tracking-wide font-medium">
                        AI Analysis
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{selectedDetectedRun.summary}</p>
                  </div>

                  {/* Main Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        R² Score / Accuracy
                      </p>
                      <p className="text-2xl font-bold text-accent mt-1">
                        {(selectedDetectedRun.accuracy * 100).toFixed(2)}%
                      </p>
                    </div>
                    {selectedDetectedRun.precision !== null && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Precision
                        </p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {(selectedDetectedRun.precision * 100).toFixed(2)}%
                        </p>
                      </div>
                    )}
                    {selectedDetectedRun.recall !== null && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Recall
                        </p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {(selectedDetectedRun.recall * 100).toFixed(2)}%
                        </p>
                      </div>
                    )}
                    {selectedDetectedRun.f1Score !== null && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          F1 Score
                        </p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {(selectedDetectedRun.f1Score * 100).toFixed(2)}%
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confusion Matrix */}
                  {selectedDetectedRun.confusionMatrix && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-sm font-medium text-foreground">
                          Confusion Matrix
                        </h4>
                      </div>
                      <ConfusionMatrixDisplay matrix={selectedDetectedRun.confusionMatrix} />
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Code Tab */}
              <TabsContent value="code" className="flex-1 overflow-hidden">
                <div className="h-full py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileCode className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium text-foreground">
                      Code Used
                    </h4>
                  </div>
                  <ScrollArea className="h-[calc(100%-40px)] rounded-lg border border-border bg-background/50">
                    <pre className="p-4 text-sm font-mono text-foreground whitespace-pre-wrap">
                      {selectedDetectedRun.code || "No code available"}
                    </pre>
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Output Tab */}
              <TabsContent value="output" className="flex-1 overflow-hidden">
                <div className="h-full py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Terminal className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium text-foreground">
                      Standard Output
                    </h4>
                  </div>
                  <ScrollArea className="h-[calc(100%-40px)] rounded-lg border border-border bg-background/50">
                    <pre className="p-4 text-sm font-mono text-foreground whitespace-pre-wrap">
                      {selectedDetectedRun.output || "No output"}
                    </pre>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default RunsPanel;
