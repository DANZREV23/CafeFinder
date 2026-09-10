import * as React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Coffee } from "lucide-react";

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <MainLayout>
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-40 px-4 text-center">
          <div className="bg-brand-cream p-8 rounded-full mb-8">
            <Coffee className="h-16 w-16 text-brand-coffee" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-brand-charcoal mb-4">{title}</h1>
          <p className="text-brand-muted max-w-md text-lg font-sans">
            This section is currently being brewed. We're working hard to bring you the best coffee discovery experience.
          </p>
          <div className="mt-12 h-1.5 w-24 bg-brand-border rounded-full" />
        </div>
      </PageContainer>
    </MainLayout>
  );
}
