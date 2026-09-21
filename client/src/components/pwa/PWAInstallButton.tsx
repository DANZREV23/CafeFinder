import * as React from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PWAInstallButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  className?: string;
  showIcon?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  variant = 'outline', 
  className,
  showIcon = true
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = React.useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <Button
        onClick={install}
        variant={variant}
        size="sm"
        className={className}
      >
        {showIcon && <Download className="mr-2 h-4 w-4" />}
        Install App
      </Button>
    );
  }

  // We only show the button if it's installable or iOS
  // But for iOS, we might want to keep it subtle
  if (isIOS) {
    return (
      <>
        <Button
          onClick={() => setShowIOSGuide(true)}
          variant={variant}
          size="sm"
          className={className}
        >
          {showIcon && <Download className="mr-2 h-4 w-4" />}
          Install App
        </Button>

        {showIOSGuide && (
          // This is a simple alert/toast if the global prompt isn't visible
          // But since we have the global InstallAppPrompt, we can just rely on that
          // Or show the guide here if they clicked specifically.
          null 
        )}
      </>
    );
  }

  return null;
};
