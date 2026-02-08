import { useState, useEffect } from 'react';
import { Sparkles, Lightbulb, Loader2, BarChart3, TrendingUp, AlertCircle, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import type { DataAnalysisResult } from '@/lib/dataAnalysis';
import type { AnalyzeDataResponse, VisualizationSpec, RecommendedModel } from '../../../../backend/src/types';

interface SmartVisualizationsProps {
  dataAnalysis: DataAnalysisResult | null;
  isUsingDemoData?: boolean;
}

// Chart colors
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

const SmartVisualizations = ({ dataAnalysis, isUsingDemoData = false }: SmartVisualizationsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<AnalyzeDataResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dataAnalysis) {
      setAiInsights(null);
      return;
    }

    const fetchAIInsights = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Prepare the request data
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

        setAiInsights(response);
      } catch (err) {
        console.error('Failed to get AI insights:', err);
        setError(err instanceof Error ? err.message : 'Failed to analyze data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAIInsights();
  }, [dataAnalysis]);

  // Prepare chart data based on visualization type
  const prepareChartData = (viz: VisualizationSpec) => {
    if (!dataAnalysis) return [];

    const xIndex = dataAnalysis.columns.indexOf(viz.xColumn);
    const yIndex = viz.yColumn ? dataAnalysis.columns.indexOf(viz.yColumn) : -1;

    if (xIndex === -1) return [];

    // For histogram, use the distribution data
    if (viz.type === 'histogram') {
      const distribution = dataAnalysis.distributions[viz.xColumn];
      if (distribution) {
        return distribution;
      }
      return [];
    }

    // For pie chart, aggregate by category
    if (viz.type === 'pie') {
      const valueCounts: Record<string, number> = {};
      dataAnalysis.rows.forEach((row) => {
        const value = String(row[xIndex] ?? 'null');
        valueCounts[value] = (valueCounts[value] || 0) + 1;
      });
      return Object.entries(valueCounts).map(([name, value]) => ({ name, value }));
    }

    // For line, bar, scatter - use row data
    return dataAnalysis.rows.map((row, idx) => ({
      name: row[xIndex] ?? `Point ${idx + 1}`,
      x: typeof row[xIndex] === 'number' ? row[xIndex] : idx,
      y: yIndex >= 0 ? row[yIndex] : null,
      value: yIndex >= 0 ? row[yIndex] : row[xIndex],
    }));
  };

  const renderChart = (viz: VisualizationSpec, index: number) => {
    const data = prepareChartData(viz);
    if (data.length === 0) return null;

    const chartContent = () => {
      switch (viz.type) {
        case 'bar':
          return (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  color: 'hsl(var(--foreground))',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="value" fill={CHART_COLORS[index % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
            </BarChart>
          );

        case 'line':
          return (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  color: 'hsl(var(--foreground))',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS[index % CHART_COLORS.length], r: 3 }}
              />
            </LineChart>
          );

        case 'scatter':
          return (
            <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                dataKey="x"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
              />
              <YAxis
                type="number"
                dataKey="y"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  color: 'hsl(var(--foreground))',
                  fontSize: '12px',
                }}
              />
              <Scatter data={data} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            </ScatterChart>
          );

        case 'histogram':
          return (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="bin"
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  color: 'hsl(var(--foreground))',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [value, 'Count']}
              />
              <Bar dataKey="count" fill={CHART_COLORS[index % CHART_COLORS.length]} radius={[2, 2, 0, 0]} />
            </BarChart>
          );

        case 'pie':
          return (
            <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  color: 'hsl(var(--foreground))',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          );

        default:
          return (
            <BarChart data={[]} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            </BarChart>
          );
      }
    };

    const chart = chartContent();

    return (
      <div key={index} className="p-4 rounded-lg bg-background/50 border border-border/50">
        <div className="text-sm font-medium text-foreground mb-1">{viz.title}</div>
        <div className="text-xs text-muted-foreground mb-3">{viz.description}</div>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            {chart}
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
      {/* AI Data Analysis Card */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              <CardTitle className="text-sm font-medium">AI Data Analysis</CardTitle>
            </div>
            {isUsingDemoData && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Database className="h-3 w-3" />
                Demo Data
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-400 mr-2" />
              <span className="text-sm text-muted-foreground">Analyzing your data with AI...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-red-400 py-4">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          ) : aiInsights ? (
            <div className="space-y-4">
              {/* Data Description */}
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  About Your Data
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {aiInsights.dataDescription}
                </p>
              </div>

              {/* Key Insights */}
              {aiInsights.insights.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-yellow-400" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                      Key Insights
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {aiInsights.insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <BarChart3 className="h-5 w-5" />
              <span className="text-sm">No AI analysis available</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI-Suggested Visualizations */}
      {aiInsights && aiInsights.suggestedVisualizations.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium">
                  AI-Suggested Visualizations
                </CardTitle>
              </div>
              {isUsingDemoData && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Database className="h-3 w-3" />
                  Demo Data
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiInsights.suggestedVisualizations.map((viz, idx) => renderChart(viz, idx))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ML Recommendations Card */}
      {aiInsights?.mlRecommendations && (
        <Card className="border-border bg-card border-purple-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <CardTitle className="text-sm font-medium">
                ML Model Recommendations
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Task Type */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Recommended Task</span>
              <span className="text-sm font-medium capitalize">
                {aiInsights.mlRecommendations.taskType}
              </span>
            </div>

            {/* Target Column */}
            {aiInsights.mlRecommendations.targetColumn && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Likely Target</span>
                <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                  {aiInsights.mlRecommendations.targetColumn}
                </span>
              </div>
            )}

            {/* Recommended Models */}
            {aiInsights.mlRecommendations.recommendedModels?.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Recommended Models
                </div>
                <div className="space-y-2">
                  {aiInsights.mlRecommendations.recommendedModels.map((model: RecommendedModel, idx: number) => (
                    <div key={idx} className="flex items-start justify-between p-2 rounded-lg bg-background/50 border border-border/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{model.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            model.expectedPerformance === 'high'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : model.expectedPerformance === 'medium'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {model.expectedPerformance}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{model.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feature Engineering Suggestions */}
            {aiInsights.mlRecommendations.featureEngineeringSuggestions?.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Feature Engineering Tips
                </div>
                <ul className="space-y-1">
                  {aiInsights.mlRecommendations.featureEngineeringSuggestions.map((tip: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Lightbulb className="h-3 w-3 text-amber-400 mt-1 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmartVisualizations;
