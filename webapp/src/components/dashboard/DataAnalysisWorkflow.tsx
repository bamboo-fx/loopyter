import { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertCircle,
  Database,
  CheckCircle2,
  MessageSquare,
  Send,
  Loader2,
  ChevronRight,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { api } from '@/lib/api';
import { usePyodideContext } from '@/hooks/PyodideContext';
import DataCleaningVisualizer from './DataCleaningVisualizer';
import DataAnalysisVisualizer from './DataAnalysisVisualizer';
import CleaningSummarySlides from './CleaningSummarySlides';
import AnalysisSummarySlides from './AnalysisSummarySlides';
import type { DataAnalysisResult } from '@/lib/dataAnalysis';
import type { AnalyzeDataResponse, VisualizationSpec, RecommendedModel } from '../../../../backend/src/types';

interface DataAnalysisWorkflowProps {
  dataAnalysis: DataAnalysisResult | null;
  isUsingDemoData?: boolean;
}

interface CleaningOperation {
  type: string;
  column: string | null;
  description: string;
  action: string;
  impact: 'low' | 'medium' | 'high';
  rowsAffected: number;
}

interface CleaningResult {
  cleaningOperations: CleaningOperation[];
  summary: string;
  dataQualityScore: {
    before: number;
    after: number;
  };
  warnings: string[];
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
];

const DataAnalysisWorkflow = ({ dataAnalysis, isUsingDemoData = false }: DataAnalysisWorkflowProps) => {
  const { workflowState, setWorkflowState, csvFileName } = usePyodideContext();
  const { stage, cleaningResult: savedCleaningResult, aiInsights: savedAiInsights } = workflowState;

  const [error, setError] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [isLoaderVisible, setIsLoaderVisible] = useState(false);
  const [loaderStage, setLoaderStage] = useState<'cleaning' | 'analyzing' | 'generating'>('cleaning');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAnalysisSlides, setShowAnalysisSlides] = useState(false);

  // Cast saved state to proper types
  const cleaningResult = savedCleaningResult as CleaningResult | null;
  const aiInsights = savedAiInsights as AnalyzeDataResponse | null;

  // Start the workflow when data is loaded and stage is idle
  useEffect(() => {
    if (dataAnalysis && stage === 'idle' && !isProcessing) {
      startCleaningProcess();
    }
  }, [dataAnalysis, stage]);

  const startCleaningProcess = async (userFeedback?: string) => {
    if (!dataAnalysis || isProcessing) return;

    setIsProcessing(true);

    setWorkflowState({ ...workflowState, stage: 'cleaning' });
    setLoaderStage('cleaning');
    setIsLoaderVisible(true);
    setError(null);
    setShowChat(false);

    try {
      const columns = dataAnalysis.columns.map((name) => {
        const stat = dataAnalysis.stats[name];
        return {
          name,
          type: stat?.type || 'categorical',
        };
      });

      const response = await api.post<CleaningResult>('/api/ai/clean-data', {
        columns,
        sampleRows: dataAnalysis.rows.slice(0, 10),
        stats: dataAnalysis.stats,
        userFeedback,
      });

      // Add delay to show animation
      await new Promise(resolve => setTimeout(resolve, 1500));

      setWorkflowState(prev => ({
        ...prev,
        stage: 'review',
        cleaningResult: response,
        aiInsights: null,
      }));
      setIsLoaderVisible(false);
      setIsProcessing(false);
    } catch (err) {
      console.error('Failed to clean data:', err);
      setError(err instanceof Error ? err.message : 'Failed to clean data');
      setIsLoaderVisible(false);
      setIsProcessing(false);
      setWorkflowState({ ...workflowState, stage: 'idle' });
    }
  };

  const approveCleaningAndAnalyze = async () => {
    if (!dataAnalysis || isProcessing) return;

    setIsProcessing(true);
    setWorkflowState({ ...workflowState, stage: 'analyzing' });
    setLoaderStage('analyzing');
    setIsLoaderVisible(true);

    try {
      const columns = dataAnalysis.columns.map((name) => {
        const stat = dataAnalysis.stats[name];
        const sampleValues = dataAnalysis.rows
          .slice(0, 5)
          .map((row) => row[dataAnalysis.columns.indexOf(name)]);

        return {
          name,
          type: stat?.type || 'categorical',
          sampleValues,
        };
      });

      const response = await api.post<AnalyzeDataResponse>('/api/ai/analyze-data', {
        columns,
        stats: dataAnalysis.stats,
        sampleRows: dataAnalysis.rows,
      });

      // Add delay to show animation
      await new Promise(resolve => setTimeout(resolve, 1500));

      setWorkflowState(prev => ({
        ...prev,
        stage: 'complete',
        cleaningResult: workflowState.cleaningResult,
        aiInsights: response,
      }));
      setIsLoaderVisible(false);
      setIsProcessing(false);
      setShowAnalysisSlides(true); // Show analysis slides first
    } catch (err) {
      console.error('Failed to analyze data:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze data');
      setIsLoaderVisible(false);
      setIsProcessing(false);
      setWorkflowState(prev => ({ ...prev, stage: 'review' }));
    }
  };

  const handleChatSubmit = () => {
    if (chatMessage.trim()) {
      startCleaningProcess(chatMessage.trim());
      setChatMessage('');
    }
  };

  const restartWorkflow = () => {
    setWorkflowState(prev => ({
      ...prev,
      stage: 'idle',
      cleaningResult: null,
      aiInsights: null,
    }));
    setError(null);
    setShowChat(false);
    setIsProcessing(false);
    setTimeout(() => startCleaningProcess(), 100);
  };

  // Re-analyze without cleaning - goes straight to analysis
  const reanalyzeData = async () => {
    if (!dataAnalysis || isProcessing) return;

    setShowAnalysisSlides(false);
    setIsProcessing(true);
    setWorkflowState({ ...workflowState, stage: 'analyzing', aiInsights: null });
    setLoaderStage('analyzing');
    setIsLoaderVisible(true);
    setError(null);

    try {
      const columns = dataAnalysis.columns.map((name) => {
        const stat = dataAnalysis.stats[name];
        const sampleValues = dataAnalysis.rows
          .slice(0, 5)
          .map((row) => row[dataAnalysis.columns.indexOf(name)]);

        return {
          name,
          type: stat?.type || 'categorical',
          sampleValues,
        };
      });

      const response = await api.post<AnalyzeDataResponse>('/api/ai/analyze-data', {
        columns,
        stats: dataAnalysis.stats,
        sampleRows: dataAnalysis.rows,
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      setWorkflowState(prev => ({
        ...prev,
        stage: 'complete',
        cleaningResult: workflowState.cleaningResult,
        aiInsights: response,
      }));
      setIsLoaderVisible(false);
      setIsProcessing(false);
      setShowAnalysisSlides(true);
    } catch (err) {
      console.error('Failed to analyze data:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze data');
      setIsLoaderVisible(false);
      setIsProcessing(false);
      setWorkflowState(prev => ({ ...prev, stage: 'complete' }));
    }
  };

  // Prepare chart data
  const prepareChartData = (viz: VisualizationSpec) => {
    if (!dataAnalysis) return [];

    const xIndex = dataAnalysis.columns.indexOf(viz.xColumn);
    const yIndex = viz.yColumn ? dataAnalysis.columns.indexOf(viz.yColumn) : -1;

    if (xIndex === -1) return [];

    if (viz.type === 'histogram') {
      const distribution = dataAnalysis.distributions[viz.xColumn];
      if (distribution) return distribution;
      return [];
    }

    if (viz.type === 'pie') {
      const valueCounts: Record<string, number> = {};
      dataAnalysis.rows.forEach((row) => {
        const value = String(row[xIndex] ?? 'null');
        valueCounts[value] = (valueCounts[value] || 0) + 1;
      });
      return Object.entries(valueCounts).map(([name, value]) => ({ name, value }));
    }

    return dataAnalysis.rows.slice(0, 50).map((row, idx) => ({
      name: row[xIndex] ?? `Point ${idx + 1}`,
      x: typeof row[xIndex] === 'number' ? row[xIndex] : idx,
      y: yIndex >= 0 ? row[yIndex] : null,
      value: yIndex >= 0 ? row[yIndex] : row[xIndex],
    }));
  };

  const renderChart = (viz: VisualizationSpec, index: number) => {
    const data = prepareChartData(viz);
    if (data.length === 0) return null;

    // Format numbers for axis ticks
    const formatAxisTick = (value: number) => {
      if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`;
      if (Number.isInteger(value)) return value.toString();
      return value.toFixed(2);
    };

    // Format tooltip values
    const formatTooltipValue = (value: number) => {
      if (typeof value !== 'number') return value;
      if (Number.isInteger(value)) return value.toLocaleString();
      return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const chartContent = () => {
      switch (viz.type) {
        case 'bar':
          return (
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
                angle={-45}
                textAnchor="end"
                height={60}
                label={{ value: viz.xColumn, position: 'insideBottom', offset: -5, fontSize: 12, fill: 'hsl(var(--foreground))' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
                tickFormatter={formatAxisTick}
                label={{ value: viz.yColumn || 'Value', angle: -90, position: 'insideLeft', fontSize: 12, fill: 'hsl(var(--foreground))' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))', fontSize: '12px', padding: '8px 12px' }}
                formatter={(value: number) => [formatTooltipValue(value), viz.yColumn || 'Value']}
                labelFormatter={(label) => `${viz.xColumn}: ${label}`}
              />
              <Bar dataKey="value" fill={CHART_COLORS[index % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
            </BarChart>
          );
        case 'line':
          return (
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
                angle={-45}
                textAnchor="end"
                height={60}
                label={{ value: viz.xColumn, position: 'insideBottom', offset: -5, fontSize: 12, fill: 'hsl(var(--foreground))' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
                tickFormatter={formatAxisTick}
                label={{ value: viz.yColumn || 'Value', angle: -90, position: 'insideLeft', fontSize: 12, fill: 'hsl(var(--foreground))' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))', fontSize: '12px', padding: '8px 12px' }}
                formatter={(value: number) => [formatTooltipValue(value), viz.yColumn || 'Value']}
                labelFormatter={(label) => `${viz.xColumn}: ${label}`}
              />
              <Line type="monotone" dataKey="value" stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={2} dot={{ fill: CHART_COLORS[index % CHART_COLORS.length], r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          );
        case 'scatter':
          return (
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                type="number"
                dataKey="x"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
                tickFormatter={formatAxisTick}
                label={{ value: viz.xColumn, position: 'insideBottom', offset: -5, fontSize: 12, fill: 'hsl(var(--foreground))' }}
              />
              <YAxis
                type="number"
                dataKey="y"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
                tickFormatter={formatAxisTick}
                label={{ value: viz.yColumn || 'Value', angle: -90, position: 'insideLeft', fontSize: 12, fill: 'hsl(var(--foreground))' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))', fontSize: '12px', padding: '8px 12px' }}
                formatter={(value: number) => [formatTooltipValue(value)]}
                labelFormatter={() => `${viz.xColumn} vs ${viz.yColumn}`}
              />
              <Scatter data={data} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            </ScatterChart>
          );
        case 'histogram':
          return (
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="bin"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
                angle={-45}
                textAnchor="end"
                height={60}
                label={{ value: viz.xColumn, position: 'insideBottom', offset: -5, fontSize: 12, fill: 'hsl(var(--foreground))' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
                tickFormatter={formatAxisTick}
                label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fontSize: 12, fill: 'hsl(var(--foreground))' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))', fontSize: '12px', padding: '8px 12px' }}
                formatter={(value: number) => [formatTooltipValue(value), 'Count']}
                labelFormatter={(label) => `Bin: ${label}`}
              />
              <Bar dataKey="count" fill={CHART_COLORS[index % CHART_COLORS.length]} radius={[2, 2, 0, 0]} />
            </BarChart>
          );
        case 'pie':
          return (
            <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
              >
                {data.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))', fontSize: '12px', padding: '8px 12px' }}
                formatter={(value: number) => [formatTooltipValue(value), 'Count']}
              />
            </PieChart>
          );
        default:
          return null;
      }
    };

    return (
      <div key={index} className="p-6 rounded-lg bg-background/50 border border-border/50">
        <div className="text-base font-semibold text-foreground mb-1">{viz.title}</div>
        <div className="text-sm text-muted-foreground mb-4">{viz.description}</div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartContent() || <div />}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  if (!dataAnalysis) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Data Cleaning Visualizer - only for cleaning stage */}
      {loaderStage === 'cleaning' && (
        <DataCleaningVisualizer
          stage={loaderStage}
          isVisible={isLoaderVisible}
          cleaningData={{
            totalRows: dataAnalysis.rows.length,
            columns: dataAnalysis.columns.slice(0, 6),
          }}
        />
      )}

      {/* Data Analysis Visualizer - for analyzing stage */}
      {loaderStage === 'analyzing' && (
        <DataAnalysisVisualizer
          isVisible={isLoaderVisible}
          analysisData={{
            columnsCount: dataAnalysis.columns.length,
            rowsCount: dataAnalysis.rows.length,
          }}
        />
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
              <Button variant="outline" size="sm" className="ml-auto" onClick={restartWorkflow}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stage: Data Cleaning Review - Slide Through Summary */}
      {stage === 'review' && cleaningResult && (
        <CleaningSummarySlides
          cleaningResult={cleaningResult}
          onApprove={approveCleaningAndAnalyze}
          onRequestChanges={(feedback) => {
            startCleaningProcess(feedback);
          }}
          isUsingDemoData={isUsingDemoData}
        />
      )}

      {/* Stage: Analysis Complete - Show Slides First */}
      {stage === 'complete' && aiInsights && showAnalysisSlides && (
        <AnalysisSummarySlides
          aiInsights={aiInsights}
          dataAnalysis={dataAnalysis}
          onViewVisualizations={() => {
            setShowAnalysisSlides(false);
          }}
        />
      )}

      {/* Stage: Post-Analysis - Visualizations Dashboard */}
      {stage === 'complete' && aiInsights && !showAnalysisSlides && (
        <>
          {/* Header with actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              <h2 className="text-lg font-semibold">Data Visualizations</h2>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAnalysisSlides(true)}
              className="text-muted-foreground"
            >
              View Summary
            </Button>
          </div>

          {/* Visualizations */}
          {aiInsights.suggestedVisualizations.length > 0 && (
            <Card className="border-purple-500/30 bg-card">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiInsights.suggestedVisualizations.map((viz, idx) => renderChart(viz, idx))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Restart Button */}
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={reanalyzeData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-analyze Data
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default DataAnalysisWorkflow;
