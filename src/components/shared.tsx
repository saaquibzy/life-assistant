import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { ArrowLeft, Check, CircleHelp, WandSparkles } from "lucide-react";
import { type Review, type Status, type Task, type Track, useRoadmap } from "../store";
import { elapsedWeeksSince } from "../metrics";
import type { ChartDatum, ChartKind } from "../RoadmapChart";

export const LazyRoadmapChart = lazy(() => import("../RoadmapChart"));
export function DeferredChart({ kind, data }: { kind: ChartKind; data: ChartDatum[] }) {
  return (
    <Suspense fallback={<div className="chart-skeleton" aria-label="Loading chart" />}>
      <LazyRoadmapChart kind={kind} data={data} />
    </Suspense>
  );
}
export const tracks: Track[] = [
  "AI/ML",
  "Robotics",
  "Design/Web",
  "Video/Social",
  "Resume",
];
export const phases = [
  "Foundations",
  "Core builds",
  "Research flagship",
  "LLMs & deploy",
  "Finish & resume",
];
export const portfolioProjects = [
  "R1 Service robot",
  "R2 Warehouse robot",
  "R3 Medical arm",
  "R4 Humanoid RL",
  "H2 Thermal CNN-Transformer",
  "H4 RAG + LoRA",
  "H5 Paper reproduction",
];
export const projects = portfolioProjects;
export const projectOptions = [...new Set(useRoadmap.getState().tasks.map((task) => task.project))].sort();
export const trackClass: Record<Track, string> = {
  "AI/ML": "violet",
  Robotics: "cyan",
  "Design/Web": "pink",
  "Video/Social": "amber",
  Resume: "green",
};
export const phaseRange = (phase: number) =>
  phase < 5 ? [phase * 4 - 3, phase * 4] : [17, 24];
export const pct = (done: number, total: number) =>
  total ? Math.round((done / total) * 100) : 0;
export const taskProgress = (items: Task[]) =>
  pct(items.filter((task) => task.status === "Done").length, items.length);
export const weekProgress = (tasks: Task[], week: number) =>
  taskProgress(tasks.filter((task) => task.week === week));
export const currentWeek = (startDate: string) => Math.max(1, Math.min(24, elapsedWeeksSince(startDate)));
export const prettyWeek = (week: number) => `Week ${String(week).padStart(2, "0")}`;
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("&", "and")
    .replace(/[^a-z0-9]+/g, "-");
export const belongsToProject = (task: Task, project: string) =>
  task.project === project ||
  (task.project === "R1/R2 polish" &&
    ["R1 Service robot", "R2 Warehouse robot"].includes(project));
