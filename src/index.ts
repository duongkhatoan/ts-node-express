import express, { Express, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import jwt from "jsonwebtoken";
import client from "./database"
import withContext from './middlewares/with-context';
import { refreshTokenUser } from "./utils/auth";
import routes from './routes/v1'
import websocket from '~/libs/WebSocket'
import http from "http"



dotenv.config();
type RequestType = Request & { token?: string; refreshToken?: string; user?: any, headers: any };
type MiddlewareFunction = (req: RequestType, res: Response, next: NextFunction) => Promise<void>;

const SECRET1 = process.env.SECRET_KEY;
const SECRET2 = process.env.REFRESH_KEY;
const PORT = process.env.PORT || 5000;
const app: Express = express();
const corsOptions: cors.CorsOptions = {
  origin: "*",
  credentials: true,
  optionsSuccessStatus: 200,
};
const server = http.createServer(app)
const run = async () => {
  try {
    const addTokens: MiddlewareFunction = async (req, res, next) => {
      req.token = req.headers["x-token"];
      req.refreshToken = req.headers["x-refresh-token"];
      next();
    };

    const addUser: MiddlewareFunction = async (req, res, next) => {
      const token = req.token;
      if (token) {
        try {
          const user = jwt.verify(token, SECRET1 as string);
          req.user = user;
        } catch (err) {
          const refreshToken = req.refreshToken;
          const newTokens = await refreshTokenUser(token, refreshToken as string, client);
          if (newTokens.token && newTokens.refreshToken) {
            res.set("Access-Control-Expose-Headers", "x-token, x-refresh-token");
            res.set("x-token", newTokens.token);
            res.set("x-refresh-token", newTokens.refreshToken);
          }
          req.user = newTokens.user;
        }
      }
      next();
    };
    app.use(cors({ credentials: true, origin: '*' }))
    app.use(addTokens);
    app.use(addUser);
    app.use(bodyParser.json());
    app.use(withContext({ client }) as MiddlewareFunction);
    // app.listen(5000);

    app.get("/", (req: Request, res: Response) => {
      res.send("test + TypeScript Server");
    });

    routes(app);
    websocket.init(server)
    websocket.on("POS", (data) => {
      if (data === "ping") {
        console.log(data, "test")
        websocket.emit("POS", "pong")
      }
    })


  } catch (error) {
    console.log("error", error);
  }
}
run()
server.listen(PORT, async (err?: Error) => {
  if (err) {
    console.error(err); // Log errors to the console 
  } else {
    console.log(`Server listening at http://localhost:${PORT}`); // Log the server's address
  }
});



