import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCheck, ExternalLink } from "lucide-react";
import { useRoadmap } from "../store";
import { phases, projects, trackClass, prettyWeek, slugify, isExternalResource, PageTitle, Panel, StatusPill, DetailField, NotFound } from "../components/shared";

function TaskDetail() {
  const { id = "" } = useParams();
  const task = useRoadmap((state) =>
    state.tasks.find((item) => item.id === id),
  );
  const updateTask = useRoadmap((state) => state.updateTask);
  const tasks = useRoadmap((state) => state.tasks);
  const index = tasks.findIndex((item) => item.id === id);
  if (!task) return <NotFound />;
  const done = task.status === "Done";
  return (
    <>
      <Link to="/tracker" className="back-link">
        <ArrowLeft size={15} /> All tasks
      </Link>
      <PageTitle
        eyebrow={`${prettyWeek(task.week)} · PHASE ${task.phase}`}
        title={task.topic}
        subtitle={`${task.id} · ${task.project}`}
        action={
          <StatusPill
            status={task.status}
            onChange={(status) => updateTask(task.id, { status })}
          />
        }
      />
      <div className="detail-grid">
        <div className="detail-main">
          <Panel title="Done when">
            <p className="output-text">{task.output}</p>
          </Panel>
          <Panel
            title="Working notes"
            meta={
              <span className="saved-label">
                <span className="live-dot" /> Auto-saved
              </span>
            }
          >
            <textarea
              className="notes-area"
              value={task.notes}
              onChange={(event) =>
                updateTask(task.id, { notes: event.target.value })
              }
              placeholder="Capture an idea, blocker, or useful detail..."
            />
          </Panel>
          <Panel title="Task navigation">
            <div className="task-navigation">
              {tasks[index - 1] ? (
                <Link to={`/task/${tasks[index - 1].id}`}>
                  <ArrowLeft size={15} />
                  <span>
                    <small>PREVIOUS</small>
                    {tasks[index - 1].topic}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {tasks[index + 1] ? (
                <Link className="next-task" to={`/task/${tasks[index + 1].id}`}>
                  <span>
                    <small>NEXT</small>
                    {tasks[index + 1].topic}
                  </span>
                  <ArrowRight size={15} />
                </Link>
              ) : (
                <span />
              )}
            </div>
          </Panel>
        </div>
        <aside className="detail-aside">
          <Panel title="Task status">
            <StatusPill
              status={task.status}
              onChange={(status) => updateTask(task.id, { status })}
            />
            <label className="field-label">Date completed</label>
            <input
              type="date"
              value={task.dateDone}
              onChange={(event) => updateTask(task.id, { dateDone: event.target.value })}
            />
            <button
              className={`button ${done ? "secondary" : "primary"} full-button`}
              onClick={() =>
                updateTask(task.id, {
                  status: done ? "Not started" : "Done",
                  dateDone: done ? "" : new Date().toISOString().slice(0, 10),
                })
              }
            >
              {done ? <CheckCheck size={15} /> : <Check size={15} />}
              {done ? "Completed" : "Mark as done"}
            </button>
          </Panel>
          <Panel title="Plan details">
            <DetailField
              label="Track"
              value={
                <Link to={`/tracks/${slugify(task.track)}`}>
                  <span className={`track-dot ${trackClass[task.track]}`} />{" "}
                  {task.track}
                </Link>
              }
            />
            <DetailField
              label="Project"
              value={
                <Link to={projects.includes(task.project) ? `/projects/${slugify(task.project)}` : "/projects"}>
                  {task.project}
                </Link>
              }
            />
            <DetailField
              label="Week"
              value={
                <Link to={`/weeks/${task.week}`}>
                  {prettyWeek(task.week)} <ArrowUpRight size={12} />
                </Link>
              }
            />
            <DetailField
              label="Phase"
              value={
                <Link to={`/phases/${task.phase}`}>
                  Phase {task.phase}: {phases[task.phase - 1]}
                </Link>
              }
            />
          </Panel>
          {task.resource && (
            <Panel title="Resource">
              {isExternalResource(task.resource) ? (
                <a className="resource-link" href={task.resource} target="_blank" rel="noreferrer">
                  {task.resource} <ExternalLink size={14} />
                </a>
              ) : (
                <p className="output-text">{task.resource}</p>
              )}
            </Panel>
          )}
        </aside>
      </div>
    </>
  );
}

export default TaskDetail;
