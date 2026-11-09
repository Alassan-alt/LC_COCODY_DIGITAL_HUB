import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "LC Cocody Digital Hub API opérationnelle",
    timestamp: new Date().toISOString(),
  });
});
