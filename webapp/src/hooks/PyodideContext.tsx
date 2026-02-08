import { createContext, useContext, ReactNode } from 'react';
import { usePyodide, PyodideState, RunState, WorkflowState } from './usePyodide';
import { DataAnalysisResult } from '@/lib/dataAnalysis';

interface PyodideContextValue {
  pyodideState: PyodideState;
  runState: RunState;
  execute: (code: string) => Promise<{ result: { success: boolean; stdout: string; error: string | null }; parsed: import('@/lib/parseResults').ParsedRunResult }>;
  uploadCsv: (data: string, fileName?: string) => Promise<void>;
  loadDemoData: () => Promise<void>;
  clearData: () => void;
  csvData: string | null;
  csvFileName: string | null;
  hasUploadedData: boolean;
  isUsingDemoData: boolean;
  dataAnalysis: DataAnalysisResult | null;
  isAnalyzing: boolean;
  analyzeData: (fileName?: string) => Promise<DataAnalysisResult | null>;
  workflowState: WorkflowState;
  setWorkflowState: React.Dispatch<React.SetStateAction<WorkflowState>>;
  resetWorkflow: () => void;
}

const PyodideContext = createContext<PyodideContextValue | null>(null);

export function PyodideProvider({ children }: { children: ReactNode }) {
  const pyodideValue = usePyodide();

  return (
    <PyodideContext.Provider value={pyodideValue}>
      {children}
    </PyodideContext.Provider>
  );
}

export function usePyodideContext(): PyodideContextValue {
  const context = useContext(PyodideContext);
  if (!context) {
    throw new Error('usePyodideContext must be used within a PyodideProvider');
  }
  return context;
}
