import { Link, useParams } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useRoadmap } from "../store";
import { tracks, trackClass, taskProgress, weekProgress, prettyWeek, slugify, PageTitle, Panel, ProgressBar, Ring, TaskRow, trackSummary, EmptyState, NotFound } from "../components/shared";

function TrackPage() {
  const { name = "" } = useParams();
  const track = tracks.find(
    (item) =>
      slugify(item) === name ||
      item.toLowerCase() === decodeURIComponent(name).toLowerCase(),
  );
  const tasks = useRoadmap((state) => state.tasks);
  if (!track) return <NotFound />;
  const items = tasks.filter((task) => task.track === track);
  const weeks = [...new Set(items.map((task) => task.week))].sort(
    (a, b) => a - b,
  );
  return (
    <>
      <div className={`track-hero panel ${trackClass[track]}`}>
        <span className="eyebrow">TRACK / 0{tracks.indexOf(track) + 1}</span>
        <h1>{track}</h1>
        <p>{trackSummary[track]}</p>
        <div className="track-hero-bottom">
          <Ring value={taskProgress(items)} size={68} />
          <span>
            {items.filter((task) => task.status === "Done").length} /{" "}
            {items.length} tasks complete
          </span>
        </div>
      </div>
      <PageTitle
        title="Timeline"
        subtitle="Follow this thread across your 24-week roadmap."
      />
      <div className="phase-timeline">
        {weeks.length ? (
          weeks.map((week) => (
            <section key={week}>
              <Link className="timeline-week" to={`/weeks/${week}`}>
                <span>{prettyWeek(week)}</span>
                <strong>{weekProgress(tasks, week)}%</strong>
                <ProgressBar value={weekProgress(tasks, week)} />
                <ArrowUpRight size={14} />
              </Link>
              <div>
                {items
                  .filter((task) => task.week === week)
                  .map((task) => (
                    <TaskRow task={task} key={task.id} compact />
                  ))}
              </div>
            </section>
          ))
        ) : (
          <Panel>
            <EmptyState
              title="No track tasks yet"
              text="Add this track's plan rows to data/tasks.json."
            />
          </Panel>
        )}
      </div>
    </>
  );
}

export default TrackPage;
