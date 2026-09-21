
import React, { useState } from 'react';
import { 
  Share2, 
  Link as LinkIcon, 
  Facebook, 
  Twitter, 
  MessageSquare, 
  Check, 
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ShareButtonsProps {
  url: string;
  title: string;
  text?: string;
  className?: string;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({
  url,
  title,
  text,
  className
}) => {
  const [copied, setCopied] = useState(false);

  const shareData = {
    title,
    text: text || `Check out ${title} on CafeFinder`,
    url
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for non-secure contexts or iframes
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          const successful = document.execCommand('copy');
          if (!successful) throw new Error('Copy failed');
        } finally {
          document.body.removeChild(textArea);
        }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareData.text} ${url}`)}`,
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Native Share on Mobile */}
      {typeof navigator !== 'undefined' && navigator.share && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleNativeShare}
          className="rounded-xl border-brand-border h-10 gap-2"
        >
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </Button>
      )}

      {/* Copy Link Button */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleCopyLink}
        className={cn(
          "rounded-xl border-brand-border h-10 gap-2 transition-all",
          copied && "border-emerald-200 bg-emerald-50 text-emerald-700"
        )}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <LinkIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Copy Link</span>
          </>
        )}
      </Button>

      {/* Social Platforms - Desktop or if native share fails */}
      <div className="flex items-center gap-2">
        <Button 
          asChild
          variant="outline" 
          size="icon"
          className="rounded-xl border-brand-border h-10 w-10 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
        >
          <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">
            <Facebook className="h-4 w-4" />
          </a>
        </Button>
        <Button 
          asChild
          variant="outline" 
          size="icon"
          className="rounded-xl border-brand-border h-10 w-10 hover:bg-sky-50 hover:text-sky-500 hover:border-sky-200"
        >
          <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Share on X (Twitter)">
            <Twitter className="h-4 w-4" />
          </a>
        </Button>
        <Button 
          asChild
          variant="outline" 
          size="icon"
          className="rounded-xl border-brand-border h-10 w-10 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
        >
          <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp">
            <Send className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
};
