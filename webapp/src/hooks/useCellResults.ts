import { useMemo } from 'react';
import type { Cell, DetectedModel } from './useNotebookCells';

export interface DetectedRun {
  cellId: string;
  modelType: string | null;
  accuracy: number;
  precision: number | null;
  recall: number | null;
  f1Score: number | null;
  confusionMatrix: number[][] | null;
  summary: string;
}

export interface CellResultsData {
  detectedRuns: DetectedRun[];
  bestRun: DetectedRun | null;
  latestRun: DetectedRun | null;
  latestDetectedModel: DetectedModel | null;
  totalDetectedModels: number;
}

export function useCellResults(cells: Cell[]): CellResultsData {
  return useMemo(() => {
    // Debug: log cells with detected models
    const debugCells = cells.filter((c) => c.detectedModel?.detected);
    console.log('[CellResults] Cells with detection:', debugCells.length);
    debugCells.forEach((c) => {
      console.log('[CellResults] Cell detected model:', c.id, c.detectedModel);
    });

    // Filter cells that have detected models with accuracy
    // Also check customMetrics for r2 score as fallback
    const detectedRuns: DetectedRun[] = cells
      .filter((c) => {
        if (!c.detectedModel?.detected) return false;
        const metrics = c.detectedModel.metrics;
        // Accept if we have accuracy OR r2 in customMetrics
        const hasAccuracy = metrics.accuracy != null;
        const hasR2 = metrics.customMetrics?.r2 != null || metrics.customMetrics?.R2 != null;
        return hasAccuracy || hasR2;
      })
      .map((c) => {
        const metrics = c.detectedModel!.metrics;
        // Use accuracy if available, otherwise try r2 from customMetrics
        let accuracy = metrics.accuracy;
        if (accuracy == null && metrics.customMetrics) {
          accuracy = metrics.customMetrics.r2 ?? metrics.customMetrics.R2 ?? null;
        }
        return {
          cellId: c.id,
          modelType: c.detectedModel!.modelType,
          accuracy: accuracy ?? 0,
          precision: metrics.precision,
          recall: metrics.recall,
          f1Score: metrics.f1Score,
          confusionMatrix: c.detectedModel!.confusionMatrix,
          summary: c.detectedModel!.summary,
        };
      })
      .sort((a, b) => b.accuracy - a.accuracy);

    // Best run is the one with highest accuracy
    const bestRun = detectedRuns.length > 0 ? detectedRuns[0] : null;

    // Latest run is the last cell with a detected model (maintaining original cell order)
    const cellsWithDetection = cells.filter((c) => c.detectedModel?.detected);
    const latestCell = cellsWithDetection.length > 0 ? cellsWithDetection[cellsWithDetection.length - 1] : null;

    const latestRun = latestCell && latestCell.detectedModel?.metrics.accuracy != null
      ? {
          cellId: latestCell.id,
          modelType: latestCell.detectedModel.modelType,
          accuracy: latestCell.detectedModel.metrics.accuracy,
          precision: latestCell.detectedModel.metrics.precision,
          recall: latestCell.detectedModel.metrics.recall,
          f1Score: latestCell.detectedModel.metrics.f1Score,
          confusionMatrix: latestCell.detectedModel.confusionMatrix,
          summary: latestCell.detectedModel.summary,
        }
      : null;

    const latestDetectedModel = latestCell?.detectedModel || null;

    return {
      detectedRuns,
      bestRun,
      latestRun,
      latestDetectedModel,
      totalDetectedModels: detectedRuns.length,
    };
  }, [cells]);
}
