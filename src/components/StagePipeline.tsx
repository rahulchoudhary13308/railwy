'use client'

const STAGES = ['pending', 'plan_review', 'building', 'testing', 'complete'] as const

interface StagePipelineProps {
  currentStage: string
}

export function StagePipeline({ currentStage }: StagePipelineProps) {
  const isError = currentStage === 'error'
  const currentIndex = STAGES.indexOf(currentStage as typeof STAGES[number])

  return (
    <div className="flex items-center gap-1">
      {STAGES.map((stage, i) => {
        const isComplete = currentIndex >= 0 && i < currentIndex
        const isCurrent = currentIndex >= 0 && i === currentIndex
        const isFuture = currentIndex < 0 || i > currentIndex

        let bg = 'bg-gray-700 text-gray-500'
        if (isComplete) bg = 'bg-green-700 text-green-100'
        if (isCurrent) bg = 'bg-blue-600 text-white'

        return (
          <div key={stage} className="flex items-center">
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${bg}`}
            >
              {isComplete && <span>&#10003;</span>}
              {stage.replace('_', ' ')}
            </div>
            {i < STAGES.length - 1 && (
              <div className={`mx-1 h-0.5 w-4 ${isFuture ? 'bg-gray-700' : 'bg-green-700'}`} />
            )}
          </div>
        )
      })}
      {isError && (
        <div className="ml-2 flex items-center">
          <div className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white">
            error
          </div>
        </div>
      )}
    </div>
  )
}
