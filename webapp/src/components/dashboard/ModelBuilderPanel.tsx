import { Brain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePyodideContext } from '@/hooks/PyodideContext';
import ModelChatBot from './ModelChatBot';

const ModelBuilderPanel = () => {
  const { dataAnalysis, csvFileName, workflowState } = usePyodideContext();
  const aiInsights = workflowState.aiInsights as {
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
  } | null;

  if (!dataAnalysis) {
    return (
      <Card className="h-full border-border bg-card">
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
            <div>
              <h3 className="font-semibold text-foreground">No Data Loaded</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Upload a CSV file to start building models
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-border bg-card overflow-hidden">
      <ScrollArea className="h-full">
        <ModelChatBot
          dataAnalysis={dataAnalysis}
          mlRecommendations={aiInsights?.mlRecommendations}
          csvFileName={csvFileName}
        />
      </ScrollArea>
    </Card>
  );
};

export default ModelBuilderPanel;
