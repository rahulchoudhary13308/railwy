import { NextResponse } from 'next/server'
import { ProjectService } from '@/services/project'

const service = new ProjectService()

function parseId(id: string): number | null {
  const parsed = Number(id)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

export async function GET(
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
    const project = await service.getById(id)
    if (!project) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 }
      )
    }
    return NextResponse.json({ data: project })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch project' } },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const deleted = await service.remove(id)
    if (!deleted) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 }
      )
    }
    return NextResponse.json({ data: { message: 'Project removed successfully' } })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete project' } },
      { status: 500 }
    )
  }
}
