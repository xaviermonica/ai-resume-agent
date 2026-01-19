import { NextResponse } from 'next/server'
import { spawn } from 'node:child_process'

// Serverless API route: POST /api/notes
// Calls Python agent (Pydantic AI) and returns validated JSON

export const runtime = 'nodejs' // Ensure Node runtime (not edge)

function runPythonAgent(payload: any, env: NodeJS.ProcessEnv): Promise<{ ok: boolean; data?: any; error?: string }> {
  return new Promise((resolve) => {
    const py = spawn('python3', ['agent/agent.py'], {
      env: {
        ...process.env,
        ...env,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    const chunks: Buffer[] = []
    const errChunks: Buffer[] = []

    py.stdout.on('data', (d) => chunks.push(Buffer.from(d)))
    py.stderr.on('data', (d) => errChunks.push(Buffer.from(d)))

    py.on('error', (e) => {
      resolve({ ok: false, error: `Agent process error: ${e.message}` })
    })

    py.on('close', (code) => {
      const stdout = Buffer.concat(chunks).toString('utf-8')
      const stderr = Buffer.concat(errChunks).toString('utf-8')
      if (code !== 0) {
        resolve({ ok: false, error: stderr || stdout || `Agent exited with code ${code}` })
        return
      }
      try {
        const parsed = JSON.parse(stdout)
        resolve({ ok: true, data: parsed })
      } catch (e: any) {
        resolve({ ok: false, error: `Invalid JSON from agent: ${e.message}\n${stdout}` })
      }
    })

    // Write payload to stdin
    try {
      py.stdin.write(JSON.stringify(payload))
      py.stdin.end()
    } catch (e: any) {
      resolve({ ok: false, error: `Failed to send payload: ${e.message}` })
    }

    // Safety timeout (60s)
    setTimeout(() => {
      try { py.kill('SIGKILL') } catch {}
      resolve({ ok: false, error: 'Agent timed out after 60s' })
    }, 60000)
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Basic input checks; strict validation is in Python via Pydantic
    const content = (body?.content ?? '').trim()
    const exam_type = body?.exam_type
    const depth = body?.depth
    if (!content || content.length < 20) {
      return NextResponse.json({ error: 'Input content is too short. Provide at least 20 characters.' }, { status: 400 })
    }
    const validExam = ['midterm', 'final', 'viva']
    const validDepth = ['short', 'medium', 'detailed']
    if (!validExam.includes(exam_type) || !validDepth.includes(depth)) {
      return NextResponse.json({ error: 'Invalid exam_type or depth.' }, { status: 400 })
    }

    // Prepare environment for Python agent
    const env = {
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
      OPENAI_BASE_URL: 'https://openrouter.ai/api/v1',
      MODEL_NAME: 'openai/gpt-oss-20b:free',
    }
    if (!env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API key not configured.' }, { status: 500 })
    }

    const result = await runPythonAgent({ content, exam_type, depth }, env)
    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'Agent error' }, { status: 500 })
    }

    // Return structured JSON from Pydantic AI
    return NextResponse.json(result.data)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
