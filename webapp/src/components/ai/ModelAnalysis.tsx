import { useState, useEffect } from 'react';
import {
  Brain,
  Beaker,
  Loader2,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Play,
  Trophy,
  Target,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useModelAnalysis, ExperimentResult } from '@/hooks/useModelAnalysis';
import { usePyodideContext } from '@/hooks/PyodideContext';
import { useNotebook } from '@/hooks/useNotebook';
import { parseRunOutput } from '@/lib/parseResults';
import type { FeatureExperiment } from '../../../../backend/src/types';

interface Run {
  id: string;
  modelType: string;
  accuracy: number;
  code: string;
  datasetRows: number | null;
  datasetColumns: number | null;
  datasetFeatures: string | null;
  confusionMatrix: string | null;
}

interface ModelAnalysisProps {
  latestRun: Run | null;
}

const ModelAnalysis = ({ latestRun }: ModelAnalysisProps) => {
  const {
    analysis,
    statistics,
    experiments,
    experimentResults,
    isAnalyzing,
    isRunningExperiment,
    error,
    analyzeModel,
    addExperimentResult,
    setRunningExperiment,
    clearError,
  } = useModelAnalysis();

  const { execute, pyodideState } = usePyodideContext();
  const { saveRun, setCode } = useNotebook();
  const [runningExperimentIndex, setRunningExperimentIndex] = useState<number | null>(null);

  // Trigger analysis when latestRun changes
  useEffect(() => {
    if (!latestRun) return;

    const features = latestRun.datasetFeatures
      ? JSON.parse(latestRun.datasetFeatures) as string[]
      : [];

    const confusionMatrix = latestRun.confusionMatrix
      ? JSON.parse(latestRun.confusionMatrix) as number[][]
      : undefined;

    analyzeModel({
      modelType: latestRun.modelType,
      accuracy: latestRun.accuracy,
      features,
      confusionMatrix,
      code: latestRun.code,
      datasetRows: latestRun.datasetRows ?? undefined,
      datasetColumns: latestRun.datasetColumns ?? undefined,
    }).catch(() => {
      // Error is already handled in the hook
    });
  }, [latestRun?.id]);

  const handleRunExperiment = async (experiment: FeatureExperiment, index: number) => {
    if (!pyodideState.isReady) {
      toast.error('Python environment not ready');
      return;
    }

    setRunningExperiment(true);
    setRunningExperimentIndex(index);

    try {
      // Update the code editor
      setCode(experiment.code);

      // Execute the experiment code
      const { result, parsed } = await execute(experiment.code);

      if (parsed.accuracy !== undefined) {
        // Save the run
        const explanation = `Feature Experiment: ${experiment.name}\n\n${experiment.description}`;
        await saveRun(
          parsed,
          experiment.code,
          result.stdout,
          result.error ?? null,
          false,
          explanation
        );

        // Add to experiment results
        addExperimentResult({
          name: experiment.name,
          features: experiment.features,
          accuracy: parsed.accuracy,
          modelType: parsed.modelType || latestRun?.modelType || 'Unknown',
        });

        toast.success('Experiment completed', {
          description: `Accuracy: ${(parsed.accuracy * 100).toFixed(2)}%`,
        });
      } else {
        toast.error('Experiment failed', {
          description: 'Could not parse accuracy from results',
        });
      }
    } catch (err) {
      console.error('Experiment error:', err);
      toast.error('Experiment failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setRunningExperiment(false);
      setRunningExperimentIndex(null);
    }
  };

  if (!latestRun) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Brain className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Run a model to enable AI analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Model Analysis Card */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-sm font-medium">Model Analysis</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isAnalyzing ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-purple-400 mr-2" />
              <span className="text-sm text-muted-foreground">Analyzing model performance...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-red-400 py-4">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </div>
          ) : analysis ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{analysis}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Statistics Card */}
      {statistics && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-cyan-400" />
              <CardTitle className="text-sm font-medium">Performance Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Strengths */}
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-emerald-400 uppercase tracking-wide font-medium">
                  Strengths
                </span>
              </div>
              <p className="text-sm text-foreground">{statistics.strengths}</p>
            </div>

            {/* Weaknesses */}
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-400" />
                <span className="text-xs text-red-400 uppercase tracking-wide font-medium">
                  Weaknesses
                </span>
              </div>
              <p className="text-sm text-foreground">{statistics.weaknesses}</p>
            </div>

            {/* Recommendation */}
            <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-cyan-400" />
                <span className="text-xs text-cyan-400 uppercase tracking-wide font-medium">
                  Recommendation
                </span>
              </div>
              <p className="text-sm text-foreground">{statistics.recommendation}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Experiments Card */}
      {experiments.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Beaker className="h-5 w-5 text-amber-400" />
              <CardTitle className="text-sm font-medium">Feature Experiments</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {experiments.map((experiment, index) => (
                <div
                  key={index}
                  className="rounded-lg bg-background/50 border border-border p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground mb-1">
                        {experiment.name}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {experiment.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {experiment.features.slice(0, 5).map((feature, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {experiment.features.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{experiment.features.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 shrink-0"
                      onClick={() => handleRunExperiment(experiment, index)}
                      disabled={isRunningExperiment || !pyodideState.isReady}
                    >
                      {isRunningExperiment && runningExperimentIndex === index ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Running
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3" />
                          Run
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experiment Results Leaderboard */}
      {experimentResults.length > 0 && (
        <Card className="border-border bg-card border-amber-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <CardTitle className="text-sm font-medium">Experiment Leaderboard</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {experimentResults.map((result, index) => (
                <div
                  key={`${result.name}-${index}`}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    index === 0
                      ? 'bg-amber-500/10 border border-amber-500/30'
                      : 'bg-background/50 border border-border/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-lg font-bold ${
                        index === 0
                          ? 'text-amber-400'
                          : index === 1
                            ? 'text-gray-400'
                            : index === 2
                              ? 'text-orange-400'
                              : 'text-muted-foreground'
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-foreground">{result.name}</div>
                      <div className="text-xs text-muted-foreground">{result.modelType}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {index === 0 && <Trophy className="h-4 w-4 text-amber-400" />}
                    <span
                      className={`font-mono font-semibold ${
                        index === 0 ? 'text-amber-400' : 'text-foreground'
                      }`}
                    >
                      {(result.accuracy * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ModelAnalysis;
