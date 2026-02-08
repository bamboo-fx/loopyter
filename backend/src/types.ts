import { z } from "zod";

// Auth types (Better Auth)
export const AuthUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SignUpRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string(),
});

export const SignInRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: AuthUserSchema,
});

export type AuthUser = z.infer<typeof AuthUserSchema>;
export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;
export type SignInRequest = z.infer<typeof SignInRequestSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// Session schemas
export const CreateSessionSchema = z.object({
  name: z.string().optional(),
});

export const SessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SessionWithRunsSchema = SessionSchema.extend({
  runs: z.array(z.lazy(() => RunSchema)),
});

// Run schemas
export const CreateRunSchema = z.object({
  sessionId: z.string(),
  name: z.string(),
  code: z.string(),
  accuracy: z.number(),
  precision: z.number().optional(),
  recall: z.number().optional(),
  f1Score: z.number().optional(),
  modelType: z.string(),
  datasetRows: z.number().optional(),
  datasetColumns: z.number().optional(),
  datasetFeatures: z.string().optional(),
  confusionMatrix: z.string().optional(),
  stdout: z.string().optional(),
  error: z.string().optional(),
  isImproved: z.boolean().optional(),
  explanation: z.string().optional(),
});

export const RunSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  name: z.string(),
  code: z.string(),
  accuracy: z.number(),
  precision: z.number().nullable(),
  recall: z.number().nullable(),
  f1Score: z.number().nullable(),
  modelType: z.string(),
  datasetRows: z.number().nullable(),
  datasetColumns: z.number().nullable(),
  datasetFeatures: z.string().nullable(),
  confusionMatrix: z.string().nullable(),
  stdout: z.string().nullable(),
  error: z.string().nullable(),
  isImproved: z.boolean(),
  explanation: z.string().nullable(),
  createdAt: z.string(),
});

// AI Improve schemas
export const ImproveRequestSchema = z.object({
  sessionId: z.string(),
  latestRun: z.object({
    accuracy: z.number(),
    modelType: z.string(),
    datasetRows: z.number().optional(),
    datasetColumns: z.number().optional(),
    datasetFeatures: z.string().optional(),
  }),
  code: z.string(),
  allRuns: z.array(z.object({
    name: z.string(),
    accuracy: z.number(),
    modelType: z.string(),
  })).optional(),
});

export const ImproveResponseSchema = z.object({
  diagnosis: z.string(),
  suggestions: z.array(z.string()),
  improvedExperiment: z.object({
    name: z.string(),
    code: z.string(),
  }),
});

// Type exports
export type CreateSession = z.infer<typeof CreateSessionSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type SessionWithRuns = z.infer<typeof SessionWithRunsSchema>;
export type CreateRun = z.infer<typeof CreateRunSchema>;
export type Run = z.infer<typeof RunSchema>;
export type ImproveRequest = z.infer<typeof ImproveRequestSchema>;
export type ImproveResponse = z.infer<typeof ImproveResponseSchema>;

// Data Analysis schemas
const ColumnStatSchema = z.object({
  type: z.enum(['numeric', 'categorical']),
  count: z.number(),
  missing: z.number(),
  mean: z.number().nullable().optional(),
  min: z.number().nullable().optional(),
  max: z.number().nullable().optional(),
  unique: z.number().optional(),
});

export const AnalyzeDataRequestSchema = z.object({
  columns: z.array(z.object({
    name: z.string(),
    type: z.enum(['numeric', 'categorical']),
    sampleValues: z.array(z.union([z.string(), z.number(), z.null()])),
  })),
  stats: z.record(z.string(), ColumnStatSchema),
  sampleRows: z.array(z.array(z.union([z.string(), z.number(), z.null()]))),
});

export const VisualizationSpecSchema = z.object({
  type: z.enum(['bar', 'line', 'scatter', 'histogram', 'pie']),
  title: z.string(),
  xColumn: z.string(),
  yColumn: z.string().nullable().optional(),
  description: z.string(),
});

export const RecommendedModelSchema = z.object({
  name: z.string(),
  reason: z.string(),
  expectedPerformance: z.enum(['high', 'medium', 'low']),
});

export const MLRecommendationsSchema = z.object({
  taskType: z.enum(['regression', 'classification', 'clustering']),
  targetColumn: z.string().nullable(),
  featureColumns: z.array(z.string()),
  recommendedModels: z.array(RecommendedModelSchema),
  dataQualityNotes: z.array(z.string()),
  featureEngineeringSuggestions: z.array(z.string()),
});

