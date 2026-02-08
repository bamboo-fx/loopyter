import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ImproveRequestSchema, type ImproveResponse, AnalyzeDataRequestSchema, type AnalyzeDataResponse, AnalyzeModelRequestSchema, type AnalyzeModelResponse, DetectModelOutputRequestSchema, type DetectModelOutputResponse, ModelChatRequestSchema, type ModelChatResponse } from "../types";

const aiRouter = new Hono();

// POST /api/ai/improve - Get AI improvement suggestions
aiRouter.post(
  "/improve",
  zValidator("json", ImproveRequestSchema),
  async (c) => {
    const data = c.req.valid("json");
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return c.json(
        { error: { message: "OpenAI API key not configured", code: "CONFIG_ERROR" } },
        500
      );
    }

    // Build history context from all runs
    let historyContext = "";
    if (data.allRuns && data.allRuns.length > 0) {
      historyContext = `
Previous experiment history:
${data.allRuns.map((run, i) => `${i + 1}. ${run.name}: ${(run.accuracy * 100).toFixed(2)}% accuracy using ${run.modelType}`).join("\n")}

`;
    }

    const systemPrompt = `You are an expert machine learning engineer helping users improve their ML models.
Your task is to analyze the current model performance and suggest improvements.

The user's code MUST output results in these exact formats that can be parsed:
- DATASET_INFO: {"rows": number, "columns": number, "features": ["feature1", "feature2", ...]}
- MODEL_TYPE: string (e.g., "LogisticRegression", "RandomForest", etc.)
- ACCURACY: float (e.g., 0.85)
- CONFUSION_MATRIX: [[TP, FP], [FN, TN]]

When generating improved code, you MUST:
1. Keep the same output format so results can be parsed
2. Use print() statements with the exact patterns above
3. Make meaningful improvements (try different models, feature engineering, hyperparameter tuning)
4. Use scikit-learn and common ML libraries
5. Include proper imports
6. Handle the same dataset as the original code

Respond with valid JSON in this exact format:
{
  "diagnosis": "Brief explanation of current model performance and limitations",
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
  "improvedExperiment": {
    "name": "Short descriptive name for this experiment",
    "code": "Complete Python code that can be executed"
  }
}`;

    const userPrompt = `${historyContext}Current experiment details:
- Model type: ${data.latestRun.modelType}
- Accuracy: ${(data.latestRun.accuracy * 100).toFixed(2)}%
- Dataset: ${data.latestRun.datasetRows || "unknown"} rows, ${data.latestRun.datasetColumns || "unknown"} columns
- Features: ${data.latestRun.datasetFeatures || "unknown"}

Current code:
\`\`\`python
${data.code}
\`\`\`

Please analyze this model and provide improvements. Return a JSON object with diagnosis, suggestions, and improved code.`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 1,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error:", errorText);
        return c.json(
          { error: { message: "Failed to get AI suggestions", code: "AI_ERROR" } },
          500
        );
      }

      const result = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = result.choices?.[0]?.message?.content;

      if (!content) {
        return c.json(
          { error: { message: "No response from AI", code: "AI_ERROR" } },
          500
        );
      }

      let parsed: ImproveResponse;
      try {
        parsed = JSON.parse(content);
      } catch {
        console.error("Failed to parse AI response:", content);
        return c.json(
          { error: { message: "Invalid AI response format", code: "AI_ERROR" } },
          500
        );
      }

      // Validate required fields
      if (
        !parsed.diagnosis ||
        !Array.isArray(parsed.suggestions) ||
        !parsed.improvedExperiment?.name ||
        !parsed.improvedExperiment?.code
      ) {
        return c.json(
          { error: { message: "Incomplete AI response", code: "AI_ERROR" } },
          500
        );
      }

      return c.json({ data: parsed });
    } catch (error) {
      console.error("AI improvement error:", error);
      return c.json(
        { error: { message: "Failed to process AI request", code: "AI_ERROR" } },
        500
      );
    }
  }
);

