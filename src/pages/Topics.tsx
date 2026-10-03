import { PageTitle, TopicCard, topics } from '../components/shared'
import { useRoadmap } from '../store'

export default function TopicsPage() {
  const tasks = useRoadmap((state) => state.tasks)
  return <>
    <PageTitle eyebrow="TOPIC INDEX" title="Topics" subtitle="Seven workstreams, each with its own groups, gates, and core-hour budget." />
    <section className="topic-card-grid topic-index-grid">{topics.map((topic) => <TopicCard key={topic.slug} topic={topic} tasks={tasks} />)}</section>
  </>
}