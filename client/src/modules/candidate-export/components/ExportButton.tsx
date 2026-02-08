import { Download } from 'lucide-react';
import { cn } from '../../../shared/utils/cn';

interface ExportButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function ExportButton({ onClick, disabled, loading, className }: ExportButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center gap-3 px-8 py-4 bg-purple-600 text-white rounded-xl',
        'font-medium transition-all duration-200',
        'shadow-lg shadow-purple-600/20',
        'hover:bg-purple-700 hover:shadow-xl hover:shadow-purple-600/30',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600 disabled:hover:shadow-lg',
        className,
      )}
    >
      {loading ? (
        <svg
          className="w-5 h-5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ) : (
        <Download className="w-5 h-5" />
      )}
      <span>{loading ? 'Preparing export...' : 'Export to CSV'}</span>
    </button>
  );
}