// POST /api/ai/analyze-data - Analyze data and suggest visualizations
aiRouter.post(
  "/analyze-data",
  zValidator("json", AnalyzeDataRequestSchema),
  async (c) => {
    const data = c.req.valid("json");
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return c.json(
        { error: { message: "OpenAI API key not configured", code: "CONFIG_ERROR" } },
        500
      );
    }

    // Build columns summary with types
    const columnsWithTypes = data.columns
      .map((col) => `${col.name} (${col.type})`)
      .join(", ");

    // Build sample rows text
    const sampleRowsText = data.sampleRows
      .slice(0, 3)
      .map((row, i) => `Row ${i + 1}: ${JSON.stringify(row)}`)
      .join("\n");

    // Build stats text for numeric columns
    const statsText = Object.entries(data.stats)
      .map(([col, stat]) => {
        if (stat.type === "numeric") {
          return `${col}: mean=${stat.mean?.toFixed(2) ?? "N/A"}, min=${stat.min ?? "N/A"}, max=${stat.max ?? "N/A"}, count=${stat.count}, missing=${stat.missing}`;
        }
        return `${col}: unique=${stat.unique ?? "N/A"}, count=${stat.count}, missing=${stat.missing}`;
      })
      .join("\n");

    const systemPrompt = `You are a data scientist. Analyze this dataset and suggest the best visualizations AND the best ML models for prediction/classification tasks.

Dataset Summary:
- Columns: ${columnsWithTypes}
- Sample rows:
${sampleRowsText}
- Statistics:
${statsText}

Respond in JSON format:
{
  "dataDescription": "Brief description of what this data represents",
  "insights": ["insight1", "insight2", "insight3"],
  "suggestedVisualizations": [
    {
      "type": "bar|line|scatter|histogram|pie",
      "title": "Chart title",
      "xColumn": "column_name",
      "yColumn": "column_name or null",
      "description": "Why this visualization helps"
    }
  ],
  "mlRecommendations": {
    "taskType": "regression|classification|clustering",
    "targetColumn": "likely target column name or null",
    "featureColumns": ["feature1", "feature2"],
    "recommendedModels": [
      {
        "name": "Model name (e.g., LinearRegression, RandomForestClassifier)",
        "reason": "Why this model is good for this data",
        "expectedPerformance": "high|medium|low"
      }
    ],
    "dataQualityNotes": ["any data quality issues to address"],
    "featureEngineeringSuggestions": ["suggestions for new features"]
  }
}

For ML recommendations:
- Identify if this looks like a regression problem (predicting continuous values) or classification (predicting categories)
- Suggest the most likely target column based on column names
- Recommend 3-5 models ranked by expected performance
- Consider data size, feature types, and relationships
- Suggest 2-4 visualizations that best reveal patterns in this data.`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-5.2",
          temperature: 1,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Analyze the dataset and provide visualization suggestions." },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error:", errorText);
        return c.json(
          { error: { message: "Failed to analyze data", code: "AI_ERROR" } },
          500
        );
      }

      const result = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = result.choices?.[0]?.message?.content;

      if (!content) {
        return c.json(
          { error: { message: "No response from AI", code: "AI_ERROR" } },
          500
        );
      }

      let parsed: AnalyzeDataResponse;
      try {
        parsed = JSON.parse(content);
      } catch {
        console.error("Failed to parse AI response:", content);
        return c.json(
          { error: { message: "Invalid AI response format", code: "AI_ERROR" } },
          500
        );
      }

      // Validate required fields
      if (
        !parsed.dataDescription ||
        !Array.isArray(parsed.insights) ||
        !Array.isArray(parsed.suggestedVisualizations)
      ) {
        return c.json(
          { error: { message: "Incomplete AI response", code: "AI_ERROR" } },
          500
        );
      }

      // Validate each visualization has required fields
      for (const viz of parsed.suggestedVisualizations) {
        if (!viz.type || !viz.title || !viz.xColumn || !viz.description) {
          return c.json(
            { error: { message: "Invalid visualization spec in AI response", code: "AI_ERROR" } },
            500
          );
        }
      }

      return c.json({ data: parsed });
    } catch (error) {
      console.error("AI data analysis error:", error);
      return c.json(
        { error: { message: "Failed to process AI request", code: "AI_ERROR" } },
        500
      );
    }
  }
);

