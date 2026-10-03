import { lazy, Suspense, useEffect, useMemo, useState } from "react";

import { Link, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { AnimatePresence, motion } from "framer-motion";

import { ArrowDownToLine, ArrowUpRight, Check, Command, LayoutDashboard, ListTodo, Moon, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Search, Settings, Sun, WandSparkles, X } from "lucide-react";

import { useRoadmap } from "./store";

import { PhasePlaceholder, phases, trackClass, taskProgress, PageSkeleton } from "./components/shared";



const DashboardPage = lazy(() => import("./pages/Dashboard"));
const TrackerPage = lazy(() => import("./pages/Tracker"));
const TaskDetailPage = lazy(() => import("./pages/TaskDetail"));
const SettingsPageLazy = lazy(() => import("./pages/Settings"));
const NotFoundPage = lazy(() => import("./pages/NotFound"));



function App() {
  const theme = useRoadmap((state) => state.theme);
  const migrationBackup = useRoadmap((state) => state.migrationBackup);
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [backupUrl, setBackupUrl] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    undo: () => void;
  } | null>(null);
  const [celebration, setCelebration] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("roadmap-sidebar-collapsed") === "true",
  );
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    if (!migrationBackup) {
      setBackupUrl('');
      setBackupDownloaded(false);
      return;
    }
    const url = URL.createObjectURL(new Blob([migrationBackup], { type: 'application/json' }));
    setBackupUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [migrationBackup]);
  useEffect(() => {
    localStorage.setItem("roadmap-sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);
  useEffect(
    () =>
      useRoadmap.subscribe((state, previous) => {
        if (state.tasks === previous.tasks) return;
        const changedIndex = state.tasks.findIndex(
          (task, index) => task.status !== previous.tasks[index]?.status,
        );
        const completed = state.tasks[changedIndex];
        const before = previous.tasks[changedIndex];
        if (!completed || completed.status !== "done" || !before) return;
        const phaseTasks = state.tasks.filter((task) => task.phase === completed.phase);
        const milestone = phaseTasks.length && phaseTasks.every((task) => task.status === "done")
          ? `Phase ${completed.phase} · ${phases[completed.phase]} complete`
          : null;
        setToast({
          message: milestone ?? "Task marked done",
          undo: () =>
            useRoadmap
              .getState()
              .updateTask(completed.id, {
                status: before.status,
                doneAt: before.doneAt,
              }),
        });
        window.setTimeout(() => setToast(null), 5000);
        if (milestone) {
          setCelebration(true);
          window.setTimeout(() => setCelebration(false), 1900);
        }
      }),
    [],
  );
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") ||
        event.key === "/"
      ) {
        if (
          (event.target as HTMLElement).tagName === "INPUT" ||
          (event.target as HTMLElement).tagName === "TEXTAREA"
        )
          return;
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
      if (
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (event.target as HTMLElement).tagName,
        )
      ) {
        if (event.key === "g")
          window.sessionStorage.setItem("roadmap-nav-key", "g");
        else if (window.sessionStorage.getItem("roadmap-nav-key") === "g") {
          window.sessionStorage.removeItem("roadmap-nav-key");
          const routes: Record<string, string> = { d: "/", t: "/tracker" };
          if (routes[event.key]) navigate(routes[event.key]);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);
  const results = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return [];
    return useRoadmap
      .getState()
      .tasks.filter((task) =>
        `${task.id} ${task.topic} ${task.step}`
          .toLowerCase()
          .includes(normalized),
      )
      .slice(0, 6);
  }, [search]);
  const progress = useRoadmap((state) => taskProgress(state.tasks.filter((task) => task.id !== 'RB-59')));
  const navGroups = [
    {
      label: "Workspace",
      links: [
        { to: "/", label: "Overview", icon: LayoutDashboard },
        { to: "/tracker", label: "Task tracker", icon: ListTodo },
      ],
    },
  ];
  return (
    <div className="app-shell">
      <aside className={`sidebar${sidebarCollapsed ? " collapsed" : ""}`}>
        <Link to="/" className="brand">
          <span className="brand-mark">
            <WandSparkles size={18} />
          </span>
          <span>
            ROUTE<span className="brand-muted">/HRS</span>
          </span>
        </Link>
        <div className="plan-label">
          <span className="live-dot" /> HOURS-BASED ROADMAP
        </div>
        {navGroups.map((group) => (
          <div className="nav-group" key={group.label}>
            <p>{group.label}</p>
            {group.links.map(({ to, label, icon: Icon }) => (
              <NavLink
                end={to === "/"}
                to={to}
                key={to}
                className={({ isActive }) =>
                  `nav-link${isActive ? " active" : ""}`
                }
              >
                <Icon size={17} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
        <div className="side-spacer" />
        <Link className="settings-link" to="/settings">
          <Settings size={17} /> Settings
        </Link>
        <div className="side-progress">
          <div className="side-progress-heading">
            <span>Plan progress</span>
            <b>{progress}%</b>
          </div>
          <div className="progress-track">
            <i style={{ width: `${progress}%` }} />
          </div>
          <small>
            {
              useRoadmap
                .getState()
                .tasks.filter((task) => task.id !== 'RB-59' && task.status === "done").length
            }{" "}
              of {useRoadmap.getState().tasks.filter((task) => task.id !== 'RB-59').length} core tasks completed
          </small>
        </div>
        <div className="profile">
          <div className="avatar">RK</div>
          <div>
            <strong>Roadmap keeper</strong>
            <small>Robotics + AI/ML</small>
          </div>
          <MoreHorizontal size={18} className="muted" />
        </div>
      </aside>
      <main
        className={`main-column${sidebarCollapsed ? " sidebar-collapsed" : ""}`}
      >
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark">
              <WandSparkles size={17} />
            </span>
            ROUTE<span className="brand-muted">/HRS</span>
          </div>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span className="slash">/</span>
            <b>{breadcrumb(location.pathname)}</b>
          </div>
          <div className="top-actions">
            <button
              className="icon-button collapse-button"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={
                sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
              }
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen size={17} />
              ) : (
                <PanelLeftClose size={17} />
              )}
            </button>
            <button
              className="search-trigger"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={15} />
              <span>Search anything...</span>
              <kbd>
                <Command size={11} /> K
              </kbd>
            </button>
            <button
              className="icon-button theme-button"
              title="Toggle theme"
              onClick={() =>
                useRoadmap
                  .getState()
                  .setTheme(theme === "dark" ? "light" : "dark")
              }
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>
        <div className="mobile-progress">
          <span>Plan progress</span>
          <div className="progress-track">
            <i style={{ width: `${progress}%` }} />
          </div>
          <b>{progress}%</b>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="page-wrap"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.18 }}
          >
            <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/tracker" element={<TrackerPage />} />
              <Route path="/task/:id" element={<TaskDetailPage />} />
              <Route path="/weeks/*" element={<PhasePlaceholder title="Week planner" />} />
              <Route path="/phases/:id" element={<PhasePlaceholder title="Phase progress" />} />
              <Route path="/tracks/:name" element={<PhasePlaceholder title="Track progress" />} />
              <Route path="/projects/*" element={<PhasePlaceholder title="Projects" />} />
              <Route path="/reviews" element={<PhasePlaceholder title="Weekly reviews" />} />
              <Route path="/analytics" element={<PhasePlaceholder title="Analytics" />} />
              <Route path="/resume" element={<PhasePlaceholder title="Resume and links" />} />
              <Route path="/settings" element={<SettingsPageLazy />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
        <MobileNav />
      </main>
      {searchOpen && (
        <div
          className="command-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSearchOpen(false);
          }}
        >
          <section className="command-box">
            <div className="command-input">
              <Search size={18} />
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks, projects, pages..."
              />
              <kbd>ESC</kbd>
            </div>
            {search.trim() ? (
              <div className="command-results">
                {results.length ? (
                  results.map((task) => (
                    <Link
                      key={task.id}
                      to={`/task/${task.id}`}
                      onClick={() => setSearchOpen(false)}
                    >
                      <span className={`track-dot ${trackClass[task.trackCode]}`} />
                      <span>
                        {task.topic}
                        <small>
                          {task.id} · Phase {task.phase} · {task.budgetHours} h
                        </small>
                      </span>
                      <ArrowUpRight size={15} />
                    </Link>
                  ))
                ) : (
                  <div className="empty-small">
                    No tasks found for “{search}”.
                  </div>
                )}
              </div>
            ) : (
              <div className="command-shortcuts">
                <span>Quick jump</span>
                <Link to="/tracker" onClick={() => setSearchOpen(false)}>
                  All tasks <kbd>T</kbd>
                </Link>
                <Link to="/settings" onClick={() => setSearchOpen(false)}>Settings</Link>
              </div>
            )}
          </section>
        </div>
      )}
      {celebration && (
        <div className="confetti-burst" aria-hidden="true">
          {Array.from({ length: 28 }, (_, index) => (
            <i
              key={index}
              style={
                {
                  "--x": `${((index % 7) - 3) * 36}px`,
                  "--y": `${70 + Math.floor(index / 7) * 38}px`,
                  "--r": `${index * 53}deg`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={14} /> {toast.message}
          </span>
          <button onClick={toast.undo}>Undo</button>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {migrationBackup && (
        <div className="command-backdrop migration-backdrop">
          <section className="command-box migration-prompt" role="alertdialog" aria-modal="true" aria-labelledby="migration-title">
            <span className="eyebrow">SCHEMA UPDATE</span>
            <h2 id="migration-title">Your saved roadmap uses the old week-based format.</h2>
            <p>Download a JSON backup of that data, then continue with the fresh hours-based roadmap.</p>
            <a className="button secondary" href={backupUrl} download="roadmap-v1-backup.json" onClick={() => setBackupDownloaded(true)}><ArrowDownToLine size={15} /> Download JSON backup</a>
            <button className="button primary" disabled={!backupDownloaded} onClick={() => useRoadmap.getState().clearMigrationBackup()}>Start fresh</button>
          </section>
        </div>
      )}
    </div>
  );
}

function breadcrumb(path: string) {
  if (path === "/") return "Overview";
  const last = path.split("/").filter(Boolean).at(-1) ?? "";
  return last
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function MobileNav() {
  return (
    <nav className="mobile-nav">
      {[
        { to: "/", label: "Home", icon: LayoutDashboard },
        { to: "/tracker", label: "Tasks", icon: ListTodo },
        { to: "/settings", label: "Setup", icon: Settings },
      ].map(({ to, label, icon: Icon }) => (
        <NavLink
          end={to === "/"}
          to={to}
          key={to}
          className={({ isActive }) =>
            isActive ? "mobile-tab active" : "mobile-tab"
          }
        >
          <Icon size={18} />
          <small>{label}</small>
        </NavLink>
      ))}
    </nav>
  );
}

export default App;