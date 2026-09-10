import React from 'react';
import { Coffee } from 'lucide-react';

export const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-20 animate-pulse">
    <div className="bg-stone-100 p-4 rounded-full mb-4">
      <Coffee className="h-10 w-10 text-stone-300" />
    </div>
    <p className="text-stone-400 font-medium">Brewing something fresh...</p>
  </div>
);

export const ErrorState = ({ message = 'Failed to load content', onRetry }: { message?: string, onRetry?: () => void }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center px-4">
    <div className="bg-rose-50 p-4 rounded-full mb-4">
      <Coffee className="h-10 w-10 text-rose-500" />
    </div>
    <h3 className="text-xl font-bold text-stone-900 mb-2">Oops! Spilled some coffee</h3>
    <p className="text-stone-500 max-w-xs mb-6">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="bg-stone-900 text-white px-6 py-2 rounded-full font-medium hover:bg-stone-800 transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

export const EmptyState = ({ title = 'No cafes found', description = 'Try adjusting your search or filters.' }: { title?: string, description?: string }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center px-4">
    <div className="bg-stone-100 p-4 rounded-full mb-4">
      <Coffee className="h-10 w-10 text-stone-400" />
    </div>
    <h3 className="text-xl font-bold text-stone-900 mb-2">{title}</h3>
    <p className="text-stone-500 max-w-xs">{description}</p>
  </div>
);
