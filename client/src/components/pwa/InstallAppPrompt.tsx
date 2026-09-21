import * as React from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "motion/react";

export const InstallAppPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [showIOSGuide, setShowIOSGuide] = React.useState(false);

  React.useEffect(() => {
    // Show prompt only if installable or iOS AND not already installed
    // We also use localStorage to avoid showing it too often after dismissal
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (!isInstalled && (isInstallable || isIOS) && !dismissed) {
      const timer = setTimeout(() => setShowPrompt(true), 5000); // Wait 5s before showing
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, isIOS]);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  const handleInstall = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) setShowPrompt(false);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  if (isInstalled) return null;

  return (
    <>
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 right-6 z-[90] max-w-sm w-full"
          >
            <div className="bg-white rounded-3xl border border-brand-border shadow-2xl p-6 relative overflow-hidden">
              <button 
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-1 text-brand-muted hover:text-brand-charcoal transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex gap-4 items-start">
                <div className="h-12 w-12 rounded-2xl bg-brand-cream flex items-center justify-center shrink-0">
                  <Download className="h-6 w-6 text-brand-coffee" />
                </div>
                <div className="space-y-1 pr-6">
                  <h3 className="font-serif font-bold text-lg text-brand-charcoal leading-tight">Install CafeFinder</h3>
                  <p className="text-xs text-brand-muted">Get the full experience. Add to your home screen for quick access and offline browsing.</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button 
                  onClick={handleInstall}
                  variant="primary" 
                  className="flex-1 rounded-xl h-11 text-xs font-bold"
                >
                  {isIOS ? 'How to Install' : 'Install Now'}
                </Button>
                <Button 
                  onClick={handleDismiss}
                  variant="ghost" 
                  className="rounded-xl h-11 text-xs font-bold text-brand-muted"
                >
                  Maybe later
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIOSGuide && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-6 right-6 p-1 text-brand-muted"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center space-y-6">
                <div className="h-16 w-16 rounded-3xl bg-brand-cream flex items-center justify-center mx-auto text-brand-coffee">
                  <Share className="h-8 w-8" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-serif font-bold text-brand-charcoal">Install on iOS</h2>
                  <p className="text-sm text-brand-muted">Follow these simple steps to add CafeFinder to your home screen:</p>
                </div>

                <div className="text-left space-y-4 bg-brand-background p-5 rounded-2xl border border-brand-border">
                  <div className="flex gap-3 items-center">
                    <span className="h-6 w-6 rounded-full bg-brand-coffee text-white text-[10px] font-bold flex items-center justify-center">1</span>
                    <span className="text-xs font-medium">Tap the <Share className="h-3.5 w-3.5 inline mx-1" /> button in Safari.</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className="h-6 w-6 rounded-full bg-brand-coffee text-white text-[10px] font-bold flex items-center justify-center">2</span>
                    <span className="text-xs font-medium">Scroll down and tap <span className="font-bold">"Add to Home Screen"</span>.</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className="h-6 w-6 rounded-full bg-brand-coffee text-white text-[10px] font-bold flex items-center justify-center">3</span>
                    <span className="text-xs font-medium">Tap <span className="font-bold text-brand-coffee">"Add"</span> to confirm.</span>
                  </div>
                </div>

                <Button 
                  onClick={() => setShowIOSGuide(false)}
                  variant="primary" 
                  className="w-full h-12 rounded-2xl font-bold"
                >
                  Got it
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
