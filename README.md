# Self-Improving AI Notebook

A Jupyter-style notebook where you can write Python ML code and AI automatically analyzes your data and detects model performance.

## Features

- **Jupyter Notebook Interface**: Code and markdown cells, just like Jupyter
- **Browser-based Python**: Execute Python code directly in the browser using Pyodide (numpy, pandas, scikit-learn included)
- **No Required Output Format**: Just write normal ML code - AI auto-detects metrics
- **AI Data Cleaning**: AI agent analyzes and cleans your data with user approval
- **AI Data Analysis**: Upload data and AI suggests smart visualizations and model recommendations
- **AI Model Builder Tab**: Dedicated tab to build models - tell AI what you want to predict and it generates code
- **Model Experiments**: AI suggests alternative models to try - each experiment creates a notebook cell and logs to the Runs tab for comparison
- **AI Model Detection**: AI automatically parses your output to find accuracy, precision, recall, F1, confusion matrices
- **Reactive Dashboard**: Updates in real-time as you run cells
- **Model Leaderboard**: Track all your experiments sorted by accuracy
- **Persistent Workflow**: Switching tabs preserves your analysis state and model builder chat
- **Demo Data**: Optionally load Iris dataset (flagged as demo data)

## How It Works

1. **Upload CSV** or **Load Demo Data**
   - AI agent shows "Cleaning Data" animation
   - AI analyzes data quality and suggests cleaning operations
   - User reviews and approves cleaning (or requests changes via chat)
   - After approval, AI analyzes data structure
   - Shows data description, feature suggestions, model recommendations, and visualizations
   - Files are accessible by their original filename in your code (e.g., `pd.read_csv('sample_loop.csv')`)

2. **Use the Build Tab**
   - Tell the AI what you want to predict (e.g., "Predict exam_score using hours_studied")
   - AI generates Python code with the right model
   - Code runs automatically and results appear in notebook
   - After running a model, AI analyzes it and suggests alternative models to try
   - Click "Run All" to test different model types and compare accuracy
   - Each experiment creates a code cell in the notebook and is logged to the Runs tab
   - Compare all your experiments in the Runs tab leaderboard

3. **Write ML Code** in notebook cells (or use AI-generated code)
   - No special output format required
   - Just use print() or any normal output

4. **Run Cells**
   - AI reads your code and output
   - Automatically detects model type, accuracy, confusion matrix, etc.
   - Results appear in the Dashboard and Leaderboard

5. **View Dashboard**
   - See all detected models in a leaderboard
   - View confusion matrices, metrics, performance charts
   - Everything updates reactively

## Tech Stack

### Frontend (webapp/)
- React 18 + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- CodeMirror (Python editor)
- Pyodide (Python in WebAssembly)
- Recharts (visualizations)

### Backend (backend/)
- Bun runtime + Hono
- Prisma + SQLite
- OpenAI API (GPT-4o) for AI features

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sessions` | POST | Create new session |
| `/api/ai/clean-data` | POST | AI suggests data cleaning operations |
| `/api/ai/analyze-data` | POST | AI analyzes data and suggests visualizations |
| `/api/ai/model-chat` | POST | AI chatbot generates ML code from natural language |
| `/api/ai/detect-model-output` | POST | AI auto-detects model metrics from code output |
| `/api/ai/analyze-model` | POST | AI analyzes model and generates feature experiments |
| `/api/ai/improve` | POST | AI suggests model improvements |

## Project Structure

```
webapp/src/
├── pages/Index.tsx                    # Main page
├── components/
│   ├── notebook/
│   │   ├── NotebookPanel.tsx          # Notebook container
│   │   ├── NotebookCell.tsx           # Individual cell
│   │   ├── NotebookToolbar.tsx        # Toolbar with data controls
│   │   ├── CodeEditor.tsx             # CodeMirror editor
│   │   └── CellOutput.tsx             # Cell output display
│   ├── dashboard/
│   │   ├── DashboardPanel.tsx         # Dashboard with metrics
│   │   ├── DataAnalysisWorkflow.tsx   # AI cleaning & analysis workflow
│   │   ├── ModelChatBot.tsx           # AI model builder chatbot
│   │   ├── AIAgentLoader.tsx          # Animated loading states
│   │   └── ConfusionMatrix.tsx        # Matrix visualization
│   └── ai/
│       ├── AIPanel.tsx                # AI improvement panel
│       └── ModelAnalysis.tsx          # Model analysis & experiments
├── hooks/
│   ├── useNotebookCells.ts            # Cell management
│   ├── useCellResults.ts              # Aggregate cell results
│   ├── NotebookCellsContext.tsx       # Shared cells context
│   ├── usePyodide.ts                  # Python execution + workflow state
│   ├── PyodideContext.tsx             # Shared Pyodide context
│   └── useModelAnalysis.ts            # Model analysis state
└── lib/
    ├── pyodide.ts                     # Pyodide wrapper
    ├── dataAnalysis.ts                # Data analysis script
    └── templates.ts                   # Initial cells

backend/src/
├── index.ts                           # Server entry
├── types.ts                           # Zod schemas
└── routes/
    └── ai.ts                          # All AI endpoints
```
