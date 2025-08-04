import express from "express";
import cors from "cors";
import dotenv from "dotenv"
import { auth } from "./utils/auth"
import { toNodeHandler } from "better-auth/node";
import { errorHandler } from "./middleware/errorHandler";
import plaidRouter from "./routes/plaidRouter"
import healthRouter from "./routes/healthRouter";
dotenv.config()

const app = express();
const frontendPort = process.env.FRONTEND_PORT || 8081

app.use(cors({
    origin: "*", // accept all origins (dev)
    credentials: true // Allows cookies/auth headers to be passed on between ports.
}));

app.all("/api/auth/{*any}", toNodeHandler(auth));
app.use(express.json());
app.use("/api/plaid", plaidRouter)
app.use("/api", healthRouter)
app.use(errorHandler)

export default app;