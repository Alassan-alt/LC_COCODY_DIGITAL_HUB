import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { isValidObjectId } from "../utils/objectId";

export function validateObjectIdParam(paramName = "id") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.params[paramName];
    if (!isValidObjectId(value)) {
      next(new AppError(`Identifiant invalide : ${paramName}`, 400));
      return;
    }
    next();
  };
}
