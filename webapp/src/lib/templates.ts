import type { Cell } from '@/hooks/useNotebookCells';

// Initial cells for a new notebook
export const INITIAL_CELLS: Cell[] = [
  {
    id: '1',
    type: 'markdown',
    content: '# Welcome to Loopyter\n\nUpload a CSV file or load demo data to get started.\n\nThen add code cells to analyze your data.\n\n**AI will automatically detect** your model metrics and visualize them in the Dashboard.',
  },
  {
    id: '2',
    type: 'code',
    content: '# Your code here\n',
  }
];

// Empty starter code - no required format, AI auto-detects
export const STARTER_CODE = `# Write your Python ML code here
#
# Available libraries: pandas, numpy, scikit-learn
#
# To use uploaded CSV data:
#   df = pd.read_csv('/data/uploaded.csv')
#
# Just run your ML code normally - AI will automatically
# detect metrics like accuracy, precision, recall, etc.
`;

export const IMPROVED_CODE_EXAMPLE = `# This is an example of improved code
# The AI will generate similar code with different models/techniques
`;
