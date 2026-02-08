import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  AnalyzeModelResponse,
  FeatureExperiment,
} from '../../../backend/src/types';

export interface ExperimentResult {
  name: string;
  features: string[];
  accuracy: number;
  modelType: string;
  timestamp: Date;
}

export interface ModelAnalysisState {
  analysis: string | null;
  statistics: {
    strengths: string;
    weaknesses: string;
    recommendation: string;
  } | null;
  experiments: FeatureExperiment[];
  experimentResults: ExperimentResult[];
  isAnalyzing: boolean;
  isRunningExperiment: boolean;
  error: string | null;
}

const initialState: ModelAnalysisState = {
  analysis: null,
  statistics: null,
  experiments: [],
  experimentResults: [],
  isAnalyzing: false,
  isRunningExperiment: false,
  error: null,
};

interface AnalyzeModelParams {
  modelType: string;
  accuracy: number;
  features: string[];
  confusionMatrix?: number[][];
  code: string;
  datasetRows?: number;
  datasetColumns?: number;
}

export function useModelAnalysis() {
  const [state, setState] = useState<ModelAnalysisState>(initialState);

  const analyzeModel = useCallback(async (params: AnalyzeModelParams) => {
    setState((s) => ({
      ...s,
      isAnalyzing: true,
      error: null,
    }));

    try {
      const response = await api.post<AnalyzeModelResponse>('/api/ai/analyze-model', params);

      setState((s) => ({
        ...s,
        isAnalyzing: false,
        analysis: response.analysis,
        statistics: response.statistics,
        experiments: response.featureExperiments,
      }));

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze model';
      setState((s) => ({
        ...s,
        isAnalyzing: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  const addExperimentResult = useCallback((result: Omit<ExperimentResult, 'timestamp'>) => {
    setState((s) => ({
      ...s,
      experimentResults: [
        ...s.experimentResults,
        { ...result, timestamp: new Date() },
      ].sort((a, b) => b.accuracy - a.accuracy), // Sort by accuracy descending
    }));
  }, []);

  const setRunningExperiment = useCallback((running: boolean) => {
    setState((s) => ({
      ...s,
      isRunningExperiment: running,
    }));
  }, []);

  const clearAnalysis = useCallback(() => {
    setState(initialState);
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({
      ...s,
      error: null,
    }));
  }, []);

  return {
    ...state,
    analyzeModel,
    addExperimentResult,
    setRunningExperiment,
    clearAnalysis,
    clearError,
  };
}