export const AnalyzeDataResponseSchema = z.object({
  dataDescription: z.string(),
  insights: z.array(z.string()),
  suggestedVisualizations: z.array(VisualizationSpecSchema),
  mlRecommendations: MLRecommendationsSchema.optional(),
});

export type AnalyzeDataRequest = z.infer<typeof AnalyzeDataRequestSchema>;
export type AnalyzeDataResponse = z.infer<typeof AnalyzeDataResponseSchema>;
export type VisualizationSpec = z.infer<typeof VisualizationSpecSchema>;
export type MLRecommendations = z.infer<typeof MLRecommendationsSchema>;
export type RecommendedModel = z.infer<typeof RecommendedModelSchema>;

// Analyze Model schemas
export const AnalyzeModelRequestSchema = z.object({
  modelType: z.string(),
  accuracy: z.number(),
  features: z.array(z.string()),
  confusionMatrix: z.array(z.array(z.number())).optional(),
  code: z.string(),
  datasetRows: z.number().optional(),
  datasetColumns: z.number().optional(),
});

export const FeatureExperimentSchema = z.object({
  name: z.string(),
  description: z.string(),
  features: z.array(z.string()),
  code: z.string(),
});

export const AnalyzeModelResponseSchema = z.object({
  analysis: z.string(),
  statistics: z.object({
    strengths: z.string(),
    weaknesses: z.string(),
    recommendation: z.string(),
  }),
  featureExperiments: z.array(FeatureExperimentSchema),
});

export type AnalyzeModelRequest = z.infer<typeof AnalyzeModelRequestSchema>;
export type AnalyzeModelResponse = z.infer<typeof AnalyzeModelResponseSchema>;
export type FeatureExperiment = z.infer<typeof FeatureExperimentSchema>;

// Detect Model Output schemas (auto-detect metrics from raw Python output)
export const DetectModelOutputRequestSchema = z.object({
  code: z.string(),
  stdout: z.string(),
});

export const DetectedMetricsSchema = z.object({
  accuracy: z.number().nullable(),
  precision: z.number().nullable(),
  recall: z.number().nullable(),
  f1Score: z.number().nullable(),
  loss: z.number().nullable(),
  customMetrics: z.record(z.string(), z.number()).optional(),
});

export const DetectModelOutputResponseSchema = z.object({
  detected: z.boolean(),
  modelType: z.string().nullable(),
  metrics: DetectedMetricsSchema,
  confusionMatrix: z.array(z.array(z.number())).nullable(),
  datasetInfo: z.object({
    rows: z.number().nullable(),
    columns: z.number().nullable(),
    features: z.array(z.string()).nullable(),
  }).nullable(),
  summary: z.string(),
});

export type DetectModelOutputRequest = z.infer<typeof DetectModelOutputRequestSchema>;
export type DetectModelOutputResponse = z.infer<typeof DetectModelOutputResponseSchema>;
export type DetectedMetrics = z.infer<typeof DetectedMetricsSchema>;

// Model Chat schemas - for conversational AI to generate ML code
export const ModelChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const DataContextColumnSchema = z.object({
  name: z.string(),
  type: z.enum(['numeric', 'categorical']),
  sampleValues: z.array(z.union([z.string(), z.number(), z.null()])).optional(),
});

export const DataContextSchema = z.object({
  columns: z.array(DataContextColumnSchema),
  sampleData: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.null()]))).optional(),
  rowCount: z.number().optional(),
  csvFileName: z.string().optional(),
});

export const ModelChatRequestSchema = z.object({
  message: z.string(),
  dataContext: DataContextSchema,
  conversationHistory: z.array(ModelChatMessageSchema).optional(),
  mlRecommendations: MLRecommendationsSchema.optional(),
});

export const ModelChatResponseSchema = z.object({
  response: z.string(),
  code: z.string(),
  modelType: z.string(),
  targetColumn: z.string(),
  features: z.array(z.string()),
});

export type ModelChatMessage = z.infer<typeof ModelChatMessageSchema>;
export type DataContextColumn = z.infer<typeof DataContextColumnSchema>;
export type DataContext = z.infer<typeof DataContextSchema>;
export type ModelChatRequest = z.infer<typeof ModelChatRequestSchema>;
export type ModelChatResponse = z.infer<typeof ModelChatResponseSchema>;
