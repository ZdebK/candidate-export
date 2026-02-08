import { AnimatePresence } from 'motion/react';
import { Users } from 'lucide-react';
import { ExportButton } from './modules/candidate-export/components/ExportButton';
import { ExportModal } from './modules/candidate-export/components/ExportModal';
import { useExportJob } from './modules/candidate-export/hooks/useExportJob';
import { useExportCount } from './modules/candidate-export/hooks/useExportCount';

function App() {
  const { job, startExport, resetJob } = useExportJob();
  const { counts, loading: countLoading } = useExportCount();

  const isActive = job?.status === 'pending' || job?.status === 'processing';

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

            <ExportButton
              onClick={startExport}
              loading={isActive}
              disabled={job !== null}
            />
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
