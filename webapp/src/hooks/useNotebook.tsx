import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { ParsedRunResult, DataPreview } from '@/lib/parseResults';
import type { ImproveResponse } from '../../../backend/src/types';

// Types matching backend
interface Run {
  id: string;
  sessionId: string;
  name: string;
  code: string;
  accuracy: number;
  precision: number | null;
  recall: number | null;
  f1Score: number | null;
  modelType: string;
  datasetRows: number | null;
  datasetColumns: number | null;
  datasetFeatures: string | null;
  confusionMatrix: string | null;
  stdout: string | null;
  error: string | null;
  isImproved: boolean;
  explanation: string | null;
  createdAt: string;
}

interface Session {
  id: string;
  name: string;
  runs: Run[];
}

interface NotebookContextType {
  session: Session | null;
  runs: Run[];
  latestRun: Run | null;
  latestDataPreview: DataPreview | null;
  code: string;
  setCode: (code: string) => void;
  csvData: string | null;
  setCsvData: (data: string | null) => void;
  createSession: () => Promise<void>;
  resetSession: () => Promise<void>;
  saveRun: (
    parsed: ParsedRunResult,
    code: string,
    stdout: string,
    error: string | null,
    isImproved?: boolean,
    explanation?: string
  ) => Promise<Run>;
  improveWithAI: () => Promise<ImproveResponse>;
  isLoading: boolean;
  initialCode: string;
}

const NotebookContext = createContext<NotebookContextType | null>(null);

interface NotebookProviderProps {
  children: ReactNode;
  initialCode?: string;
}

export function NotebookProvider({ children, initialCode = '' }: NotebookProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [code, setCode] = useState<string>(initialCode);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [latestDataPreview, setLatestDataPreview] = useState<DataPreview | null>(null);

  const latestRun = runs.length > 0 ? runs[runs.length - 1] : null;

  // Create a new session
  const createSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const newSession = await api.post<Session>('/api/sessions', {
        name: `Session ${new Date().toLocaleDateString()}`,
      });
      setSession({ ...newSession, runs: [] });
      setRuns([]);
    } catch (err) {
      console.error('Failed to create session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset session - create new session and reset code to initial
  const resetSession = useCallback(async () => {
    setCode(initialCode);
    setCsvData(null);
    setLatestDataPreview(null);
    await createSession();
  }, [initialCode, createSession]);

  // Save a run to the backend
  const saveRun = useCallback(
    async (
      parsed: ParsedRunResult,
      runCode: string,
      stdout: string,
      error: string | null,
      isImproved = false,
      explanation?: string
    ): Promise<Run> => {
      if (!session) {
        throw new Error('No active session');
      }

      // Generate run name based on model type and run count
      const modelType = parsed.modelType || 'Unknown Model';
      const runNumber = runs.length + 1;
      const runName = `${modelType} #${runNumber}`;

      const runData = {
        sessionId: session.id,
        name: runName,
        code: runCode,
        accuracy: parsed.accuracy || 0,
        precision: parsed.precision,
        recall: parsed.recall,
        f1Score: parsed.f1Score,
        modelType: parsed.modelType || 'Unknown',
        datasetRows: parsed.datasetInfo?.rows,
        datasetColumns: parsed.datasetInfo?.columns,
        datasetFeatures: parsed.datasetInfo?.features
          ? JSON.stringify(parsed.datasetInfo.features)
          : undefined,
        confusionMatrix: parsed.confusionMatrix
          ? JSON.stringify(parsed.confusionMatrix)
          : undefined,
        stdout,
        error,
        isImproved,
        explanation,
      };

      const savedRun = await api.post<Run>('/api/runs', runData);

      // Update local state with the new run
      setRuns((prev) => [...prev, savedRun]);

      // Store the latest data preview if available
      if (parsed.dataPreview) {
        setLatestDataPreview(parsed.dataPreview);
      }

      return savedRun;
    },
    [session, runs.length]
  );

  // Create session on mount
  useEffect(() => {
    createSession();
  }, [createSession]);

  // Update code when initialCode changes
  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode]);

  // Call AI to get improvement suggestions
  const improveWithAI = useCallback(async (): Promise<ImproveResponse> => {
    if (!session) {
      throw new Error('No active session');
    }
    if (!latestRun) {
      throw new Error('No runs to analyze');
    }

    const requestData = {
      sessionId: session.id,
      latestRun: {
        accuracy: latestRun.accuracy,
        modelType: latestRun.modelType,
        datasetRows: latestRun.datasetRows ?? undefined,
        datasetColumns: latestRun.datasetColumns ?? undefined,
        datasetFeatures: latestRun.datasetFeatures ?? undefined,
      },
      code: latestRun.code,
      allRuns: runs.map((r) => ({
        name: r.name,
        accuracy: r.accuracy,
        modelType: r.modelType,
      })),
    };

    const response = await api.post<ImproveResponse>('/api/ai/improve', requestData);
    return response;
  }, [session, latestRun, runs]);

  const value: NotebookContextType = {
    session,
    runs,
    latestRun,
    latestDataPreview,
    code,
    setCode,
    csvData,
    setCsvData,
    createSession,
    resetSession,
    saveRun,
    improveWithAI,
    isLoading,
    initialCode,
  };

  return <NotebookContext.Provider value={value}>{children}</NotebookContext.Provider>;
}

export function useNotebook() {
  const context = useContext(NotebookContext);
  if (!context) {
    throw new Error('useNotebook must be used within NotebookProvider');
  }
  return context;
}
