import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { usePyodideContext } from "@/hooks/PyodideContext";
import DataAnalysisWorkflow from "./DataAnalysisWorkflow";

const DashboardPanel = () => {
  const { dataAnalysis, isAnalyzing, pyodideState, isUsingDemoData } = usePyodideContext();

  return (
    <div className="h-full flex flex-col gap-4 overflow-auto">
      {/* Data Preview Section - shown when data analysis is available */}
      {pyodideState.isLoading ? (
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm">Loading Python environment...</p>
            </div>
          </CardContent>
        </Card>
      ) : isAnalyzing ? (
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mb-2" />
              <p className="text-sm">Analyzing data...</p>
            </div>
          </CardContent>
        </Card>
      ) : dataAnalysis ? (
        <DataAnalysisWorkflow dataAnalysis={dataAnalysis} isUsingDemoData={isUsingDemoData} />
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <p className="text-sm">Upload a CSV file to get started</p>
              <p className="text-xs mt-1">The AI will clean and analyze your data</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPanel;
