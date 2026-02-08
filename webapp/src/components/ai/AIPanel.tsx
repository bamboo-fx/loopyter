import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Lightbulb,
  Beaker,
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Brain,
  Target,
  Zap,
  Play,
  Trophy,
  RotateCw,
  Pause,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { usePyodideContext } from "@/hooks/PyodideContext";
import { useNotebookCellsContext } from "@/hooks/NotebookCellsContext";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface ModelInsight {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  shouldTryOtherModels: boolean;
  suggestedModels: string[];
  suggestedFeatureChanges: string[];
}

interface ExperimentSuggestion {
  name: string;
  description: string;
  code: string;
  modelType?: string;
  complexity?: string;
}

interface ExperimentResult {
  name: string;
  accuracy: number;
  modelType: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

const AIPanel = () => {
  const { execute, pyodideState, csvFileName, dataAnalysis } = usePyodideContext();
  const { cellResults, cells } = useNotebookCellsContext();
  const { latestDetectedModel } = cellResults;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [modelInsight, setModelInsight] = useState<ModelInsight | null>(null);
  const [experiments, setExperiments] = useState<ExperimentSuggestion[]>([]);
  const [experimentResults, setExperimentResults] = useState<ExperimentResult[]>([]);

  // Autonomous run state
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [autoRunProgress, setAutoRunProgress] = useState(0);
  const [currentExperimentIndex, setCurrentExperimentIndex] = useState(-1);
  const [shouldStopAutoRun, setShouldStopAutoRun] = useState(false);

  // Analyze the detected model when it changes
  useEffect(() => {
    if (!latestDetectedModel?.detected) {
      return;
    }

    analyzeDetectedModel();
  }, [latestDetectedModel?.detected, latestDetectedModel?.metrics?.accuracy]);

  const analyzeDetectedModel = async () => {
    if (!latestDetectedModel) return;

    setIsAnalyzing(true);

    try {
      const cellWithModel = cells.find(c => c.detectedModel?.detected);
      const code = cellWithModel?.content || '';

      const response = await api.post<{
        insight: ModelInsight;
        experiments: ExperimentSuggestion[];
      }>('/api/ai/analyze-detected-model', {
        modelType: latestDetectedModel.modelType,
        metrics: latestDetectedModel.metrics,
        summary: latestDetectedModel.summary,
        code: code,
        dataFileName: csvFileName,
      });

      setModelInsight(response.insight);

      // If accuracy is low, automatically generate more experiments
      const accuracy = latestDetectedModel.metrics.accuracy ?? 0;
      if (accuracy < 0.7 && response.experiments) {
        setExperiments(response.experiments);
      } else if (response.experiments) {
        setExperiments(response.experiments);
      }
    } catch (err) {
      console.error('Failed to analyze model:', err);
      const accuracy = latestDetectedModel.metrics.accuracy ?? 0;
      const quality = accuracy >= 0.9 ? 'excellent' : accuracy >= 0.7 ? 'good' : accuracy >= 0.5 ? 'fair' : 'poor';

      setModelInsight({
        quality,
        summary: `Your ${latestDetectedModel.modelType || 'model'} achieved an R²/accuracy of ${(accuracy * 100).toFixed(1)}%.`,
        strengths: accuracy >= 0.7 ? ['Model shows good predictive power'] : [],
        weaknesses: accuracy < 0.7 ? ['Model accuracy could be improved'] : [],
        suggestions: accuracy < 0.7 ? ['Try different feature combinations', 'Consider other model types'] : ['Model is performing well'],
        shouldTryOtherModels: accuracy < 0.7,
        suggestedModels: accuracy < 0.7 ? ['RandomForestRegressor', 'GradientBoostingRegressor', 'Ridge'] : [],
        suggestedFeatureChanges: [],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateExperiments = async () => {
    if (!dataAnalysis) {
      toast.error('No data loaded', { description: 'Please upload data first.' });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await api.post<{
        experiments: ExperimentSuggestion[];
        strategy: string;
      }>('/api/ai/generate-model-experiments', {
        dataFileName: csvFileName,
        columns: dataAnalysis.columns,
        targetColumn: dataAnalysis.columns[dataAnalysis.columns.length - 1], // Assume last column is target
        taskType: 'regression',
        currentAccuracy: latestDetectedModel?.metrics?.accuracy,
        currentModelType: latestDetectedModel?.modelType,
      });

      setExperiments(response.experiments || []);
      toast.success('Experiments generated', { description: response.strategy });
    } catch (err) {
      console.error('Failed to generate experiments:', err);
      toast.error('Failed to generate experiments');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runSingleExperiment = async (experiment: ExperimentSuggestion, index: number): Promise<ExperimentResult> => {
    const result: ExperimentResult = {
      name: experiment.name,
      accuracy: 0,
      modelType: experiment.modelType || experiment.name,
      status: 'running',
    };

    try {
      const { result: execResult } = await execute(experiment.code);
      const output = execResult.stdout || '';

      // Try to extract accuracy/R² from output
      const r2Match = output.match(/R\^?2\s*(?:score)?[:\s]+([0-9.]+)/i) ||
                      output.match(/(?:accuracy|score)[:\s]+([0-9.]+)/i);
      const accuracy = r2Match ? parseFloat(r2Match[1]) : 0;

      result.accuracy = accuracy;
      result.status = 'completed';
    } catch (err) {
      result.status = 'failed';
      result.error = err instanceof Error ? err.message : 'Unknown error';
    }

    return result;
  };

  const runExperiment = async (experiment: ExperimentSuggestion, index: number) => {
    if (!pyodideState.isReady) return;

    // Update status to running
    setExperimentResults(prev => {
      const updated = [...prev];
      const existingIndex = updated.findIndex(r => r.name === experiment.name);
      if (existingIndex >= 0) {
        updated[existingIndex] = { ...updated[existingIndex], status: 'running' };
      } else {
        updated.push({ name: experiment.name, accuracy: 0, modelType: experiment.name, status: 'running' });
      }
      return updated;
    });

    const result = await runSingleExperiment(experiment, index);

    setExperimentResults(prev => {
      const updated = prev.filter(r => r.name !== experiment.name);
      updated.push(result);
      return updated.sort((a, b) => b.accuracy - a.accuracy);
    });

    if (result.status === 'completed') {
      toast.success(`${experiment.name} completed`, {
        description: `R²/Accuracy: ${(result.accuracy * 100).toFixed(2)}%`,
      });
    } else {
      toast.error(`${experiment.name} failed`, {
        description: result.error,
      });
    }
  };

  const runAllExperiments = useCallback(async () => {
    if (!pyodideState.isReady || experiments.length === 0) return;

    setIsAutoRunning(true);
    setShouldStopAutoRun(false);
    setAutoRunProgress(0);
    setExperimentResults([]);

    for (let i = 0; i < experiments.length; i++) {
      if (shouldStopAutoRun) break;

      setCurrentExperimentIndex(i);
      setAutoRunProgress(((i) / experiments.length) * 100);

      const experiment = experiments[i];

      // Add to results as running
      setExperimentResults(prev => [
        ...prev,
        { name: experiment.name, accuracy: 0, modelType: experiment.name, status: 'running' }
      ]);

      const result = await runSingleExperiment(experiment, i);

      // Update with final result
      setExperimentResults(prev => {
        const updated = prev.filter(r => r.name !== experiment.name);
        updated.push(result);
        return updated.sort((a, b) => b.accuracy - a.accuracy);
      });

      setAutoRunProgress(((i + 1) / experiments.length) * 100);
    }

    setIsAutoRunning(false);
    setCurrentExperimentIndex(-1);
    setAutoRunProgress(100);

    toast.success('All experiments completed!', {
      description: 'Check the leaderboard for results.',
    });
  }, [experiments, pyodideState.isReady, shouldStopAutoRun, execute]);

  const stopAutoRun = () => {
    setShouldStopAutoRun(true);
    setIsAutoRunning(false);
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-emerald-400';
      case 'good': return 'text-cyan-400';
      case 'fair': return 'text-amber-400';
      case 'poor': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  const getQualityBg = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'bg-emerald-500/10 border-emerald-500/30';
      case 'good': return 'bg-cyan-500/10 border-cyan-500/30';
      case 'fair': return 'bg-amber-500/10 border-amber-500/30';
      case 'poor': return 'bg-red-500/10 border-red-500/30';
      default: return 'bg-muted/50 border-border';
    }
  };

  const bestResult = experimentResults.length > 0 ? experimentResults[0] : null;
  const completedCount = experimentResults.filter(r => r.status === 'completed').length;

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 pr-4">
        {/* No Model Detected State */}
        {!latestDetectedModel?.detected && !isAutoRunning && (
          <Card className="border-border bg-card">
            <CardContent className="py-8">
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <Brain className="h-10 w-10 mb-3 opacity-50" />
                <p className="font-medium">No Model Detected</p>
                <p className="text-sm text-center mt-1 mb-4">
                  Run code with an ML model to see AI analysis
                </p>
                {dataAnalysis && (
                  <Button onClick={generateExperiments} disabled={isAnalyzing}>
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Auto-Generate Model Experiments
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isAnalyzing && !isAutoRunning && (
          <Card className="border-border bg-card">
            <CardContent className="py-8">
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400 mr-3" />
                <span className="text-sm text-muted-foreground">Analyzing your model...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Model Insight Card */}
        {modelInsight && latestDetectedModel && (
          <>
            <Card className={`border ${getQualityBg(modelInsight.quality)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-cyan-400" />
                    <CardTitle className="text-sm font-medium">Model Analysis</CardTitle>
                  </div>
                  <Badge variant="outline" className={getQualityColor(modelInsight.quality)}>
                    {modelInsight.quality.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Model</span>
                  <span className="text-sm font-medium">{latestDetectedModel.modelType || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">R² / Accuracy</span>
                  <span className={`text-lg font-bold ${getQualityColor(modelInsight.quality)}`}>
                    {((latestDetectedModel.metrics.accuracy ?? 0) * 100).toFixed(2)}%
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {modelInsight.summary}
                </p>
              </CardContent>
            </Card>

            {/* Strengths */}
            {modelInsight.strengths.length > 0 && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <CardTitle className="text-sm font-medium text-emerald-400">Strengths</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {modelInsight.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Weaknesses & Suggestions for low accuracy */}
            {modelInsight.weaknesses.length > 0 && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-400" />
                    <CardTitle className="text-sm font-medium text-red-400">Areas to Improve</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {modelInsight.weaknesses.map((weakness, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                        <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {modelInsight.suggestions.length > 0 && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-400" />
                    <CardTitle className="text-sm font-medium">Suggestions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {modelInsight.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Zap className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Auto-Run Controls */}
        {experiments.length > 0 && (
          <Card className="border-border bg-card border-purple-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Beaker className="h-5 w-5 text-purple-400" />
                  <CardTitle className="text-sm font-medium">
                    Autonomous Model Testing
                  </CardTitle>
                </div>
                <Badge variant="secondary">{experiments.length} experiments</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAutoRunning && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Running: {experiments[currentExperimentIndex]?.name || '...'}
                    </span>
                    <span className="text-foreground">
                      {completedCount}/{experiments.length}
                    </span>
                  </div>
                  <Progress value={autoRunProgress} className="h-2" />
                </div>
              )}

              <div className="flex gap-2">
                {!isAutoRunning ? (
                  <Button
                    onClick={runAllExperiments}
                    className="flex-1 bg-purple-600 hover:bg-purple-500"
                    disabled={!pyodideState.isReady}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run All Experiments
                  </Button>
                ) : (
                  <Button
                    onClick={stopAutoRun}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={generateExperiments}
                  disabled={isAnalyzing || isAutoRunning}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Individual Experiments */}
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {experiments.map((exp, index) => {
                  const result = experimentResults.find(r => r.name === exp.name);
                  const isRunning = result?.status === 'running' || currentExperimentIndex === index;

                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded-lg border ${
                        isRunning
                          ? 'border-purple-500/50 bg-purple-500/10'
                          : result?.status === 'completed'
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : 'border-border bg-background/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isRunning ? (
                          <Loader2 className="h-4 w-4 animate-spin text-purple-400 flex-shrink-0" />
                        ) : result?.status === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        ) : result?.status === 'failed' ? (
                          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                        )}
                        <span className="text-sm truncate">{exp.name}</span>
                      </div>
                      {result?.status === 'completed' && (
                        <span className="text-sm font-mono font-medium text-foreground">
                          {(result.accuracy * 100).toFixed(1)}%
                        </span>
                      )}
                      {!isAutoRunning && !result && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => runExperiment(exp, index)}
                          disabled={!pyodideState.isReady}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Leaderboard */}
        {experimentResults.filter(r => r.status === 'completed').length > 0 && (
          <Card className="border-border bg-card border-amber-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                <CardTitle className="text-sm font-medium">Model Leaderboard</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {experimentResults
                  .filter(r => r.status === 'completed')
                  .map((result, index) => {
                    const improvement = latestDetectedModel?.metrics?.accuracy
                      ? ((result.accuracy - latestDetectedModel.metrics.accuracy) * 100).toFixed(1)
                      : null;
                    const isImproved = improvement && parseFloat(improvement) > 0;

                    return (
                      <div
                        key={`${result.name}-${index}`}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          index === 0
                            ? 'bg-amber-500/10 border border-amber-500/30'
                            : 'bg-background/50 border border-border/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-lg font-bold ${
                              index === 0 ? 'text-amber-400' :
                              index === 1 ? 'text-gray-400' :
                              index === 2 ? 'text-orange-400' : 'text-muted-foreground'
                            }`}
                          >
                            #{index + 1}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-foreground">{result.name}</div>
                            {improvement && (
                              <div className={`text-xs ${isImproved ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isImproved ? '+' : ''}{improvement}% vs baseline
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {index === 0 && <Trophy className="h-4 w-4 text-amber-400" />}
                          <span
                            className={`font-mono font-bold text-lg ${
                              index === 0 ? 'text-amber-400' : 'text-foreground'
                            }`}
                          >
                            {(result.accuracy * 100).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {bestResult && latestDetectedModel?.metrics?.accuracy && bestResult.accuracy > latestDetectedModel.metrics.accuracy && (
                <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Better model found!</span>
                  </div>
                  <p className="text-sm text-foreground mt-1">
                    {bestResult.name} achieved {((bestResult.accuracy - latestDetectedModel.metrics.accuracy) * 100).toFixed(1)}% higher accuracy than your baseline.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};

export default AIPanel;
