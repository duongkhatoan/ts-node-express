import { Request, Response, NextFunction } from "express";

interface Context {
  user: {
    id: string,
  };
  client: any,
  db: any,
  language: any;
  serverUrl: any;
  origin: any,
}
type RequestContext = Request & { context: Context };


export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const { user, client } = (req as RequestContext).context;
  if (!user?.id) {

    return res.json({ message: "Unauthorized" }).status(401);
  }

  const userInfo = await client.user.findFirst({
    where: {
      id: user.id,
      deletedAt: { isSet: false }
    }
  })
  if (userInfo.role === 0) {
    return res.json({ message: "Unauthorized admin" }).status(401);
  }
  next();
};
