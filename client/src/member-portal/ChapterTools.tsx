import { canAccessChapterTools } from "./routing";
import { lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "./context";
import { PageHead, Empty } from "./components/ui";
import { PageSkeleton, skeletonVariantForPath } from "@/components/DashboardSkeleton";
const Updates = lazy(() => import("@/pages/dashboard/Updates"));
const Calendar = lazy(() => import("@/pages/dashboard/CalendarView"));
const Tasks = lazy(() => import("@/pages/dashboard/TasksView"));
const Connections = lazy(() => import("@/pages/dashboard/ConnectionsFinder"));
const Alumni = lazy(() => import("@/pages/dashboard/AlumniFinder"));
const Documentation = lazy(() => import("@/pages/dashboard/Documentation"));
const Admin = lazy(() => import("@/pages/dashboard/AdminPanel"));
export const chapterLabels: Record<string, string> = {
  updates: "Chapter updates",
  "chapter-calendar": "Chapter calendar",
  tasks: "My chapter tasks",
  connections: "Connections",
  alumni: "Alumni",
  docs: "Resources",
  admin: "Chapter administration",
};
export default function ChapterTools() {
  const { page, state } = useApp(),
    { user } = useAuth();
  if (state.viewingAs)
    return (
      <Empty
        title="Chapter tools aren’t part of this view"
        description="Viewing as a member covers the class dashboard. Exit the view to use chapter tools as yourself."
      />
    );
  if (!canAccessChapterTools(state.user.role))
    return (
      <Empty
        title="Chapter member access required"
        description="Your new-member tools are available in the main navigation."
      />
    );
  if (page === "admin" && !["admin", "exec"].includes(user?.role || ""))
    return (
      <Empty
        title="Chapter administrator access required"
        description="Pledge masters manage the process. Chapter administrators manage website accounts."
      />
    );
  if (state.demo)
    return (
      <>
        <PageHead
          title={chapterLabels[page]}
          description="Part of your Sigma Eta Pi website."
        />
        <section className="panel overview-panel">
          <h2>Existing chapter tools, in the same dashboard</h2>
          <p className="announcement-copy">
            This area uses your chapter’s existing records when you sign in on
            the connected website. The local sample preview contains fictional
            new-member process data only.
          </p>
        </section>
      </>
    );
  const views: Record<string, React.ReactNode> = {
    updates: <Updates />,
    "chapter-calendar": <Calendar />,
    tasks: <Tasks />,
    connections: <Connections />,
    alumni: <Alumni />,
    docs: <Documentation />,
    admin: <Admin />,
  };
  return (
    <section className="chapter-tool-content">
      <Suspense
        fallback={
          <PageSkeleton
            variant={skeletonVariantForPath(page)}
            label={`Loading ${chapterLabels[page] || "chapter records"}`}
          />
        }
      >
        {views[page]}
      </Suspense>
    </section>
  );
}
