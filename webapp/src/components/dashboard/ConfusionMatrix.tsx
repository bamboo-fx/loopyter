import { cn } from '@/lib/utils';

interface ConfusionMatrixProps {
  matrix: number[][] | null;
}

export function ConfusionMatrix({ matrix }: ConfusionMatrixProps) {
  if (!matrix || matrix.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p className="text-sm">No confusion matrix data available</p>
      </div>
    );
  }

  // Find the max value for color intensity scaling
  const maxValue = Math.max(...matrix.flat());

  // Calculate color intensity based on value
  const getCellColor = (value: number): string => {
    if (maxValue === 0) return 'bg-primary/10';
    const intensity = value / maxValue;

    // Using primary color (cyan/teal) with varying opacity
    if (intensity > 0.8) return 'bg-primary/80';
    if (intensity > 0.6) return 'bg-primary/60';
    if (intensity > 0.4) return 'bg-primary/40';
    if (intensity > 0.2) return 'bg-primary/20';
    return 'bg-primary/10';
  };

  const getTextColor = (value: number): string => {
    if (maxValue === 0) return 'text-foreground';
    const intensity = value / maxValue;
    return intensity > 0.5 ? 'text-primary-foreground' : 'text-foreground';
  };

  // Generate labels (Predicted vs Actual)
  const size = matrix.length;
  const labels = Array.from({ length: size }, (_, i) => `Class ${i}`);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center">
        <span className="text-xs text-muted-foreground font-medium">Predicted</span>
      </div>
      <div className="flex">
        <div className="flex flex-col items-center justify-center pr-2">
          <span
            className="text-xs text-muted-foreground font-medium"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Actual
          </span>
        </div>
        <div className="flex-1">
          {/* Header row with predicted labels */}
          <div className="flex">
            <div className="w-12 h-8" /> {/* Empty corner */}
            {labels.map((label, i) => (
              <div
                key={`header-${i}`}
                className="flex-1 h-8 flex items-center justify-center text-xs text-muted-foreground font-medium"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Matrix rows */}
          {matrix.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="flex">
              {/* Row label (actual) */}
              <div className="w-12 h-12 flex items-center justify-center text-xs text-muted-foreground font-medium">
                {labels[rowIndex]}
              </div>

              {/* Matrix cells */}
              {row.map((value, colIndex) => (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  className={cn(
                    'flex-1 h-12 flex items-center justify-center border border-border/50 rounded-sm m-0.5 transition-colors',
                    getCellColor(value),
                    getTextColor(value)
                  )}
                >
                  <span className="text-sm font-semibold">{value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-primary/10 border border-border/50" />
          <span className="text-xs text-muted-foreground">Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-primary/80" />
          <span className="text-xs text-muted-foreground">High</span>
        </div>
      </div>
    </div>
  );
}
