import { Gauge } from "lucide-react";
import { useRoadmap } from "../store";
import { completionByWeek, elapsedWeeksSince, finishForecast, weeklyVelocity } from "../metrics";
import { DeferredChart, tracks, taskProgress, currentWeek, PageTitle, Panel, Metric } from "../components/shared";

function Analytics() {
  const tasks = useRoadmap((state) => state.tasks);
  const reviews = useRoadmap((state) => state.reviews);
  const startDate = useRoadmap((state) => state.startDate);
  const completed = tasks.filter((task) => task.status === "Done");
  const byWeek = completionByWeek(tasks, startDate).map((item) => ({
    week: `W${String(item.week).padStart(2, "0")}`,
    done: item.total,
    velocity: item.completed,
  }));
  const current = currentWeek(startDate);
  const elapsedWeeks = elapsedWeeksSince(startDate);
  const avgVelocity = weeklyVelocity(completed.length, elapsedWeeks);
  const forecast = finishForecast(startDate, tasks.length, completed.length, avgVelocity);
  const byTrack = tracks.map((track) => ({
    track,
    done: completed.filter((task) => task.track === track).length,
  }));
  const planExpected = Math.round((tasks.length * current) / 24);
  const isAhead = completed.length >= planExpected;
  return (
    <>
      <PageTitle
        eyebrow="MEASURE WHAT MATTERS"
        title="Analytics"
        subtitle="Use the signal to choose the next meaningful move."
      />
      <div className="stats-row">
        <Metric label="Completion" value={taskProgress(tasks)} suffix="%" />
        <Metric
          label="Weekly velocity"
          value={Number(avgVelocity.toFixed(1))}
          suffix=" / wk"
        />
        <Metric
          label="Hours invested"
          value={Object.values(reviews).reduce(
            (sum, item) => sum + item.hoursSpent,
            0,
          )}
          suffix="h"
        />
        <div
          className={`metric panel schedule-metric ${isAhead ? "ahead" : "behind"}`}
        >
          <span>Plan pace</span>
          <strong>{isAhead ? "Ahead" : "Behind"}</strong>
          <small>
            {completed.length} done · {planExpected} expected by now
          </small>
        </div>
      </div>
      <div className="analytics-grid">
        <Panel title="Completion over time" className="analytics-chart">
          <div className="chart-wrap tall">
            <DeferredChart kind="completion" data={byWeek} />
          </div>
        </Panel>
        <Panel title="Tasks by track" className="track-chart">
          <div className="chart-wrap tall">
            <DeferredChart kind="tracks" data={byTrack} />
          </div>
        </Panel>
        <Panel title="Weekly velocity" className="velocity-chart">
          <div className="chart-wrap tall">
            <DeferredChart kind="velocity" data={byWeek} />
          </div>
        </Panel>
        <Panel title="Finish forecast" className="forecast-panel">
          <div className="forecast-icon">
            <Gauge size={20} />
          </div>
          <span className="eyebrow">AT CURRENT PACE</span>
          <strong>
            {forecast.projectedDate
              ? new Date(`${forecast.projectedDate}T00:00:00`).toLocaleDateString()
              : "Not enough data"}
          </strong>
          <p>
            {avgVelocity
              ? `Plan target: ${new Date(`${forecast.planDate}T00:00:00`).toLocaleDateString()}. Current velocity: ${avgVelocity.toFixed(1)} tasks per elapsed week.`
              : "Mark a few tasks done to unlock a useful forecast."}
          </p>
        </Panel>
      </div>
    </>
  );
}

export default Analytics;
