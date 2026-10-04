import { lazy, Suspense, useEffect, useMemo, useState } from "react";

import { Link, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { AnimatePresence, motion } from "framer-motion";

import { ArrowUpRight, Check, Command, Flag, LayoutDashboard, ListTodo, Moon, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Search, Settings, Sun, Tags, WandSparkles, X, Pause } from "lucide-react";

import { useRoadmap } from "./store";
import { elapsedAcrossSessions, ringLevel } from "./lib/timer";

import { phases, trackClass, taskProgress, PageSkeleton } from "./components/shared";



const DashboardPage = lazy(() => import("./pages/Dashboard"));
const TrackerPage = lazy(() => import("./pages/Tracker"));
const TaskDetailPage = lazy(() => import("./pages/TaskDetail"));
const TopicsPage = lazy(() => import("./pages/Topics"));
const TopicDetailPage = lazy(() => import("./pages/TopicDetail"));
const PhasesPage = lazy(() => import("./pages/Phases"));
const PhaseDetailPage = lazy(() => import("./pages/PhaseDetail"));
const SettingsPageLazy = lazy(() => import("./pages/Settings"));
const NotFoundPage = lazy(() => import("./pages/NotFound"));
const FocusPage = lazy(() => import('./pages/Focus'));
const AnalyticsPage = lazy(() => import('./pages/Analytics'));
const SwipePage = lazy(() => import('./pages/Swipe'));



function App() {
  const theme = useRoadmap((state) => state.theme);
  const swipeDefaultMobile = useRoadmap((state) => state.swipeDefaultMobile);
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
    if (location.pathname === '/swipe') useRoadmap.getState().setSwipeMode(true);
    else if (location.pathname === '/' && swipeDefaultMobile && window.matchMedia('(max-width: 620px)').matches && sessionStorage.getItem('classic-home-override') !== 'true') navigate('/swipe', { replace: true });
  }, [location.pathname, swipeDefaultMobile, navigate]);
  const activeId = useRoadmap(s => s.timerSessions.find(x => x.id === s.activeSessionId)?.taskId ?? null);
  const sessions = useRoadmap(s => s.timerSessions);
  const budgetNotifications = useRoadmap(s => s.budgetNotifications);
  const [clockNow, setClockNow] = useState(Date.now());
  const [overrunId, setOverrunId] = useState<string | null>(null);
  const [overrunNote, setOverrunNote] = useState('');
  useEffect(() => { const timer = window.setInterval(() => setClockNow(Date.now()), 1000); const seen = window.setInterval(() => useRoadmap.getState().updateLastSeen(), 60000); return () => { clearInterval(timer); clearInterval(seen) } }, []);
  useEffect(() => { const task = useRoadmap.getState().tasks.find(x => x.id === activeId); const active = useRoadmap.getState().timerSessions.find(x => x.id === useRoadmap.getState().activeSessionId); if (!active || !task) { setOverrunId(null); return } const snooze = Number(sessionStorage.getItem(`2x-snooze-${active.id}`) ?? 0); if (elapsedAcrossSessions(useRoadmap.getState().timerSessions, activeId!) >= task.budgetHours * 7200000 && Date.now() >= snooze && !sessionStorage.getItem(`2x-done-${active.id}`)) setOverrunId(active.id) }, [activeId, clockNow, sessions]);
  useEffect(() => { const task = useRoadmap.getState().tasks.find(x => x.id === activeId); const elapsed = activeId ? elapsedAcrossSessions(useRoadmap.getState().timerSessions, activeId, clockNow) : 0; document.title = task ? `${formatClock(elapsed)} · ${task.id}` : 'Route/Hrs' }, [activeId, clockNow, sessions]);
  useEffect(() => { if (!budgetNotifications || !activeId || typeof window.Notification === 'undefined' || window.Notification.permission !== 'granted') return; const active = useRoadmap.getState().timerSessions.find(x => x.id === useRoadmap.getState().activeSessionId); const task = useRoadmap.getState().tasks.find(x => x.id === activeId); if (active && task && elapsedAcrossSessions(useRoadmap.getState().timerSessions, activeId) >= task.budgetHours * 3600000 && !sessionStorage.getItem(`budget-${active.id}`)) { sessionStorage.setItem(`budget-${active.id}`, '1'); try { new window.Notification(`${task.id} reached its time estimate`) } catch { /* Ignore unavailable notification contexts. */ } } }, [budgetNotifications, activeId, clockNow, sessions]);
  useEffect(() => { const active = useRoadmap.getState().timerSessions.find(s => s.id === useRoadmap.getState().activeSessionId); const last = useRoadmap.getState().lastSeenAt; if (active && last && Date.now() - Date.parse(last) > 1800000) { if (window.confirm('Keep all time? Choose Cancel to trim to when you left.')) useRoadmap.getState().pauseTask(active.taskId); else useRoadmap.getState().trimActiveSession(last); } }, []);
  useEffect(() => { const sync = (event: StorageEvent) => { if (event.key === 'roadmap-tracker-v1') void (useRoadmap as any).persist?.rehydrate?.() }; window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync) }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
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
        const phaseTasks = state.tasks.filter((task) => task.phase === completed.phase && !task.optional);
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
  const progress = useRoadmap((state) => taskProgress(state.tasks.filter((task) => !task.optional)));
  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tracker', label: 'Tracker', icon: ListTodo },
    { to: '/topics', label: 'Topics', icon: Tags },
    { to: '/phases', label: 'Phases', icon: Flag },
    { to: '/analytics', label: 'Analytics', icon: ArrowUpRight },
    { to: '/settings', label: 'Settings', icon: Settings },
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
        <div className="nav-group" aria-label="Main navigation">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                end={to === '/' || to === '/topics' || to === '/phases'}
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
        <div className="side-spacer" />
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
                .tasks.filter((task) => !task.optional && task.status === "done").length
            }{" "}
              of {useRoadmap.getState().tasks.filter((task) => !task.optional).length} core tasks completed
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
          <div className="mode-toggle" aria-label="Home mode"><button className={location.pathname !== '/swipe' ? 'selected' : ''} onClick={() => { sessionStorage.setItem('classic-home-override','true'); useRoadmap.getState().setSwipeMode(false); navigate('/') }}>Classic</button><button className={location.pathname === '/swipe' ? 'selected' : ''} onClick={() => { sessionStorage.removeItem('classic-home-override'); useRoadmap.getState().setSwipeMode(true); navigate('/swipe') }}>Swipe</button></div>
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
              <Route path="/topics" element={<TopicsPage />} />
              <Route path="/topics/:slug" element={<TopicDetailPage />} />
              <Route path="/phases" element={<PhasesPage />} />
              <Route path="/phases/:id" element={<PhaseDetailPage />} />
              <Route path="/settings" element={<SettingsPageLazy />} />
              <Route path="/focus/:id" element={<FocusPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/swipe" element={<SwipePage />} />
              <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <TimerBar now={clockNow} />
        {overrunId && <div className="command-backdrop"><section className="command-box completion-dialog" role="dialog" aria-modal="true"><h2>Do the minimum pass and finish</h2><p>{useRoadmap.getState().tasks.find(t=>t.id===activeId)?.id} is at 200% of its time budget.</p><button className="button primary" onClick={() => { sessionStorage.setItem(`2x-done-${overrunId}`, '1'); setOverrunId(null); navigate(`/focus/${activeId}`) }}>Do the minimum pass and finish</button><label className="field-label">Blocker note for parking<textarea value={overrunNote} onChange={e=>setOverrunNote(e.target.value)} placeholder="Required to park"/></label><button className="button secondary" disabled={!overrunNote.trim()} onClick={() => { if(activeId) useRoadmap.getState().parkTask(activeId,overrunNote); setOverrunNote(''); setOverrunId(null) }}>Park it</button><button className="button secondary" onClick={() => { sessionStorage.setItem(`2x-snooze-${overrunId}`,String(Date.now()+30*60000)); setOverrunId(null) }}>Keep going · 30 min</button></section></div>}
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
                <Link to="/topics" onClick={() => setSearchOpen(false)}>Topics</Link>
                <Link to="/phases" onClick={() => setSearchOpen(false)}>Phases</Link>
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

function formatClock(ms: number) {
  const seconds = Math.floor(ms / 1000);
  return `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function MobileNav() {
  return (
    <nav className="mobile-nav">
      {[
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/tracker', label: 'Tracker', icon: ListTodo },
        { to: '/topics', label: 'Topics', icon: Tags },
        { to: '/phases', label: 'Phases', icon: Flag },
        { to: '/analytics', label: 'Analytics', icon: ArrowUpRight },
        { to: '/settings', label: 'Settings', icon: Settings },
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

function TimerBar({ now }: { now: number }) {
  const state = useRoadmap(); const active = state.timerSessions.find(s => s.id === state.activeSessionId); const task = active && state.tasks.find(t => t.id === active.taskId);
  if (!active || !task) return null;
  const elapsed = elapsedAcrossSessions(state.timerSessions, task.id, now); const percent = elapsed / (task.budgetHours * 3600000) * 100; const seconds = Math.floor(elapsed / 1000);
  const time = `${String(Math.floor(seconds / 3600)).padStart(2,'0')}:${String(Math.floor(seconds / 60) % 60).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
  const level = ringLevel(percent);
  return <aside className={`timer-bar timer-${level}`}><Link to={`/focus/${task.id}`}><b>{task.id}</b><span>{task.step}</span></Link><div className="timer-budget"><i style={{width:`${Math.min(percent,100)}%`}}/><small>{time} / {task.budgetHours} h</small></div><button className="button secondary" onClick={() => state.pauseTask(task.id)}><Pause size={14}/>Pause</button><Link className="button primary" to={`/focus/${task.id}`}>Complete</Link><Link className="timer-focus-link" to={`/focus/${task.id}`}>Focus ↗</Link></aside>
}

export default App;
