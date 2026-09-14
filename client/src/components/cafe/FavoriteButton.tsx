import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import favoriteService from '../../services/favoriteService';
import { motion, AnimatePresence } from 'motion/react';

interface FavoriteButtonProps {
  cafeId: string;
  cafeName: string;
  initialIsFavorite?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  cafeId,
  cafeName,
  initialIsFavorite = false,
  className,
  variant = 'default',
  size = 'md',
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    if (isLoading) return;

    // Optimistic UI
    const previousState = isFavorite;
    setIsFavorite(!previousState);
    setIsLoading(true);

    try {
      const response = await favoriteService.toggleFavorite(cafeId);
      if (response.success) {
        setIsFavorite(response.data.isFavorite);
      } else {
        // Rollback
        setIsFavorite(previousState);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Rollback
      setIsFavorite(previousState);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2.5',
    lg: 'p-3.5',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const variantClasses = {
    default: 'bg-white/90 hover:bg-white text-brand-coffee shadow-sm backdrop-blur-sm',
    outline: 'bg-transparent border border-brand-border hover:border-brand-coffee text-brand-muted hover:text-brand-coffee',
    ghost: 'bg-transparent hover:bg-brand-cream/50 text-brand-muted hover:text-brand-coffee',
  };

  return (
    <div className="relative inline-block">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        disabled={isLoading}
        className={cn(
          'rounded-full transition-all flex items-center justify-center group',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        aria-label={isFavorite ? `Remove ${cafeName} from saved cafes` : `Save ${cafeName}`}
        title={isFavorite ? 'Remove from saved' : 'Save cafe'}
      >
        <Heart
          size={iconSizes[size]}
          className={cn(
            'transition-all duration-300',
            isFavorite ? 'fill-rose-500 text-rose-500 scale-110' : 'text-current group-hover:text-rose-400'
          )}
        />
      </motion.button>

      <AnimatePresence>
        {showLoginPrompt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginPrompt(false)}
              className="fixed inset-0 bg-brand-charcoal/20 backdrop-blur-[2px] z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-[32px] p-8 shadow-2xl z-[101] text-center space-y-6 border border-brand-border"
            >
              <div className="w-16 h-16 bg-brand-cream rounded-full flex items-center justify-center mx-auto text-brand-coffee">
                <Heart className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-bold text-brand-charcoal">Save this cafe?</h3>
                <p className="text-brand-muted leading-relaxed">
                  Log in to save cafes you love and access your personal discovery list from any device.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)}
                  className="w-full h-14 bg-brand-coffee text-white rounded-2xl font-bold hover:bg-brand-coffee-dark transition-all"
                >
                  Log In
                </button>
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="w-full h-14 bg-brand-background text-brand-charcoal rounded-2xl font-bold hover:bg-brand-cream transition-all"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
