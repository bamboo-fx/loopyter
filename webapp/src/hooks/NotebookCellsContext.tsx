import { createContext, useContext, ReactNode } from 'react';
import { useNotebookCells, Cell, CellType } from './useNotebookCells';
import { useCellResults, CellResultsData } from './useCellResults';
import { INITIAL_CELLS } from '@/lib/templates';

interface NotebookCellsContextType {
  // Cell state
  cells: Cell[];
  activeCellId: string | null;

  // Cell actions
  addCell: (type: CellType, afterId?: string) => string;
  addCellWithContent: (type: CellType, content: string, afterId?: string) => string;
  deleteCell: (id: string) => void;
  updateCellContent: (id: string, content: string) => void;
  setCellOutput: (id: string, output?: string, error?: string) => void;
  setCellRunning: (id: string, isRunning: boolean) => void;
  moveCell: (id: string, direction: 'up' | 'down') => void;
  setActiveCell: (id: string | null) => void;
  convertCellType: (id: string, newType: CellType) => void;
  runCell: (id: string) => Promise<void>;
  runAllCells: () => Promise<void>;
  clearAllOutputs: () => void;
  setCells: (cells: Cell[]) => void;
  getAllCode: () => string;

  // Aggregated results from cells
  cellResults: CellResultsData;
}

const NotebookCellsContext = createContext<NotebookCellsContextType | null>(null);

interface NotebookCellsProviderProps {
  children: ReactNode;
  initialCells?: Cell[];
}

export function NotebookCellsProvider({ children, initialCells = INITIAL_CELLS }: NotebookCellsProviderProps) {
  const notebookCells = useNotebookCells(initialCells);
  const cellResults = useCellResults(notebookCells.cells);

  const value: NotebookCellsContextType = {
    ...notebookCells,
    cellResults,
  };

  return (
    <NotebookCellsContext.Provider value={value}>
      {children}
    </NotebookCellsContext.Provider>
  );
}

export function useNotebookCellsContext() {
  const context = useContext(NotebookCellsContext);
  if (!context) {
    throw new Error('useNotebookCellsContext must be used within NotebookCellsProvider');
  }
  return context;
}

// Re-export types for convenience
export type { Cell, CellType } from './useNotebookCells';
export type { CellResultsData, DetectedRun } from './useCellResults';
