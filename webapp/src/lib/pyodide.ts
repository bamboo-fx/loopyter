import { loadPyodide, PyodideInterface } from 'pyodide';

let pyodide: PyodideInterface | null = null;
let isLoading = false;
let loadPromise: Promise<PyodideInterface> | null = null;
let currentFileName: string | null = null;

export async function initPyodide(onProgress?: (msg: string) => void): Promise<PyodideInterface> {
  if (pyodide) return pyodide;

  if (loadPromise) return loadPromise;

  isLoading = true;
  onProgress?.('Loading Python environment...');

  loadPromise = (async () => {
    const py = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.3/full/',
    });

    onProgress?.('Installing numpy...');
    await py.loadPackage('numpy');

    onProgress?.('Installing pandas...');
    await py.loadPackage('pandas');

    onProgress?.('Installing scikit-learn...');
    await py.loadPackage('scikit-learn');

    // Create /data directory for data files
    try {
      py.FS.mkdir('/data');
    } catch {
      // Directory might already exist
    }

    onProgress?.('Pre-loading ML libraries...');
    // Pre-import common libraries so users don't need to import them
    await py.runPythonAsync(`
import numpy as np
import pandas as pd

# Common sklearn imports
from sklearn.linear_model import LinearRegression, LogisticRegression, Ridge, Lasso
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.svm import SVC, SVR
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.naive_bayes import GaussianNB
from sklearn.cluster import KMeans, DBSCAN
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder, OneHotEncoder
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.datasets import load_iris, load_diabetes, load_wine, make_classification, make_regression

print("ML libraries loaded!")
`);

    onProgress?.('Ready!');
    pyodide = py;
    isLoading = false;
    return py;
  })();

  return loadPromise;
}

export function isPyodideLoading(): boolean {
  return isLoading;
}

export function isPyodideReady(): boolean {
  return pyodide !== null;
}

export function getCurrentFileName(): string | null {
  return currentFileName;
}

export interface RunResult {
  success: boolean;
  stdout: string;
  error: string | null;
}

// Run a script and return just the result (no stdout capture needed for internal scripts)
export async function runPythonScript(code: string): Promise<string | null> {
  const py = await initPyodide();

  try {
    const result = await py.runPythonAsync(code);
    return result as string;
  } catch {
    return null;
  }
}

// Write a CSV file to the virtual filesystem
export async function writeCsvFile(data: string, fileName: string): Promise<void> {
  const py = await initPyodide();

  // Store the current file name
  currentFileName = fileName;

  // Write to multiple locations so users can access by any path:
  // 1. Current working directory (e.g., "sample_loop.csv")
  // 2. /data/ directory (e.g., "/data/sample_loop.csv")
  // 3. /data/uploaded.csv (backward compatibility)

  py.FS.writeFile(fileName, data);
  py.FS.writeFile(`/data/${fileName}`, data);
  py.FS.writeFile('/data/uploaded.csv', data);
}

// Export a trained model as a downloadable file (pickle or joblib format)
export async function exportModel(modelVarName: string = 'model', format: 'pickle' | 'joblib' = 'joblib'): Promise<Blob | null> {
  if (!pyodide) return null;

  try {
    // Serialize the model to bytes
    const exportCode = format === 'joblib' ? `
import joblib
import io
_model_buffer = io.BytesIO()
joblib.dump(${modelVarName}, _model_buffer)
_model_bytes = _model_buffer.getvalue()
_model_bytes
` : `
import pickle
import io
_model_buffer = io.BytesIO()
pickle.dump(${modelVarName}, _model_buffer)
_model_bytes = _model_buffer.getvalue()
_model_bytes
`;

    const result = await pyodide.runPythonAsync(exportCode);

    // Convert Python bytes to JavaScript Blob
    const uint8Array = new Uint8Array(result.toJs());
    const blob = new Blob([uint8Array], { type: 'application/octet-stream' });

    return blob;
  } catch (err) {
    console.error('Failed to export model:', err);
    return null;
  }
}

// Check if a model variable exists in Python
export async function checkModelExists(modelVarName: string = 'model'): Promise<boolean> {
  if (!pyodide) return false;

  try {
    const exists = await pyodide.runPythonAsync(`'${modelVarName}' in dir()`);
    return exists;
  } catch {
    return false;
  }
}

// Get model info (type, parameters count, etc.)
export async function getModelInfo(modelVarName: string = 'model'): Promise<{ type: string; params: Record<string, unknown> } | null> {
  if (!pyodide) return null;

  try {
    const infoCode = `
import json
_model_info = {
    'type': type(${modelVarName}).__name__,
    'params': ${modelVarName}.get_params() if hasattr(${modelVarName}, 'get_params') else {}
}
json.dumps(_model_info)
`;
    const result = await pyodide.runPythonAsync(infoCode);
    return JSON.parse(result);
  } catch {
    return null;
  }
}

export async function runPython(code: string, csvData?: string, csvFileName?: string): Promise<RunResult> {
  const py = await initPyodide();

  // Write CSV data if provided
  if (csvData) {
    const fileName = csvFileName || 'uploaded.csv';
    await writeCsvFile(csvData, fileName);
  }

  // Capture stdout
  let stdout = '';

  // Set up stdout capture using Python's sys.stdout redirection
  await py.runPythonAsync(`
import sys
from io import StringIO
_stdout_capture = StringIO()
sys.stdout = _stdout_capture
  `);

  try {
    await py.runPythonAsync(code);

    // Get captured stdout
    stdout = await py.runPythonAsync(`
_stdout_capture.getvalue()
    `);

    return { success: true, stdout: stdout || '', error: null };
  } catch (err: unknown) {
    // Get any partial stdout
    try {
      stdout = await py.runPythonAsync(`_stdout_capture.getvalue()`);
    } catch {
      // Ignore
    }

    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      stdout: stdout || '',
      error: errorMessage
    };
  } finally {
    // Reset stdout
    try {
      await py.runPythonAsync(`
sys.stdout = sys.__stdout__
      `);
    } catch {
      // Ignore cleanup errors
    }
  }
}
