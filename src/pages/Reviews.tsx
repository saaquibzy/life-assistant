import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Timer } from "lucide-react";
import { getReview, useRoadmap } from "../store";
import { postingSummary } from "../metrics";
import { DeferredChart, taskProgress, currentWeek, prettyWeek, PageTitle, Panel, ProgressBar, Metric, EmptyState } from "../components/shared";

function Reviews() {
  const reviews = useRoadmap((state) => state.reviews);
  const tasks = useRoadmap((state) => state.tasks);
  const rows = Array.from({ length: 24 }, (_, index) => ({
    week: index + 1,
    ...(reviews[index + 1] ?? getReview(reviews, index + 1)),
  })).filter(
    (review) =>
      review.hoursSpent ||
      review.whatIFinished ||
      review.whatBlockedMe ||
      review.postedThisWeek ||
      review.nextWeeksGoals,
  );
  const chart = Array.from({ length: 24 }, (_, index) => ({
    week: `W${String(index + 1).padStart(2, "0")}`,
    hours: reviews[index + 1]?.hoursSpent ?? 0,
  }));
  const { streak, weeksPosted } = postingSummary(
    reviews,
    currentWeek(useRoadmap.getState().startDate),
  );
  return (
    <>
      <PageTitle
        eyebrow="LOOK BACK, MOVE FORWARD"
        title="Weekly reviews"
        subtitle="A record of the work, friction, and ideas worth carrying ahead."
        action={
          <Link className="button secondary" to="/weeks">
            Open week planner <ArrowRight size={15} />
          </Link>
        }
      />
      <div className="stats-row">
        <Metric
          label="Hours logged"
          value={Object.values(reviews).reduce(
            (sum, item) => sum + item.hoursSpent,
            0,
          )}
          suffix="h"
        />
        <Metric label="Reviews captured" value={rows.length} />
        <Metric label="Weeks posted" value={weeksPosted} />
        <Metric label="Current streak" value={streak} suffix=" wk" />
      </div>
      <Panel title="Hours over time" className="wide-chart">
        <div className="chart-wrap tall">
          <DeferredChart kind="hours" data={chart} />
        </div>
      </Panel>
      <div className="review-timeline">
        <h2>Review timeline</h2>
        {rows.length ? (
          rows
            .sort((a, b) => b.week - a.week)
            .map((review) => (
              <article className="review-entry panel" key={review.week}>
                <Link to={`/weeks/${review.week}`} className="review-week">
                  {prettyWeek(review.week)} <ArrowUpRight size={13} />
                </Link>
                <span className="review-hours">
                  <Timer size={14} /> {review.hoursSpent}h
                </span>
                {review.whatIFinished && (
                  <p>
                    <strong>Finished</strong>
                    {review.whatIFinished}
                  </p>
                )}
                {review.whatBlockedMe && (
                  <p>
                    <strong>Blocked by</strong>
                    {review.whatBlockedMe}
                  </p>
                )}
                {review.postedThisWeek && (
                  <span className="tag green-tag">POSTED THIS WEEK</span>
                )}
              </article>
            ))
        ) : (
          <Panel>
            <EmptyState
              title="Your first review starts here"
              text="Write a weekly reflection from any week page. It will show up here."
            />
          </Panel>
        )}
      </div>
      <Panel title="Plan completion" className="review-task-foot">
        <ProgressBar value={taskProgress(tasks)} />
        <span>{taskProgress(tasks)}% complete across all weeks</span>
      </Panel>
    </>
  );
}

export default Reviews;
