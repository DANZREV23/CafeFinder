import React, { useState } from 'react';
import { Share2, Link2, Check, Twitter, Facebook } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({
  url,
  title,
  description,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title
  )}&url=${encodeURIComponent(url)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleNativeShare}
        className="p-2.5 rounded-xl border border-brand-border bg-white text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
        title="Share"
        aria-label="Share"
      >
        <Share2 className="w-4 h-4" />
      </button>

      <button
        onClick={handleCopy}
        className="p-2.5 rounded-xl border border-brand-border bg-white text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
        title={copied ? 'Copied!' : 'Copy Link'}
        aria-label="Copy Link"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4" />}
      </button>

      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2.5 rounded-xl border border-brand-border bg-white text-stone-700 hover:bg-stone-50 transition-colors inline-flex items-center justify-center"
        title="Share on X"
        aria-label="Share on X"
      >
        <Twitter className="w-4 h-4" />
      </a>

      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2.5 rounded-xl border border-brand-border bg-white text-stone-700 hover:bg-stone-50 transition-colors inline-flex items-center justify-center"
        title="Share on Facebook"
        aria-label="Share on Facebook"
      >
        <Facebook className="w-4 h-4" />
      </a>
    </div>
  );
};

export default ShareButtons;
