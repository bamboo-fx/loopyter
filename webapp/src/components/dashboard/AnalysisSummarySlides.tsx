import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, BarChart3, Brain, Eye, Zap, TrendingUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalysisSummarySlideProps {
  aiInsights: {
    dataDescription: string;
    insights: string[];
    suggestedVisualizations: Array<{
      type: 'bar' | 'line' | 'scatter' | 'histogram' | 'pie';
      title: string;
      description: string;
      xColumn: string;
      yColumn?: string | null;
    }>;
    mlRecommendations?: {
      taskType: 'classification' | 'regression' | 'clustering';
      targetColumn: string | null;
      featureColumns: string[];
      recommendedModels: Array<{
        name: string;
        reason: string;
        expectedPerformance: 'high' | 'medium' | 'low';
      }>;
      dataQualityNotes: string[];
      featureEngineeringSuggestions: string[];
    };
  };
  dataAnalysis: {
    columns: string[];
    rows: (string | number | boolean | null)[][];
    stats: Record<string, unknown>;
    distributions: Record<string, unknown[]>;
  };
  onViewVisualizations: () => void;
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

// Matrix rain background - purple tinted
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
          className="absolute text-violet-500 font-mono text-xs leading-4"
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

// Slide 1: Data Summary
const DataSummarySlide = ({
  dataDescription,
  columnCount,
  rowCount,
  isActive,
}: {
  dataDescription: string;
  columnCount: number;
  rowCount: number;
  isActive: boolean;
}) => {
  const { displayedText: titleText, isComplete: titleComplete } = useTypewriter(
    'ANALYSIS COMPLETE',
    60,
    200,
    isActive
  );
  const { displayedText: descText, isComplete: descComplete } = useTypewriter(
    dataDescription,
    20,
    1000,
    isActive && titleComplete
  );
  const { value: colCount } = useCountUp(columnCount, 1500, 500, isActive);
  const { value: rCount } = useCountUp(rowCount, 1500, 700, isActive);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Sparkles className="w-16 h-16 text-violet-400 animate-pulse" />
            <div
              className="absolute inset-0 blur-xl bg-violet-500/30 rounded-full"
              style={{ animation: 'pulse 2s ease-in-out infinite' }}
            />
          </div>
        </div>
        <h2 className="text-4xl font-mono font-bold text-violet-300 drop-shadow-[0_0_30px_rgba(139,92,246,0.5)]">
          {titleText}
          {!titleComplete && <span className="animate-pulse">_</span>}
        </h2>
      </div>

      {titleComplete && (
        <div className="bg-zinc-900/70 border border-violet-500/30 rounded-lg p-6 max-w-lg animate-in fade-in duration-500">
          <p className="text-zinc-300 font-mono text-sm leading-relaxed">
            {descText}
            {!descComplete && <span className="animate-pulse text-violet-400">_</span>}
          </p>
        </div>
      )}

      <div className="flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '500ms' }}>
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg px-6 py-4 text-center">
          <div className="text-3xl font-mono font-bold text-violet-400 tabular-nums drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]">
            {colCount}
          </div>
          <div className="text-xs font-mono text-zinc-500 mt-1">COLUMNS</div>
        </div>
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg px-6 py-4 text-center">
          <div className="text-3xl font-mono font-bold text-violet-400 tabular-nums drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]">
            {rCount.toLocaleString()}
          </div>
          <div className="text-xs font-mono text-zinc-500 mt-1">ROWS ANALYZED</div>
        </div>
      </div>
    </div>
  );
};

