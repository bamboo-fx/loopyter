import { useState, useCallback, useEffect } from 'react';
import { initPyodide, runPython, runPythonScript, isPyodideReady, writeCsvFile, RunResult } from '@/lib/pyodide';
import { parseRunOutput, ParsedRunResult } from '@/lib/parseResults';
import { DATA_ANALYSIS_SCRIPT, DataAnalysisResult, parseDataAnalysisResult } from '@/lib/dataAnalysis';

export interface PyodideState {
  isLoading: boolean;
  isReady: boolean;
  loadingMessage: string;
  error: string | null;
}

export interface RunState {
  isRunning: boolean;
  stdout: string;
  error: string | null;
  parsed: ParsedRunResult | null;
}

export type WorkflowStage = 'idle' | 'cleaning' | 'review' | 'analyzing' | 'complete';

export interface WorkflowState {
  stage: WorkflowStage;
  cleaningResult: unknown | null;
  aiInsights: unknown | null;
  modelBuilderMessages: unknown[] | null;
}

export function usePyodide() {
  const [pyodideState, setPyodideState] = useState<PyodideState>({
    isLoading: false,
    isReady: isPyodideReady(),
    loadingMessage: '',
    error: null,
  });

  const [runState, setRunState] = useState<RunState>({
    isRunning: false,
    stdout: '',
    error: null,
    parsed: null,
  });

  const [csvData, setCsvData] = useState<string | null>(null);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [isUsingDemoData, setIsUsingDemoData] = useState(false);
  const [dataAnalysis, setDataAnalysis] = useState<DataAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasUploadedData, setHasUploadedData] = useState(false);
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    stage: 'idle',
    cleaningResult: null,
    aiInsights: null,
    modelBuilderMessages: null,
  });

  // Initialize Pyodide on mount
  useEffect(() => {
    if (!isPyodideReady()) {
      setPyodideState(s => ({ ...s, isLoading: true }));

      initPyodide((msg) => {
        setPyodideState(s => ({ ...s, loadingMessage: msg }));
      })
        .then(() => {
          setPyodideState({
            isLoading: false,
            isReady: true,
            loadingMessage: 'Ready!',
            error: null,
          });
        })
        .catch((err: unknown) => {
          setPyodideState({
            isLoading: false,
            isReady: false,
            loadingMessage: '',
            error: err instanceof Error ? err.message : 'Failed to load Python',
          });
        });
    }
  }, []);

  // Run automatic data analysis (separate from user code)
  const analyzeData = useCallback(async (fileName?: string) => {
    if (!isPyodideReady()) return null;

    setIsAnalyzing(true);
    try {
      // Modify the analysis script to use the correct file
      const fileToAnalyze = fileName || csvFileName || 'uploaded.csv';
      const analysisScript = DATA_ANALYSIS_SCRIPT.replace(
        "'__DATA_FILE__'",
        `'${fileToAnalyze}'`
      );

      const result = await runPythonScript(analysisScript);
      if (result) {
        const parsed = parseDataAnalysisResult(result);
        setDataAnalysis(parsed);
        return parsed;
      }
    } catch (err) {
      console.error('Data analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
    return null;
  }, [csvFileName]);

  // NO auto-analyze on start - only when user uploads data

  const execute = useCallback(async (code: string): Promise<{ result: RunResult; parsed: ParsedRunResult }> => {
    setRunState(s => ({ ...s, isRunning: true, stdout: '', error: null, parsed: null }));

    try {
      // Pass the CSV data and filename so the file is available
      const result = await runPython(code, csvData || undefined, csvFileName || undefined);
      const parsed = parseRunOutput(result.stdout);

      setRunState({
        isRunning: false,
        stdout: result.stdout,
        error: result.error,
        parsed,
      });

      // Don't re-analyze data after code runs - keep the initial visualizations
      // User can manually trigger re-analysis if needed

      return { result, parsed };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Execution failed';
      setRunState({
        isRunning: false,
        stdout: '',
        error,
        parsed: null,
      });
      throw err;
    }
  }, [csvData, csvFileName]);

  // Upload user CSV - store data and write to filesystem
  const uploadCsv = useCallback(async (data: string, fileName?: string) => {
    const finalFileName = fileName || 'uploaded.csv';

    setCsvData(data);
    setCsvFileName(finalFileName);
    setHasUploadedData(true);
    setIsUsingDemoData(false);

    // Write the file to the virtual filesystem immediately
    await writeCsvFile(data, finalFileName);

    // Analyze the new data immediately after uploading
    analyzeData(finalFileName);
  }, [analyzeData]);

  // Load demo data (Iris dataset)
  const loadDemoData = useCallback(async () => {
    if (!isPyodideReady()) return;

    setIsUsingDemoData(true);
    setHasUploadedData(false);
    setCsvFileName('iris_demo.csv');

    // Load Iris dataset and save as CSV to multiple locations
    const demoScript = `
import pandas as pd
from sklearn.datasets import load_iris

iris = load_iris()
df = pd.DataFrame(iris.data, columns=iris.feature_names)
df['target'] = iris.target

# Save to multiple locations
df.to_csv('iris_demo.csv', index=False)
df.to_csv('/data/iris_demo.csv', index=False)
df.to_csv('/data/uploaded.csv', index=False)
'Demo data loaded'
`;
    await runPythonScript(demoScript);
    analyzeData('iris_demo.csv');
  }, [analyzeData]);

  // Clear data
  const clearData = useCallback(() => {
    setCsvData(null);
    setCsvFileName(null);
    setHasUploadedData(false);
    setIsUsingDemoData(false);
    setDataAnalysis(null);
  }, []);

  // Reset workflow to idle state
  const resetWorkflow = useCallback(() => {
    setWorkflowState({
      stage: 'idle',
      cleaningResult: null,
      aiInsights: null,
      modelBuilderMessages: null,
    });
  }, []);

  return {
    pyodideState,
    runState,
    execute,
    uploadCsv,
    loadDemoData,
    clearData,
    csvData,
    csvFileName,
    hasUploadedData,
    isUsingDemoData,
    dataAnalysis,
    isAnalyzing,
    analyzeData,
    workflowState,
    setWorkflowState,
    resetWorkflow,
  };
}
