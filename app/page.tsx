"use client"
import React, { useState } from 'react'
import styles from './page.module.css'

type NotesOutput = {
  title: string
  key_concepts: string[]
  important_points: string[]
  exam_tips: string[]
}

export default function Page() {
  const [content, setContent] = useState('')
  const [examType, setExamType] = useState<'midterm' | 'final' | 'viva'>('midterm')
  const [depth, setDepth] = useState<'short' | 'medium' | 'detailed'>('medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [output, setOutput] = useState<NotesOutput | null>(null)

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

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>AI Study Notes Generator</h1>
      <p className={styles.subtitle}>Paste study content, choose exam type and depth, and generate clean, bullet-point notes.</p>

      <div className={styles.grid}>
        <section className={styles.left}>
          <label className={styles.label}>Study Content</label>
          <textarea
            className={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste raw study material here..."
          />

          <div className={styles.controls}>
            <div className={styles.controlItem}>
              <label className={styles.label}>Exam Type</label>
              <select value={examType} onChange={(e) => setExamType(e.target.value as any)} className={styles.select}>
                <option value="midterm">midterm</option>
                <option value="final">final</option>
                <option value="viva">viva</option>
              </select>
            </div>
            <div className={styles.controlItem}>
              <label className={styles.label}>Depth</label>
              <select value={depth} onChange={(e) => setDepth(e.target.value as any)} className={styles.select}>
                <option value="short">short</option>
                <option value="medium">medium</option>
                <option value="detailed">detailed</option>
              </select>
            </div>
          </div>

          <button onClick={submit} disabled={disabled} className={styles.button}>
            {loading ? 'Generating…' : 'Generate Notes'}
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </section>

        <section className={styles.right}>
          {!output && !loading && <p className={styles.placeholder}>Your notes will appear here.</p>}
          {loading && <p className={styles.loading}>Working on it…</p>}
          {output && (
            <div className={styles.output}>
              <h2 className={styles.outputTitle}>{output.title}</h2>
              <div className={styles.section}>
                <h3>Key Concepts</h3>
                <ul>
                  {output.key_concepts.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.section}>
                <h3>Important Points</h3>
                <ul>
                  {output.important_points.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.section}>
                <h3>Exam Tips</h3>
                <ul>
                  {output.exam_tips.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
              <button onClick={copy} className={styles.copy}>Copy Notes</button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
