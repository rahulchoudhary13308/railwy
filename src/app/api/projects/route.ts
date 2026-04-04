import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { registerProjectSchema, parseGitHubRepoName } from '@/lib/validators'
import { ProjectRepository } from '@/repositories/project'

const repo = new ProjectRepository()

export async function GET() {
  try {
    const projects = await repo.findAll()
    return NextResponse.json({ data: projects })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch projects' } },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null)

    if (body === null) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Request body is required' } },
        { status: 400 }
      )
    }

    const parsed = registerProjectSchema.parse(body)

    const repoName = parseGitHubRepoName(parsed.repoUrl)
    const normalizedUrl = parsed.repoUrl.replace(/\.git$/, '').replace(/\/$/, '')
    const branch = parsed.branch ?? `build/auto-${repoName}`

    const existing = await repo.findByRepoUrl(normalizedUrl)
    if (existing) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Project already registered' } },
        { status: 409 }
      )
    }

    const project = await repo.create({
      name: repoName,
      repoUrl: normalizedUrl,
      branch,
    })

    return NextResponse.json({ data: project }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      const first = error.errors[0]
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: first.message,
            field: first.path[0] as string | undefined,
          },
        },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to register project' } },
      { status: 500 }
    )
  }
}
