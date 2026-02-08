export interface DataPreview {
  columns: string[];
  rows: (string | number | null)[][];
  stats: {
    [column: string]: {
      type: 'numeric' | 'categorical';
      count: number;
      missing: number;
      mean?: number | null;
      min?: number | null;
      max?: number | null;
      unique?: number;
    };
  };
  distributions: {
    [column: string]: { bin: string; count: number }[];
  };
}

export interface ParsedRunResult {
  datasetInfo?: {
    rows: number;
    columns: number;
    features: string[];
  };
  modelType?: string;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  confusionMatrix?: number[][];
  dataPreview?: DataPreview;
}

export function parseRunOutput(stdout: string): ParsedRunResult {
  const result: ParsedRunResult = {};
  const lines = stdout.split('\n');

  // Initialize dataPreview structure
  let dataPreviewColumns: string[] = [];
  let dataPreviewRows: (string | number | null)[][] = [];
  let dataStats: DataPreview['stats'] = {};
  let distributions: DataPreview['distributions'] = {};

  for (const line of lines) {
    try {
      if (line.startsWith('DATASET_INFO:')) {
        const json = line.replace('DATASET_INFO:', '').trim();
        result.datasetInfo = JSON.parse(json);
      }
      if (line.startsWith('MODEL_TYPE:')) {
        result.modelType = line.replace('MODEL_TYPE:', '').trim();
      }
      if (line.startsWith('ACCURACY:')) {
        result.accuracy = parseFloat(line.replace('ACCURACY:', '').trim());
      }
      if (line.startsWith('PRECISION:')) {
        result.precision = parseFloat(line.replace('PRECISION:', '').trim());
      }
      if (line.startsWith('RECALL:')) {
        result.recall = parseFloat(line.replace('RECALL:', '').trim());
      }
      if (line.startsWith('F1_SCORE:')) {
        result.f1Score = parseFloat(line.replace('F1_SCORE:', '').trim());
      }
      if (line.startsWith('CONFUSION_MATRIX:')) {
        const json = line.replace('CONFUSION_MATRIX:', '').trim();
        result.confusionMatrix = JSON.parse(json);
      }
      if (line.startsWith('DATA_PREVIEW:')) {
        const json = line.replace('DATA_PREVIEW:', '').trim();
        const parsed = JSON.parse(json);
        dataPreviewColumns = parsed.columns || [];
        dataPreviewRows = parsed.rows || [];
      }
      if (line.startsWith('DATA_STATS:')) {
        const json = line.replace('DATA_STATS:', '').trim();
        dataStats = JSON.parse(json);
      }
      if (line.startsWith('FEATURE_DISTRIBUTIONS:')) {
        const json = line.replace('FEATURE_DISTRIBUTIONS:', '').trim();
        distributions = JSON.parse(json);
      }
    } catch (e) {
      // Skip malformed lines
    }
  }

  // Combine data preview info if any was parsed
  if (dataPreviewColumns.length > 0 || Object.keys(dataStats).length > 0) {
    result.dataPreview = {
      columns: dataPreviewColumns,
      rows: dataPreviewRows,
      stats: dataStats,
      distributions: distributions,
    };
  }

  return result;
}
