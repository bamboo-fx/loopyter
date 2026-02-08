import { useState, useEffect, useRef, useCallback } from 'react';
import { Check, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CleaningSummarySlideProps {
  cleaningResult: {
    cleaningOperations: Array<{
      type: string;
      column: string | null;
      description: string;
      action: string;
      impact: 'low' | 'medium' | 'high';
      rowsAffected: number;
    }>;
    summary: string;
    dataQualityScore: {
      before: number;
      after: number;
    };
    warnings: string[];
  };
  onApprove: () => void;
  onRequestChanges: (feedback: string) => void;
  isUsingDemoData?: boolean;
}

// Matrix rain character generator
const generateMatrixChar = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*';
  return chars[Math.floor(Math.random() * chars.length)];
};

// Typewriter hook
const useTypewriter = (text: string, speed: number = 30, startDelay: number = 0, enabled: boolean = true) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText('');
      setIsComplete(false);
      return;
    }

    setDisplayedText('');
    setIsComplete(false);

    const startTimeout = setTimeout(() => {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsComplete(true);
          clearInterval(interval);
        }
      }, speed);

      return () => clearInterval(interval);
    }, startDelay);

    return () => clearTimeout(startTimeout);
  }, [text, speed, startDelay, enabled]);

  return { displayedText, isComplete };
};

// Counting animation hook
const useCountUp = (end: number, duration: number = 2000, startDelay: number = 0, enabled: boolean = true) => {
  const [value, setValue] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      setValue(0);
      setIsComplete(false);
      return;
    }

    const timeout = setTimeout(() => {
      startTimeRef.current = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic

        setValue(Math.floor(eased * end));

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsComplete(true);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }, startDelay);

    return () => {
      clearTimeout(timeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [end, duration, startDelay, enabled]);

  return { value, isComplete };
};

