import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useRoadmap } from "../store";
import { phases, phaseRange, weekProgress, currentWeek, prettyWeek, PageTitle, ProgressBar, Ring } from "../components/shared";

function Weeks() {
  const tasks = useRoadmap((state) => state.tasks);
  const start = useRoadmap((state) => state.startDate);
  const current = currentWeek(start);
  return (
    <>
      <PageTitle
        eyebrow="PLAN IN SPRINTS"
        title="Week planner"
        subtitle="Twenty-four focused chapters. One deliberate step at a time."
      />
      <div className="phase-strip">
        {phases.map((phase, index) => (
          <Link to={`/phases/${index + 1}`} key={phase}>
            <span>0{index + 1}</span>
            <strong>{phase}</strong>
            <small>Weeks {phaseRange(index + 1).join("–")}</small>
          </Link>
        ))}
      </div>
      <div className="weeks-grid">
        {Array.from({ length: 24 }, (_, index) => {
          const n = index + 1;
          const count = tasks.filter((task) => task.week === n).length;
          const value = weekProgress(tasks, n);
          return (
            <Link
              className={`week-card${n === current ? " current" : ""}`}
              to={`/weeks/${n}`}
              key={n}
            >
              <div className="week-card-top">
                <span>{prettyWeek(n)}</span>
                <Ring size={46} value={value} />
              </div>
              <h2>{phases[Math.min(4, Math.ceil(n / 4) - 1)]}</h2>
              <ProgressBar value={value} />
              <div className="week-card-bottom">
                <span>{count} planned tasks</span>
                <span>
                  {value}% <ArrowUpRight size={13} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export default Weeks;