// POST /api/ai/analyze-model - Analyze model run and generate feature experiments
aiRouter.post(
  "/analyze-model",
  zValidator("json", AnalyzeModelRequestSchema),
  async (c) => {
    const data = c.req.valid("json");
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return c.json(
        { error: { message: "OpenAI API key not configured", code: "CONFIG_ERROR" } },
        500
      );
    }

    const confusionMatrixStr = data.confusionMatrix
      ? JSON.stringify(data.confusionMatrix)
      : "Not available";

    const systemPrompt = `You are an ML expert. Analyze this model and suggest feature experiments.

Model Run:
- Model: ${data.modelType}
- Accuracy: ${data.accuracy}
- Features: ${data.features.join(", ")}
- Confusion Matrix: ${confusionMatrixStr}
- Code: ${data.code}

Generate experiments that test different feature combinations to understand feature importance.

Respond in JSON:
{
  "analysis": "Analysis of current model performance",
  "statistics": {
    "strengths": "What the model does well",
    "weaknesses": "Potential issues",
    "recommendation": "Key suggestion"
  },
  "featureExperiments": [
    {
      "name": "Experiment name",
      "description": "Why this is interesting",
      "features": ["feature1", "feature2"],
      "code": "Complete Python code..."
    }
  ]
}

Each experiment's code MUST:
1. Use the exact same model type (${data.modelType})
2. Use only the specified features subset
3. Print MODEL_TYPE, ACCURACY, CONFUSION_MATRIX in the required format
4. Be complete and runnable

Generate 3-5 experiments with different feature subsets.`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-5.2",
          temperature: 1,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Analyze the model and generate feature experiments." },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error:", errorText);
        return c.json(
          { error: { message: "Failed to analyze model", code: "AI_ERROR" } },
          500
        );
      }

      const result = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = result.choices?.[0]?.message?.content;

      if (!content) {
        return c.json(
          { error: { message: "No response from AI", code: "AI_ERROR" } },
          500
        );
      }

      let parsed: AnalyzeModelResponse;
      try {
        parsed = JSON.parse(content);
      } catch {
        console.error("Failed to parse AI response:", content);
        return c.json(
          { error: { message: "Invalid AI response format", code: "AI_ERROR" } },
          500
        );
      }

      // Validate required fields
      if (
        !parsed.analysis ||
        !parsed.statistics?.strengths ||
        !parsed.statistics?.weaknesses ||
        !parsed.statistics?.recommendation ||
        !Array.isArray(parsed.featureExperiments)
      ) {
        return c.json(
          { error: { message: "Incomplete AI response", code: "AI_ERROR" } },
          500
        );
      }

      // Validate each experiment has required fields
      for (const exp of parsed.featureExperiments) {
        if (!exp.name || !exp.description || !Array.isArray(exp.features) || !exp.code) {
          return c.json(
            { error: { message: "Invalid experiment spec in AI response", code: "AI_ERROR" } },
            500
          );
        }
      }

      return c.json({ data: parsed });
    } catch (error) {
      console.error("AI model analysis error:", error);
      return c.json(
        { error: { message: "Failed to process AI request", code: "AI_ERROR" } },
        500
      );
    }
  }
);

