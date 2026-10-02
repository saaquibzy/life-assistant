import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { Download, FolderKanban, ListTodo, Search, Table2, X } from "lucide-react";
import { type Status, type Task, useRoadmap } from "../store";
import { tracks, phases, projectOptions, prettyWeek, PageTitle, StatusPill, TaskRow, KanbanColumn, EmptyState } from "../components/shared";

function Tracker() {
  const tasks = useRoadmap((state) => state.tasks);
  const updateMany = useRoadmap((state) => state.updateMany);
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<"list" | "kanban" | "table">("list");
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const track = params.get("track") ?? "";
  const phase = params.get("phase") ?? "";
  const week = params.get("week") ?? "";
  const status = params.get("status") ?? "";
  const project = params.get("project") ?? "";
  const urlQuery = params.get("q") ?? "";
  const filtered = tasks.filter(
    (task) =>
      (!urlQuery ||
        `${task.id} ${task.topic} ${task.project}`
          .toLowerCase()
          .includes(urlQuery.toLowerCase())) &&
      (!track || task.track === track) &&
      (!phase || task.phase === Number(phase)) &&
      (!week || task.week === Number(week)) &&
      (!status || task.status === status) &&
      (!project || task.project === project),
  );
  const queryTimer = useRef<number | undefined>(undefined);
  useEffect(() => setQuery(urlQuery), [urlQuery]);
  useEffect(() => () => window.clearTimeout(queryTimer.current), []);
  const put = (key: string, value: string) => {
    if (key === "q") {
      window.clearTimeout(queryTimer.current);
      queryTimer.current = window.setTimeout(() => {
        const next = new URLSearchParams(window.location.search);
        value ? next.set("q", value) : next.delete("q");
        setParams(next, { replace: true });
      }, 250);
      return;
    }
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next);
  };
  const grouped = Object.fromEntries(
    (["Not started", "In progress", "Done"] as Status[]).map((item) => [
      item,
      filtered.filter((task) => task.status === item),
    ]),
  ) as Record<Status, Task[]>;
  return (
    <>
      <PageTitle
        eyebrow="YOUR WORK, IN MOTION"
        title="Task tracker"
        subtitle={`${filtered.length} tasks · update status, add a note, keep the plan yours.`}
        action={
          <button
            className="button secondary"
            onClick={() => {
              const blob = new Blob([JSON.stringify(tasks, null, 2)], {
                type: "application/json",
              });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = "roadmap-tasks.json";
              link.click();
              URL.revokeObjectURL(link.href);
            }}
          >
            <Download size={15} /> Export
          </button>
        }
      />
      <section className="panel filter-panel">
        <div className="tracker-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              put("q", event.target.value);
            }}
            placeholder="Search tasks, projects, IDs..."
          />
        </div>
        <select
          value={track}
          onChange={(event) => put("track", event.target.value)}
        >
          <option value="">All tracks</option>
          {tracks.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          value={phase}
          onChange={(event) => put("phase", event.target.value)}
        >
          <option value="">All phases</option>
          {phases.map((item, index) => (
            <option value={index + 1} key={item}>
              Phase {index + 1} · {item}
            </option>
          ))}
        </select>
        <select
          value={week}
          onChange={(event) => put("week", event.target.value)}
        >
          <option value="">All weeks</option>
          {Array.from({ length: 24 }, (_, index) => (
            <option key={index + 1} value={index + 1}>
              {prettyWeek(index + 1)}
            </option>
          ))}
        </select>
        <select
          value={project}
          onChange={(event) => put("project", event.target.value)}
        >
          <option value="">All projects</option>
          {projectOptions.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => put("status", event.target.value)}
        >
          <option value="">All status</option>
          {["Not started", "In progress", "Done"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <div className="view-switch">
          {(
            [
              { id: "list", icon: ListTodo },
              { id: "kanban", icon: FolderKanban },
              { id: "table", icon: Table2 },
            ] as const
          ).map(({ id, icon: Icon }) => (
            <button
              className={view === id ? "selected" : ""}
              onClick={() => setView(id)}
              key={id}
              aria-label={`${id} view`}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </section>
      {selected.length > 0 && (
        <div className="bulk-bar">
          <span>{selected.length} selected</span>
          <select id="bulk-status">
            <option>Not started</option>
            <option>In progress</option>
            <option>Done</option>
          </select>
          <button
            className="button primary small"
            onClick={() => {
              updateMany(
                selected,
                (document.querySelector("#bulk-status") as HTMLSelectElement)
                  .value as Status,
              );
              setSelected([]);
            }}
          >
            Apply status
          </button>
          <button className="icon-button" onClick={() => setSelected([])}>
            <X size={15} />
          </button>
        </div>
      )}
      {view === "list" ? (
        <div className="panel task-list-panel">
          {filtered.length ? (
            filtered.map((task) => (
              <div className="selectable-task" key={task.id}>
                <input
                  type="checkbox"
                  checked={selected.includes(task.id)}
                  onChange={(event) =>
                    setSelected(
                      event.target.checked
                        ? [...selected, task.id]
                        : selected.filter((id) => id !== task.id),
                    )
                  }
                  aria-label={`Select ${task.id}`}
                />
                <TaskRow task={task} />
              </div>
            ))
          ) : (
            <EmptyState
              title="No tasks match"
              text="Try removing one of the filters."
            />
          )}
        </div>
      ) : view === "table" ? (
        <div className="panel table-scroll">
          <table className="task-table">
            <thead>
              <tr>
                <th></th>
                <th>ID</th>
                <th>Task</th>
                <th>Track</th>
                <th>Project</th>
                <th>Week</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => (
                <tr key={task.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(task.id)}
                      onChange={(event) =>
                        setSelected(
                          event.target.checked
                            ? [...selected, task.id]
                            : selected.filter((id) => id !== task.id),
                        )
                      }
                    />
                  </td>
                  <td className="mono">{task.id}</td>
                  <td>
                    <Link to={`/task/${task.id}`}>{task.topic}</Link>
                  </td>
                  <td>{task.track}</td>
                  <td>{task.project}</td>
                  <td>W{String(task.week).padStart(2, "0")}</td>
                  <td>
                    <StatusPill status={task.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <DndContext
          onDragEnd={(event: DragEndEvent) => {
            const id = String(event.active.id);
            const nextStatus = String(event.over?.id ?? "") as Status;
            if (["Not started", "In progress", "Done"].includes(nextStatus))
              updateMany([id], nextStatus);
          }}
        >
          <div className="kanban-grid">
            {(["Not started", "In progress", "Done"] as Status[]).map(
              (column) => (
                <KanbanColumn
                  key={column}
                  status={column}
                  tasks={grouped[column]}
                />
              ),
            )}
          </div>
        </DndContext>
      )}
    </>
  );
}

export default Tracker;
