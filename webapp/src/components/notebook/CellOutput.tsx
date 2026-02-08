import { Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CellOutputProps {
  output?: string;
  error?: string;
  isRunning?: boolean;
}

export function CellOutput({ output, error, isRunning }: CellOutputProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Don't render if there's no output, error, or running state
  if (!output && !error && !isRunning) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border-t border-border bg-[#1a1a1a]">
        <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/20 transition-colors">
          {isOpen ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <span>Output</span>
          {isRunning && (
            <Loader2 className="h-3 w-3 animate-spin ml-auto" />
          )}
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className={cn(
            "px-4 py-3 font-mono text-sm overflow-auto max-h-[300px]",
            error ? "bg-red-950/30" : "bg-[#1e1e1e]"
          )}>
            {isRunning ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Running code...</span>
              </div>
            ) : error ? (
              <pre className="text-red-400 whitespace-pre-wrap text-xs">{error}</pre>
            ) : output ? (
              <pre className="text-green-400 whitespace-pre-wrap text-xs">{output}</pre>
            ) : null}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
