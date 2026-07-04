import { router } from "./trpc";
import { clientsRouter } from "./routers/clients";
import { projectsRouter } from "./routers/projects";
import { invoicesRouter } from "./routers/invoices";
import { agentsRouter } from "./routers/agents";

export const appRouter = router({
  clients: clientsRouter,
  projects: projectsRouter,
  invoices: invoicesRouter,
  agents: agentsRouter,
});

export type AppRouter = typeof appRouter;
