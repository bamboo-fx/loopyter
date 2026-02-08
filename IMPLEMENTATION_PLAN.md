# Self-Improving AI Notebook - Implementation Plan

## Overview
A web app where users can write Python ML code, upload datasets, run experiments, and use AI to automatically improve their models with a leaderboard tracking performance.

---

## Architecture

### Tech Stack
- **Frontend**: React + Vite + Tailwind + shadcn/ui + Recharts
- **Backend**: Hono + Bun
- **Python Execution**: Pyodide (Python in WebAssembly - runs in browser)
- **AI**: OpenAI API for improvement suggestions

### Why Pyodide?
Running Python safely on the server requires sandboxing (Docker, etc.) which adds complexity. Pyodide runs Python directly in the browser via WebAssembly, giving us:
- Zero server infrastructure for Python
- Safe execution (browser sandbox)
- Pre-installed numpy, pandas, scikit-learn
- Works offline after initial load

---

## Phase 1: Core Infrastructure

### 1.1 Backend Setup
**Files to create:**
- `backend/src/types.ts` - Zod schemas for all API contracts
- `backend/src/routes/sessions.ts` - Session management
- `backend/src/routes/runs.ts` - Store run history
- `backend/src/routes/ai.ts` - AI improvement endpoint

**API Endpoints:**
```
POST /api/sessions          - Create a new session
GET  /api/sessions/:id      - Get session with runs
POST /api/runs              - Save a run result
GET  /api/runs/:sessionId   - Get all runs for session (leaderboard)
POST /api/ai/improve        - Get AI improvement suggestions
```

### 1.2 Database Schema (Prisma/SQLite)
```prisma
model Session {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  runs      Run[]
}

model Run {
  id           String   @id @default(cuid())
  sessionId    String
  session      Session  @relation(fields: [sessionId], references: [id])
  name         String   // e.g., "Baseline", "RandomForest + Scaling"
  code         String   // The Python code that was run
  accuracy     Float
  precision    Float?
  recall       Float?
  f1Score      Float?
  modelType    String   // e.g., "LogisticRegression", "RandomForest"
  datasetInfo  Json     // { rows, columns, features, target }
  confusionMatrix Json? // [[TP, FP], [FN, TN]]
  stdout       String?
  error        String?
  isImproved   Boolean  @default(false) // AI-generated improvement
  createdAt    DateTime @default(now())
}
```

---

## Phase 2: Frontend - Code Editor & Execution

### 2.1 Page Layout (Single Page App)
```
┌─────────────────────────────────────────────────────────────────┐
│  Header: "Self-Improving AI Notebook"           [New Session]   │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │                      │  │  [Dashboard] [Runs] [AI]         │ │
│  │   Code Editor        │  │                                  │ │
│  │   (Monaco/CodeMirror)│  │  Tab Content:                    │ │
│  │                      │  │  - Dashboard: Charts + Metrics   │ │
│  │                      │  │  - Runs: Leaderboard table       │ │
│  │   [Upload CSV]       │  │  - AI: Diagnosis + Improve btn   │ │
│  │   [▶ Run Code]       │  │                                  │ │
│  │                      │  │                                  │ │
│  │   ─────────────────  │  │                                  │ │
│  │   Output Console     │  │                                  │ │
│  │   (stdout/errors)    │  │                                  │ │
│  └──────────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Components to Create
```
src/
├── pages/
│   └── Index.tsx              # Main notebook page
├── components/
│   ├── notebook/
│   │   ├── CodeEditor.tsx     # Python code editor (CodeMirror)
│   │   ├── OutputConsole.tsx  # stdout/stderr display
│   │   ├── FileUpload.tsx     # CSV upload with drag-drop
│   │   └── RunButton.tsx      # Execute code button
│   ├── dashboard/
│   │   ├── DashboardTab.tsx   # Main dashboard container
│   │   ├── DatasetSummary.tsx # Rows, cols, missing values
│   │   ├── FeatureCharts.tsx  # Distribution histograms
│   │   ├── ConfusionMatrix.tsx # Heatmap visualization
│   │   └── MetricsCard.tsx    # Accuracy, precision, etc.
│   ├── runs/
│   │   ├── RunsTab.tsx        # Leaderboard container
│   │   └── Leaderboard.tsx    # Sortable runs table
│   └── ai/
│       ├── AITab.tsx          # AI panel container
│       ├── Diagnosis.tsx      # AI analysis display
│       └── ImproveButton.tsx  # Trigger improvement
├── lib/
│   ├── pyodide.ts             # Pyodide initialization & execution
│   ├── templates.ts           # Starter code templates
│   └── parseResults.ts        # Extract metrics from Python output
└── hooks/
    ├── usePyodide.ts          # Pyodide state management
    ├── useSession.ts          # Session state
    └── useRuns.ts             # Runs query/mutation
```

### 2.3 Starter Template (Iris Dataset)
```python
import pandas as pd
import numpy as np
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
import json

