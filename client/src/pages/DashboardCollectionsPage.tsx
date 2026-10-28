import * as React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Link } from "react-router-dom";
import { UserCollection } from "@/types";
import { collectionService } from "@/services/collectionService";
import { 
  FolderPlus, 
  Bookmark, 
  Lock, 
  Globe, 
  Trash2, 
  ChevronRight, 
  Loader2 
} from "lucide-react";
import { toast } from "sonner";

export default function DashboardCollectionsPage() {
  const [collections, setCollections] = React.useState<UserCollection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [newCollectionName, setNewCollectionName] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  const fetchCollections = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await collectionService.getMyCollections();
      if (result.success && result.data) {
        setCollections(result.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load collections");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    setIsCreating(true);
    try {
      const res = await collectionService.createCollection({
        name: newCollectionName.trim(),
        visibility: "PRIVATE",
      });
      if (res.success && res.data) {
        toast.success("Collection created!");
        setNewCollectionName("");
        fetchCollections();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create collection");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCollection = async (id: string, name: string) => {
    if (!window.confirm(`Delete collection "${name}"?`)) return;

    try {
      const res = await collectionService.deleteCollection(id);
      if (res.success) {
        setCollections(prev => prev.filter(c => c.id !== id));
        toast.success("Collection deleted");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete collection");
    }
  };

  return (
    <MainLayout>
      <PageContainer className="py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-brand-charcoal">My Collections</h1>
              <p className="text-sm text-brand-muted mt-1">
                Organize your favorite coffee spots into personal and shareable collections.
              </p>
            </div>

            <form onSubmit={handleCreateCollection} className="flex gap-2">
              <input
                type="text"
                placeholder="New collection name..."
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="px-4 py-2 rounded-2xl border border-brand-border bg-white text-xs text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-coffee"
              />
              <Button type="submit" disabled={isCreating || !newCollectionName.trim()} className="rounded-2xl gap-1.5 text-xs font-bold bg-brand-coffee text-white">
                <FolderPlus className="w-4 h-4" />
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </form>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="w-8 h-8 text-brand-coffee animate-spin" />
            </div>
          ) : collections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((coll) => (
                <div 
                  key={coll.id}
                  className="bg-white rounded-3xl border border-brand-border p-5 shadow-xs flex flex-col justify-between hover:border-brand-coffee/30 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="p-2.5 rounded-2xl bg-brand-cream text-brand-coffee">
                        <Bookmark className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600">
                          {coll.visibility === "PUBLIC" ? <Globe className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-stone-500" />}
                          {coll.visibility}
                        </span>
                        <button
                          onClick={() => handleDeleteCollection(coll.id, coll.name)}
                          className="text-brand-muted hover:text-red-600 transition p-1"
                          title="Delete collection"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-serif font-bold text-lg text-brand-charcoal group-hover:text-brand-coffee transition-colors">
                        <Link to={`/dashboard/collections/${coll.id}`}>
                          {coll.name}
                        </Link>
                      </h3>
                      {coll.description && (
                        <p className="text-xs text-brand-muted line-clamp-2 mt-1">
                          {coll.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-brand-border/40 flex items-center justify-between text-xs text-brand-muted">
                    <span>{coll._count?.items ?? coll.items?.length ?? 0} cafes</span>
                    <Link to={`/dashboard/collections/${coll.id}`} className="font-bold text-brand-coffee flex items-center gap-1 hover:underline">
                      View details <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-brand-cream/30 rounded-[40px] border border-dashed border-brand-border p-12 text-center space-y-6">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Bookmark className="w-10 h-10 text-brand-muted" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-bold text-brand-charcoal">No collections yet</h3>
                <p className="text-sm text-brand-muted max-w-md mx-auto">
                  Create custom collections like "Weekend Brunch Spots" or "Quiet Study Cafes" to organize your coffee journey.
                </p>
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </MainLayout>
  );
}
