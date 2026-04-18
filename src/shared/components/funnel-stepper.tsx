'use client';

import { cn } from '@/shared/utils/cn';
import { Check } from 'lucide-react';

interface FunnelStage {
  id: string;
  name: string;
  position: number;
}

interface FunnelStepperProps {
  stages: FunnelStage[];
  currentStageId: string;
  funnelColor?: string;
  onStageClick?: (stageId: string) => void;
  disabled?: boolean;
}

export function FunnelStepper({
  stages,
  currentStageId,
  funnelColor = '#E8792A',
  onStageClick,
  disabled = false,
}: FunnelStepperProps) {
  const sortedStages = [...stages].sort((a, b) => a.position - b.position);
  const currentIndex = sortedStages.findIndex((s) => s.id === currentStageId);

  return (
    <div className="flex items-center w-full overflow-x-auto py-2 scrollbar-hide">
      {sortedStages.map((stage, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = stage.id === currentStageId;
        const isFuture = index > currentIndex;
        const isLast = index === sortedStages.length - 1;

        return (
          <div key={stage.id} className="flex items-center flex-shrink-0">
            {/* Stage circle + label */}
            <button
              type="button"
              onClick={() => !disabled && onStageClick?.(stage.id)}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center gap-1 group',
                !disabled && 'cursor-pointer',
                disabled && 'cursor-default'
              )}
            >
              {/* Circle */}
              <div
                className={cn(
                  'flex items-center justify-center rounded-full transition-all duration-200',
                  isCompleted && 'h-7 w-7',
                  isCurrent && 'h-9 w-9',
                  isFuture && 'h-7 w-7 border-2 border-gray-300 bg-white',
                  !disabled && !isCurrent && 'group-hover:scale-110'
                )}
                style={{
                  backgroundColor: isCompleted || isCurrent ? funnelColor : undefined,
                  boxShadow: isCurrent ? `0 0 0 4px ${funnelColor}40` : undefined,
                }}
              >
                {isCompleted ? (
                  <Check size={14} className="text-white" />
                ) : isCurrent ? (
                  <div className="h-3 w-3 rounded-full bg-white" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-gray-300" />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-[10px] font-medium whitespace-nowrap max-w-[60px] truncate text-center',
                  isCurrent && 'text-white font-semibold',
                  isCompleted && 'text-white/80',
                  isFuture && 'text-white/60'
                )}
                title={stage.name}
              >
                {stage.name}
              </span>
            </button>

            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  'h-0.5 w-6 mx-1 transition-colors',
                  index < currentIndex ? 'bg-white/60' : 'bg-white/30'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
