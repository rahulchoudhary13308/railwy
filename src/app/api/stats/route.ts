import { NextResponse } from 'next/server'
import { ProjectRepository } from '@/repositories/project'

const repo = new ProjectRepository()

export async function GET() {
  try {
    const stats = await repo.getStats()
    return NextResponse.json({ data: stats })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch statistics' } },
      { status: 500 }
    )
  }
}
