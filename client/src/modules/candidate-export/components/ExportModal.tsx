import { motion, AnimatePresence } from 'motion/react';
import { Download, CheckCircle, XCircle, X } from 'lucide-react';
import { ExportProgress } from './ExportProgress';
import type { ExportJob } from '../types/export.types';

interface ExportModalProps {
  job: ExportJob;
  onClose: () => void;
  onCancel?: () => void;
}

export function ExportModal({ job, onClose, onCancel }: ExportModalProps) {
  const isActive = job.status === 'pending' || job.status === 'processing';
  const isCompleted = job.status === 'completed';
  const isFailed = job.status === 'failed';

  const handleBackdropClick = () => {
    if (isActive) {
      const confirmed = window.confirm('Export in progress. Are you sure you want to close?');
      if (confirmed) onClose();
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button — only when not actively processing */}
        {!isActive && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <AnimatePresence mode="wait">
          {isActive && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <Download className="w-10 h-10 text-purple-600 animate-pulse" />
              </div>

              <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                Exporting Candidates
              </h2>
              <p className="text-slate-600 mb-6">
                {job.status === 'pending'
                  ? 'Preparing export...'
                  : 'Processing your data...'}
              </p>

              <ExportProgress progress={job.progress} />

              {onCancel && (
                <button
                  onClick={onCancel}
                  className="mt-6 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
              )}
            </motion.div>
          )}

          {isCompleted && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>

              <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                Export Complete!
              </h2>
              <p className="text-slate-600 mb-1">
                Your CSV file has been downloaded successfully.
              </p>
              {job.result && (
                <p className="text-sm text-slate-400">
                  {job.result.recordCount} records · {job.result.fileName}
                </p>
              )}

              <button
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </motion.div>
          )}

          {isFailed && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>

              <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                Export Failed
              </h2>
              <p className="text-slate-600 mb-1">
                {job.error?.message ?? 'An unexpected error occurred.'}
              </p>
              <p className="text-xs text-slate-400">{job.error?.code}</p>

              <button
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