# Load data (uses Iris if no CSV uploaded)
try:
    df = pd.read_csv('/data/uploaded.csv')
    X = df.iloc[:, :-1]
    y = df.iloc[:, -1]
except:
    iris = load_iris()
    X = pd.DataFrame(iris.data, columns=iris.feature_names)
    y = iris.target

# Dataset summary
print(f"DATASET_INFO: {json.dumps({'rows': len(X), 'columns': len(X.columns), 'features': list(X.columns)})}")

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = LogisticRegression(max_iter=200)
model.fit(X_train, y_train)

# Predictions
y_pred = model.predict(X_test)

# Metrics
accuracy = accuracy_score(y_test, y_pred)
cm = confusion_matrix(y_test, y_pred).tolist()

print(f"MODEL_TYPE: LogisticRegression")
print(f"ACCURACY: {accuracy:.4f}")
print(f"CONFUSION_MATRIX: {json.dumps(cm)}")
print(f"CLASSIFICATION_REPORT:\n{classification_report(y_test, y_pred)}")
```

---

## Phase 3: Python Execution with Pyodide

### 3.1 Pyodide Setup
```typescript
// src/lib/pyodide.ts
import { loadPyodide, PyodideInterface } from 'pyodide';

let pyodide: PyodideInterface | null = null;

export async function initPyodide() {
  if (pyodide) return pyodide;

  pyodide = await loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
  });

  // Load ML packages
  await pyodide.loadPackage(['numpy', 'pandas', 'scikit-learn']);

  return pyodide;
}

export async function runPython(code: string, csvData?: string) {
  const py = await initPyodide();

  // Mount CSV data if provided
  if (csvData) {
    py.FS.writeFile('/data/uploaded.csv', csvData);
  }

  // Capture stdout
  let stdout = '';
  py.setStdout({ batched: (text) => { stdout += text; }});

  try {
    await py.runPythonAsync(code);
    return { success: true, stdout, error: null };
  } catch (err) {
    return { success: false, stdout, error: err.message };
  }
}
```

### 3.2 Result Parsing
Extract structured data from Python output:
```typescript
// src/lib/parseResults.ts
export function parseRunOutput(stdout: string) {
  const lines = stdout.split('\n');
  const result: RunResult = {};

  for (const line of lines) {
    if (line.startsWith('DATASET_INFO:')) {
      result.datasetInfo = JSON.parse(line.replace('DATASET_INFO:', '').trim());
    }
    if (line.startsWith('MODEL_TYPE:')) {
      result.modelType = line.replace('MODEL_TYPE:', '').trim();
    }
    if (line.startsWith('ACCURACY:')) {
      result.accuracy = parseFloat(line.replace('ACCURACY:', '').trim());
    }
    if (line.startsWith('CONFUSION_MATRIX:')) {
      result.confusionMatrix = JSON.parse(line.replace('CONFUSION_MATRIX:', '').trim());
    }
  }

  return result;
}
```

---

## Phase 4: AI Improvement System

### 4.1 AI Endpoint
```typescript
// backend/src/routes/ai.ts
POST /api/ai/improve

Request:
{
  latestRun: {
    accuracy: 0.87,
    modelType: "LogisticRegression",
    datasetInfo: { rows: 150, columns: 4, features: [...] }
  },
  code: "...",
  allRuns: [...]  // For context
}

Response:
{
  data: {
    diagnosis: "The baseline LogisticRegression achieves 87% accuracy...",
    suggestions: [
      "Add feature scaling with StandardScaler",
      "Try RandomForest for non-linear patterns",
      "Tune hyperparameters with GridSearchCV"
    ],
    improvedExperiment: {
      name: "RandomForest + StandardScaler",
      code: "import pandas as pd\n..."  // Complete runnable code
    }
  }
}
```

### 4.2 AI Prompt Template
```
You are an ML expert. Analyze this experiment and suggest ONE improvement.

Current Results:
- Model: {modelType}
- Accuracy: {accuracy}
- Dataset: {rows} rows, {columns} features

Current Code:
{code}

Respond with:
1. Brief diagnosis (2-3 sentences)
2. 2-3 improvement suggestions
3. ONE complete improved experiment with:
   - Name (e.g., "RandomForest + Scaling")
   - Full runnable Python code using same output format