// POST /api/ai/detect-model-output - Auto-detect ML metrics from raw Python output
aiRouter.post(
  "/detect-model-output",
  zValidator("json", DetectModelOutputRequestSchema),
  async (c) => {
    const data = c.req.valid("json");
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return c.json(
        { error: { message: "OpenAI API key not configured", code: "CONFIG_ERROR" } },
        500
      );
    }

    const systemPrompt = `You are an ML output parser. Analyze this Python code and its output to extract model metrics.

Code:
${data.code}

Output:
${data.stdout}

Extract any machine learning metrics you can find. Look for:
- Model type (from the code - sklearn, pytorch, keras, tensorflow, xgboost, lightgbm, etc.)
- For CLASSIFICATION models: Accuracy, precision, recall, F1 score
- For REGRESSION models: R², MSE, RMSE, MAE - use R² as the "accuracy" value
- Confusion matrix (in any format)
- Loss values
- Classification reports
- Any other metrics (AUC, ROC, etc.)

IMPORTANT for regression models:
- LinearRegression, Ridge, Lasso, ElasticNet, SVR, etc. are REGRESSION models
- For regression, use the R² score as the "accuracy" field (it's the equivalent metric)
- R² (R-squared, R2 score, coefficient of determination) should be the accuracy field

Respond in JSON:
{
  "detected": true/false,
  "modelType": "model name or null",
  "metrics": {
    "accuracy": number or null (USE R² FOR REGRESSION MODELS),
    "precision": number or null,
    "recall": number or null,
    "f1Score": number or null,
    "loss": number or null,
    "customMetrics": { "name": value }
  },
  "confusionMatrix": [[numbers]] or null,
  "datasetInfo": {
    "rows": number or null,
    "columns": number or null,
    "features": ["names"] or null
  },
  "summary": "Brief summary of what the code does"
}

Important:
- Convert percentages to decimals (95% -> 0.95)
- Extract model type from imports and instantiation (e.g., LogisticRegression, RandomForestClassifier, LinearRegression, etc.)
- If no ML model/metrics are detected, set detected: false
- For regression models, R² score MUST go in the "accuracy" field
- For customMetrics, include any other numeric metrics found (e.g., MSE, RMSE, MAE, etc.)`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 0.2,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Parse the code and output to extract ML metrics. Return valid JSON." },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error:", errorText);
        return c.json(
          { error: { message: "Failed to detect model output", code: "AI_ERROR" } },
          500
        );
      }

      const result = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = result.choices?.[0]?.message?.content;

      if (!content) {
        return c.json(
          { error: { message: "No response from AI", code: "AI_ERROR" } },
          500
        );
      }

      let parsed: DetectModelOutputResponse;
      try {
        parsed = JSON.parse(content);
      } catch {
        console.error("Failed to parse AI response:", content);
        return c.json(
          { error: { message: "Invalid AI response format", code: "AI_ERROR" } },
          500
        );
      }

      // Normalize and validate the response structure
      const normalizedResponse: DetectModelOutputResponse = {
        detected: Boolean(parsed.detected),
        modelType: parsed.modelType ?? null,
        metrics: {
          accuracy: parsed.metrics?.accuracy ?? null,
          precision: parsed.metrics?.precision ?? null,
          recall: parsed.metrics?.recall ?? null,
          f1Score: parsed.metrics?.f1Score ?? null,
          loss: parsed.metrics?.loss ?? null,
          customMetrics: parsed.metrics?.customMetrics,
        },
        confusionMatrix: parsed.confusionMatrix ?? null,
        datasetInfo: parsed.datasetInfo ? {
          rows: parsed.datasetInfo.rows ?? null,
          columns: parsed.datasetInfo.columns ?? null,
          features: parsed.datasetInfo.features ?? null,
        } : null,
        summary: parsed.summary || "No summary available",
      };

      return c.json({ data: normalizedResponse });
    } catch (error) {
      console.error("AI detect model output error:", error);
      return c.json(
        { error: { message: "Failed to process AI request", code: "AI_ERROR" } },
        500
      );
    }
  }
);

