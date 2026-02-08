import { useState, useEffect, useRef } from 'react';

interface DataCleaningVisualizerProps {
  isVisible: boolean;
  stage: 'cleaning' | 'analyzing' | 'generating';
  cleaningData?: {
    totalRows: number;
    columns: string[];
  };
}

interface CellData {
  id: string;
  row: number;
  col: number;
  value: string;
  isCleaned: boolean;
  hasError: boolean;
  isProcessing: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  speed: number;
}

// Generate random data values for cells
const generateRandomValue = (isError: boolean): string => {
  if (isError) {
    const errorValues = ['NULL', 'NaN', '#ERR', '???', 'undef', '-', ''];
    return errorValues[Math.floor(Math.random() * errorValues.length)];
  }
  const cleanValues = ['0.847', '1.234', 'TRUE', '42.5', 'valid', '100%', '3.14', '2.718'];
  return cleanValues[Math.floor(Math.random() * cleanValues.length)];
};

// Generate glitchy text effect
const glitchText = (text: string): string => {
  const glitchChars = '!@#$%^&*_+-=|;:<>?/~';
  return text
    .split('')
    .map((char) => (Math.random() > 0.7 ? glitchChars[Math.floor(Math.random() * glitchChars.length)] : char))
    .join('');
};

const DataCleaningVisualizer = ({ isVisible, stage, cleaningData }: DataCleaningVisualizerProps) => {
  const [cells, setCells] = useState<CellData[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [stats, setStats] = useState({
    rowsProcessed: 0,
    nullsRemoved: 0,
    outliersDetected: 0,
    dataQuality: 0,
  });
  const [matrixLines, setMatrixLines] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const errorCellCountRef = useRef<number>(0);

  const totalRows = cleaningData?.totalRows || 1247;
  const columns = cleaningData?.columns || ['id', 'value', 'status', 'score', 'date', 'flag'];

  const GRID_ROWS = 8;
  const GRID_COLS = 6;
  const ANIMATION_DURATION = 7000;

  // Initialize cells
  useEffect(() => {
    if (!isVisible) {
      setIsAnimating(false);
      return;
    }

    const initialCells: CellData[] = [];
    let errorCount = 0;
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const hasError = Math.random() > 0.65;
        if (hasError) errorCount++;
        initialCells.push({
          id: `${row}-${col}`,
          row,
          col,
          value: generateRandomValue(hasError),
          isCleaned: false,
          hasError,
          isProcessing: false,
        });
      }
    }
    setCells(initialCells);
    errorCellCountRef.current = errorCount;
    setStats({ rowsProcessed: 0, nullsRemoved: 0, outliersDetected: 0, dataQuality: 0 });
    setParticles([]);
    setMatrixLines([]);
    startTimeRef.current = Date.now();
    setIsAnimating(true);
  }, [isVisible]);

  // Generate matrix rain effect
  useEffect(() => {
    if (!isVisible) return;

    const generateMatrixLine = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*';
      return Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };

    const interval = setInterval(() => {
      setMatrixLines((prev) => {
        const newLines = [...prev, generateMatrixLine()];
        if (newLines.length > 15) newLines.shift();
        return newLines;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Main animation loop
  useEffect(() => {
    if (!isVisible || !isAnimating) return;

    const errorCells = errorCellCountRef.current;

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

      // Update cells progressively with ripple effect
      setCells((prevCells) => {
        return prevCells.map((cell) => {
          const diagonalIndex = cell.row + cell.col;
          const maxDiagonal = GRID_ROWS + GRID_COLS - 2;
          const cleanThreshold = progress * maxDiagonal * 1.2;

          const shouldProcess = diagonalIndex <= cleanThreshold && !cell.isCleaned;
          const shouldClean = diagonalIndex < cleanThreshold - 1;

          if (shouldClean && !cell.isCleaned) {
            return {
              ...cell,
              isProcessing: false,
              isCleaned: true,
              value: generateRandomValue(false),
            };
          } else if (shouldProcess && !cell.isCleaned) {
            return {
              ...cell,
              isProcessing: true,
            };
          }
          return cell;
        });
      });

      // Update stats with easing
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setStats({
        rowsProcessed: Math.floor(easedProgress * totalRows),
        nullsRemoved: Math.floor(easedProgress * Math.floor(errorCells * 0.8)),
        outliersDetected: Math.floor(easedProgress * Math.floor(errorCells * 0.3)),
        dataQuality: Math.floor(40 + easedProgress * 58),
      });

      // Generate particles
      if (Math.random() > 0.7) {
        setParticles((prev) => {
          const newParticle: Particle = {
            id: Date.now() + Math.random(),
            x: Math.random() * 100,
            y: Math.random() * 20,
            color: Math.random() > 0.5 ? '#06b6d4' : '#22d3ee',
            size: 2 + Math.random() * 3,
            speed: 2 + Math.random() * 3,
          };
          const filtered = prev.filter((p) => p.y < 100);
          return [...filtered.slice(-20), newParticle];
        });
      }

      // Update particle positions
      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          y: p.y + p.speed,
        }))
      );

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, isAnimating, totalRows]);

  // Circular progress component
  const CircularProgress = ({ value, size = 80 }: { value: number; size?: number }) => {
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-zinc-800"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#gradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
              transition: 'stroke-dashoffset 0.5s ease-out',
            }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-cyan-400 font-mono">{value}%</span>
        </div>
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-md animate-in fade-in duration-300">
      {/* Matrix rain background */}
      <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
        {matrixLines.map((line, i) => (
          <div
            key={i}
            className="absolute text-cyan-500 font-mono text-xs whitespace-nowrap animate-pulse"
            style={{
              left: `${(i * 7) % 100}%`,
              top: `${i * 40}px`,
              opacity: 0.5,
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full transition-all duration-100"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            }}
          />
        ))}
      </div>

      {/* Main content container */}
      <div className="relative flex flex-col lg:flex-row gap-6 p-6 max-w-5xl w-full mx-4 animate-in zoom-in-95 duration-400">
        {/* Data Grid Section */}
        <div className="flex-1">
          <div className="mb-4 animate-in slide-in-from-bottom duration-300">
            <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2 font-mono">
              <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              {stage === 'cleaning' ? 'AI DATA CLEANING' : stage === 'analyzing' ? 'AI DATA ANALYSIS' : 'AI GENERATING'}
            </h2>
            <p className="text-zinc-500 text-sm font-mono mt-1">
              {stage === 'cleaning'
                ? `Processing ${totalRows.toLocaleString()} rows`
                : stage === 'analyzing'
                ? 'Analyzing patterns and insights...'
                : 'Generating recommendations...'}
            </p>
          </div>

          {/* Column Headers */}
          <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}>
            {columns.slice(0, GRID_COLS).map((col, i) => (
              <div
                key={col}
                className="text-xs font-mono text-zinc-500 px-2 py-1 text-center truncate animate-in fade-in duration-300"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {col}
              </div>
            ))}
          </div>

          {/* Data Grid */}
          <div
            className="grid gap-1 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800"
            style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}
          >
            {cells.map((cell, index) => (
              <div
                key={cell.id}
                className={`
                  relative px-2 py-1.5 rounded text-xs font-mono text-center
                  transition-all duration-300 ease-out
                  ${cell.isCleaned
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                    : cell.isProcessing
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse'
                    : cell.hasError
                    ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                    : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700'}
                `}
                style={{
                  animationDelay: `${index * 10}ms`,
                }}
              >
                {/* Glow effect for processing cells */}
                {cell.isProcessing && (
                  <div
                    className="absolute inset-0 rounded animate-pulse"
                    style={{
                      boxShadow: '0 0 15px rgba(251, 191, 36, 0.5)',
                    }}
                  />
                )}

                <span className="relative z-10">
                  {cell.isProcessing ? glitchText(cell.value) : cell.value}
                </span>
              </div>
            ))}
          </div>

          {/* Processing indicator */}
          <div className="mt-3 flex items-center gap-2 animate-in fade-in duration-500 delay-300">
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-300 ease-out"
                style={{ width: `${(stats.rowsProcessed / totalRows) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono text-zinc-500">
              {Math.round((stats.rowsProcessed / totalRows) * 100)}%
            </span>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="w-full lg:w-72 space-y-4 animate-in slide-in-from-right duration-400 delay-200">
          <div className="bg-zinc-900/70 rounded-lg border border-zinc-800 p-4">
            <h3 className="text-sm font-mono text-zinc-400 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              LIVE METRICS
            </h3>

            {/* Data Quality Ring */}
            <div className="flex justify-center mb-6">
              <CircularProgress value={stats.dataQuality} />
            </div>
            <p className="text-center text-xs font-mono text-zinc-500 mb-6">Data Quality Score</p>

            {/* Stats */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-zinc-500">Rows Processed</span>
                <span className="text-sm font-mono text-cyan-400 tabular-nums">
                  {stats.rowsProcessed.toLocaleString()} / {totalRows.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-zinc-500">Nulls Removed</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-red-400/60">0</span>
                  <span className="text-cyan-400 animate-pulse">-&gt;</span>
                  <span className="text-sm font-mono text-emerald-400 tabular-nums">
                    {stats.nullsRemoved}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-zinc-500">Outliers Detected</span>
                <span className="text-sm font-mono text-amber-400 tabular-nums">
                  {stats.outliersDetected}
                </span>
              </div>
            </div>
          </div>

          {/* Stage indicator */}
          <div className="bg-zinc-900/70 rounded-lg border border-zinc-800 p-4">
            <h3 className="text-sm font-mono text-zinc-400 mb-3">CURRENT STAGE</h3>
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"
                style={{
                  boxShadow: '0 0 15px rgba(6, 182, 212, 0.5)',
                }}
              />
              <span className="text-sm font-mono text-cyan-400 capitalize">{stage}</span>
            </div>

            <div className="mt-3 space-y-2">
              {(['cleaning', 'analyzing', 'generating'] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                      s === stage
                        ? 'bg-cyan-400'
                        : i < ['cleaning', 'analyzing', 'generating'].indexOf(stage)
                        ? 'bg-emerald-500'
                        : 'bg-zinc-700'
                    }`}
                  />
                  <span
                    className={`text-xs font-mono capitalize transition-colors duration-300 ${
                      s === stage ? 'text-cyan-400' : 'text-zinc-600'
                    }`}
                  >
                    {s}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scan line effect */}
      <div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none"
        style={{
          animation: 'scanline 3s linear infinite',
        }}
      />

      {/* CSS Keyframes */}
      <style>{`
        @keyframes scanline {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default DataCleaningVisualizer;
