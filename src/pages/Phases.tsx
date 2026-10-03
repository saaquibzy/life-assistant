import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { deriveExitGateChecklist, progressByPhase } from '../lib/roadmap'
import { useRoadmap } from '../store'
import { ExitGateChecklist, PageTitle, Panel, ProgressBar } from '../components/shared'
import phaseRows from '../../data/phases.json'

const phaseData = phaseRows as Array<{ phase: number; name: string; gate: string }>

export default function PhasesPage() {
  const state = useRoadmap()
  return <>
    <PageTitle eyebrow="GATES & MILESTONES" title="Phases" subtitle="Core completion and exit-gate checklists across the roadmap." />
    <section className="phase-index-list">{phaseData.map((phase) => {
      const phaseProgress = progressByPhase(state.tasks, phase.phase)
      const value = phaseProgress.percentHours
      const checks = deriveExitGateChecklist(state.tasks, phase.phase, phase.gate, state.gateChecks)
      return <Panel key={phase.phase} className="phase-index-card">
        <Link className="phase-card-heading" to={`/phases/${phase.phase}`}><span>PHASE {phase.phase}</span><strong>{phase.name}</strong><ArrowRight size={14} /></Link>
        <div className="phase-card-progress"><ProgressBar value={value} /><small>{phaseProgress.doneHours.toFixed(1)}/{phaseProgress.totalHours.toFixed(1)} core h · {phaseProgress.doneSteps}/{phaseProgress.totalSteps} steps</small></div>
        <ExitGateChecklist checks={checks} onToggle={state.setGateCheck} />
      </Panel>
    })}</section>
  </>
}