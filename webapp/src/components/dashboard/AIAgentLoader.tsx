import { useState, useEffect } from 'react';
import { Sparkles, Database, Trash2, Search, CheckCircle2, Brain, Loader2 } from 'lucide-react';

interface AIAgentLoaderProps {
  stage: 'cleaning' | 'analyzing' | 'generating';
  isVisible: boolean;
}

const stageConfig = {
  cleaning: {
    icon: Trash2,
    title: 'AI Agent Cleaning Data',
    steps: [
      'Scanning for missing values...',
      'Detecting outliers...',
      'Normalizing data formats...',
      'Validating data types...',
    ],
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/30',
    progressColor: 'bg-cyan-400',
  },
  analyzing: {
    icon: Brain,
    title: 'AI Agent Analyzing Data',
    steps: [
      'Identifying patterns...',
      'Computing statistics...',
      'Finding correlations...',
      'Generating insights...',
    ],
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    progressColor: 'bg-purple-400',
  },
  generating: {
    icon: Sparkles,
    title: 'AI Agent Generating Recommendations',
    steps: [
      'Selecting best models...',
      'Evaluating features...',
      'Creating visualizations...',
      'Preparing report...',
    ],
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    progressColor: 'bg-amber-400',
  },
};

const AIAgentLoader = ({ stage, isVisible }: AIAgentLoaderProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const config = stageConfig[stage];
  const Icon = config.icon;

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setCompletedSteps([]);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < config.steps.length - 1) {
          setCompletedSteps((completed) => [...completed, prev]);
          return prev + 1;
        }
        return prev;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isVisible, stage, config.steps.length]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`relative w-full max-w-md mx-4 p-8 rounded-2xl border ${config.borderColor} ${config.bgColor} bg-card shadow-2xl animate-in zoom-in-95 duration-300`}>
        {/* Animated background dots */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className={`absolute top-4 left-8 w-2 h-2 rounded-full ${config.bgColor} animate-pulse`} />
          <div className={`absolute top-12 right-12 w-3 h-3 rounded-full ${config.bgColor} animate-pulse delay-300`} />
          <div className={`absolute bottom-8 left-16 w-2 h-2 rounded-full ${config.bgColor} animate-pulse delay-500`} />
          <div className={`absolute bottom-16 right-8 w-2 h-2 rounded-full ${config.bgColor} animate-pulse delay-700`} />
        </div>

        <div className="relative z-10">
          {/* Icon with pulse animation */}
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-full ${config.bgColor} border ${config.borderColor} animate-pulse`}>
              <Icon className={`h-10 w-10 ${config.color} animate-spin`} style={{ animationDuration: '3s' }} />
            </div>
          </div>

          {/* Title */}
          <h3 className={`text-xl font-bold text-center mb-6 ${config.color} animate-pulse`}>
            {config.title}
          </h3>

          {/* Steps */}
          <div className="space-y-3">
            {config.steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  index <= currentStep ? 'opacity-100' : 'opacity-30'
                }`}
              >
                {completedSteps.includes(index) ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 animate-in zoom-in duration-200" />
                ) : index === currentStep ? (
                  <Loader2 className={`h-5 w-5 ${config.color} animate-spin`} />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                )}
                <span className={`text-sm ${
                  index === currentStep ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-6 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${config.progressColor} transition-all duration-500 ease-out`}
              style={{ width: `${((currentStep + 1) / config.steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgentLoader;
