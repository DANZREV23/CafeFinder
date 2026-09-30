import React, { useState, useEffect } from 'react';
import { 
  History, 
  RotateCcw, 
  X, 
  User, 
  Calendar,
  ChevronRight,
  Eye
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'react-hot-toast';
import { clsx } from 'clsx';

interface Revision {
  id: string;
  revisionNumber: number;
  createdAt: string;
  author?: { name: string };
  snapshot: any;
}

interface RevisionHistoryDialogProps {
  entityType: string;
  entityId: string;
  onRestore: (snapshot: any) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const RevisionHistoryDialog: React.FC<RevisionHistoryDialogProps> = ({
  entityType,
  entityId,
  onRestore,
  isOpen,
  onClose
}) => {
  const { t, formatDate } = useI18n();
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRevisions();
    }
  }, [isOpen, entityId]);

  const fetchRevisions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/editorial/revisions/${entityType}/${entityId}`);
      const data = await response.json();
      if (data.success) {
        setRevisions(data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch revision history');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (revisionId: string) => {
    if (!window.confirm('Are you sure you want to restore this version? Current changes will be archived as a new revision.')) return;

    try {
      const response = await fetch(`/api/admin/editorial/revisions/${revisionId}/restore`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Revision restored successfully');
        onRestore(selectedRevision?.snapshot);
        onClose();
      }
    } catch (error) {
      toast.error('Failed to restore revision');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <History size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-900">Revision History</h2>
              <p className="text-xs text-stone-500 uppercase tracking-widest font-bold">Restore previous versions of this content</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-900 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* List of Revisions */}
          <div className="w-full md:w-72 border-r border-stone-100 overflow-y-auto bg-stone-50/50">
            {loading ? (
              <div className="p-8 text-center text-stone-400">
                <RotateCcw className="animate-spin mx-auto mb-2" size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">Loading...</span>
              </div>
            ) : revisions.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <p className="text-sm italic">No revisions found.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {revisions.map((rev) => (
                  <button
                    key={rev.id}
                    onClick={() => setSelectedRevision(rev)}
                    className={clsx(
                      "w-full px-6 py-4 text-left transition-all group",
                      selectedRevision?.id === rev.id ? "bg-white border-l-4 border-l-amber-600 shadow-sm" : "hover:bg-stone-100 border-l-4 border-l-transparent"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-black text-stone-900">v{rev.revisionNumber}</span>
                      <Badge variant="outline" className="text-[9px]">
                        {rev.revisionNumber === revisions[0].revisionNumber ? 'Current' : 'History'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1">
                      <Calendar size={12} />
                      {formatDate(rev.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-stone-400">
                      <User size={12} />
                      {rev.author?.name || 'System'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview of Selected Revision */}
          <div className="flex-1 overflow-y-auto p-8 bg-white">
            {selectedRevision ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-stone-900">{selectedRevision.snapshot.title || 'Untitled'}</h3>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => handleRestore(selectedRevision.id)}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw size={16} />
                    Restore this version
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <p className="text-[10px] font-black uppercase text-stone-400 mb-1">Status</p>
                    <Badge variant="outline">{selectedRevision.snapshot.status}</Badge>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <p className="text-[10px] font-black uppercase text-stone-400 mb-1">Category</p>
                    <p className="text-sm font-bold text-stone-700">{selectedRevision.snapshot.category || 'None'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase text-stone-400 mb-2 tracking-widest">Snapshot Preview</p>
                  <div className="p-6 border border-stone-100 rounded-2xl bg-stone-50/30 prose prose-stone prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: selectedRevision.snapshot.content }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Metadata</p>
                  <pre className="text-[10px] bg-stone-900 text-stone-300 p-4 rounded-xl overflow-x-auto">
                    {JSON.stringify(selectedRevision.snapshot, (key, value) => {
                      if (key === 'content') return '(content omitted)';
                      return value;
                    }, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12">
                <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4 text-stone-300">
                  <Eye size={32} />
                </div>
                <h3 className="text-lg font-bold text-stone-900">Select a version</h3>
                <p className="text-sm text-stone-500 max-w-xs mx-auto mt-2">
                  Pick a revision from the list on the left to see what was changed and restore it if needed.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
