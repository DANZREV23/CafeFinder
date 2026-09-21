import * as React from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showBackOnline, setShowBackOnline] = React.useState(false);
  const [lastStatus, setLastStatus] = React.useState(true);

  React.useEffect(() => {
    if (isOnline && !lastStatus) {
      setShowBackOnline(true);
      const timer = setTimeout(() => setShowBackOnline(false), 3000);
      return () => clearTimeout(timer);
    }
    setLastStatus(isOnline);
  }, [isOnline, lastStatus]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 rounded-2xl bg-brand-charcoal text-white px-5 py-3 shadow-2xl border border-white/10"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-warning">
            <WifiOff className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold leading-none">You're offline</span>
            <span className="text-[10px] opacity-70 leading-tight mt-0.5">Showing cached content where available.</span>
          </div>
        </motion.div>
      )}

      {showBackOnline && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 rounded-2xl bg-brand-success text-white px-5 py-3 shadow-2xl"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
            <Wifi className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-xs font-bold">Back online</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
