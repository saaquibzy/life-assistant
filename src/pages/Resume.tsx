import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Check, Github } from "lucide-react";
import { useRoadmap } from "../store";
import { PageTitle, Panel, TaskRow, EmptyState } from "../components/shared";

function Resume() {
  const tasks = useRoadmap((state) =>
    state.tasks.filter((task) => task.track === "Resume"),
  );
  const checks = useRoadmap((state) => state.resumeChecks);
  const setResumeCheck = useRoadmap((state) => state.setResumeCheck);
  useEffect(() => {
    if (Object.keys(checks).length) return;
    try {
      const legacy = JSON.parse(localStorage.getItem("roadmap-resume-checks") ?? "{}");
      for (const [id, value] of Object.entries(legacy)) {
        if (typeof value === "boolean") setResumeCheck(id, value);
      }
      localStorage.removeItem("roadmap-resume-checks");
    } catch {
      localStorage.removeItem("roadmap-resume-checks");
    }
  }, []);
  const setCheck = (id: string, value: boolean) => {
    setResumeCheck(id, value);
  };
  const items = [
    "LinkedIn headline and about section refreshed",
    "GitHub profile README and pinned repositories curated",
    "Portfolio project links tested on mobile and desktop",
    "Resume PDF updated with measurable project outcomes",
  ];
  return (
    <>
      <PageTitle
        eyebrow="MAKE YOUR WORK LEGIBLE"
        title="Resume & portfolio"
        subtitle="The launch checklist for turning your roadmap into a clear professional story."
      />
      <Panel title="Resume track tasks" className="resume-task-panel">
        {tasks.length ? (
          tasks.map((task) => <TaskRow task={task} key={task.id} />)
        ) : (
          <EmptyState
            title="No resume tasks loaded"
            text="Resume track tasks from data/tasks.json will appear here."
          />
        )}
      </Panel>
      <Panel
        title="Portfolio checklist"
        meta={
          <span className="tag muted-tag">
            {Object.values(checks).filter(Boolean).length} / {items.length}{" "}
            READY
          </span>
        }
        className="portfolio-checklist"
      >
        {items.map((item, index) => (
          <label className="checklist-item" key={item}>
            <input
              type="checkbox"
              checked={checks[String(index)] ?? false}
              onChange={(event) =>
                setCheck(String(index), event.target.checked)
              }
            />
            <span>
              <Check size={13} />
            </span>
            {item}
          </label>
        ))}
      </Panel>
      <div className="resume-links">
        <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">
          <span className="link-mark linkedin">in</span>LinkedIn
          <ArrowUpRight size={14} />
        </a>
        <a href="https://github.com" target="_blank" rel="noreferrer">
          <Github size={17} /> GitHub <ArrowUpRight size={14} />
        </a>
        <Link to="/projects">
          <span className="link-mark portfolio-mark">↗</span>Project library{" "}
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </>
  );
}

export default Resume;