export const isExternalResource = (resource: string) => /^https?:\/\//i.test(resource);
export function PageTitle({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
export function Panel({
  title,
  meta,
  children,
  className = "",
}: {
  title?: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || meta) && (
        <div className="panel-heading">
          {title && <h2>{title}</h2>}
          {meta}
        </div>
      )}
      {children}
    </section>
  );
}
export function ProgressBar({
  value,
  color = "violet",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div className={`progress-track ${color}`}>
      <i style={{ width: `${value}%` }} />
    </div>
  );
}
export function Ring({
  value,
  size = 122,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  return (
    <div
      className="ring"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(var(--lime) ${value * 3.6}deg, var(--line) 0deg)`,
      }}
    >
      <div className="ring-inner">
        <strong>
          {value}
          <small>%</small>
        </strong>
        {label && <span>{label}</span>}
      </div>
    </div>
  );
}
export function StatusPill({
  status,
  onChange,
}: {
  status: Status;
  onChange?: (status: Status) => void;
}) {
  const order: Status[] = ["Not started", "In progress", "Done"];
  return onChange ? (
    <select
      className={`status-select status-${slugify(status)}`}
      value={status}
      onChange={(event) => onChange(event.target.value as Status)}
      aria-label="Task status"
    >
      {order.map((item) => (
        <option key={item}>{item}</option>
      ))}
    </select>
  ) : (
    <span className={`status-badge status-${slugify(status)}`}>{status}</span>
  );
}
export function TaskRow({ task, compact = false }: { task: Task; compact?: boolean }) {
  const updateTask = useRoadmap((state) => state.updateTask);
  return (
    <div className={`task-row${compact ? " compact" : ""}`}>
      <button
        className={`task-check ${task.status === "Done" ? "checked" : ""}`}
        aria-label={`Mark ${task.topic} ${task.status === "Done" ? "not done" : "done"}`}
        onClick={() =>
          updateTask(task.id, {
            status: task.status === "Done" ? "Not started" : "Done",
          })
        }
      >
        {task.status === "Done" && <Check size={13} />}
      </button>
      <Link to={`/task/${task.id}`} className="task-main">
        <span className="task-title">{task.topic}</span>
        <span className="task-subline">
          <span className={`track-dot ${trackClass[task.track]}`} />
          {task.track}
          <span className="dot-sep">·</span>
          {task.project}
        </span>
      </Link>
      <span className="task-week">W{String(task.week).padStart(2, "0")}</span>
      {!compact && (
        <StatusPill
          status={task.status}
          onChange={(status) => updateTask(task.id, { status })}
        />
      )}
    </div>
  );
}
export function KanbanColumn({ status, tasks }: { status: Status; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? "drag-over" : ""}`}
    >
      <div className="kanban-heading">
        <span className={`status-dot ${slugify(status)}`} />
        {status}
        <b>{tasks.length}</b>
      </div>
      {tasks.map((task) => (
        <DraggableTask task={task} key={task.id} />
      ))}
    </div>
  );
}
export function DraggableTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });
  return (
    <Link
      ref={setNodeRef}
      to={`/task/${task.id}`}
      className={`kanban-card${isDragging ? " dragging" : ""}`}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` }
          : undefined
      }
      {...listeners}
      {...attributes}
    >
      <span className="mono">{task.id}</span>
      <strong>{task.topic}</strong>
      <span className="task-subline">
        <span className={`track-dot ${trackClass[task.track]}`} />
        {task.track} · W{task.week}
      </span>
    </Link>
  );
}
export function DetailField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="detail-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
export function WeeklyReviewForm({
  review,
  onChange,
  nextTasks,
}: {
  review: Review;
  onChange: (review: Review) => void;
  nextTasks: Task[];
}) {
  const [prefilled, setPrefilled] = useState(false);
  return (
    <Panel
      title="Weekly review"
      meta={<span className="tag muted-tag">AUTO-SAVED</span>}
      className="review-form"
    >
      <label className="field-label">
        Hours invested
        <input
          type="number"
          min="0"
          step="0.5"
          value={review.hoursSpent}
          onChange={(event) =>
            onChange({ ...review, hoursSpent: Number(event.target.value) })
          }
        />
      </label>
      <label className="field-label">
        What did I finish?
        <textarea
          value={review.whatIFinished}
          onChange={(event) =>
            onChange({ ...review, whatIFinished: event.target.value })
          }
          placeholder="The thing I am proud of..."
        />
      </label>
      <label className="field-label">
        What blocked me?
        <textarea
          value={review.whatBlockedMe}
          onChange={(event) =>
            onChange({ ...review, whatBlockedMe: event.target.value })
          }
          placeholder="Name the friction; make it actionable."
        />
      </label>
      <label className="review-check">
        <input
          type="checkbox"
          checked={review.postedThisWeek}
          onChange={(event) =>
            onChange({ ...review, postedThisWeek: event.target.checked })
          }
        />{" "}
        I shared a progress update this week
      </label>
      <label className="field-label">
        Next week's goals
        <textarea
          value={review.nextWeeksGoals}
          onChange={(event) =>
            onChange({ ...review, nextWeeksGoals: event.target.value })
          }
          placeholder="Set a small, specific intention..."
        />
      </label>
      <button
        className="button secondary small"
        onClick={() => {
          onChange({
            ...review,
            nextWeeksGoals: nextTasks
              .map((task) => `- ${task.topic}`)
              .join("\n"),
          });
          setPrefilled(true);
        }}
      >
        <WandSparkles size={14} /> Prefill from unfinished tasks
      </button>
      {prefilled && (
        <span className="inline-confirm">
          Goals drafted from next week's plan.
        </span>
      )}
    </Panel>
  );
}
export const trackSummary: Record<Track, string> = {
  "AI/ML":
    "Build sound machine learning foundations, then ship models that solve real problems.",
  Robotics:
    "Make intelligent machines move, perceive, and interact with the world.",
  "Design/Web":
    "Turn your technical work into clear, accessible experiences people can use.",
  "Video/Social":
    "Show the process behind your projects and build a visible trail of progress.",
  Resume:
    "Translate your work into a portfolio and story that opens the next door.",
};
export const projectDescription: Record<string, string> = {
  "R1 Service robot":
    "A helpful mobile robot built around robust perception and navigation.",
  "R2 Warehouse robot":
    "A logistics prototype for efficient and safe warehouse movement.",
  "R3 Medical arm":
    "A precision manipulation concept grounded in human-centered design.",
  "R4 Humanoid RL":
    "A simulated humanoid learning to move through reinforcement learning.",
  "H2 Thermal CNN-Transformer":
    "A hybrid architecture for learning from thermal imagery.",
  "H4 RAG + LoRA":
    "A compact, grounded language model application with retrieval.",
  "H5 Paper reproduction":
    "A careful reproduction that makes a research result trustworthy.",
};
export function Metric({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="metric panel">
      <span>{label}</span>
      <strong>
        {value}
        {suffix}
      </strong>
    </div>
  );
}
export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <CircleHelp size={19} />
      </div>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}
export function NotFound() {
  return (
    <div className="not-found">
      <span className="eyebrow">404 / OFF THE MAP</span>
      <h1>This route isn't in the plan.</h1>
      <p>The page may have moved, or this item has not been added yet.</p>
      <Link className="button primary" to="/">
        Back to overview <ArrowLeft size={15} />
      </Link>
    </div>
  );
}
export function PageSkeleton() {
  return <div className="page-skeleton" aria-label="Loading page"><i /><i /><i /></div>;
}
