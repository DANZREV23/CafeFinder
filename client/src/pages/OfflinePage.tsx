import * as React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { WifiOff, RotateCcw, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <MainLayout>
      <PageContainer className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-brand-cream rounded-[32px] flex items-center justify-center text-brand-coffee mb-8"
        >
          <WifiOff className="w-12 h-12" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-md space-y-4"
        >
          <h1 className="text-4xl font-serif font-bold text-brand-charcoal">You're offline</h1>
          <p className="text-brand-muted text-lg">
            CafeFinder can't reach the internet right now. You can still view some recently cached content like cafe profiles you've visited.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-12 flex flex-col sm:flex-row gap-4 w-full max-w-sm"
        >
          <Button 
            onClick={handleRetry} 
            disabled={isRetrying}
            className="flex-1 h-14 rounded-2xl font-bold gap-2"
          >
            <RotateCcw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Checking connection...' : 'Try Again'}
          </Button>
          <Button 
            asChild 
            variant="outline" 
            className="flex-1 h-14 rounded-2xl font-bold gap-2"
          >
            <Link to="/">
              <Home className="w-4 h-4" />
              Go to Home
            </Link>
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-sm text-brand-muted italic"
        >
          Check your Wi-Fi or cellular data and try refreshing the page.
        </motion.p>
      </PageContainer>
    </MainLayout>
  );
}
