import { Loader2 } from "lucide-react";

interface OutputConsoleProps {
  output: string;
  error: string | null;
  isRunning: boolean;
}

export function OutputConsole({ output, error, isRunning }: OutputConsoleProps) {
  return (
    <div className="h-full overflow-auto p-4 font-mono text-sm bg-[#1e1e1e]">
      {isRunning ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Running code...</span>
        </div>
      ) : error ? (
        <div className="text-red-400 whitespace-pre-wrap">{error}</div>
      ) : output ? (
        <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
      ) : (
        <div className="text-muted-foreground">
          <p>Console output will appear here</p>
          <p className="text-xs mt-1">Run your code to see results</p>
        </div>
      )}
    </div>
  );
}