// POST /api/ai/analyze-detected-model - Analyze a detected model and suggest improvements
aiRouter.post(
  "/analyze-detected-model",
  async (c) => {
    const data = await c.req.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return c.json(
        { error: { message: "OpenAI API key not configured", code: "CONFIG_ERROR" } },
        500
      );
    }

    const { modelType, metrics, summary, code, dataFileName } = data;
    const accuracy = metrics?.accuracy ?? 0;

    // Detect task type from model name
    const isClassification = modelType?.toLowerCase().includes('classifier') ||
                             modelType?.toLowerCase().includes('logistic') ||
                             modelType?.toLowerCase().includes('svc') ||
                             modelType?.toLowerCase().includes('kneighbors');

    const alternativeModels = isClassification
      ? ['RandomForestClassifier', 'GradientBoostingClassifier', 'LogisticRegression', 'SVC', 'KNeighborsClassifier', 'XGBClassifier']
      : ['RandomForestRegressor', 'GradientBoostingRegressor', 'Ridge', 'Lasso', 'ElasticNet', 'XGBRegressor', 'SVR'];

    // Filter out current model
    const modelsToTry = alternativeModels.filter(m =>
      !modelType?.toLowerCase().includes(m.toLowerCase().replace('classifier', '').replace('regressor', ''))
    ).slice(0, 4);

    const systemPrompt = `You are an ML expert analyzing a user's model. Provide helpful feedback and suggest alternative models to try.

Model Information:
- Model Type: ${modelType || 'Unknown'}
- R² Score / Accuracy: ${(accuracy * 100).toFixed(2)}%
- Summary: ${summary || 'No summary'}
- Data File: ${dataFileName || 'Unknown'}
- Task Type: ${isClassification ? 'Classification' : 'Regression'}

User's Code:
${code || 'No code provided'}

Analyze the model and respond in JSON format:
{
  "insight": {
    "quality": "excellent" | "good" | "fair" | "poor",
    "summary": "2-3 sentence analysis of the model performance",
    "strengths": ["list of things the model does well"],
    "weaknesses": ["list of areas that could be improved"],
    "suggestions": ["actionable suggestions for improvement"]
  },
  "experiments": [
    {
      "name": "Model Name (e.g., RandomForestRegressor)",
      "description": "Brief reason why this model might perform better",
      "code": "Complete Python code"
    }
  ]
}

CRITICAL EXPERIMENT REQUIREMENTS:
1. Generate exactly 3-4 experiments, each using a DIFFERENT ML model from: ${modelsToTry.join(', ')}
2. Each experiment must be a complete, runnable Python script that:
   - Imports all required libraries (pandas, sklearn, etc.)
   - Loads data from '${dataFileName || 'uploaded.csv'}' using the exact same approach as the user's code
   - Uses the SAME target column and features as the original model
   - Trains the alternative model
   - Evaluates and prints the score
3. The "name" field should be the model class name (e.g., "RandomForestRegressor", "GradientBoostingClassifier")
4. Each code block MUST end with a print statement like:
   - For regression: print(f"R^2 score: {score:.4f}")
   - For classification: print(f"Accuracy: {score:.4f}")
5. Store the trained model in a variable called 'model' so it can be exported

Example experiment code structure:
\`\`\`python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score

# Load and prepare data (same as original)
df = pd.read_csv('${dataFileName || 'data.csv'}')
X = df[['feature1', 'feature2', ...]]  # Same features
y = df['target']  # Same target

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
score = r2_score(y_test, y_pred)
print(f"R^2 score: {score:.4f}")
\`\`\`

Guidelines:
- Quality thresholds: excellent >= 90%, good >= 70%, fair >= 50%, poor < 50%
- DO NOT suggest feature engineering experiments - ONLY different model types
- Make each experiment test a genuinely different algorithm
- Keep the same train/test split and features as the original`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 0.7,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Analyze this model and provide insights and experiments with alternative models." },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error:", errorText);
        return c.json(
          { error: { message: "Failed to analyze model", code: "AI_ERROR" } },
          500
        );
      }

      const result = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = result.choices?.[0]?.message?.content;

      if (!content) {
        return c.json(
          { error: { message: "No response from AI", code: "AI_ERROR" } },
          500
        );
      }

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        console.error("Failed to parse AI response:", content);
        return c.json(
          { error: { message: "Invalid AI response format", code: "AI_ERROR" } },
          500
        );
      }

      return c.json({ data: parsed });
    } catch (error) {
      console.error("AI analyze model error:", error);
      return c.json(
        { error: { message: "Failed to process AI request", code: "AI_ERROR" } },
        500
      );
    }
  }
);

// POST /api/ai/generate-model-experiments - Generate runnable code for multiple models to try
aiRouter.post(
  "/generate-model-experiments",
  async (c) => {
    const data = await c.req.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return c.json(
        { error: { message: "OpenAI API key not configured", code: "CONFIG_ERROR" } },
        500
      );
    }

    const { dataFileName, columns, targetColumn, taskType, currentAccuracy, currentModelType } = data;

    const systemPrompt = `You are an ML engineer. Generate Python code experiments to try different models on the user's data.

Data Info:
- File: ${dataFileName || 'uploaded.csv'}
- Columns: ${columns?.join(', ') || 'Unknown'}
- Target Column: ${targetColumn || 'Unknown'}
- Task Type: ${taskType || 'regression'}
- Current Model: ${currentModelType || 'Unknown'}
- Current Accuracy/R²: ${currentAccuracy ? (currentAccuracy * 100).toFixed(2) + '%' : 'Unknown'}

Generate 4-5 complete, runnable Python experiments that:
1. Load the data from "${dataFileName || 'uploaded.csv'}"
2. Prepare features (X) and target (y)
3. Train the model
4. Print the R² score (for regression) or accuracy (for classification)

IMPORTANT: Each experiment must be complete and runnable. Include all necessary sklearn imports at the top.
The code should print "R^2 score: X.XX" or "Accuracy: X.XX" at the end.

Respond in JSON:
{
  "experiments": [
    {
      "name": "Model Name",
      "description": "Why this model might work better",
      "modelType": "regression|classification",
      "complexity": "simple|medium|complex",
      "code": "complete Python code here"
    }
  ],
  "strategy": "Brief explanation of the experimentation strategy"
}

Include a mix of:
- Simple baseline models
- Tree-based models (RandomForest, GradientBoosting)
- Linear models with regularization (Ridge, Lasso)
- If classification: SVM, Logistic Regression, etc.`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 0.7,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Generate diverse model experiments to improve on the current performance." },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error:", errorText);
        return c.json(
          { error: { message: "Failed to generate experiments", code: "AI_ERROR" } },
          500
        );
      }

      const result = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = result.choices?.[0]?.message?.content;

      if (!content) {
        return c.json(
          { error: { message: "No response from AI", code: "AI_ERROR" } },
          500
        );
      }

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        console.error("Failed to parse AI response:", content);
        return c.json(
          { error: { message: "Invalid AI response format", code: "AI_ERROR" } },
          500
        );
      }

      return c.json({ data: parsed });
    } catch (error) {
      console.error("AI generate experiments error:", error);
      return c.json(
        { error: { message: "Failed to process AI request", code: "AI_ERROR" } },
        500
      );
    }
  }
);

