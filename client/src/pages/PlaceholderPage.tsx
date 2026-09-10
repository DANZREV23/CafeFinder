import React from 'react';
import MainLayout from '../layouts/MainLayout.js';
import { Coffee } from 'lucide-react';

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center py-40 px-4 text-center">
        <div className="bg-amber-100 p-6 rounded-full mb-8">
          <Coffee className="h-16 w-16 text-amber-800" />
        </div>
        <h1 className="text-4xl font-black text-stone-900 mb-4 tracking-tighter uppercase">{title}</h1>
        <p className="text-stone-500 max-w-md text-lg">
          This section is currently being brewed. We're working hard to bring you the best coffee discovery experience.
        </p>
        <div className="mt-10 h-1 w-20 bg-stone-200 rounded-full" />
      </div>
    </MainLayout>
  );
}
