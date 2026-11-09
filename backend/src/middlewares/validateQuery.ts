import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as unknown as Request["query"];
      next();
    } catch (error) {
      next(error);
    }
  };
}
