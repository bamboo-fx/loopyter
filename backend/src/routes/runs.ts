import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../lib/prisma";
import { CreateRunSchema } from "../types";

const runsRouter = new Hono();

// POST /api/runs - Save a new run
runsRouter.post(
  "/",
  zValidator("json", CreateRunSchema),
  async (c) => {
    const data = c.req.valid("json");

    // Verify session exists
    const session = await prisma.mLSession.findUnique({
      where: { id: data.sessionId },
    });

    if (!session) {
      return c.json({ error: { message: "Session not found", code: "NOT_FOUND" } }, 404);
    }

    const run = await prisma.run.create({
      data: {
        sessionId: data.sessionId,
        name: data.name,
        code: data.code,
        accuracy: data.accuracy,
        precision: data.precision ?? null,
        recall: data.recall ?? null,
        f1Score: data.f1Score ?? null,
        modelType: data.modelType,
        datasetRows: data.datasetRows ?? null,
        datasetColumns: data.datasetColumns ?? null,
        datasetFeatures: data.datasetFeatures ?? null,
        confusionMatrix: data.confusionMatrix ?? null,
        stdout: data.stdout ?? null,
        error: data.error ?? null,
        isImproved: data.isImproved ?? false,
        explanation: data.explanation ?? null,
      },
    });

    return c.json({
      data: {
        id: run.id,
        sessionId: run.sessionId,
        name: run.name,
        code: run.code,
        accuracy: run.accuracy,
        precision: run.precision,
        recall: run.recall,
        f1Score: run.f1Score,
        modelType: run.modelType,
        datasetRows: run.datasetRows,
        datasetColumns: run.datasetColumns,
        datasetFeatures: run.datasetFeatures,
        confusionMatrix: run.confusionMatrix,
        stdout: run.stdout,
        error: run.error,
        isImproved: run.isImproved,
        explanation: run.explanation,
        createdAt: run.createdAt.toISOString(),
      },
    });
  }
);

// GET /api/runs/:sessionId - Get all runs for a session (sorted by accuracy descending)
runsRouter.get("/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");

  // Verify session exists
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return c.json({ error: { message: "Session not found", code: "NOT_FOUND" } }, 404);
  }

  const runs = await prisma.run.findMany({
    where: { sessionId },
    orderBy: { accuracy: "desc" },
  });

  return c.json({
    data: runs.map((run) => ({
      id: run.id,
      sessionId: run.sessionId,
      name: run.name,
      code: run.code,
      accuracy: run.accuracy,
      precision: run.precision,
      recall: run.recall,
      f1Score: run.f1Score,
      modelType: run.modelType,
      datasetRows: run.datasetRows,
      datasetColumns: run.datasetColumns,
      datasetFeatures: run.datasetFeatures,
      confusionMatrix: run.confusionMatrix,
      stdout: run.stdout,
      error: run.error,
      isImproved: run.isImproved,
      explanation: run.explanation,
      createdAt: run.createdAt.toISOString(),
    })),
  });
});

export { runsRouter };
