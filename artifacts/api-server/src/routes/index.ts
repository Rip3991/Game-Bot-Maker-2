import { Router, type IRouter } from "express";
import healthRouter from "./health";
import telegramRouter from "./telegram";
import usersRouter from "./users";
import spinRouter from "./spin";
import leaderboardRouter from "./leaderboard";
import starsRouter from "./stars";

const router: IRouter = Router();

router.use(healthRouter);
router.use(telegramRouter);
router.use(usersRouter);
router.use(spinRouter);
router.use(leaderboardRouter);
router.use(starsRouter);

export default router;