// POST /api/ai/clean-data - Analyze data and suggest cleaning operations
aiRouter.post(
  "/clean-data",
  async (c) => {
    const data = await c.req.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return c.json(
        { error: { message: "OpenAI API key not configured", code: "CONFIG_ERROR" } },
        500
      );
    }

    const { columns, sampleRows, stats, userFeedback } = data;

    const feedbackContext = userFeedback
      ? `\n\nUser feedback on previous cleaning suggestion: "${userFeedback}"\nPlease adjust the cleaning recommendations based on this feedback.`
      : '';

    const systemPrompt = `You are a data cleaning expert. Analyze this dataset and suggest cleaning operations.

Dataset Information:
- Columns: ${JSON.stringify(columns)}
- Sample rows: ${JSON.stringify(sampleRows?.slice(0, 5))}
- Statistics: ${JSON.stringify(stats)}
${feedbackContext}

Analyze the data and respond in JSON format:
{
  "cleaningOperations": [
    {
      "type": "missing_values" | "outliers" | "duplicates" | "format" | "type_conversion" | "normalization",
      "column": "column_name or null if applies to all",
      "description": "What will be cleaned",
      "action": "What action will be taken (e.g., 'Remove 3 rows with missing values', 'Cap outliers at 95th percentile')",
      "impact": "low" | "medium" | "high",
      "rowsAffected": number
    }
  ],
  "summary": "Brief 1-2 sentence summary of all cleaning that will be performed",
  "dataQualityScore": {
    "before": number (0-100),
    "after": number (0-100)
  },
  "warnings": ["Any important warnings about data quality or cleaning"]
}

Guidelines:
- Be specific about what will be cleaned and why
- Estimate rows affected for each operation
- Consider impact of each operation (high = might significantly change results)
- If data looks clean, say so with minimal operations
- Consider user feedback if provided`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 0.3,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Analyze the data and suggest cleaning operations." },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error:", errorText);
        return c.json(
          { error: { message: "Failed to analyze data for cleaning", code: "AI_ERROR" } },
          500
        );
      }

      const result = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = result.choices?.[0]?.message?.content;

      if (!content) {
        return c.json(
          { error: { message: "No response from AI", code: "AI_ERROR" } },
          500
        );
      }

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        console.error("Failed to parse AI response:", content);
        return c.json(
          { error: { message: "Invalid AI response format", code: "AI_ERROR" } },
          500
        );
      }

      return c.json({ data: parsed });
    } catch (error) {
      console.error("AI clean data error:", error);
      return c.json(
        { error: { message: "Failed to process AI request", code: "AI_ERROR" } },
        500
      );
    }
  }
);

