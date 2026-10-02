import { useState } from "react";
import { ArrowDownToLine, ChevronDown, Download, Moon, Sun, Table2 } from "lucide-react";
import { type Task, useRoadmap } from "../store";
import { exportTasksCsv, importTasksCsv } from "../taskCsv";
import { PageTitle, Panel } from "../components/shared";

function SettingsPage() {
  const theme = useRoadmap((state) => state.theme);
  const startDate = useRoadmap((state) => state.startDate);
  const paused = useRoadmap((state) => state.pausedWeeks);
  const state = useRoadmap();
  const [message, setMessage] = useState("");
  const exportData = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            tasks: state.tasks,
            reviews: state.reviews,
            theme,
            startDate,
            pausedWeeks: paused,
            projectLinks: state.projectLinks,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "roadmap-tracker-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  };
  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      if (file.name.toLowerCase().endsWith(".csv")) {
        const tasks = importTasksCsv(await file.text());
        state.importData({ tasks });
        setMessage(`${tasks.length} CSV tasks imported.`);
      } else {
        const parsed = JSON.parse(await file.text());
        if (!Array.isArray(parsed.tasks) || !parsed.tasks.every((task: Partial<Task>) => task.id !== undefined && task.week && task.track && task.status)) {
          throw new Error("That file does not look like a roadmap backup.");
        }
        state.importData(parsed);
        setMessage("Backup imported successfully.");
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not read that backup.",
      );
    }
  };
  const exportCsv = () => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([exportTasksCsv(state.tasks)], { type: "text/csv" }));
    link.download = "roadmap-tasks.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };
  return (
    <>
      <PageTitle
        eyebrow="MAKE THE PLAN YOURS"
        title="Settings"
        subtitle="Adjust your timeline and keep your data portable."
      />
      <div className="settings-grid">
        <Panel title="Appearance">
          <div className="setting-row">
            <div>
              <strong>Color theme</strong>
              <small>Choose the contrast that feels right.</small>
            </div>
            <button
              className="theme-toggle"
              onClick={() =>
                useRoadmap
                  .getState()
                  .setTheme(theme === "dark" ? "light" : "dark")
              }
            >
              {theme === "dark" ? (
                <>
                  <Moon size={15} /> Dark
                </>
              ) : (
                <>
                  <Sun size={15} /> Light
                </>
              )}
              <ChevronDown size={13} />
            </button>
          </div>
        </Panel>
        <Panel title="Plan timeline">
          <label className="field-label">
            Plan start date
            <input
              type="date"
              value={startDate}
              onChange={(event) => state.setStartDate(event.target.value)}
            />
          </label>
          <p className="setting-hint">
            Current week is calculated from this date.
          </p>
          <label className="field-label">
            Pause / shift by exam weeks
            <input
              type="number"
              min="0"
              max="24"
              value={paused}
              onChange={(event) =>
                state.setPausedWeeks(Math.max(0, Number(event.target.value)))
              }
            />
          </label>
          <p className="setting-hint">
            Adding or removing paused weeks shifts the plan start date and every
            derived week and finish-date calculation by the same amount.
          </p>
        </Panel>
        <Panel title="Data portability">
          <p className="muted">
            Your plan and updates are stored locally in this browser. Keep a
            backup before switching devices.
          </p>
          <div className="settings-actions">
            <button className="button secondary" onClick={exportData}>
              <ArrowDownToLine size={15} /> Export JSON
            </button>
            <button className="button secondary" onClick={exportCsv}>
              <Table2 size={15} /> Export CSV
            </button>
            <label className="button secondary file-button">
              <Download size={15} /> Import JSON
              <input
                type="file"
                accept="application/json,.json,text/csv,.csv"
                onChange={(event) => importFile(event.target.files?.[0])}
              />
            </label>
          </div>
          {message && <p className="inline-confirm">{message}</p>}
        </Panel>
        <Panel title="Reset progress" className="danger-panel">
          <p className="muted">
            This removes all task updates, reviews, and project links from this
            browser. Export a backup first.
          </p>
          <button
            className="button danger"
            onClick={() => {
              if (
                window.confirm("Reset all roadmap data stored in this browser?")
              ) {
                state.reset();
                localStorage.removeItem("roadmap-resume-checks");
                setMessage("Roadmap reset to its original task plan.");
              }
            }}
          >
            Reset all data
          </button>
        </Panel>
        <Panel title="Plan data">
          <div className="data-summary">
            <span>Loaded task rows</span>
            <strong>{state.tasks.length}</strong>
          </div>
          <p className="setting-hint">
            Replace <code>data/tasks.json</code> with your full plan. User
            updates are kept separately in the browser store.
          </p>
        </Panel>
      </div>
    </>
  );
}

export default SettingsPage;
