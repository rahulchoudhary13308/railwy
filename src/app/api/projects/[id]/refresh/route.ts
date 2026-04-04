import { NextResponse } from 'next/server'
import { ProjectRepository } from '@/repositories/project'
import { pollProject } from '@/lib/poller'

const repo = new ProjectRepository()

function parseId(id: string): number | null {
  const parsed = Number(id)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseId(params.id)
  if (id === null) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid project ID' } },
      { status: 400 }
    )
  }

  try {
    const project = await repo.findById(id)
    if (!project) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 }
      )
    }

    await pollProject(project)

    const updated = await repo.findById(id)
    return NextResponse.json({
      data: {
        id: updated!.id,
        stage: updated!.stage,
        percentage: updated!.percentage,
        lastPolledAt: updated!.lastPolledAt,
      },
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'GITHUB_ERROR', message: 'Failed to fetch STATUS.json from GitHub' } },
      { status: 502 }
    )
  }
}