// Slide 2: Key Insights
const InsightsSlide = ({
  insights,
  featureColumns,
  isActive,
}: {
  insights: string[];
  featureColumns?: string[];
  isActive: boolean;
}) => {
  const [visibleInsights, setVisibleInsights] = useState<number>(0);
  const [showBars, setShowBars] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setVisibleInsights(0);
      setShowBars(false);
      return;
    }

    setVisibleInsights(0);
    const interval = setInterval(() => {
      setVisibleInsights((prev) => {
        if (prev < insights.length) {
          return prev + 1;
        }
        clearInterval(interval);
        setShowBars(true);
        return prev;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isActive, insights.length]);

  const topFeatures = featureColumns?.slice(0, 5) || [];

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-violet-500/20 rounded-lg border border-violet-500/30">
          <Zap className="w-5 h-5 text-violet-400" />
        </div>
        <h2 className="text-sm font-mono text-violet-400 tracking-widest">KEY INSIGHTS</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {insights.slice(0, visibleInsights).map((insight, index) => (
          <div
            key={index}
            className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 animate-in fade-in slide-in-from-left-2 duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-3">
              <div
                className="mt-1 w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/50 flex items-center justify-center text-violet-400 font-mono text-xs animate-in zoom-in duration-300"
                style={{
                  boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)',
                  animationDelay: `${index * 50 + 200}ms`,
                }}
              >
                {index + 1}
              </div>
              <p className="text-zinc-300 font-mono text-sm flex-1">{insight}</p>
            </div>
          </div>
        ))}
      </div>

      {showBars && topFeatures.length > 0 && (
        <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-xs font-mono text-zinc-500 tracking-widest">KEY FEATURES</h3>
          <div className="flex flex-wrap gap-2">
            {topFeatures.map((feature, index) => (
              <div
                key={index}
                className="px-3 py-1.5 bg-violet-500/10 border border-violet-500/30 rounded-lg text-xs font-mono text-violet-300"
                style={{ boxShadow: '0 0 10px rgba(139, 92, 246, 0.2)' }}
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Slide 3: Recommended Models
const ModelsSlide = ({
  mlRecommendations,
  isActive,
}: {
  mlRecommendations?: AnalysisSummarySlideProps['aiInsights']['mlRecommendations'];
  isActive: boolean;
}) => {
  const [visibleModels, setVisibleModels] = useState<number>(0);

  useEffect(() => {
    if (!isActive) {
      setVisibleModels(0);
      return;
    }

    setVisibleModels(0);
    const interval = setInterval(() => {
      setVisibleModels((prev) => {
        const models = mlRecommendations?.recommendedModels || [];
        if (prev < Math.min(models.length, 3)) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [isActive, mlRecommendations]);

  const getPerformanceColor = (perf: 'high' | 'medium' | 'low') => {
    switch (perf) {
      case 'high':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
      case 'medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
      case 'low':
        return 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
    }
  };

  const getProblemTypeIcon = (type: string) => {
    switch (type) {
      case 'classification':
        return <Target className="w-4 h-4" />;
      case 'regression':
        return <TrendingUp className="w-4 h-4" />;
      case 'clustering':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  if (!mlRecommendations) {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-in fade-in duration-500">
        <div className="text-center space-y-4">
          <Brain className="w-16 h-16 text-zinc-600 mx-auto" />
          <h2 className="text-xl font-mono text-zinc-500">NO ML RECOMMENDATIONS</h2>
          <p className="text-sm font-mono text-zinc-600">Data may not be suitable for machine learning</p>
        </div>
      </div>
    );
  }

  const models = mlRecommendations.recommendedModels.slice(0, 3);

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-violet-500/20 rounded-lg border border-violet-500/30">
          <Brain className="w-5 h-5 text-violet-400" />
        </div>
        <h2 className="text-sm font-mono text-violet-400 tracking-widest">RECOMMENDED MODELS</h2>
      </div>

      {/* Problem type & target */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="bg-zinc-900/70 border border-violet-500/30 rounded-lg px-4 py-2 flex items-center gap-2">
          {getProblemTypeIcon(mlRecommendations.taskType)}
          <span className="font-mono text-xs text-violet-300 uppercase">
            {mlRecommendations.taskType}
          </span>
        </div>
        {mlRecommendations.targetColumn && (
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg px-4 py-2 font-mono text-xs">
            <span className="text-zinc-500">TARGET: </span>
            <span className="text-fuchsia-400">{mlRecommendations.targetColumn}</span>
          </div>
        )}
      </div>

      {/* Model cards */}
      <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
        {models.slice(0, visibleModels).map((model, index) => (
          <div
            key={index}
            className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 animate-in fade-in slide-in-from-left-4 duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-mono text-sm font-bold">
                  {index + 1}
                </div>
                <h3 className="font-mono text-violet-300 font-semibold">{model.name}</h3>
              </div>
              <span
                className={`text-xs font-mono px-3 py-1 rounded border ${getPerformanceColor(model.expectedPerformance)}`}
              >
                {model.expectedPerformance.toUpperCase()}
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-400 ml-11">{model.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Slide 4: Visualizations Preview
const VisualizationsSlide = ({
  visualizations,
  isActive,
}: {
  visualizations: AnalysisSummarySlideProps['aiInsights']['suggestedVisualizations'];
  isActive: boolean;
}) => {
  const [visibleCards, setVisibleCards] = useState<number>(0);

  useEffect(() => {
    if (!isActive) {
      setVisibleCards(0);
      return;
    }

    setVisibleCards(0);
    const interval = setInterval(() => {
      setVisibleCards((prev) => {
        if (prev < visualizations.length) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [isActive, visualizations.length]);

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'bar':
        return <BarChart3 className="w-6 h-6" />;
      case 'line':
        return <TrendingUp className="w-6 h-6" />;
      case 'scatter':
        return <Target className="w-6 h-6" />;
      case 'histogram':
        return <BarChart3 className="w-6 h-6" />;
      case 'pie':
        return <Target className="w-6 h-6" />;
      default:
        return <BarChart3 className="w-6 h-6" />;
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-violet-500/20 rounded-lg border border-violet-500/30">
          <Eye className="w-5 h-5 text-violet-400" />
        </div>
        <h2 className="text-sm font-mono text-violet-400 tracking-widest">DATA VISUALIZATIONS</h2>
      </div>

      <div className="text-center mb-4">
        <span className="text-2xl font-mono font-bold text-violet-300">
          {visualizations.length}
        </span>
        <span className="text-sm font-mono text-zinc-500 ml-2">visualizations ready to explore</span>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar">
        {visualizations.slice(0, visibleCards).map((viz, index) => (
          <div
            key={index}
            className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 animate-in fade-in zoom-in-95 duration-300 hover:border-violet-500/50 transition-colors cursor-pointer group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="text-violet-400 group-hover:text-violet-300 transition-colors"
                style={{ filter: 'drop-shadow(0 0 6px rgba(139, 92, 246, 0.5))' }}
              >
                {getChartIcon(viz.type)}
              </div>
              <span className="text-xs font-mono text-zinc-500 uppercase px-2 py-0.5 bg-zinc-800 rounded">
                {viz.type}
              </span>
            </div>
            <h3 className="font-mono text-sm text-zinc-300 mb-1 truncate">{viz.title}</h3>
            <p className="text-xs font-mono text-zinc-500 line-clamp-2">{viz.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center text-xs font-mono text-zinc-600">
        Click "View Visualizations" to explore all charts
      </div>
    </div>
  );
};

// Slide 5: Ready to Continue
const ReadySlide = ({
  insightsCount,
  modelsCount,
  visualizationsCount,
  onViewVisualizations,
  isActive,
}: {
  insightsCount: number;
  modelsCount: number;
  visualizationsCount: number;
  onViewVisualizations: () => void;
  isActive: boolean;
}) => {
  const { displayedText: readyText, isComplete } = useTypewriter('ANALYSIS_COMPLETE', 50, 300, isActive);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <Eye className="w-12 h-12 text-violet-400 animate-pulse" />
            <div
              className="absolute inset-0 blur-xl bg-violet-500/30 rounded-full"
              style={{ animation: 'pulse 2s ease-in-out infinite' }}
            />
          </div>
        </div>
        <h2 className="text-2xl font-mono text-violet-300 drop-shadow-[0_0_20px_rgba(139,92,246,0.5)]">
          ANALYSIS COMPLETE
        </h2>
        <p className="text-sm font-mono text-zinc-500">
          {readyText}
          {!isComplete && <span className="animate-pulse">_</span>}
        </p>
      </div>

      {/* Stats badges */}
      <div className="flex flex-wrap justify-center gap-3">
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg px-4 py-2 font-mono text-xs">
          <span className="text-zinc-500">INSIGHTS: </span>
          <span className="text-violet-400">{insightsCount}</span>
        </div>
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg px-4 py-2 font-mono text-xs">
          <span className="text-zinc-500">MODELS: </span>
          <span className="text-fuchsia-400">{modelsCount}</span>
        </div>
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg px-4 py-2 font-mono text-xs">
          <span className="text-zinc-500">CHARTS: </span>
          <span className="text-violet-400">{visualizationsCount}</span>
        </div>
      </div>

      {/* Action button - only View Visualizations */}
      <div className="w-full max-w-sm">
        <Button
          onClick={onViewVisualizations}
          className="relative w-full bg-violet-500 hover:bg-violet-400 text-zinc-950 font-mono text-lg px-12 py-6 rounded-lg transition-all duration-300 hover:scale-105"
          style={{
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          <span className="relative z-10 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            VIEW VISUALIZATIONS
          </span>
          <div
            className="absolute inset-0 rounded-lg animate-pulse opacity-50"
            style={{
              background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
            }}
          />
        </Button>
      </div>
    </div>
  );
};

// Main component
const AnalysisSummarySlides = ({
  aiInsights,
  dataAnalysis,
  onViewVisualizations,
}: AnalysisSummarySlideProps) => {
  const hasModels = aiInsights.mlRecommendations && aiInsights.mlRecommendations.recommendedModels.length > 0;
  const hasVisualizations = aiInsights.suggestedVisualizations.length > 0;
  const totalSlides = 4; // Reduced from 5 - removed Analysis Complete slide

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

  const getSlideContent = () => {
    switch (currentSlide) {
      case 0:
        return (
          <InsightsSlide
            insights={aiInsights.insights}
            featureColumns={aiInsights.mlRecommendations?.featureColumns}
            isActive={currentSlide === 0}
          />
        );
      case 1:
        return (
          <ModelsSlide
            mlRecommendations={aiInsights.mlRecommendations}
            isActive={currentSlide === 1}
          />
        );
      case 2:
        return (
          <VisualizationsSlide
            visualizations={aiInsights.suggestedVisualizations}
            isActive={currentSlide === 2}
          />
        );
      case 3:
        return (
          <ReadySlide
            insightsCount={aiInsights.insights.length}
            modelsCount={aiInsights.mlRecommendations?.recommendedModels.length || 0}
            visualizationsCount={aiInsights.suggestedVisualizations.length}
            onViewVisualizations={onViewVisualizations}
            isActive={currentSlide === 3}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Matrix rain background - purple tinted */}
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

      {/* Progress bar at top - purple gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-900">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-50"
          style={{
            width: `${((currentSlide + progress / 100) / totalSlides) * 100}%`,
            boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
          }}
        />
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-zinc-600 hover:text-violet-400 transition-colors z-10"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      {currentSlide < totalSlides - 1 && (
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-zinc-600 hover:text-violet-400 transition-colors z-10"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Main content */}
      <div className="h-full flex items-center justify-center p-8 pt-12">
        <div className="w-full max-w-2xl h-[500px]">{getSlideContent()}</div>
      </div>

      {/* Dot indicators - purple theme */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-violet-400 w-6 shadow-[0_0_10px_rgba(139,92,246,0.5)]'
                : 'bg-zinc-700 hover:bg-zinc-600'
            }`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-8 right-8 text-xs font-mono text-zinc-600">
        {String(currentSlide + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
      </div>

      {/* Scanning line animation - purple tinted */}
      <div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent pointer-events-none"
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

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(39, 39, 42, 0.5);
          border-radius: 2px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 2px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default AnalysisSummarySlides;
