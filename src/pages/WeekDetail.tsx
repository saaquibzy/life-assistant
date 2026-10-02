import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getReview, useRoadmap } from "../store";
import { tracks, phases, weekProgress, prettyWeek, PageTitle, Panel, Ring, TaskRow, WeeklyReviewForm, EmptyState } from "../components/shared";

function WeekDetail() {
  const { n = "1" } = useParams();
  const week = Math.max(1, Math.min(24, Number(n)));
  const tasks = useRoadmap((state) => state.tasks);
  const reviews = useRoadmap((state) => state.reviews);
  const saveReview = useRoadmap((state) => state.saveReview);
  const review = getReview(reviews, week);
  const thisWeekTasks = tasks.filter((task) => task.week === week);
  const nextTasks = tasks.filter(
    (task) => task.week === week + 1 && task.status !== "Done",
  );
  const groups = tracks
    .map((track) => ({
      track,
      tasks: thisWeekTasks.filter((task) => task.track === track),
    }))
    .filter((group) => group.tasks.length);
  return (
    <>
      <Link to="/weeks" className="back-link">
        <ArrowLeft size={15} /> All weeks
      </Link>
      <PageTitle
        eyebrow={`PHASE ${Math.min(5, Math.ceil(week / 4))} · ${phases[Math.min(4, Math.ceil(week / 4) - 1)].toUpperCase()}`}
        title={prettyWeek(week)}
        subtitle="Make space for the work, then capture what you learned."
        action={
          <div className="page-stepper">
            {week > 1 && (
              <Link to={`/weeks/${week - 1}`}>
                <ArrowLeft size={15} />
              </Link>
            )}
            {week < 24 && (
              <Link to={`/weeks/${week + 1}`}>
                <ArrowRight size={15} />
              </Link>
            )}
          </div>
        }
      />
      <div className="week-summary">
        <Ring size={82} value={weekProgress(tasks, week)} />
        <div>
          <span className="eyebrow">WEEKLY PROGRESS</span>
          <strong>
            {thisWeekTasks.filter((task) => task.status === "Done").length} of{" "}
            {thisWeekTasks.length} tasks complete
          </strong>
          <p>
            {weekProgress(tasks, week) === 100
              ? "Week complete. Take a moment to mark the win."
              : "Keep your focus on the next useful deliverable."}
          </p>
        </div>
      </div>
      <div className="week-detail-grid">
        <div>
          {groups.length ? (
            groups.map(({ track, tasks: groupTasks }) => (
              <Panel title={track} key={track} className="week-task-panel">
                {groupTasks.map((task) => (
                  <TaskRow task={task} key={task.id} />
                ))}
              </Panel>
            ))
          ) : (
            <Panel>
              <EmptyState
                title="No tasks scheduled"
                text="Your imported plan has no tasks for this week yet."
              />
            </Panel>
          )}
        </div>
        <WeeklyReviewForm
          review={review}
          onChange={(next) => saveReview(week, next)}
          nextTasks={nextTasks}
        />
      </div>
    </>
  );
}

export default WeekDetail;
