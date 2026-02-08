// Automatic data analysis script that runs independently of user code
// This script analyzes any CSV data and returns visualization-ready data

export const DATA_ANALYSIS_SCRIPT = `
import pandas as pd
import numpy as np
import json

def analyze_data():
    result = {
        'columns': [],
        'rows': [],
        'stats': {},
        'distributions': {}
    }

    # Load the data file - filename is replaced dynamically
    df = pd.read_csv('__DATA_FILE__')

    # Get columns and first 5 rows
    result['columns'] = list(df.columns)
    result['rows'] = df.head(5).values.tolist()

    # Calculate statistics for each column
    for col in df.columns:
        col_data = df[col]
        if pd.api.types.is_numeric_dtype(col_data):
            result['stats'][col] = {
                'type': 'numeric',
                'count': int(col_data.count()),
                'missing': int(col_data.isna().sum()),
                'mean': float(col_data.mean()) if not col_data.isna().all() else None,
                'min': float(col_data.min()) if not col_data.isna().all() else None,
                'max': float(col_data.max()) if not col_data.isna().all() else None
            }
            # Create histogram
            try:
                clean_data = col_data.dropna()
                if len(clean_data) > 0:
                    hist, bins = np.histogram(clean_data, bins=min(10, len(clean_data.unique())))
                    result['distributions'][col] = [
                        {'bin': f'{bins[i]:.2f}-{bins[i+1]:.2f}', 'count': int(hist[i])}
                        for i in range(len(hist))
                    ]
            except:
                pass
        else:
            result['stats'][col] = {
                'type': 'categorical',
                'count': int(col_data.count()),
                'missing': int(col_data.isna().sum()),
                'unique': int(col_data.nunique())
            }

    return json.dumps(result)

analyze_data()
`;

export interface DataAnalysisResult {
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

export function parseDataAnalysisResult(output: string): DataAnalysisResult | null {
  try {
    return JSON.parse(output) as DataAnalysisResult;
  } catch {
    return null;
  }
}
