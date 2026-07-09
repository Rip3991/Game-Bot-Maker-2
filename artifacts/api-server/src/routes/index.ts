import { Router, type IRouter } from "express";
import healthRouter from "./health";
import telegramRouter from "./telegram";
import usersRouter from "./users";
import spinRouter from "./spin";
import leaderboardRouter from "./leaderboard";
import starsRouter from "./stars";
import withdrawRouter from "./withdraw";
import statsRouter from "./stats";
import vaultRouter from "./vault";
import nftsRouter from "./nfts";
import adminRouter from "./admin";
import tasksRouter from "./tasks";
import tradesRouter from "./trades";

const router: IRouter = Router();

router.use(healthRouter);
router.use(telegramRouter);
router.use(usersRouter);
router.use(spinRouter);
router.use(leaderboardRouter);
router.use(starsRouter);
router.use(withdrawRouter);
router.use(statsRouter);
router.use("/vault", vaultRouter);
router.use("/nfts", nftsRouter);
router.use("/admin", adminRouter);
router.use("/tasks", tasksRouter);
router.use("/trades", tradesRouter);

export default router;
