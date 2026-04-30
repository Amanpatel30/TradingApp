import { createElement } from "react";
import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AppLayout } from "./components/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { TradeSimulator } from "./pages/TradeSimulator";
import { MarketReplay } from "./pages/MarketReplay";
import { StrategyBuilder } from "./pages/StrategyBuilder";
import { Analytics } from "./pages/Analytics";
import { TradingJournal } from "./pages/TradingJournal";
import { Leaderboard } from "./pages/Leaderboard";
import { MistakeAnalysis } from "./pages/MistakeAnalysis";
import { LearningCenter } from "./pages/LearningCenter";
import { ProfilePage } from "./pages/ProfilePage";
import { RouteError } from "./components/RouteError";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
    errorElement: createElement(RouteError),
  },
  {
    path: "/login",
    Component: LoginPage,
    errorElement: createElement(RouteError),
  },
  {
    path: "/register",
    Component: RegisterPage,
    errorElement: createElement(RouteError),
  },
  {
    path: "/app",
    Component: AppLayout,
    errorElement: createElement(RouteError),
    children: [
      { index: true, Component: Dashboard },
      { path: "dashboard", Component: Dashboard },
      { path: "simulator", Component: TradeSimulator },
      { path: "replay", Component: MarketReplay },
      { path: "strategy", Component: StrategyBuilder },
      { path: "analytics", Component: Analytics },
      { path: "journal", Component: TradingJournal },
      { path: "leaderboard", Component: Leaderboard },
      { path: "mistakes", Component: MistakeAnalysis },
      { path: "learn", Component: LearningCenter },
      { path: "profile", Component: ProfilePage },
    ],
  },
]);
