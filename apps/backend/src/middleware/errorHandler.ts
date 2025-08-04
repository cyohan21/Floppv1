import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || "Something went wrong.";
  res.status(status).json({
    error: message,
    status,
    timestamp: new Date().toISOString()
  });
};