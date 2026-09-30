import * as React from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { SkipLink } from "../ui/SkipLink";
import { OfflineIndicator } from "../pwa/OfflineIndicator";
import { InstallAppPrompt } from "../pwa/InstallAppPrompt";

interface MainLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export function MainLayout({ children, showFooter = true }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <SkipLink />
      <Navbar />
      <main id="main-content" className="flex-grow" tabIndex={-1}>
        {children}
      </main>
      {showFooter && <Footer />}
      <OfflineIndicator />
      <InstallAppPrompt />
    </div>
  );
}
