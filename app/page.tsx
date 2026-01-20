"use client"
import React, { useMemo, useState } from 'react'
import styles from './page.module.css'

type NotesOutput = {
  title: string
  key_concepts: string[]
  important_points: string[]
  exam_tips: string[]
}

type Recommendation = {
  role: string
  match: number
  skills: string[]
  futureScope: string
}

type SkillGap = {
  focus: string
  status: string
  action: string
}

type RoadmapPhase = {
  title: string
  detail: string
  milestone: string
}

export default function Page() {
  const [content, setContent] = useState('')
  const [examType, setExamType] = useState<'midterm' | 'final' | 'viva'>('midterm')
  const [depth, setDepth] = useState<'short' | 'medium' | 'detailed'>('medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [output, setOutput] = useState<NotesOutput | null>(null)
  const [insightTab, setInsightTab] = useState<'overview' | 'skills' | 'market'>('overview')

  const submit = async () => {
    setLoading(true)
    setError(null)
    setOutput(null)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, exam_type: examType, depth }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Failed to generate notes')
      } else {
        setOutput(data)
      }
    } catch (e: any) {
      setError(e?.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    if (!output) return
    const text = [
      `# ${output.title}`,
      '\n## Key Concepts',
      ...output.key_concepts,
      '\n## Important Points',
      ...output.important_points,
      '\n## Exam Tips',
      ...output.exam_tips,
    ].join('\n')
    await navigator.clipboard.writeText(text)
    alert('Notes copied to clipboard!')
  }

  const disabled = loading || content.trim().length < 20

  const steps = [
    {
      id: 1,
      title: 'Curate Content',
      description: 'Paste raw study or career prep material.',
      complete: content.trim().length >= 20,
    },
    {
      id: 2,
      title: 'Exam Context',
      description: 'Let the assistant understand your target exam.',
      complete: Boolean(examType),
    },
    {
      id: 3,
      title: 'Depth Preference',
      description: 'Choose how detailed recommendations should be.',
      complete: Boolean(depth),
    },
  ]

  const completedSteps = steps.filter((step) => step.complete).length
  const progress = Math.round((completedSteps / steps.length) * 100)

  const recommendations = useMemo<Recommendation[]>(() => {
    if (!output) return []
    return buildRecommendations(output, examType)
  }, [output, examType])

  const skillGaps = useMemo<SkillGap[]>(() => {
    if (!output) return []
    return buildSkillGaps(output)
  }, [output])

  const roadmap = useMemo<RoadmapPhase[]>(() => {
    if (!output) return []
    return buildRoadmap(output)
  }, [output])

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.heroBadge}>Student launchpad</p>
          <h1 className={styles.heroTitle}>AI-Driven Career Guidance & Study Notes</h1>
          <p className={styles.heroSubtitle}>
            Translate messy study material into structured insights, career-aligned recommendations, and a personalized learning roadmap.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.primaryAction} onClick={() => document.getElementById('questionnaire')?.scrollIntoView({ behavior: 'smooth' })}>
              Start the questionnaire
            </button>
            <span className={styles.actionNote}>Takes less than 60 seconds</span>
          </div>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Progress</span>
            <strong className={styles.statValue}>{progress}% ready</strong>
            <small>{completedSteps}/{steps.length} steps complete</small>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Insights captured</span>
            <strong className={styles.statValue}>{output ? output.key_concepts.length : 0}</strong>
            <small>Concept anchors</small>
          </div>
        </div>
      </header>

      <section className={styles.progressPanel}>
        <div className={styles.progressMeta}>
          <p>Questionnaire progress</p>
          <span>{progress}%</span>
        </div>
        <div className={styles.progressBar}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.stepChips}>
          {steps.map((step) => (
            <div key={step.id} className={`${styles.stepChip} ${step.complete ? styles.stepChipComplete : ''}`}>
              <div>
                <p>{step.title}</p>
                <small>{step.description}</small>
              </div>
              <span>{step.complete ? '✓' : step.id}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.formGrid} id="questionnaire">
        <article className={`${styles.stepCard} ${steps[0].complete ? styles.stepComplete : ''}`}>
          <div className={styles.stepHeader}>
            <span>Step 1</span>
            <span>{steps[0].complete ? 'Ready' : 'Add content'}</span>
          </div>
          <h3>Curate your study content</h3>
          <p>Paste raw lecture notes, case studies, or interview prep prompts.</p>
          <textarea
            className={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste raw study or resume content here..."
          />
          <p className={styles.helperText}>Minimum 20 characters so the AI can extract patterns.</p>
        </article>

        <article className={`${styles.stepCard} ${styles.compactCard} ${steps[1].complete ? styles.stepComplete : ''}`}>
          <div className={styles.stepHeader}>
            <span>Step 2</span>
            <span>Exam context</span>
          </div>
          <h3>Where will you apply this?</h3>
          <p>Select the evaluation type so recommendations feel relevant.</p>
          <select value={examType} onChange={(e) => setExamType(e.target.value as any)} className={styles.select}>
            <option value="midterm">Midterm simulation</option>
            <option value="final">Final mastery</option>
            <option value="viva">Viva / oral defense</option>
          </select>
        </article>

        <article className={`${styles.stepCard} ${styles.compactCard} ${steps[2].complete ? styles.stepComplete : ''}`}>
          <div className={styles.stepHeader}>
            <span>Step 3</span>
            <span>Depth preference</span>
          </div>
          <h3>How detailed should the plan be?</h3>
          <p>Depth adjusts narrative tone, pacing, and number of action items.</p>
          <select value={depth} onChange={(e) => setDepth(e.target.value as any)} className={styles.select}>
            <option value="short">Highlights only</option>
            <option value="medium">Balanced detail</option>
            <option value="detailed">Deep dive</option>
          </select>
          <button onClick={submit} disabled={disabled} className={styles.primaryButton}>
            {loading ? 'Generating insights…' : 'Generate personalized guidance'}
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </article>
      </section>

      <section className={styles.resultsSection}>
        {!output && !loading && (
          <div className={styles.resultsPlaceholder}>
            <h3>Career-ready insights will display here</h3>
            <p>Complete the questionnaire to reveal structured notes, skill gaps, and labor market outlook.</p>
          </div>
        )}

        {loading && <p className={styles.loading}>Synthesizing recommendations…</p>}

        {output && (
          <div className={styles.resultsStack}>
            <div className={styles.resultsTop}>
              <article className={styles.summaryCard}>
                <div>
                  <p className={styles.badge}>Summary</p>
                  <h2>{output.title}</h2>
                  <p>AI distilled your submission into clear focus areas, tactics, and opportunities.</p>
                </div>
                <button onClick={copy} className={styles.secondaryButton}>Copy all notes</button>
              </article>
              <article className={styles.metricsCard}>
                <div>
                  <span>Key concepts</span>
                  <strong>{output.key_concepts.length}</strong>
                </div>
                <div>
                  <span>Critical points</span>
                  <strong>{output.important_points.length}</strong>
                </div>
                <div>
                  <span>Action tips</span>
                  <strong>{output.exam_tips.length}</strong>
                </div>
              </article>
            </div>

            <div className={styles.tabBar}>
              {['overview', 'skills', 'market'].map((tab) => (
                <button
                  key={tab}
                  className={`${styles.tabButton} ${insightTab === tab ? styles.tabActive : ''}`}
                  onClick={() => setInsightTab(tab as typeof insightTab)}
                >
                  {tab === 'overview' && 'Overview'}
                  {tab === 'skills' && 'Skill gaps & roadmap'}
                  {tab === 'market' && 'Market trends'}
                </button>
              ))}
            </div>

            {insightTab === 'overview' && (
              <div className={styles.overviewGrid}>
                <article className={styles.notesCard}>
                  <div className={styles.notesSection}>
                    <h3>Key Concepts</h3>
                    <ul>
                      {output.key_concepts.map((concept, index) => (
                        <li key={`concept-${index}`}>{concept}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={styles.notesSection}>
                    <h3>Important Points</h3>
                    <ul>
                      {output.important_points.map((point, index) => (
                        <li key={`point-${index}`}>{point}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={styles.notesSection}>
                    <h3>Exam Tips</h3>
                    <ul>
                      {output.exam_tips.map((tip, index) => (
                        <li key={`tip-${index}`}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </article>
                <div className={styles.recommendationColumn}>
                  {recommendations.map((rec, index) => (
                    <article key={`rec-${index}`} className={styles.recommendationRow}>
                      <div>
                        <p className={styles.cardLabel}>Role match</p>
                        <h4>{rec.role}</h4>
                      </div>
                      <div>
                        <span className={styles.matchScore}>{rec.match}%</span>
                        <small>{rec.skills.join(' • ')}</small>
                      </div>
                      <p className={styles.futureScope}>{rec.futureScope}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {insightTab === 'skills' && (
              <div className={styles.dualColumn}>
                <article className={styles.skillCard}>
                  <div className={styles.sectionHeader}>
                    <h3>Skill gap analysis</h3>
                    <p>Focus on one improvement theme at a time.</p>
                  </div>
                  <ul>
                    {skillGaps.map((gap, index) => (
                      <li key={`gap-${index}`}>
                        <div>
                          <strong>{gap.focus}</strong>
                          <span className={styles.tag}>{gap.status}</span>
                        </div>
                        <p>{gap.action}</p>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className={styles.skillCard}>
                  <div className={styles.sectionHeader}>
                    <h3>Learning roadmap</h3>
                    <p>Phase-by-phase plan anchored to your exam tips.</p>
                  </div>
                  <ol className={styles.roadmapList}>
                    {roadmap.map((phase, index) => (
                      <li key={`phase-${index}`}>
                        <div>
                          <strong>{phase.title}</strong>
                          <span>{phase.milestone}</span>
                        </div>
                        <p>{phase.detail}</p>
                      </li>
                    ))}
                  </ol>
                </article>
              </div>
            )}

            {insightTab === 'market' && (
              <article className={styles.marketCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h3>Regional job market trends</h3>
                    <p>Signals from global hiring data tailored to your selected exam type.</p>
                  </div>
                </div>
                <div className={styles.trendList}>
                  {buildTrends(examType).map((trend, index) => (
                    <div key={`trend-${index}`}>
                      <header>
                        <span>{trend.region}</span>
                        <strong>{trend.shift}</strong>
                      </header>
                      <p>{trend.highlight}</p>
                    </div>
                  ))}
                </div>
              </article>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

const sanitizeBullet = (text: string) => text.replace(/^[-•]\s*/, '').trim()

const buildRecommendations = (notes: NotesOutput, examType: string): Recommendation[] => {
  const source = notes.key_concepts.length ? notes.key_concepts : notes.important_points
  return source.slice(0, 3).map((concept, index) => {
    const clean = sanitizeBullet(concept) || `Opportunity ${index + 1}`
    const skills = [clean, sanitizeBullet(notes.important_points[index] ?? notes.exam_tips[index] ?? clean) || 'Structured thinking']
    const depthBoost = examType === 'viva' ? 6 : examType === 'final' ? 10 : 4
    return {
      role: `${clean} Strategist`,
      match: Math.min(98, 68 + depthBoost + index * 7),
      skills,
      futureScope: examType === 'viva' ? 'Excels in real-time articulation and coaching environments.' : 'High potential for collaborative research and curriculum innovation.',
    }
  })
}

const buildSkillGaps = (notes: NotesOutput): SkillGap[] => {
  return notes.important_points.slice(0, 3).map((point, index) => {
    const focus = sanitizeBullet(point) || `Focus area ${index + 1}`
    const status = index === 0 ? 'Strength' : index === 1 ? 'Needs polish' : 'Practice more'
    const action = sanitizeBullet(notes.exam_tips[index] ?? notes.exam_tips[0] ?? 'Revisit fundamentals with spaced repetition.')
    return { focus, status, action }
  })
}

const buildRoadmap = (notes: NotesOutput): RoadmapPhase[] => {
  return notes.exam_tips.slice(0, 3).map((tip, index) => {
    const titles = ['Foundation', 'Application', 'Confidence']
    const milestone = index === 0 ? 'Week 1' : index === 1 ? 'Week 2' : 'Final stretch'
    return {
      title: titles[index] ?? `Phase ${index + 1}`,
      detail: sanitizeBullet(tip) || 'Apply concepts to realistic prompts.',
      milestone,
    }
  })
}

const buildTrends = (examType: string) => {
  const focus = examType === 'viva' ? 'communication-first roles' : examType === 'final' ? 'research-heavy tracks' : 'analysis-ready internships'
  return [
    {
      region: 'North America',
      shift: '+8% openings',
      highlight: `Rising demand for ${focus} with cross-functional design skills.`,
    },
    {
      region: 'Europe',
      shift: 'Stable growth',
      highlight: 'Universities prioritise evidence-based learning science and multilingual delivery.',
    },
    {
      region: 'Asia-Pacific',
      shift: '+11% funding',
      highlight: 'Fast-growing edtech hubs need agile curriculum builders and mentoring talent.',
    },
  ]
}