// POST /api/ai/model-chat - Conversational AI for generating ML code
aiRouter.post(
  "/model-chat",
  zValidator("json", ModelChatRequestSchema),
  async (c) => {
    const data = c.req.valid("json");
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return c.json(
        { error: { message: "OpenAI API key not configured", code: "CONFIG_ERROR" } },
        500
      );
    }

    // Build column info string
    const columnsInfo = data.dataContext.columns
      .map((col) => `${col.name} (${col.type})${col.sampleValues ? ` - samples: ${col.sampleValues.slice(0, 3).join(', ')}` : ''}`)
      .join("\n");

    // Build sample data string
    const sampleDataStr = data.dataContext.sampleData
      ? data.dataContext.sampleData.slice(0, 3).map((row, i) => `Row ${i + 1}: ${JSON.stringify(row)}`).join("\n")
      : "No sample data available";

    // Build ML recommendations context if available
    let mlContext = "";
    if (data.mlRecommendations) {
      const rec = data.mlRecommendations;
      mlContext = `
ML Analysis Results:
- Task Type: ${rec.taskType}
- Suggested Target Column: ${rec.targetColumn || 'Not identified'}
- Suggested Features: ${rec.featureColumns.join(', ')}
- Recommended Models: ${rec.recommendedModels.map(m => `${m.name} (${m.expectedPerformance} performance)`).join(', ')}
- Data Quality Notes: ${rec.dataQualityNotes.join('; ')}
`;
    }

    // Build conversation history context
    let historyContext = "";
    if (data.conversationHistory && data.conversationHistory.length > 0) {
      historyContext = `
Previous conversation:
${data.conversationHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join("\n")}
`;
    }

    const csvFileName = data.dataContext.csvFileName || 'uploaded.csv';

    const systemPrompt = `You are an expert data scientist helping users build machine learning models. You generate Python code that runs in a Pyodide (browser-based Python) environment.

Dataset Information:
- File: ${csvFileName} (also available as 'uploaded.csv' and '/data/uploaded.csv')
- Rows: ${data.dataContext.rowCount || 'Unknown'}
- Columns:
${columnsInfo}

Sample Data:
${sampleDataStr}
${mlContext}
${historyContext}
Your task is to:
1. Understand what the user wants to predict or analyze
2. Generate complete, runnable Python code for Pyodide
3. Explain what you're doing in simple terms

IMPORTANT CODE REQUIREMENTS:
1. The code runs in Pyodide with pandas, numpy, and sklearn already imported
2. Load the CSV from one of these paths (try in order):
   - '${csvFileName}' (original filename)
   - 'uploaded.csv'
   - '/data/uploaded.csv'
3. Use this pattern to load the file:
   \`\`\`python
   import pandas as pd
   # Try loading from different possible paths
   try:
       df = pd.read_csv('${csvFileName}')
   except:
       try:
           df = pd.read_csv('uploaded.csv')
       except:
           df = pd.read_csv('/data/uploaded.csv')
   \`\`\`
4. Print metrics clearly:
   - For regression: print(f"R² Score: {r2_score:.4f}")
   - For classification: print(f"Accuracy: {accuracy:.4f}")
   - Also print other relevant metrics (MSE, precision, recall, etc.)
5. Use train_test_split with a random_state for reproducibility
6. Handle any missing values appropriately
7. Keep the code simple and educational
8. CRITICAL: Always save the trained model to a variable called 'model' so users can download it:
   \`\`\`python
   model = LinearRegression()  # or whatever model
   model.fit(X_train, y_train)
   # model is now available for export
   \`\`\`

Respond in JSON format:
{
  "response": "Friendly explanation of what you're doing (2-3 sentences max)",
  "code": "Complete Python code that can be executed in Pyodide",
  "modelType": "Name of the model being used (e.g., LinearRegression, RandomForestClassifier)",
  "targetColumn": "The column being predicted",
  "features": ["list", "of", "feature", "columns"]
}

If the user's request is unclear about what to predict:
- Use the ML recommendations if available
- Otherwise, make a reasonable guess based on column names
- Explain your choice in the response`;

    const userMessage = data.message;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 0.7,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error:", errorText);
        return c.json(
          { error: { message: "Failed to generate model code", code: "AI_ERROR" } },
          500
        );
      }

      const result = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = result.choices?.[0]?.message?.content;

      if (!content) {
        return c.json(
          { error: { message: "No response from AI", code: "AI_ERROR" } },
          500
        );
      }

      let parsed: ModelChatResponse;
      try {
        parsed = JSON.parse(content);
      } catch {
        console.error("Failed to parse AI response:", content);
        return c.json(
          { error: { message: "Invalid AI response format", code: "AI_ERROR" } },
          500
        );
      }

      // Validate required fields
      if (
        !parsed.response ||
        !parsed.code ||
        !parsed.modelType ||
        !parsed.targetColumn ||
        !Array.isArray(parsed.features)
      ) {
        return c.json(
          { error: { message: "Incomplete AI response", code: "AI_ERROR" } },
          500
        );
      }

      return c.json({ data: parsed });
    } catch (error) {
      console.error("AI model chat error:", error);
      return c.json(
        { error: { message: "Failed to process AI request", code: "AI_ERROR" } },
        500
      );
    }
  }
);

export { aiRouter };
