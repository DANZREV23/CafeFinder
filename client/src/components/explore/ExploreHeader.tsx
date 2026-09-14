import * as React from "react";

interface ExploreHeaderProps {
  searchQuery?: string;
  totalResults: number;
}

export const ExploreHeader: React.FC<ExploreHeaderProps> = ({ searchQuery, totalResults }) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl md:text-4xl font-display font-bold text-brand-charcoal mb-2">
        {searchQuery ? (
          <>
            Results for <span className="italic text-brand-coffee">"{searchQuery}"</span>
          </>
        ) : (
          "Explore Cafes"
        )}
      </h1>
      <p className="text-brand-muted max-w-2xl text-lg">
        {searchQuery 
          ? `Found ${totalResults} ${totalResults === 1 ? 'cafe' : 'cafes'} matching your search.`
          : "Find coffee shops, workspaces, cozy corners, and local favorites."
        }
      </p>
    </div>
  );
};
