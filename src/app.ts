import bodyParser from "body-parser";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import mongoSanitize from "express-mongo-sanitize";
import { rateLimit } from "express-rate-limit";
import session from "express-session";
import figlet from "figlet";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import passport from "passport";
import errorMiddleware from "./middlewares/error.middleware";
import setupSwaggerDocs from "./config/swagger";

import dotenv from "dotenv";
import GlobalController from "./protocols/global.controller";
import logger, { default as log } from "./services/logger/logger";
dotenv.config();
class App {
  public express: Application;
  public port: number;

  constructor(controllers: GlobalController[], port: number) {
    this.express = express();
    this.port = port;

    this.initializeDatabaseConnection();
    this.initializeLoggers();
    this.initializeMiddlewares();
    this.initializeControllers(controllers);
    setupSwaggerDocs(this.express, this.port);
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    this.express.use(
      cors({
        credentials: true,
      })
    );

    this.express.use(compression());
    this.express.use(cookieParser());

    const jsonParser = bodyParser.json();

    this.express.use(
      "/api/stripe/webhook",
      express.raw({ type: "application/json" })
    );

    this.express.use((req, res, next) => {
      if (req.originalUrl === "/api/stripe/webhook") {
        return next();
      }
      return jsonParser(req, res, next);
    });

    this.express.use(
      (err: any, req: Request, res: Response, next: NextFunction): void => {
        // Gracefully handle empty JSON bodies (e.g. POST with Content-Type: application/json and no payload)
        if (err instanceof SyntaxError) {
          const anyErr = err as any;
          if (
            anyErr.status === 400 &&
            "body" in anyErr &&
            typeof anyErr.body === "string" &&
            anyErr.body.trim() === ""
          ) {
            req.body = {};
            return next();
          }
        }
        next(err);
      }
    );
    this.express.use(morgan("dev"));
    this.express.use(express.urlencoded({ extended: false }));
    this.express.use(helmet());
    this.express.use(
      session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
          maxAge: 60000 * 60,
          secure: true,
        },
      })
    );
    this.express.use(passport.initialize());
    this.express.use(passport.session());
    this.express.use(mongoSanitize());

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      // store: ... ,
      message: `Too many request from IP. try again after 15min`,
    });

    // TEMPORARILY DISABLED FOR TESTING
    this.express.use(limiter);

    this.express.get("/", (req, res) => {
      figlet("Wond3rCard", { font: "Slant" }, (err, data) => {
        if (err) {
          console.error("Error generating ASCII art:", err);
          const message = `Welcome to Wond3rCard! 🎉✨
            Explore our APIs and create magic! 🪄💳
            Documentation: https://example.com/docs 📚🌐`;
          res.send(message.trim());
        }
        res.type("text/plain");
        res.send(data);
      });
    });
  }

  private initializeControllers(controllers: GlobalController[]): void {
    controllers.forEach((c) => {
      this.express.use("/api", c.router);
    });
  }

  private async initializeErrorHandling(): Promise<void> {
    this.express.use(errorMiddleware);
  }

  private initializeLoggers(): void {
    const morganFormat = ":method :url :status :response-time ms";

    this.express.use(
      morgan(morganFormat, {
        stream: {
          write: (message) => {
            const [method, url, status, responseTime] = message.split(" ");

            const logObject = {
              method,
              url,
              status,
              responseTime,
              timestamp: new Date().toISOString(),
            };

            const isError = status.startsWith("4") || status.startsWith("5");

            if (isError) {
              logger.error("HTTP Error", {
                ...logObject,
                level: "error",
                statusCode: status,
                message: `${method} ${url} failed with status ${status}`,
              });
            } else {
              logger.info("HTTP Request", logObject);
            }
          },
        },
      })
    );

    this.express.use((req, res, next) => {
      const logObject = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        requestHeaders: req.headers,
        requestBody: req.body,
        responseTime: res.get("X-Response-Time") || "N/A",
        timestamp: new Date().toISOString(),
      };

      logger.info("Detailed Request Log", logObject);
      next();
    });

    this.express.use((req, res, next) => {
      const originalWrite = res.write;
      const originalEnd = res.end;
      const chunks = [];

      res.write = function (chunk) {
        chunks.push(chunk);
        originalWrite.apply(res, arguments);
      } as any;

      res.end = function (chunk) {
        if (chunk) {
          chunks.push(
            Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, "utf8")
          );
        }
        const responseBody = Buffer.concat(chunks).toString("utf8");

        logger.info("HTTP Response", {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          responseBody,
          timestamp: new Date().toISOString(),
        });

        originalEnd.apply(res, arguments);
      } as any;

      next();
    });
  }

  public initializeDatabaseConnection(): void {
    const { MONGO_USER, MONGO_PASSWORD, MONGO_PATH, NODE_ENV } = process.env;

    if (!MONGO_USER || !MONGO_PASSWORD || !MONGO_PATH) {
      logger.error("MongoDB environment variables are not properly set.");
      console.log(
        `MONGO_USER: ${MONGO_USER}\nMONGO_PASSWORD: ${MONGO_PASSWORD}\nMONGO_PATH: ${MONGO_PATH}`
      );
      process.exit(1);
    }

    const local = "mongodb://localhost:27017/";
    const live = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_PATH}`;
    logger.info(`Attempting to connect to MongoDB...`);

    const connectionString = NODE_ENV === "development" ? local : live;
    const enableTLS = NODE_ENV === "production";

    const connectionOptions = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      tls: enableTLS,
    };

    const connectWithRetry = async () => {
      await mongoose
        .connect(connectionString, connectionOptions)
        .then(() => {
          logger.info("MongoDB connected successfully on retry.");
        })
        .catch((error) => {
          logger.error(`Could not connect to MongoDB: ${error.message}`);
          setTimeout(connectWithRetry, 5000);
        });
    };

    connectWithRetry();

    mongoose.connection.on("connected", () => {
      logger.info("Mongoose connected to MongoDB.");
    });

    mongoose.connection.on("error", (err) => {
      logger.error(`Mongoose connection error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("Mongoose disconnected. Attempting to reconnect...");
      setTimeout(connectWithRetry, 5000);
    });

    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.info("Mongoose connection closed due to app termination.");
      process.exit(0);
    });
  }

  public listen() {
    const server = this.express.listen(this.port, () => {
      log.info(`Live on https://wond3rcard-backend-rgmx.onrender.com/`);
      log.info(`App is listening on localhost:${this.port}`);
    });
    return server;
  }
}

export default App;
