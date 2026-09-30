import * as React from "react";
import { Button } from "../ui/Button";
import { FilterPanel } from "./FilterPanel";
import { useI18n } from "@/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  onFilterChange: (key: string, value: any) => void;
  onClearAll: () => void;
  totalResults: number;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onClearAll,
  totalResults,
}) => {
  const { t } = useI18n();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="fixed right-0 top-0 bottom-0 left-auto translate-x-0 translate-y-0 h-full w-full max-w-xs rounded-none sm:rounded-none flex flex-col p-0 border-l border-brand-border">
        <div className="flex items-center justify-between p-4 border-b border-brand-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-brand-charcoal">{t("common.filter")}</DialogTitle>
          </DialogHeader>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <FilterPanel 
            filters={filters}
            onFilterChange={onFilterChange}
            onClearAll={onClearAll}
          />
        </div>
        
        <div className="p-4 border-t border-brand-border bg-brand-cream/30">
          <Button 
            className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-brand-coffee/20"
            onClick={onClose}
          >
            Show {totalResults} {t("cafe.status.published")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
