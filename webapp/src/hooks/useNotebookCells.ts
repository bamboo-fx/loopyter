import { useState, useCallback } from 'react';
import { usePyodideContext } from './PyodideContext';
import { api } from '@/lib/api';
import type { DetectModelOutputResponse } from '../../../backend/src/types';

export type CellType = 'code' | 'markdown';

export interface DetectedModel {
  detected: boolean;
  modelType: string | null;
  metrics: {
    accuracy: number | null;
    precision: number | null;
    recall: number | null;
    f1Score: number | null;
    loss: number | null;
    customMetrics?: Record<string, number>;
  };
  confusionMatrix: number[][] | null;
  datasetInfo: {
    rows: number | null;
    columns: number | null;
    features: string[] | null;
  } | null;
  summary: string;
}

export interface Cell {
  id: string;
  type: CellType;
  content: string;
  output?: string;
  error?: string;
  isRunning?: boolean;
  detectedModel?: DetectedModel;
}

interface NotebookCellsState {
  cells: Cell[];
  activeCellId: string | null;
}

// Generate unique ID for cells
function generateId(): string {
  return `cell-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useNotebookCells(initialCells: Cell[] = []) {
  const { execute, pyodideState } = usePyodideContext();

  const [state, setState] = useState<NotebookCellsState>({
    cells: initialCells.length > 0 ? initialCells : [
      { id: generateId(), type: 'code', content: '# Your code here\n' }
    ],
    activeCellId: initialCells.length > 0 ? initialCells[0].id : null,
  });

  const { cells, activeCellId } = state;

  // Add a new cell after the specified cell or at the end
  const addCell = useCallback((type: CellType, afterId?: string) => {
    const newCell: Cell = {
      id: generateId(),
      type,
      content: type === 'code' ? '' : '',
    };

    setState((prev) => {
      let newCells: Cell[];

      if (afterId) {
        const index = prev.cells.findIndex((c) => c.id === afterId);
        if (index !== -1) {
          newCells = [
            ...prev.cells.slice(0, index + 1),
            newCell,
            ...prev.cells.slice(index + 1),
          ];
        } else {
          newCells = [...prev.cells, newCell];
        }
      } else {
        newCells = [...prev.cells, newCell];
      }

      return {
        cells: newCells,
        activeCellId: newCell.id,
      };
    });

    return newCell.id;
  }, []);

  // Add a new cell with content and optionally run it
  const addCellWithContent = useCallback((type: CellType, content: string, afterId?: string): string => {
    const newCell: Cell = {
      id: generateId(),
      type,
      content,
    };

    setState((prev) => {
      let newCells: Cell[];

      if (afterId) {
        const index = prev.cells.findIndex((c) => c.id === afterId);
        if (index !== -1) {
          newCells = [
            ...prev.cells.slice(0, index + 1),
            newCell,
            ...prev.cells.slice(index + 1),
          ];
        } else {
          newCells = [...prev.cells, newCell];
        }
      } else {
        newCells = [...prev.cells, newCell];
      }

      return {
        cells: newCells,
        activeCellId: newCell.id,
      };
    });

    return newCell.id;
  }, []);

  // Delete a cell
  const deleteCell = useCallback((id: string) => {
    setState((prev) => {
      // Don't delete if it's the only cell
      if (prev.cells.length <= 1) {
        return prev;
      }

      const index = prev.cells.findIndex((c) => c.id === id);
      const newCells = prev.cells.filter((c) => c.id !== id);

      // If we deleted the active cell, select the previous one or the first
      let newActiveId = prev.activeCellId;
      if (prev.activeCellId === id) {
        newActiveId = newCells[Math.max(0, index - 1)]?.id || null;
      }

      return {
        cells: newCells,
        activeCellId: newActiveId,
      };
    });
  }, []);

  // Update cell content
  const updateCellContent = useCallback((id: string, content: string) => {
    setState((prev) => ({
      ...prev,
      cells: prev.cells.map((c) =>
        c.id === id ? { ...c, content } : c
      ),
    }));
  }, []);

  // Set cell output and error
  const setCellOutput = useCallback((id: string, output?: string, error?: string) => {
    setState((prev) => ({
      ...prev,
      cells: prev.cells.map((c) =>
        c.id === id ? { ...c, output, error } : c
      ),
    }));
  }, []);

  // Set cell running state
  const setCellRunning = useCallback((id: string, isRunning: boolean) => {
    setState((prev) => ({
      ...prev,
      cells: prev.cells.map((c) =>
        c.id === id ? { ...c, isRunning } : c
      ),
    }));
  }, []);

  // Set cell detected model
  const setCellDetectedModel = useCallback((id: string, detectedModel?: DetectedModel) => {
    setState((prev) => ({
      ...prev,
      cells: prev.cells.map((c) =>
        c.id === id ? { ...c, detectedModel } : c
      ),
    }));
  }, []);

  // Move cell up or down
  const moveCell = useCallback((id: string, direction: 'up' | 'down') => {
    setState((prev) => {
      const index = prev.cells.findIndex((c) => c.id === id);
      if (index === -1) return prev;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.cells.length) return prev;

      const newCells = [...prev.cells];
      [newCells[index], newCells[newIndex]] = [newCells[newIndex], newCells[index]];

      return {
        ...prev,
        cells: newCells,
      };
    });
  }, []);

  // Set the active cell
  const setActiveCell = useCallback((id: string | null) => {
    setState((prev) => ({
      ...prev,
      activeCellId: id,
    }));
  }, []);

  // Convert cell type
  const convertCellType = useCallback((id: string, newType: CellType) => {
    setState((prev) => ({
      ...prev,
      cells: prev.cells.map((c) =>
        c.id === id ? { ...c, type: newType, output: undefined, error: undefined } : c
      ),
    }));
  }, []);

  // Run a single code cell
  const runCell = useCallback(async (id: string) => {
    const cell = cells.find((c) => c.id === id);
    if (!cell || cell.type !== 'code' || !pyodideState.isReady) return;

    setCellRunning(id, true);
    setCellOutput(id, undefined, undefined);
    setCellDetectedModel(id, undefined);

    try {
      const { result } = await execute(cell.content);
      const stdout = result.stdout || '';
      const error = result.error || undefined;
      setCellOutput(id, stdout, error);

      // If execution succeeded with output, call AI to detect model results
      if (stdout && !error) {
        try {
          console.log('[Detection] Calling detect-model-output with:', { code: cell.content.substring(0, 100), stdout: stdout.substring(0, 200) });
          const detection = await api.post<DetectModelOutputResponse>('/api/ai/detect-model-output', {
            code: cell.content,
            stdout: stdout,
          });
          console.log('[Detection] Response:', detection);

          if (detection.detected) {
            console.log('[Detection] Model detected! Setting detectedModel for cell:', id);
            setCellDetectedModel(id, {
              detected: detection.detected,
              modelType: detection.modelType,
              metrics: {
                accuracy: detection.metrics.accuracy,
                precision: detection.metrics.precision,
                recall: detection.metrics.recall,
                f1Score: detection.metrics.f1Score,
                loss: detection.metrics.loss,
                customMetrics: detection.metrics.customMetrics,
              },
              confusionMatrix: detection.confusionMatrix,
              datasetInfo: detection.datasetInfo,
              summary: detection.summary,
            });
          } else {
            console.log('[Detection] No model detected in output');
          }
        } catch (detectErr) {
          // Don't fail the cell if detection fails, just log it
          console.error('Failed to detect model output:', detectErr);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Execution failed';
      setCellOutput(id, undefined, errorMessage);
    } finally {
      setCellRunning(id, false);
    }
  }, [cells, execute, pyodideState.isReady, setCellRunning, setCellOutput, setCellDetectedModel]);

  // Run all code cells in order
  const runAllCells = useCallback(async () => {
    if (!pyodideState.isReady) return;

    for (const cell of cells) {
      if (cell.type === 'code') {
        await runCell(cell.id);
      }
    }
  }, [cells, pyodideState.isReady, runCell]);

  // Clear all outputs
  const clearAllOutputs = useCallback(() => {
    setState((prev) => ({
      ...prev,
      cells: prev.cells.map((c) => ({
        ...c,
        output: undefined,
        error: undefined,
        detectedModel: undefined,
      })),
    }));
  }, []);

  // Set cells (for loading initial cells)
  const setCells = useCallback((newCells: Cell[]) => {
    setState((prev) => ({
      cells: newCells,
      activeCellId: newCells.length > 0 ? newCells[0].id : prev.activeCellId,
    }));
  }, []);

  // Get all code as a single string (for backward compatibility)
  const getAllCode = useCallback(() => {
    return cells
      .filter((c) => c.type === 'code')
      .map((c) => c.content)
      .join('\n\n');
  }, [cells]);

  return {
    cells,
    activeCellId,
    addCell,
    addCellWithContent,
    deleteCell,
    updateCellContent,
    setCellOutput,
    setCellRunning,
    moveCell,
    setActiveCell,
    convertCellType,
    runCell,
    runAllCells,
    clearAllOutputs,
    setCells,
    getAllCode,
  };
}