The code MUST print DATASET_INFO, MODEL_TYPE, ACCURACY, CONFUSION_MATRIX.
```

---

## Phase 5: Dashboard & Visualizations

### 5.1 Dashboard Components

**Dataset Summary Card:**
- Rows, columns, missing values
- Feature names list
- Target variable info

**Feature Distribution Charts (Recharts):**
- 2 histograms of numeric features
- Simple bar charts, nothing fancy

**Confusion Matrix Heatmap:**
- Grid visualization with color intensity
- Show actual values in cells

**Metrics Card:**
- Accuracy (big number)
- Precision, Recall, F1 if available

### 5.2 Leaderboard Table
```
| Rank | Name                    | Accuracy | Model          | Created    |
|------|-------------------------|----------|----------------|------------|
| 🥇 1  | RandomForest + Scaling | 94.5%    | RandomForest   | 2 min ago  |
| 2    | Baseline               | 87.0%    | LogisticReg    | 5 min ago  |
```

- Sorted by accuracy (descending)
- Highlight best model
- Mark AI-improved runs with badge

---

## Phase 6: UI/UX Polish

### 6.1 Design Theme
- **Style**: Dark IDE theme (like VS Code dark)
- **Primary color**: Cyan/teal accents (#06b6d4)
- **Font**: JetBrains Mono for code, Inter for UI
- **Layout**: Resizable split panels

### 6.2 Loading States
- Pyodide loading: Full-screen spinner with "Initializing Python..."
- Code running: Spinner in run button
- AI improving: Skeleton cards with "Analyzing..."

### 6.3 Animations
- Confetti or highlight when new best model
- Smooth tab transitions
- Fade-in for new results

---

## Implementation Order (Step by Step)

### Step 1: Database & API Setup
1. Set up Prisma with SQLite
2. Create Session and Run models
3. Implement CRUD endpoints
4. Test with cURL

### Step 2: Frontend Shell
1. Create main layout with split panels
2. Add tabs for Dashboard/Runs/AI
3. Style with dark theme

### Step 3: Code Editor
1. Install and configure CodeMirror
2. Add starter template
3. Create output console component

### Step 4: Pyodide Integration
1. Set up Pyodide initialization
2. Implement code execution
3. Parse results and display

### Step 5: CSV Upload
1. Create drag-drop upload component
2. Store CSV in browser memory
3. Pass to Pyodide execution

### Step 6: Dashboard
1. Dataset summary card
2. Feature distribution charts
3. Confusion matrix visualization
4. Metrics display

### Step 7: Runs & Leaderboard
1. Save runs to database
2. Display leaderboard table
3. Highlight best model

### Step 8: AI Improvement
1. Create AI endpoint with OpenAI
2. Build AI tab UI
3. Implement auto-run of improved code
4. Show before/after comparison

### Step 9: Polish
1. Loading states and animations
2. Error handling
3. Mobile responsiveness
4. Demo flow testing

---

## Files to Create

### Backend
```
backend/
├── prisma/
│   └── schema.prisma        # Database schema
├── src/
│   ├── types.ts             # Zod schemas
│   ├── routes/
│   │   ├── sessions.ts      # Session CRUD
│   │   ├── runs.ts          # Run CRUD
│   │   └── ai.ts            # AI improvement
│   └── index.ts             # Mount routes
```

### Frontend
```
webapp/src/
├── pages/
│   └── Index.tsx            # Main page
├── components/
│   ├── notebook/
│   │   ├── CodeEditor.tsx
│   │   ├── OutputConsole.tsx
│   │   ├── FileUpload.tsx
│   │   └── RunControls.tsx
│   ├── dashboard/
│   │   ├── DashboardTab.tsx
│   │   ├── DatasetSummary.tsx
│   │   ├── FeatureCharts.tsx
│   │   ├── ConfusionMatrix.tsx
│   │   └── MetricsCard.tsx
│   ├── runs/
│   │   ├── RunsTab.tsx
│   │   └── Leaderboard.tsx
│   └── ai/
│       ├── AITab.tsx
│       ├── Diagnosis.tsx
│       └── ImproveButton.tsx
├── lib/
│   ├── pyodide.ts
│   ├── templates.ts
│   └── parseResults.ts
└── hooks/
    ├── usePyodide.ts
    └── useNotebook.ts
```

---

## Environment Variables Needed

### Backend
```
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="sk-..."  # For AI improvement
```

### Frontend
```
VITE_BACKEND_URL="..."   # Already configured
```

---

## Success Criteria (Demo Flow)

1. ✅ App loads with starter code
2. ✅ Click "Run" → See output + metrics
3. ✅ Dashboard shows dataset info + charts
4. ✅ Leaderboard shows baseline run
5. ✅ Upload custom CSV → Run again
6. ✅ Click "Improve with AI" → See diagnosis
7. ✅ AI runs improved experiment
8. ✅ Leaderboard updates with better accuracy
9. ✅ Explanation shown for improvement

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Pyodide slow to load | Show loading progress, cache in service worker |
| AI returns bad code | Validate code structure, fallback to template |
| CSV parsing fails | Show clear error, provide format requirements |
| Large datasets | Limit to 10k rows, warn user |

---

## Timeline Estimate

This is a substantial feature set. Recommend building in phases:
- **Phase 1-2**: Core infrastructure + editor (foundation)
- **Phase 3-4**: Execution + AI (core features)
- **Phase 5-6**: Dashboard + polish (demo-ready)

Ready to start implementation when you approve this plan!
