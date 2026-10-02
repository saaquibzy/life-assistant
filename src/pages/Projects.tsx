import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useRoadmap } from "../store";
import { projects, taskProgress, slugify, belongsToProject, PageTitle, ProgressBar, projectDescription } from "../components/shared";

function Projects() {
  const tasks = useRoadmap((state) => state.tasks);
  return (
    <>
      <PageTitle
        eyebrow="FLAGSHIPS & SHIPABLES"
        title="Project library"
        subtitle="A portfolio of proof, built one milestone at a time."
      />
      <div className="projects-grid">
        {projects.map((project, index) => {
          const items = tasks.filter((task) => belongsToProject(task, project));
          const range = items.length
            ? `${Math.min(...items.map((task) => task.week))}–${Math.max(...items.map((task) => task.week))}`
            : "—";
          return (
            <Link
              to={`/projects/${slugify(project)}`}
              className={`project-card panel project-${index % 4}`}
              key={project}
            >
              <div className="project-card-top">
                <span className="project-index">
                  {String(index + 1).padStart(2, "0")} / PROJECT
                </span>
                <ArrowUpRight size={16} />
              </div>
              <span className="project-sigil">{project.split(" ")[0]}</span>
              <h2>{project.replace(/^(R\d|H\d) /, "")}</h2>
              <p>{projectDescription[project]}</p>
              <div className="project-card-bottom">
                <span>Weeks {range}</span>
                <span>{taskProgress(items)}% complete</span>
              </div>
              <ProgressBar value={taskProgress(items)} />
            </Link>
          );
        })}
      </div>
    </>
  );
}

export default Projects;
