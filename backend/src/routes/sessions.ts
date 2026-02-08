import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../lib/prisma";
import { CreateSessionSchema } from "../types";

const sessionsRouter = new Hono();

// POST /api/sessions - Create new session
sessionsRouter.post(
  "/",
  zValidator("json", CreateSessionSchema),
  async (c) => {
    const { name } = c.req.valid("json");

    const session = await prisma.mLSession.create({
      data: {
        name: name || "Untitled Session",
      },
    });

    return c.json({
      data: {
        id: session.id,
        name: session.name,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      },
    });
  }
);

// GET /api/sessions/:id - Get session with all runs
sessionsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  const session = await prisma.mLSession.findUnique({
    where: { id },
    include: {
      runs: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!session) {
    return c.json({ error: { message: "Session not found", code: "NOT_FOUND" } }, 404);
  }

  return c.json({
    data: {
      id: session.id,
      name: session.name,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      runs: session.runs.map((run) => ({
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
    },
  });
});

export { sessionsRouter };
