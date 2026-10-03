import { useEffect, useMemo, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { ArrowLeft, RotateCcw, Play, SkipForward, Check, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageTitle, Panel, topics } from '../components/shared'
import { getBlockingParents, isUnlocked } from '../lib/roadmap'
import { buildStepDeck, isSkippedToday, resolveSwipe, swipeAction } from '../lib/swipe'
import { useRoadmap } from '../store'

type UndoEntry = { kind: 'topic'; topic: string; queue: string[] } | { kind: 'step'; taskId: string; previousSkippedAt: string | null }
const localDay = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
const icon: Record<string,string> = { bot:'🤖', brain:'🧠', sparkles:'✨', palette:'🎨', layout:'▦', video:'▶', briefcase:'▣' }

export default function SwipePage() {
  const state = useRoadmap(); const navigate = useNavigate(); const reduceMotion = useReducedMotion()
  const dragX = useMotionValue(0); const rotate = useTransform(dragX,[-220,0,220],[-11,0,11]); const startOpacity = useTransform(dragX,[0,75,140],[0,0.35,1]); const skipOpacity = useTransform(dragX,[-140,-75,0],[1,0.35,0])
  const [stage, setStage] = useState<'topics'|'steps'>('topics'); const [topicQueue, setTopicQueue] = useState<string[]>([]); const [queueInitialized, setQueueInitialized] = useState(false); const [topicName, setTopicName] = useState(''); const [stepIndex, setStepIndex] = useState(0); const [flipped, setFlipped] = useState(false); const [undo, setUndo] = useState<UndoEntry[]>([]); const [refreshDate, setRefreshDate] = useState(localDay())
  const [flyDirection, setFlyDirection] = useState<'left'|'right'|null>(null)
  const date = localDay()
  useEffect(() => { if (date !== refreshDate) setRefreshDate(date) }, [date, refreshDate])
  const availableTopics = useMemo(() => topics.filter(topic => state.tasks.some(task => task.topic === topic.name && task.status !== 'done' && task.status !== 'parked' && !isSkippedToday(task, refreshDate) && isUnlocked(task,{tasks:state.tasks}))), [state.tasks, refreshDate])
  useEffect(() => { if (stage === 'topics' && !queueInitialized) { setTopicQueue(availableTopics.map(t => t.name)); setQueueInitialized(true) } }, [availableTopics, stage, queueInitialized])
  const currentTopic = topicQueue[0]
  const stepDeck = useMemo(() => buildStepDeck(state.tasks, topicName, refreshDate), [state.tasks, topicName, refreshDate])
  const currentTask = stepDeck[stepIndex]
  const skippedToday = state.tasks.filter(task => isSkippedToday(task, refreshDate) && task.status !== 'done' && task.status !== 'parked')

  const buzz = () => { if (navigator.vibrate) navigator.vibrate(18) }
  const enterTopic = (name: string) => { setUndo(entries => [...entries, { kind:'topic', topic:name, queue:topicQueue }]); setTopicQueue(queue=>queue[0]===name?queue.slice(1):queue.filter(item=>item!==name)); setTopicName(name); setStepIndex(0); setFlipped(false); setStage('steps') }
  const skipTopic = () => { if (!currentTopic) return; setUndo(entries => [...entries, {kind:'topic', topic:currentTopic, queue:topicQueue}]); setTopicQueue(queue => [...queue.slice(1), queue[0]]); buzz() }
  const skipCurrentStep = () => { if (!currentTask) return; setUndo(entries => [...entries,{kind:'step',taskId:currentTask.id,previousSkippedAt:currentTask.skippedAt}]); state.updateTask(currentTask.id,{skippedAt:refreshDate}); setFlipped(false); buzz() }
  const startTask = (id: string) => {
    const active = useRoadmap.getState().timerSessions.find(s => s.id === useRoadmap.getState().activeSessionId)
    if (active && active.taskId !== id) { const old = useRoadmap.getState().tasks.find(t=>t.id===active.taskId); if (!window.confirm(`Pause ${old?.id ?? active.taskId} and start ${id}?`)) return; useRoadmap.getState().pauseTask(active.taskId) }
    if (useRoadmap.getState().startTask(id)) { buzz(); navigate(`/focus/${id}`); return true }
    return false
  }
  const startCurrentStep = () => currentTask ? startTask(currentTask.id) : false
  const undoLast = () => {
    const entry = undo.at(-1); if (!entry) return
    setUndo(items=>items.slice(0,-1))
    if (entry.kind==='topic') { setStage('topics'); setTopicQueue(entry.queue); setTopicName(''); setStepIndex(0) }
    else { const task=useRoadmap.getState().tasks.find(t=>t.id===entry.taskId); if(task) useRoadmap.getState().updateTask(entry.taskId,{skippedAt:entry.previousSkippedAt}) }
    setFlipped(false)
  }
  const applySwipeAction = (action: ReturnType<typeof swipeAction>) => {
    if (action === 'defer-topic') skipTopic()
    else if (action === 'choose-topic' && currentTopic) { buzz(); enterTopic(currentTopic) }
    else if (action === 'skip-step') skipCurrentStep()
    else if (action === 'start-step') startCurrentStep()
  }
  const swipe = (direction:'left'|'right') => applySwipeAction(swipeAction(stage,direction))
  const handleDragEnd = async (offset: number, velocity: number) => {
    const direction=resolveSwipe(offset,velocity); if(direction==='none')return
    const action=swipeAction(stage,direction)
    if(action==='start-step') { if(!startCurrentStep())setFlyDirection(null); return }
    setFlyDirection(direction); await new Promise(resolve=>window.setTimeout(resolve,170)); applySwipeAction(action); setFlyDirection(null); dragX.set(0)
  }
  useEffect(() => { const onKey=(event:KeyboardEvent)=>{ if (['INPUT','TEXTAREA','SELECT'].includes((event.target as HTMLElement).tagName)) return; if(event.key==='ArrowLeft') { event.preventDefault(); swipe('left') } else if(event.key==='ArrowRight') { event.preventDefault(); swipe('right') } else if(event.key.toLowerCase()==='z') undoLast() }; window.addEventListener('keydown',onKey); return()=>window.removeEventListener('keydown',onKey) })

  const topicCards = topicQueue.map(name=>topics.find(topic=>topic.name===name)).filter((t):t is typeof topics[number]=>Boolean(t))
  const topic = currentTopic && topics.find(t=>t.name===currentTopic)
  const topicTasks = topic ? state.tasks.filter(t=>t.topic===topic.name) : []
  const topicHoursLeft = topicTasks.filter(t=>!t.optional&&t.status!=='done').reduce((sum,t)=>sum+t.budgetHours,0)
  const unlockedCount = topicTasks.filter(t=>t.status!=='done'&&t.status!=='parked'&&!isSkippedToday(t,refreshDate)&&isUnlocked(t,{tasks:state.tasks})).length
  const blocking = currentTask ? getBlockingParents(currentTask,state.tasks) : []

  return <>
    <PageTitle eyebrow="SWIPE MODE" title={stage==='topics'?'Choose a topic':topicName} subtitle={stage==='topics'?'Swipe right to work on a topic, left to put it at the back.':'Choose an unlocked step. Optional steps are last.'}/>
    {stage==='topics' ? <section className="swipe-deck" aria-label="Topic deck">
      {topicCards[1]&&<div className="swipe-next-peek"><small>NEXT</small><strong>{topicCards[1].name}</strong></div>}
      {topic ? <motion.article key={topic.name} className="swipe-card topic-swipe-card" style={{...({'--topic-color':topic.color} as React.CSSProperties),x:dragX,rotate}} drag={!reduceMotion?'x':false} dragConstraints={{left:0,right:0}} dragElastic={0.8} onDragEnd={(_,info)=>void handleDragEnd(info.offset.x,info.velocity.x)} animate={flyDirection?{x:flyDirection==='right'?640:-640,opacity:0}:{x:0,opacity:1}}>
        <motion.span style={{opacity:startOpacity}} className="swipe-stamp start-stamp">START</motion.span><motion.span style={{opacity:skipOpacity}} className="swipe-stamp skip-stamp">NOT NOW</motion.span><div className="swipe-topic-icon">{icon[topic.icon]??'✦'}</div><span className="eyebrow">{topic.code} · TOPIC</span><h2>{topic.name}</h2><p>{topic.description}</p><div className="swipe-topic-stats"><span>Core hours left<strong>{topicHoursLeft.toFixed(1)} h</strong></span><span>Unlocked<strong>{unlockedCount}</strong></span></div>
      </motion.article> : <div className="swipe-empty"><strong>Nothing left</strong><span>All available topics have been passed.</span></div>}
    </section> : <section className="swipe-deck" aria-label="Step deck">
      {stepDeck[stepIndex+1]&&<div className="swipe-next-peek"><small>NEXT STEP</small><strong>{stepDeck[stepIndex+1].id}</strong><span>{stepDeck[stepIndex+1].step}</span></div>}
      {currentTask ? <motion.article key={currentTask.id} className={`swipe-card step-swipe-card${flipped?' flipped':''}`} style={{x:dragX,rotate}} drag={!reduceMotion?'x':false} dragConstraints={{left:0,right:0}} dragElastic={0.8} onDragEnd={(_,info)=>void handleDragEnd(info.offset.x,info.velocity.x)} animate={flyDirection?{x:flyDirection==='right'?640:-640,opacity:0}:{x:0,opacity:1}} onClick={()=>setFlipped(value=>!value)}>
        <motion.span style={{opacity:startOpacity}} className="swipe-stamp start-stamp">START</motion.span><motion.span style={{opacity:skipOpacity}} className="swipe-stamp skip-stamp">SKIP</motion.span>{!flipped ? <><div className="swipe-card-top"><span>{currentTask.id}</span><span>{currentTask.budgetHours} h budget</span></div><h2>{currentTask.step}</h2><p className="swipe-group">{currentTask.group} · {currentTask.optional?'Optional':'Core'}</p><div className="swipe-needs"><Check size={15}/>{blocking.length===0?'Needs satisfied':`${blocking.length} prerequisite${blocking.length===1?'':'s'} incomplete`}</div><button className="swipe-flip" onClick={event=>{event.stopPropagation();setFlipped(true)}}><Info size={15}/>Tap for notes and details</button></> : <div className="swipe-back"><span className="eyebrow">{currentTask.id} · DETAILS</span><h3>Done when</h3><p>{currentTask.doneWhen||'No completion criteria provided.'}</p><h3>Needs</h3><p>{blocking.length?blocking.map(t=>t.id).join(', '):'All prerequisites satisfied'}</p><h3>Notes</h3><p>{currentTask.notes||'No notes yet.'}</p><button className="swipe-flip" onClick={event=>{event.stopPropagation();setFlipped(false)}}>Back to step</button></div>}
      </motion.article> : <div className="swipe-empty"><strong>Nothing left</strong><span>No unlocked steps remain in this topic.</span></div>}
      <button className="swipe-back-link" onClick={()=>{setStage('topics');setTopicName('');setStepIndex(0)}}><ArrowLeft size={14}/>Topics</button>
    </section>}
    <div className="swipe-controls"><button className="button secondary" onClick={()=>swipe('left')} disabled={stage==='topics'?!currentTopic:!currentTask}><SkipForward size={16}/>{stage==='topics'?'Not now':'Skip for now'}</button><button className="button secondary" onClick={undoLast} disabled={!undo.length}><RotateCcw size={16}/>Undo</button><button className="button primary" onClick={()=>swipe('right')} disabled={stage==='topics'?!currentTopic:!currentTask}><Play size={16}/>{stage==='topics'?'Work on topic':'Start step'}</button></div>
    {skippedToday.length>0&&<Panel title="Review skipped" className="swipe-skipped" meta={<span className="tag muted-tag">{skippedToday.length}</span>}>{skippedToday.map(task=><div className="swipe-skipped-row" key={task.id}><span><strong>{task.id}</strong> · {task.step}</span><button className="button secondary" onClick={()=>{state.updateTask(task.id,{skippedAt:null});setTopicQueue(queue=>queue.includes(task.topic)?queue:[...queue,task.topic])}}>Un-skip</button><button className="button primary" onClick={()=>{if(startTask(task.id))state.updateTask(task.id,{skippedAt:null})}}>Start</button></div>)}</Panel>}
    {stage==='topics'&&<div className="swipe-topic-count" aria-hidden="true">{topicCards.length} topics in this pass</div>}
  </>
}
