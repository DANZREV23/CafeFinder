import * as React from "react";
import { WifiOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PrivateOfflineStateProps {
  title?: string;
  description?: string;
}

export const PrivateOfflineState: React.FC<PrivateOfflineStateProps> = ({
  title = "Account data unavailable offline",
  description = "Your private account information and personalized dashboard require an internet connection to securely sync with our servers."
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 bg-brand-cream rounded-[32px] flex items-center justify-center text-brand-coffee mb-6">
        <WifiOff className="h-10 w-10" />
      </div>
      <h2 className="text-2xl font-serif font-bold text-brand-charcoal">{title}</h2>
      <p className="text-brand-muted mt-2 max-w-sm mx-auto font-medium">
        {description}
      </p>
      <Button 
        onClick={() => window.location.reload()} 
        variant="outline" 
        className="mt-8 rounded-2xl h-12 px-8 font-bold gap-2 border-brand-border hover:bg-brand-background transition-all"
      >
        <RotateCcw className="w-4 h-4" />
        Try Again
      </Button>
    </div>
  );
};
