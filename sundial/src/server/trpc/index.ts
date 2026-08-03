import { router } from "./trpc";
import { clientsRouter } from "./routers/clients";
import { projectsRouter } from "./routers/projects";
import { invoicesRouter } from "./routers/invoices";
import { agentsRouter } from "./routers/agents";
import { approvalsRouter } from "./routers/approvals";
import { activityRouter } from "./routers/activity";
import { dashboardRouter } from "./routers/dashboard";
import { workspaceRouter } from "./routers/workspace";

export const appRouter = router({
  dashboard: dashboardRouter,
  clients: clientsRouter,
  projects: projectsRouter,
  invoices: invoicesRouter,
  agents: agentsRouter,
  approvals: approvalsRouter,
  activity: activityRouter,
  workspace: workspaceRouter,
});

export type AppRouter = typeof appRouter;
