import { AnimatePresence } from 'motion/react';
import { Users } from 'lucide-react';
import { ExportButton } from './modules/candidate-export/components/ExportButton';
import { ExportModal } from './modules/candidate-export/components/ExportModal';
import { useExportJob } from './modules/candidate-export/hooks/useExportJob';

function App() {
  const { job, startExport, resetJob } = useExportJob();

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
          <p className="text-lg text-slate-600 mb-8">
            Download all candidate information with job applications as a CSV file.
          </p>

          <ExportButton
            onClick={startExport}
            loading={isActive}
            disabled={job !== null}
          />
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
