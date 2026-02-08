import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Loader2,
  Bot,
  User,
  CheckCircle2,
  Play,
  Beaker,
  Brain,
  Download,
  FileDown,
  Code,
  ChevronDown,
  ChevronUp,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { useNotebookCellsContext } from '@/hooks/NotebookCellsContext';
import { usePyodideContext } from '@/hooks/PyodideContext';
import { exportModel, checkModelExists, getModelInfo } from '@/lib/pyodide';
import type { DataAnalysisResult } from '@/lib/dataAnalysis';
import type { MLRecommendations, ModelChatResponse } from '../../../../backend/src/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelType?: string;
  targetColumn?: string;
  features?: string[];
  isRunning?: boolean;
  cellId?: string;
  ranSuccessfully?: boolean;
  // Model analysis data
  analysis?: ModelAnalysis;
  experiments?: ExperimentSuggestion[];
}

interface ModelAnalysis {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  accuracy: number;
  modelType: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

interface ExperimentSuggestion {
  name: string;
  description: string;
  code: string;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  accuracy?: number;
  output?: string;
  error?: string;
  isExpanded?: boolean;
}

interface ModelChatBotProps {
  dataAnalysis: DataAnalysisResult;
  mlRecommendations?: MLRecommendations;
  csvFileName?: string | null;
}

const ModelChatBot = ({ dataAnalysis, mlRecommendations, csvFileName }: ModelChatBotProps) => {
  const { addCellWithContent, runCell, cellResults, cells } = useNotebookCellsContext();
  const { execute, pyodideState, workflowState, setWorkflowState } = usePyodideContext();

  // Initialize messages from persisted state or empty
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = workflowState.modelBuilderMessages as ChatMessage[] | null;
    return saved || [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningExperiments, setIsRunningExperiments] = useState(false);
  const [experimentProgress, setExperimentProgress] = useState(0);
  const [modelAvailable, setModelAvailable] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentModelType, setCurrentModelType] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastAnalyzedModelRef = useRef<string | null>(null);

