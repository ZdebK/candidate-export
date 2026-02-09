import { AnimatePresence } from 'motion/react';
import { Users, Download, Sparkles } from 'lucide-react';
import { ExportButton } from './modules/candidate-export/components/ExportButton';
import { ExportModal } from './modules/candidate-export/components/ExportModal';
import { useExportJob } from './modules/candidate-export/hooks/useExportJob';
import { useExportCount } from './modules/candidate-export/hooks/useExportCount';
import { getCachedExport, isCacheValid } from './modules/candidate-export/utils/export-cache.util';

function App() {
  const { job, startExport, downloadPrevious, resetJob } = useExportJob();
  const { counts, loading: countLoading } = useExportCount();

  const cachedExport = getCachedExport();
  const canUseCached = counts && cachedExport && isCacheValid(cachedExport, counts.candidates, counts.applications);

  const isActive = job?.status === 'pending' || job?.status === 'processing';

  const handleNewExport = () => {
    startExport(counts ?? undefined);
  };

  const handleDownloadPrevious = () => {
    if (cachedExport) {
      downloadPrevious(cachedExport.jobId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            <span className="font-semibold text-slate-900">Candidate Hub</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Export Your Candidates
          </h1>
          <p className="text-lg text-slate-600 mb-4">
            Download all candidate information with job applications as a CSV file.
          </p>

          <div className="flex flex-col items-center gap-4">
            {!countLoading && counts !== null && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">
                <Users className="w-4 h-4" />
                <span>
                  {counts.candidates} candidates · {counts.applications} applications ready to export
                </span>
              </div>
            )}

            {countLoading && (
              <div className="text-sm text-slate-400">Loading candidate count...</div>
            )}

            {canUseCached && !job && (
              <div className="flex flex-col items-center gap-3">
                <div className="inline-flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Previous export available (same data)</span>
                  </div>

                  <button
                    onClick={handleDownloadPrevious}
                    title="Download previous export"
                    className="inline-flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                <ExportButton
                  onClick={handleNewExport}
                  loading={false}
                  disabled={false}
                />
              </div>
            )}

            {!canUseCached && (
              <ExportButton
                onClick={handleNewExport}
                loading={isActive}
                disabled={job !== null}
              />
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {job && (
          <ExportModal
            job={job}
            onClose={resetJob}
            onCancel={resetJob}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
