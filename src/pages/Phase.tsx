import { Link, useParams } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useRoadmap } from "../store";
import { phases, phaseRange, taskProgress, weekProgress, prettyWeek, PageTitle, ProgressBar, Ring, TaskRow, NotFound } from "../components/shared";

function PhasePage() {
  const { id = "" } = useParams();
  const phase = Number(id);
  const tasks = useRoadmap((state) => state.tasks);
  const [from, to] = phaseRange(phase);
  if (!phases[phase - 1]) return <NotFound />;
  const items = tasks.filter((task) => task.phase === phase);
  return (
    <>
      <PageTitle
        eyebrow={`PHASE ${String(phase).padStart(2, "0")} · WEEKS ${from}–${to}`}
        title={phases[phase - 1]}
        subtitle={
          [
            "Build the basics and create a steady rhythm.",
            "Turn fundamentals into working prototypes.",
            "Go deep on a research-grade flagship.",
            "Make useful models real, accessible products.",
            "Polish, publish, and make your work legible.",
          ][phase - 1]
        }
        action={<Ring size={74} value={taskProgress(items)} />}
      />
      <div className="phase-timeline">
        {Array.from({ length: to - from + 1 }, (_, index) => {
          const week = from + index;
          return (
            <section key={week}>
              <Link className="timeline-week" to={`/weeks/${week}`}>
                <span>{prettyWeek(week)}</span>
                <strong>{weekProgress(tasks, week)}%</strong>
                <ProgressBar value={weekProgress(tasks, week)} />
                <ArrowUpRight size={14} />
              </Link>
              <div>
                {tasks
                  .filter((task) => task.week === week)
                  .map((task) => (
                    <TaskRow task={task} key={task.id} compact />
                  ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

export default PhasePage;