  // Persist messages to workflow state whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      setWorkflowState(prev => ({
        ...prev,
        modelBuilderMessages: messages,
      }));
    }
  }, [messages, setWorkflowState]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Check if model exists whenever a cell runs successfully
  useEffect(() => {
    const checkModel = async () => {
      const exists = await checkModelExists('model');
      setModelAvailable(exists);
      if (exists) {
        const info = await getModelInfo('model');
        if (info) {
          setCurrentModelType(info.type);
        }
      }
    };

    if (pyodideState.isReady) {
      checkModel();
    }
  }, [cellResults, pyodideState.isReady]);

  // Initial greeting based on ML recommendations
  useEffect(() => {
    if (mlRecommendations && messages.length === 0) {
      // Build recommended models list without markdown
      const modelsText = mlRecommendations.recommendedModels
        .slice(0, 3)
        .map((m, i) => `${i + 1}. ${m.name} (${m.expectedPerformance} performance) - ${m.reason}`)
        .join('\n');

      const featuresText = mlRecommendations.featureColumns.slice(0, 5).join(', ');
      const targetText = mlRecommendations.targetColumn || 'a target column';

      const greeting: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `I've analyzed your data and I'm ready to help you build a ${mlRecommendations.taskType} model.\n\nRecommended Models:\n${modelsText}\n\nTarget: ${targetText}\nKey Features: ${featuresText}\n\nTell me which model you'd like to try, or describe what you want to predict!`,
      };
      setMessages([greeting]);
    }
  }, [mlRecommendations]);

  // Watch for new model runs and analyze them
  useEffect(() => {
    const { latestDetectedModel } = cellResults;
    if (!latestDetectedModel?.detected) return;

    const modelKey = `${latestDetectedModel.modelType}-${latestDetectedModel.metrics.accuracy}`;
    if (lastAnalyzedModelRef.current === modelKey) return;
    lastAnalyzedModelRef.current = modelKey;

    analyzeDetectedModel(latestDetectedModel);
  }, [cellResults.latestDetectedModel]);

  const analyzeDetectedModel = async (model: typeof cellResults.latestDetectedModel) => {
    if (!model) return;

    const analyzingMessage: ChatMessage = {
      id: `msg-analyzing-${Date.now()}`,
      role: 'system',
      content: 'Analyzing your model...',
      isRunning: true,
    };
    setMessages(prev => [...prev, analyzingMessage]);

    try {
      const cellWithModel = cells.find(c => c.detectedModel?.detected);
      const code = cellWithModel?.content || '';

      const response = await api.post<{
        insight: {
          quality: 'excellent' | 'good' | 'fair' | 'poor';
          summary: string;
          strengths: string[];
          weaknesses: string[];
          suggestions: string[];
        };
        experiments: ExperimentSuggestion[];
      }>('/api/ai/analyze-detected-model', {
        modelType: model.modelType,
        metrics: model.metrics,
        summary: model.summary,
        code: code,
        dataFileName: csvFileName,
      });

      const accuracy = model.metrics.accuracy ?? 0;
      const analysis: ModelAnalysis = {
        quality: response.insight.quality,
        accuracy,
        modelType: model.modelType || 'Unknown',
        strengths: response.insight.strengths,
        weaknesses: response.insight.weaknesses,
        suggestions: response.insight.suggestions,
      };

      // Remove the analyzing message and add the analysis
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== analyzingMessage.id);
        return [...filtered, {
          id: `msg-analysis-${Date.now()}`,
          role: 'assistant',
          content: response.insight.summary,
          analysis,
          experiments: response.experiments.map(e => ({ ...e, status: 'pending' as const })),
        }];
      });
    } catch (err) {
      console.error('Failed to analyze model:', err);
      const accuracy = model.metrics.accuracy ?? 0;
      const quality = accuracy >= 0.9 ? 'excellent' : accuracy >= 0.7 ? 'good' : accuracy >= 0.5 ? 'fair' : 'poor';

      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== analyzingMessage.id);
        return [...filtered, {
          id: `msg-analysis-${Date.now()}`,
          role: 'assistant',
          content: `Your ${model.modelType || 'model'} achieved ${(accuracy * 100).toFixed(1)}% accuracy.`,
          analysis: {
            quality,
            accuracy,
            modelType: model.modelType || 'Unknown',
            strengths: accuracy >= 0.7 ? ['Model shows good predictive power'] : [],
            weaknesses: accuracy < 0.7 ? ['Model accuracy could be improved'] : [],
            suggestions: accuracy < 0.7 ? ['Try different feature combinations', 'Consider other model types'] : ['Model is performing well'],
          },
        }];
      });
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const dataContext = {
        columns: dataAnalysis.columns.map((name) => {
          const stat = dataAnalysis.stats[name];
          const sampleValues = dataAnalysis.rows
            .slice(0, 5)
            .map((row) => row[dataAnalysis.columns.indexOf(name)]);
          return {
            name,
            type: stat?.type || 'categorical' as const,
            sampleValues,
          };
        }),
        rowCount: dataAnalysis.rows.length,
        csvFileName: csvFileName || 'uploaded.csv',
      };

      const conversationHistory = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      const response = await api.post<ModelChatResponse>('/api/ai/model-chat', {
        message: input.trim(),
        dataContext,
        conversationHistory,
        mlRecommendations,
      });

      const messageId = `msg-${Date.now()}-response`;
      const assistantMessage: ChatMessage = {
        id: messageId,
        role: 'assistant',
        content: response.response,
        modelType: response.modelType,
        targetColumn: response.targetColumn,
        features: response.features,
        isRunning: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);

      // Auto-run the code
      try {
        const cellId = addCellWithContent('code', response.code);
        await new Promise((resolve) => setTimeout(resolve, 100));
        await runCell(cellId);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, isRunning: false, cellId, ranSuccessfully: true }
              : m
          )
        );

        // Check if model is available after running
        const exists = await checkModelExists('model');
        setModelAvailable(exists);
        if (exists) {
          setCurrentModelType(response.modelType);
        }
      } catch (runError) {
        console.error('Run error:', runError);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, isRunning: false, ranSuccessfully: false }
              : m
          )
        );
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
      setIsLoading(false);
    }
  };

  const handleDownloadModel = async () => {
    setIsExporting(true);
    try {
      const blob = await exportModel('model', 'joblib');
      if (blob) {
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentModelType || 'model'}_trained.joblib`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const runExperiment = async (messageId: string, expIndex: number, experiment: ExperimentSuggestion) => {
    if (!pyodideState.isReady) return;

    // Update experiment status to running
    setMessages(prev => prev.map(m => {
      if (m.id === messageId && m.experiments) {
        const newExperiments = [...m.experiments];
        newExperiments[expIndex] = { ...newExperiments[expIndex], status: 'running', isExpanded: true };
        return { ...m, experiments: newExperiments };
      }
      return m;
    }));

    try {
      // Create a code cell with the experiment code so it appears in the notebook
      const cellId = addCellWithContent('code', experiment.code);
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Run the cell - this executes the code, sets output, and triggers model detection for the Runs tab
      await runCell(cellId);

      // Wait a bit for state to propagate then try to get cell output
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Try to find the cell in the updated cells array
      // Note: This may not reflect the latest state due to React's async nature
      // But the notebook will show the output and Runs will show the detected model
      let output = '';
      let errorOutput = '';
      let accuracy: number | undefined;

      // Check cellResults for the detected model from this run
      const detectedRuns = cellResults.detectedRuns;
      const latestRun = detectedRuns.find(r => r.cellId === cellId);
      if (latestRun && latestRun.accuracy !== null) {
        accuracy = latestRun.accuracy;
        output = `Model: ${latestRun.modelType}\nAccuracy: ${(latestRun.accuracy * 100).toFixed(1)}%`;
      } else {
        // Fallback: run execute to get output for the UI
        const { result } = await execute(experiment.code);
        output = result.stdout || 'Model trained successfully';
        errorOutput = result.error || '';

        // Extract accuracy from output
        const r2Match = output.match(/R\^?2\s*(?:score)?[:\s]+([0-9.]+)/i) ||
                        output.match(/(?:accuracy|score)[:\s]+([0-9.]+)/i);
        accuracy = r2Match ? parseFloat(r2Match[1]) : undefined;
      }

      setMessages(prev => prev.map(m => {
        if (m.id === messageId && m.experiments) {
          const newExperiments = [...m.experiments];
          newExperiments[expIndex] = {
            ...newExperiments[expIndex],
            status: errorOutput ? 'failed' : 'completed',
            accuracy,
            output: output || 'Model trained successfully',
            error: errorOutput || undefined,
            isExpanded: true,
          };
          return { ...m, experiments: newExperiments };
        }
        return m;
      }));

      // Check if model is available after experiment
      const exists = await checkModelExists('model');
      setModelAvailable(exists);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setMessages(prev => prev.map(m => {
        if (m.id === messageId && m.experiments) {
          const newExperiments = [...m.experiments];
          newExperiments[expIndex] = {
            ...newExperiments[expIndex],
            status: 'failed',
            error: errorMessage,
            isExpanded: true,
          };
          return { ...m, experiments: newExperiments };
        }
        return m;
      }));
    }
  };

  const runAllExperiments = async (messageId: string, experiments: ExperimentSuggestion[]) => {
    if (!pyodideState.isReady) return;

    setIsRunningExperiments(true);
    setExperimentProgress(0);

    for (let i = 0; i < experiments.length; i++) {
      await runExperiment(messageId, i, experiments[i]);
      setExperimentProgress(((i + 1) / experiments.length) * 100);
    }

    setIsRunningExperiments(false);
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

  return (
    <div className="flex flex-col h-full">
      {/* Model Export Info - if available */}
      {modelAvailable && (
        <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileDown className="h-4 w-4 text-emerald-400" />
              <div>
                <span className="text-sm font-medium text-emerald-400">Model Ready</span>
                {currentModelType && (
                  <span className="text-xs text-muted-foreground ml-2">{currentModelType}</span>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              onClick={handleDownloadModel}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              Export
            </Button>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              {/* Regular chat message */}
              {message.role !== 'system' && (
                <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Bot className="h-3.5 w-3.5 text-amber-400" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-amber-600 text-white'
                      : 'bg-zinc-800/50 border border-zinc-700/50'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>

                    {/* Model badges */}
                    {message.modelType && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30">
                          {message.modelType}
                        </Badge>
                        {message.targetColumn && (
                          <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-400/30">
                            Target: {message.targetColumn}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Running/Success status */}
                    {message.isRunning && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Running model...
                      </div>
                    )}
                    {message.ranSuccessfully && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Model executed
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-zinc-300" />
                    </div>
                  )}
                </div>
              )}

              {/* System message (analyzing) */}
              {message.role === 'system' && message.isRunning && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Brain className="h-3.5 w-3.5 text-cyan-400" />
                  </div>
                  <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {message.content}
                    </div>
                  </div>
                </div>
              )}

              {/* Model Analysis Card */}
              {message.analysis && (
                <div className={`ml-10 rounded-lg border p-3 ${getQualityBg(message.analysis.quality)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-cyan-400" />
                      <span className="text-sm font-medium">Analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${getQualityColor(message.analysis.quality)}`}>
                        {(message.analysis.accuracy * 100).toFixed(1)}%
                      </span>
                      <Badge variant="outline" className={`text-xs ${getQualityColor(message.analysis.quality)}`}>
                        {message.analysis.quality}
                      </Badge>
                    </div>
                  </div>

                  {/* Compact strengths/weaknesses */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {message.analysis.strengths.length > 0 && (
                      <div>
                        <span className="text-emerald-400 font-medium">Strengths</span>
                        <ul className="mt-1 space-y-0.5 text-muted-foreground">
                          {message.analysis.strengths.slice(0, 2).map((s, i) => (
                            <li key={i} className="truncate">• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {message.analysis.weaknesses.length > 0 && (
                      <div>
                        <span className="text-red-400 font-medium">Improve</span>
                        <ul className="mt-1 space-y-0.5 text-muted-foreground">
                          {message.analysis.weaknesses.slice(0, 2).map((w, i) => (
                            <li key={i} className="truncate">• {w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Experiments with code blocks */}
              {message.experiments && message.experiments.length > 0 && (
                <div className="ml-10 rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Beaker className="h-4 w-4 text-purple-400" />
                      <span className="text-sm font-medium">Try Different Models</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs"
                      onClick={() => runAllExperiments(message.id, message.experiments!)}
                      disabled={isRunningExperiments || !pyodideState.isReady}
                    >
                      {isRunningExperiments ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Run All
                        </>
                      )}
                    </Button>
                  </div>

                  {isRunningExperiments && (
                    <Progress value={experimentProgress} className="h-1 mb-3" />
                  )}

                  <div className="space-y-2">
                    {message.experiments
                      .sort((a, b) => {
                        // Completed experiments with accuracy first, sorted by accuracy
                        if (a.status === 'completed' && b.status === 'completed') {
                          return (b.accuracy || 0) - (a.accuracy || 0);
                        }
                        if (a.status === 'completed') return -1;
                        if (b.status === 'completed') return 1;
                        return 0;
                      })
                      .map((exp, i) => {
                        const toggleExpand = () => {
                          setMessages(prev => prev.map(m => {
                            if (m.id === message.id && m.experiments) {
                              const newExperiments = [...m.experiments];
                              const originalIndex = m.experiments.findIndex(e => e.name === exp.name);
                              if (originalIndex !== -1) {
                                newExperiments[originalIndex] = {
                                  ...newExperiments[originalIndex],
                                  isExpanded: !newExperiments[originalIndex].isExpanded
                                };
                              }
                              return { ...m, experiments: newExperiments };
                            }
                            return m;
                          }));
                        };

                        return (
                          <div
                            key={i}
                            className={`rounded-lg border overflow-hidden ${
                              exp.status === 'completed' ? 'border-emerald-500/30 bg-emerald-500/5' :
                              exp.status === 'failed' ? 'border-red-500/30 bg-red-500/5' :
                              exp.status === 'running' ? 'border-purple-500/30 bg-purple-500/10' :
                              'border-zinc-700/50 bg-zinc-800/30'
                            }`}
                          >
                            {/* Experiment header */}
                            <div
                              className="flex items-center justify-between p-2 cursor-pointer hover:bg-white/5"
                              onClick={toggleExpand}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {exp.status === 'running' && <Loader2 className="h-3 w-3 animate-spin text-purple-400 flex-shrink-0" />}
                                {exp.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0" />}
                                {exp.status === 'failed' && <XCircle className="h-3 w-3 text-red-400 flex-shrink-0" />}
                                {!exp.status || exp.status === 'pending' ? (
                                  <div className="h-3 w-3 rounded-full border border-zinc-600 flex-shrink-0" />
                                ) : null}
                                <span className="text-xs font-medium truncate">{exp.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {exp.status === 'completed' && exp.accuracy !== undefined && (
                                  <span className="font-mono text-xs font-bold text-emerald-400">
                                    {(exp.accuracy * 100).toFixed(1)}%
                                  </span>
                                )}
                                {!exp.status && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 px-2 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const originalIndex = message.experiments!.findIndex(e => e.name === exp.name);
                                      runExperiment(message.id, originalIndex, exp);
                                    }}
                                    disabled={!pyodideState.isReady}
                                  >
                                    <Play className="h-3 w-3" />
                                  </Button>
                                )}
                                {exp.isExpanded ? (
                                  <ChevronUp className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            </div>

                            {/* Expanded content - code and output */}
                            {exp.isExpanded && (
                              <div className="border-t border-zinc-700/50">
                                {/* Description */}
                                <div className="px-3 py-2 text-xs text-muted-foreground">
                                  {exp.description}
                                </div>

                                {/* Code block */}
                                <div className="border-t border-zinc-700/50">
                                  <div className="flex items-center gap-1 px-3 py-1 bg-zinc-900/50">
                                    <Code className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Code</span>
                                  </div>
                                  <pre className="p-3 text-xs font-mono overflow-x-auto bg-zinc-950/50 max-h-48 overflow-y-auto">
                                    <code className="text-zinc-300">{exp.code}</code>
                                  </pre>
                                </div>

                                {/* Output block */}
                                {(exp.output || exp.error) && (
                                  <div className="border-t border-zinc-700/50">
                                    <div className="flex items-center gap-1 px-3 py-1 bg-zinc-900/50">
                                      <span className="text-xs text-muted-foreground">Output</span>
                                    </div>
                                    <pre className={`p-3 text-xs font-mono overflow-x-auto max-h-32 overflow-y-auto ${
                                      exp.error ? 'text-red-400' : 'text-emerald-400'
                                    }`}>
                                      {exp.output || exp.error}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Generating model...
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick suggestions - based on recommendations */}
      {messages.length <= 1 && mlRecommendations && (
        <div className="px-6 py-3 border-t border-zinc-800">
          <p className="text-xs text-muted-foreground mb-2">Quick start:</p>
          <div className="flex flex-wrap gap-2">
            {mlRecommendations.recommendedModels.slice(0, 3).map((model, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="text-xs h-7 border-zinc-700 hover:border-amber-500/50 hover:text-amber-400"
                onClick={() => setInput(`Build a ${model.name} to predict ${mlRecommendations.targetColumn || 'the target'}`)}
              >
                {model.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
        <div className="flex gap-2">
          <Input
            placeholder="Describe what you want to predict..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            disabled={isLoading}
            className="flex-1 bg-zinc-800/50 border-zinc-700"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-amber-600 hover:bg-amber-500"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModelChatBot;
