import { Link } from "react-router-dom";
import { Activity, ArrowRight, ArrowUpRight, Target, Timer } from "lucide-react";
import { type Task, useRoadmap } from "../store";
import { postingSummary } from "../metrics";
import { DeferredChart, tracks, phases, projects, trackClass, taskProgress, weekProgress, currentWeek, prettyWeek, slugify, belongsToProject, PageTitle, Panel, ProgressBar, Ring, TaskRow, EmptyState } from "../components/shared";

function Dashboard() {
  const tasks = useRoadmap((state) => state.tasks);
  const reviews = useRoadmap((state) => state.reviews);
  const startDate = useRoadmap((state) => state.startDate);
  const week = currentWeek(startDate);
  const done = tasks.filter((task) => task.status === "Done").length;
  const trend = Array.from({ length: 8 }, (_, index) => {
    const n = index + 1;
    return {
      week: `W${String(n).padStart(2, "0")}`,
      hours: reviews[n]?.hoursSpent ?? 0,
    };
  });
  const thisWeekTasks = tasks.filter((task) => task.week === week).slice(0, 3);
  const milestones = projects
    .map((project) => {
      const items = tasks.filter((task) => belongsToProject(task, project));
      const task = items
        .filter((item) => item.status !== "Done")
        .sort((a, b) => a.week - b.week)[0];
      return task ? { project, task, items } : null;
    })
    .filter(
      (item): item is { project: string; task: Task; items: Task[] } =>
        item !== null,
    )
    .sort((a, b) => a.task.week - b.task.week)
    .slice(0, 4);
  const { streak } = postingSummary(reviews, week);
  return (
    <>
      <PageTitle
        eyebrow={`WEEK ${String(week).padStart(2, "0")} / 24 · ${phases[Math.min(4, Math.ceil(week / 4) - 1)]}`}
        title="Build your next chapter."
        subtitle="A clear view of the work that turns robotics + AI ambition into proof."
        action={
          <Link className="button primary" to={`/weeks/${week}`}>
            Open this week <ArrowRight size={16} />
          </Link>
        }
      />
      <div className="dashboard-grid">
        <section className="hero-panel panel">
          <div className="hero-copy">
            <span className="eyebrow">ROADMAP PROGRESS</span>
            <h2>
              Small steps.
              <br />
              <em>Real momentum.</em>
            </h2>
            <p>
              {done === 0
                ? "Your first milestone is waiting. Pick one task and make it real."
                : `${done} finished task${done === 1 ? "" : "s"} down. Keep the weekly rhythm moving.`}
            </p>
            <Link to="/tracker" className="text-link">
              View all tasks <ArrowRight size={15} />
            </Link>
          </div>
          <div className="hero-ring">
            <Ring value={taskProgress(tasks)} />
            <span>
              {done} <i>/</i> {tasks.length} tasks
            </span>
          </div>
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
        </section>
        <Panel className="week-panel">
          <div className="week-stat">
            <div>
              <span className="eyebrow">CURRENT WEEK</span>
              <strong>
                {String(week).padStart(2, "0")}
                <small> / 24</small>
              </strong>
            </div>
            <div className="week-icon">
              <Timer size={19} />
            </div>
          </div>
          <ProgressBar value={weekProgress(tasks, week)} />
          <div className="week-foot">
            <span>{weekProgress(tasks, week)}% complete</span>
            <span className="streak-label">
              <Activity size={14} /> {streak} review streak
            </span>
          </div>
          <div className="quick-week-list">
            {thisWeekTasks.length ? (
              thisWeekTasks.map((task) => (
                <TaskRow task={task} compact key={task.id} />
              ))
            ) : (
              <span className="quick-empty">
                No tasks loaded for this week.
              </span>
            )}
          </div>
          <Link to={`/weeks/${week}`} className="panel-link">
            Plan this week <ArrowUpRight size={14} />
          </Link>
        </Panel>
        <Panel
          className="track-panel"
          title="Track progress"
          meta={
            <Link to="/analytics" className="subtle-link">
              Details <ArrowRight size={13} />
            </Link>
          }
        >
          <div className="track-list">
            {tracks.map((track) => {
              const items = tasks.filter((task) => task.track === track);
              return (
                <Link
                  to={`/tracks/${slugify(track)}`}
                  className="track-progress-row"
                  key={track}
                >
                  <span className={`track-icon ${trackClass[track]}`}>
                    {track.slice(0, 1)}
                  </span>
                  <span className="track-label">{track}</span>
                  <span className="track-count">
                    {items.filter((task) => task.status === "Done").length}/
                    {items.length}
                  </span>
                  <ProgressBar
                    value={taskProgress(items)}
                    color={trackClass[track]}
                  />
                </Link>
              );
            })}
          </div>
          <div className="phase-progress">
            <span className="eyebrow">PHASES</span>
            {phases.map((phase, index) => {
              const items = tasks.filter((task) => task.phase === index + 1);
              return (
                <Link
                  className="phase-progress-row"
                  to={`/phases/${index + 1}`}
                  key={phase}
                >
                  <span>0{index + 1}</span>
                  <strong>{phase}</strong>
                  <ProgressBar value={taskProgress(items)} />
                  <small>{taskProgress(items)}%</small>
                </Link>
              );
            })}
          </div>
        </Panel>
        <Panel
          title="Hours invested"
          className="hours-panel"
          meta={<span className="tag muted-tag">LAST 8 WEEKS</span>}
        >
          <div className="chart-wrap">
            <DeferredChart kind="hours" data={trend} />
          </div>
        </Panel>
        <Panel
          title="24-week map"
          className="heatmap-panel"
          meta={
            <Link className="subtle-link" to="/weeks">
              All weeks <ArrowRight size={13} />
            </Link>
          }
        >
          <div className="heatmap">
            {Array.from({ length: 24 }, (_, index) => {
              const n = index + 1;
              const value = weekProgress(tasks, n);
              return (
                <Link
                  title={`${prettyWeek(n)} · ${value}% complete`}
                  key={n}
                  to={`/weeks/${n}`}
                  className={`heat-cell heat-${value === 100 ? "done" : value ? "active" : "empty"}${n === week ? " current" : ""}`}
                >
                  <span>{String(n).padStart(2, "0")}</span>
                  <i style={{ "--heat": `${value}%` } as React.CSSProperties} />
                </Link>
              );
            })}
          </div>
          <div className="heat-legend">
            <span>
              <i className="heat-empty" /> Not started
            </span>
            <span>
              <i className="heat-active" /> In progress
            </span>
            <span>
              <i className="heat-done" /> Complete
            </span>
          </div>
        </Panel>
        <Panel
          title="Upcoming milestones"
          className="upnext-panel"
          meta={
            <Link className="subtle-link" to="/projects">
              All projects <ArrowRight size={13} />
            </Link>
          }
        >
          {milestones.length ? (
            milestones.map(({ project, task, items }) => (
              <Link
                className="milestone-row"
                key={project}
                to={`/projects/${slugify(project)}`}
              >
                <span className="milestone-bullet">
                  <Target size={14} />
                </span>
                <span className="milestone-copy">
                  <strong>{project}</strong>
                  <small>
                    Next · W{String(task.week).padStart(2, "0")} · {task.topic}
                  </small>
                  <ProgressBar value={taskProgress(items)} />
                </span>
                <span className="milestone-percent">
                  {taskProgress(items)}%
                </span>
              </Link>
            ))
          ) : (
            <EmptyState
              title="All milestones complete"
              text="Your project list is clear."
            />
          )}
        </Panel>
      </div>
    </>
  );
}

export default Dashboard;