// Particle burst component
const ParticleBurst = ({ trigger, x, y }: { trigger: boolean; x: number; y: number }) => {
  const [particles, setParticles] = useState<Array<{ id: number; angle: number; distance: number; size: number }>>([]);

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        angle: (i / 20) * 360 + Math.random() * 18,
        distance: 50 + Math.random() * 100,
        size: 2 + Math.random() * 4,
      }));
      setParticles(newParticles);
    }
  }, [trigger]);

  if (!trigger || particles.length === 0) return null;

  return (
    <div className="absolute pointer-events-none" style={{ left: x, top: y }}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-cyan-400"
          style={{
            width: particle.size,
            height: particle.size,
            boxShadow: `0 0 ${particle.size * 2}px #06b6d4`,
            animation: 'particleBurst 1s ease-out forwards',
            '--angle': `${particle.angle}deg`,
            '--distance': `${particle.distance}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

// Matrix rain background
const MatrixRain = () => {
  const [columns, setColumns] = useState<Array<{ id: number; x: number; chars: string[]; speed: number }>>([]);

  useEffect(() => {
    const cols = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: (i / 15) * 100,
      chars: Array.from({ length: 20 }, () => generateMatrixChar()),
      speed: 2 + Math.random() * 3,
    }));
    setColumns(cols);

    const interval = setInterval(() => {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          chars: col.chars.map(() => generateMatrixChar()),
        }))
      );
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
      {columns.map((col) => (
        <div
          key={col.id}
          className="absolute text-cyan-500 font-mono text-xs leading-4"
          style={{
            left: `${col.x}%`,
            top: 0,
            animation: `matrixFall ${10 / col.speed}s linear infinite`,
          }}
        >
          {col.chars.map((char, i) => (
            <div key={i} style={{ opacity: 1 - i * 0.05 }}>
              {char}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Circular progress ring with glow
const CircularProgress = ({ value, size = 200, isComplete }: { value: number; size?: number; isComplete: boolean }) => {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
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
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          filter={isComplete ? 'url(#glow)' : undefined}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 0.1s ease-out',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`text-5xl font-bold font-mono tabular-nums transition-all duration-300 ${
            isComplete ? 'text-cyan-300 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]' : 'text-cyan-400'
          }`}
        >
          {value}%
        </span>
      </div>
    </div>
  );
};

// Slide 1: Data Quality Transformation
const DataQualitySlide = ({ before, after, isActive }: { before: number; after: number; isActive: boolean }) => {
  const { value: displayValue, isComplete } = useCountUp(after, 2500, 500, isActive);
  const { displayedText: scanText, isComplete: scanComplete } = useTypewriter(
    'SCAN COMPLETE',
    80,
    3000,
    isActive
  );
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    if (isComplete) {
      setShowBurst(true);
    }
  }, [isComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-sm font-mono text-zinc-500 tracking-widest">DATA QUALITY TRANSFORMATION</h2>
        <div className="flex items-center justify-center gap-4 text-sm font-mono">
          <span className="text-red-400">{before}%</span>
          <span className="text-zinc-600">-{'>'}</span>
          <span className="text-cyan-400">{after}%</span>
        </div>
      </div>

      <div className="relative">
        <CircularProgress value={displayValue} isComplete={isComplete} />
        <ParticleBurst trigger={showBurst} x={100} y={100} />
      </div>

      <div className="h-8 flex items-center justify-center">
        {scanComplete ? (
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-lg animate-in fade-in duration-300">
            <Check className="w-5 h-5" />
            <span className="drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">{scanText}</span>
          </div>
        ) : (
          <span className="text-cyan-400 font-mono text-lg">
            {scanText}
            <span className="animate-pulse">_</span>
          </span>
        )}
      </div>
    </div>
  );
};

// Slide 2: Operations Performed
const OperationsSlide = ({
  operations,
  isActive,
}: {
  operations: CleaningSummarySlideProps['cleaningResult']['cleaningOperations'];
  isActive: boolean;
}) => {
  const [visibleOps, setVisibleOps] = useState<number>(0);

  useEffect(() => {
    if (!isActive) {
      setVisibleOps(0);
      return;
    }

    setVisibleOps(0);
    const interval = setInterval(() => {
      setVisibleOps((prev) => {
        if (prev < operations.length) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isActive, operations.length]);

  const getImpactColor = (impact: 'low' | 'medium' | 'high') => {
    switch (impact) {
      case 'low':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
      case 'medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
      <h2 className="text-sm font-mono text-zinc-500 tracking-widest mb-4">OPERATIONS PERFORMED</h2>
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {operations.slice(0, visibleOps).map((op, index) => (
          <div
            key={index}
            className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 animate-in fade-in slide-in-from-left-2 duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 text-cyan-400 animate-in zoom-in duration-300" style={{ animationDelay: `${index * 50 + 200}ms` }}>
                <Check className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-cyan-300 text-sm">{'>'}_ {op.type}</span>
                  {op.column && (
                    <span className="text-xs font-mono text-zinc-500 px-1.5 py-0.5 bg-zinc-800 rounded">
                      {op.column}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1 font-mono">{op.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded border ${getImpactColor(op.impact)}`}
                  >
                    {op.impact.toUpperCase()}
                  </span>
                  <span className="text-xs font-mono text-zinc-500">
                    {op.rowsAffected.toLocaleString()} rows
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Slide 3: Stats Breakdown
const StatsSlide = ({
  operations,
  isActive,
}: {
  operations: CleaningSummarySlideProps['cleaningResult']['cleaningOperations'];
  isActive: boolean;
}) => {
  // Calculate stats from operations
  const stats = {
    nullsRemoved: operations
      .filter((op) => op.type.toLowerCase().includes('null') || op.type.toLowerCase().includes('missing'))
      .reduce((sum, op) => sum + op.rowsAffected, 0),
    outliersDetected: operations
      .filter((op) => op.type.toLowerCase().includes('outlier'))
      .reduce((sum, op) => sum + op.rowsAffected, 0),
    typesFixed: operations
      .filter((op) => op.type.toLowerCase().includes('type') || op.type.toLowerCase().includes('format'))
      .reduce((sum, op) => sum + op.rowsAffected, 0),
    totalRowsAffected: operations.reduce((sum, op) => sum + op.rowsAffected, 0),
  };

  const { value: nulls } = useCountUp(stats.nullsRemoved, 1500, 300, isActive);
  const { value: outliers } = useCountUp(stats.outliersDetected, 1500, 600, isActive);
  const { value: types } = useCountUp(stats.typesFixed, 1500, 900, isActive);
  const { value: total } = useCountUp(stats.totalRowsAffected, 1500, 1200, isActive);

  const [typedLines, setTypedLines] = useState<number>(0);

  useEffect(() => {
    if (!isActive) {
      setTypedLines(0);
      return;
    }

    const interval = setInterval(() => {
      setTypedLines((prev) => {
        if (prev < 5) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isActive]);

  const statLines = [
    { label: 'NULLS_REMOVED', value: nulls, color: 'text-red-400' },
    { label: 'OUTLIERS_DETECTED', value: outliers, color: 'text-amber-400' },
    { label: 'TYPES_FIXED', value: types, color: 'text-blue-400' },
    { label: '────────────────────', value: null, color: 'text-zinc-700' },
    { label: 'TOTAL_AFFECTED', value: total, color: 'text-cyan-400' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full animate-in fade-in slide-in-from-right-4 duration-500">
      <h2 className="text-sm font-mono text-zinc-500 tracking-widest mb-6">CLEANING STATISTICS</h2>
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-6 font-mono text-sm w-full max-w-md">
        <div className="text-zinc-500 mb-4">$ cat cleaning_report.log</div>
        <div className="space-y-2">
          {statLines.slice(0, typedLines).map((line, index) => (
            <div
              key={index}
              className="flex justify-between items-center animate-in fade-in slide-in-from-left-2 duration-200"
            >
              <span className="text-zinc-400">{line.label}</span>
              {line.value !== null && (
                <span className={`${line.color} tabular-nums font-bold`}>
                  {line.value.toLocaleString()}
                </span>
              )}
            </div>
          ))}
        </div>
        {typedLines < 5 && (
          <div className="mt-2 text-cyan-400">
            <span className="animate-pulse">_</span>
          </div>
        )}
      </div>

      {/* Visual bar chart */}
      <div className="mt-8 w-full max-w-md space-y-3">
        {[
          { label: 'Nulls', value: stats.nullsRemoved, max: stats.totalRowsAffected || 1, color: 'bg-red-500' },
          { label: 'Outliers', value: stats.outliersDetected, max: stats.totalRowsAffected || 1, color: 'bg-amber-500' },
          { label: 'Types', value: stats.typesFixed, max: stats.totalRowsAffected || 1, color: 'bg-blue-500' },
        ].map((bar, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-500">{bar.label}</span>
              <span className="text-zinc-400">{bar.value.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${bar.color} transition-all duration-1000 ease-out`}
                style={{
                  width: isActive ? `${Math.max((bar.value / bar.max) * 100, bar.value > 0 ? 5 : 0)}%` : '0%',
                  boxShadow: `0 0 10px ${bar.color === 'bg-red-500' ? '#ef4444' : bar.color === 'bg-amber-500' ? '#f59e0b' : '#3b82f6'}`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Slide 4: Warnings
const WarningsSlide = ({ warnings, isActive }: { warnings: string[]; isActive: boolean }) => {
  const [visibleWarnings, setVisibleWarnings] = useState<number>(0);

  useEffect(() => {
    if (!isActive) {
      setVisibleWarnings(0);
      return;
    }

    const interval = setInterval(() => {
      setVisibleWarnings((prev) => {
        if (prev < warnings.length) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [isActive, warnings.length]);

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
          <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
        </div>
        <h2 className="text-sm font-mono text-amber-400 tracking-widest">WARNINGS DETECTED</h2>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {warnings.slice(0, visibleWarnings).map((warning, index) => (
          <div
            key={index}
            className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 animate-in fade-in slide-in-from-left-2 duration-300"
            style={{
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.1)',
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-amber-400 font-mono text-sm">[{String(index + 1).padStart(2, '0')}]</span>
              <p className="text-amber-200/80 font-mono text-sm flex-1">{warning}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Slide 5: Ready to Continue
const ReadySlide = ({
  dataQuality,
  operationsCount,
  onApprove,
  onRequestChanges,
  isActive,
}: {
  dataQuality: { before: number; after: number };
  operationsCount: number;
  onApprove: () => void;
  onRequestChanges: (feedback: string) => void;
  isActive: boolean;
}) => {
  const { displayedText: readyText, isComplete } = useTypewriter('READY_FOR_INPUT', 50, 300, isActive);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const handleSubmitFeedback = () => {
    if (feedbackText.trim()) {
      onRequestChanges(feedbackText.trim());
      setFeedbackText('');
      setShowFeedbackInput(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {!showFeedbackInput ? (
        <>
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-mono text-cyan-300">CLEANING COMPLETE</h2>
            <p className="text-sm font-mono text-zinc-500">
              {readyText}
              {!isComplete && <span className="animate-pulse">_</span>}
            </p>
          </div>

          {/* Stats badges */}
          <div className="flex flex-wrap justify-center gap-3">
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg px-4 py-2 font-mono text-xs">
              <span className="text-zinc-500">QUALITY: </span>
              <span className="text-red-400">{dataQuality.before}%</span>
              <span className="text-zinc-600 mx-1">-{'>'}</span>
              <span className="text-emerald-400">{dataQuality.after}%</span>
            </div>
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg px-4 py-2 font-mono text-xs">
              <span className="text-zinc-500">OPS: </span>
              <span className="text-cyan-400">{operationsCount}</span>
            </div>
          </div>

          {/* Approve button */}
          <div className="space-y-4">
            <Button
              onClick={onApprove}
              className="relative bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-mono text-lg px-12 py-6 rounded-lg transition-all duration-300 hover:scale-105"
              style={{
                boxShadow: '0 0 30px rgba(6, 182, 212, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <span className="relative z-10">APPROVE</span>
              <div className="absolute inset-0 rounded-lg animate-pulse opacity-50" style={{
                background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
              }} />
            </Button>
            <button
              onClick={() => setShowFeedbackInput(true)}
              className="block w-full text-center text-sm font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {'>'} Request Changes
            </button>
          </div>
        </>
      ) : (
        <div className="w-full max-w-md space-y-4 animate-in fade-in duration-300">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-mono text-amber-400">REQUEST CHANGES</h2>
            <p className="text-sm font-mono text-zinc-500">Describe what cleaning you'd like instead</p>
          </div>

          <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-4">
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="> Enter your feedback..."
              className="w-full h-32 bg-transparent text-cyan-300 font-mono text-sm placeholder:text-zinc-600 focus:outline-none resize-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey) {
                  handleSubmitFeedback();
                }
              }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowFeedbackInput(false)}
              className="flex-1 py-3 font-mono text-sm text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded-lg transition-colors"
            >
              CANCEL
            </button>
            <Button
              onClick={handleSubmitFeedback}
              disabled={!feedbackText.trim()}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              SUBMIT
            </Button>
          </div>
          <p className="text-center text-xs font-mono text-zinc-600">Press ⌘+Enter to submit</p>
        </div>
      )}
    </div>
  );
};

// Main component
const CleaningSummarySlides = ({
  cleaningResult,
  onApprove,
  onRequestChanges,
  isUsingDemoData = false,
}: CleaningSummarySlideProps) => {
  const hasWarnings = cleaningResult.warnings.length > 0;
  const totalSlides = hasWarnings ? 5 : 4;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const SLIDE_DURATION = 3500; // 3.5 seconds per slide

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    setProgress(0);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
    setProgress(0);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    setProgress(0);
  }, [totalSlides]);

  // Auto-advance slides
  useEffect(() => {
    if (isPaused || currentSlide === totalSlides - 1) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      return;
    }

    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / SLIDE_DURATION) * 100;

      if (newProgress >= 100) {
        nextSlide();
      } else {
        setProgress(newProgress);
      }
    }, 50);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentSlide, isPaused, nextSlide, totalSlides]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Get slide index accounting for warnings slide
  const getSlideContent = () => {
    if (hasWarnings) {
      switch (currentSlide) {
        case 0:
          return (
            <DataQualitySlide
              before={cleaningResult.dataQualityScore.before}
              after={cleaningResult.dataQualityScore.after}
              isActive={currentSlide === 0}
            />
          );
        case 1:
          return (
            <OperationsSlide
              operations={cleaningResult.cleaningOperations}
              isActive={currentSlide === 1}
            />
          );
        case 2:
          return (
            <StatsSlide
              operations={cleaningResult.cleaningOperations}
              isActive={currentSlide === 2}
            />
          );
        case 3:
          return (
            <WarningsSlide
              warnings={cleaningResult.warnings}
              isActive={currentSlide === 3}
            />
          );
        case 4:
          return (
            <ReadySlide
              dataQuality={cleaningResult.dataQualityScore}
              operationsCount={cleaningResult.cleaningOperations.length}
              onApprove={onApprove}
              onRequestChanges={onRequestChanges}
              isActive={currentSlide === 4}
            />
          );
        default:
          return null;
      }
    } else {
      switch (currentSlide) {
        case 0:
          return (
            <DataQualitySlide
              before={cleaningResult.dataQualityScore.before}
              after={cleaningResult.dataQualityScore.after}
              isActive={currentSlide === 0}
            />
          );
        case 1:
          return (
            <OperationsSlide
              operations={cleaningResult.cleaningOperations}
              isActive={currentSlide === 1}
            />
          );
        case 2:
          return (
            <StatsSlide
              operations={cleaningResult.cleaningOperations}
              isActive={currentSlide === 2}
            />
          );
        case 3:
          return (
            <ReadySlide
              dataQuality={cleaningResult.dataQualityScore}
              operationsCount={cleaningResult.cleaningOperations.length}
              onApprove={onApprove}
              onRequestChanges={onRequestChanges}
              isActive={currentSlide === 3}
            />
          );
        default:
          return null;
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Matrix rain background */}
      <MatrixRain />

      {/* Scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
        }}
      />

      {/* CRT flicker effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          animation: 'crtFlicker 0.1s infinite',
        }}
      />

      {/* Progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-900">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-50"
          style={{
            width: `${((currentSlide + progress / 100) / totalSlides) * 100}%`,
            boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)',
          }}
        />
      </div>

      {/* Demo data badge */}
      {isUsingDemoData && (
        <div className="absolute top-4 left-4 bg-amber-500/20 border border-amber-500/30 rounded px-3 py-1 text-xs font-mono text-amber-400">
          DEMO DATA
        </div>
      )}

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className={`absolute left-4 top-1/2 -translate-y-1/2 p-2 text-zinc-600 hover:text-cyan-400 transition-colors z-10 ${currentSlide === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
        disabled={currentSlide === 0}
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      {currentSlide < totalSlides - 1 && (
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-zinc-600 hover:text-cyan-400 transition-colors z-10"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Main content */}
      <div className="h-full flex items-center justify-center p-8 pt-12">
        <div className="w-full max-w-2xl h-[500px]">{getSlideContent()}</div>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-cyan-400 w-6 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                : 'bg-zinc-700 hover:bg-zinc-600'
            }`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-8 right-8 text-xs font-mono text-zinc-600">
        {String(currentSlide + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
      </div>

      {/* Scanning line animation */}
      <div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none"
        style={{
          animation: 'scanline 4s linear infinite',
        }}
      />

      {/* CSS Keyframes */}
      <style>{`
        @keyframes scanline {
          0% { top: 0%; }
          100% { top: 100%; }
        }

        @keyframes matrixFall {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        @keyframes crtFlicker {
          0% { opacity: 0.02; }
          50% { opacity: 0.04; }
          100% { opacity: 0.02; }
        }

        @keyframes particleBurst {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(
              calc(cos(var(--angle)) * var(--distance)),
              calc(sin(var(--angle)) * var(--distance))
            ) scale(0);
            opacity: 0;
          }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(39, 39, 42, 0.5);
          border-radius: 2px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 2px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.5);
        }
      `}</style>
    </div>
  );
};

export default CleaningSummarySlides;
