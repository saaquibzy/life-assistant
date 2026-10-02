import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useRoadmap } from "../store";
import { projects, taskProgress, prettyWeek, slugify, belongsToProject, PageTitle, Panel, Ring, TaskRow, projectDescription, EmptyState, NotFound } from "../components/shared";

function ProjectDetail() {
  const { slug = "" } = useParams();
  const project = projects.find((item) => slugify(item) === slug);
  const tasks = useRoadmap((state) => state.tasks);
  const projectLinks = useRoadmap((state) => state.projectLinks);
  const setProjectLinks = useRoadmap((state) => state.setProjectLinks);
  if (!project) return <NotFound />;
  const items = tasks.filter((task) => belongsToProject(task, project));
  const links = projectLinks[project] ?? { github: "", demo: "", live: "" };
  const weeks = [...new Set(items.map((task) => task.week))].sort(
    (a, b) => a - b,
  );
  return (
    <>
      <Link to="/projects" className="back-link">
        <ArrowLeft size={15} /> Projects
      </Link>
      <PageTitle
        eyebrow="PROJECT / MILESTONE PLAN"
        title={project}
        subtitle={projectDescription[project]}
        action={<Ring size={76} value={taskProgress(items)} />}
      />
      <div className="project-detail-grid">
        <div>
          <Panel title="Task checklist">
            {items.length ? (
              items.map((task) => <TaskRow task={task} key={task.id} />)
            ) : (
              <EmptyState
                title="No milestones loaded yet"
                text="Add project tasks to data/tasks.json to build this checklist."
              />
            )}
          </Panel>
          <Panel title="Milestone timeline">
            <div className="milestones">
              {weeks.length ? (
                weeks.map((week) => (
                  <Link to={`/weeks/${week}`} key={week}>
                    <span className="milestone-marker" />
                    <span>
                      <small>{prettyWeek(week)}</small>
                      <strong>
                        {items
                          .filter((task) => task.week === week)
                          .map((task) => task.topic)
                          .join(" · ")}
                      </strong>
                    </span>
                    <ArrowUpRight size={14} />
                  </Link>
                ))
              ) : (
                <EmptyState
                  title="Timeline will appear here"
                  text="Milestones are grouped by their planned week."
                />
              )}
            </div>
          </Panel>
        </div>
        <Panel title="Project links" className="project-links-panel">
          <p className="muted">Keep the shipped work one click away.</p>
          {(
            [
              ["github", "GitHub repository"],
              ["demo", "Demo video"],
              ["live", "Live project"],
            ] as const
          ).map(([key, label]) => (
            <label className="field-label" key={key}>
              {label}
              <input
                type="url"
                placeholder="https://"
                value={links[key]}
                onChange={(event) =>
                  setProjectLinks(project, {
                    ...links,
                    [key]: event.target.value,
                  })
                }
              />
            </label>
          ))}
        </Panel>
      </div>
    </>
  );
}

export default ProjectDetail;
