import { Request, Response, NextFunction } from "express";

interface Context {
  user: {
    id: string,
  };
  db: any,
  language: any;
  serverUrl: any;
  origin: any,
}
type RequestContext = Request & { context: Context };


export const requireLogin = (req: Request, res: Response, next: NextFunction) => {
  const { user } = (req as RequestContext).context;

  if (!user?.id) {

    return res.json({ message: "Unauthorized" }).status(401);
  }
  next();
};
