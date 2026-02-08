import { Progress } from '../../../shared/components/ui/progress';
import type { ExportProgress as ExportProgressType } from '../types/export.types';

interface ExportProgressProps {
  progress: ExportProgressType;
}

export function ExportProgress({ progress }: ExportProgressProps) {
  const { percentage, stage, candidatesProcessed, totalCandidates } = progress;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-slate-600">{stage}</span>
        <span className="text-sm font-medium text-purple-600">{percentage}%</span>
      </div>

      <Progress value={percentage} className="mb-3" />

      {totalCandidates > 0 && (
        <p className="text-xs text-slate-400 text-center">
          {candidatesProcessed} / {totalCandidates} candidates
        </p>
      )}
    </div>
  );
}
