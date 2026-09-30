// client/src/pages/OwnerCafeHoursPage.tsx
import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Save, Clock, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { ownerService } from "@/services/ownerService";
import { ownerCafeService, OwnerHours } from "@/services/ownerCafeService";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils";

export default function OwnerCafeHoursPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useI18n();
  const [name, setName] = React.useState("");
  const [hours, setHours] = React.useState<OwnerHours[]>(
    Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      isClosed: false,
      openTime: "08:00",
      closeTime: "20:00",
    }))
  );
  const [message, setMessage] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const dayNames = React.useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      // Create a date for the day (Jan 4, 2021 was a Monday)
      // Prisma: 0=Sunday, 1=Monday... 6=Saturday
      const date = new Date(2021, 0, 3 + i); // Jan 3, 2021 is Sunday
      return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date);
    });
  }, [locale]);

  React.useEffect(() => {
    if (id) {
      setLoading(true);
      ownerService
        .getOwnedCafe(id)
        .then((r) => {
          setName(r.data.name);
          if (r.data.hours?.length === 7) {
            // Sort to ensure 0-6 order (Sun-Sat)
            const sortedHours = [...r.data.hours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
            setHours(sortedHours);
          }
        })
        .catch((e) => setMessage(e.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const updateHour = (index: number, patch: Partial<OwnerHours>) => {
    setHours((prev) => prev.map((hour, i) => (i === index ? { ...hour, ...patch } : hour)));
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setMessage("");
    try {
      await ownerCafeService.updateHours(id, hours);
      setMessage("Business hours updated successfully.");
    } catch (e: any) {
      setMessage(e.message || "Failed to update hours");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <PageContainer className="py-12">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-brand-coffee" />
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer className="py-12">
        <Link 
          to={`/owner/cafes/${id}`} 
          className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-coffee transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {name}
        </Link>
        
        <div className="mt-8 max-w-4xl">
          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-bold text-brand-charcoal">{t("cafe.openingHours")}</h1>
            <p className="text-brand-muted">Set the regular operating hours for {name}.</p>
          </div>

          {message && (
            <div role="alert" className="mt-6 p-4 rounded-2xl bg-brand-cream/50 text-brand-coffee-dark border border-brand-coffee/10 flex items-center gap-3 font-medium">
              <Clock className="w-5 h-5" />
              {message}
            </div>
          )}

          <div className="mt-8 space-y-4">
            <div className="hidden sm:grid sm:grid-cols-[12rem_1fr_1fr_auto] gap-4 px-6 py-2 text-xs font-bold uppercase tracking-widest text-brand-muted">
              <span>Day</span>
              <span>Open Time</span>
              <span>Close Time</span>
              <span>Status</span>
            </div>

            <div className="divide-y divide-brand-border rounded-3xl border border-brand-border bg-white overflow-hidden shadow-sm">
              {hours.map((hour, index) => (
                <div 
                  key={hour.dayOfWeek} 
                  className={cn(
                    "grid gap-4 p-6 sm:grid-cols-[12rem_1fr_1fr_auto] sm:items-center group transition-colors",
                    hour.isClosed ? "bg-brand-background/30" : "hover:bg-brand-background/50"
                  )}
                >
                  <strong className="text-brand-charcoal font-bold">{dayNames[hour.dayOfWeek]}</strong>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor={`open-${index}`} className="sm:hidden">Open Time</Label>
                    <Input 
                      id={`open-${index}`}
                      type="time" 
                      disabled={hour.isClosed} 
                      value={hour.openTime || ""} 
                      onChange={(e) => updateHour(index, { openTime: e.target.value })}
                      className="h-11 rounded-xl bg-white focus:ring-brand-coffee/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`close-${index}`} className="sm:hidden">Close Time</Label>
                    <Input 
                      id={`close-${index}`}
                      type="time" 
                      disabled={hour.isClosed} 
                      value={hour.closeTime || ""} 
                      onChange={(e) => updateHour(index, { closeTime: e.target.value })}
                      className="h-11 rounded-xl bg-white focus:ring-brand-coffee/20"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2 sm:pt-0">
                    <Checkbox 
                      id={`closed-${index}`}
                      checked={hour.isClosed} 
                      onCheckedChange={(checked) => updateHour(index, { isClosed: !!checked })}
                    />
                    <Label 
                      htmlFor={`closed-${index}`} 
                      className="cursor-pointer font-medium"
                    >
                      {t("cafe.closed")}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex items-center gap-4">
            <Button 
              onClick={handleSave} 
              isLoading={saving}
              className="h-14 px-8 rounded-2xl min-w-[200px] shadow-lg shadow-brand-coffee/20"
              variant="primary"
            >
              {!saving && <Save className="h-5 w-5 mr-2" />}
              {saving ? "Saving..." : "Save Business Hours"}
            </Button>
          </div>
        </div>
      </PageContainer>
    </MainLayout>
  );
}
