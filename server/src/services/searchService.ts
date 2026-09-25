import { SearchRepository, SearchSuggestion } from '../repositories/searchRepository.js';

export class SearchService {
  private searchRepository: SearchRepository;

  constructor() {
    this.searchRepository = new SearchRepository();
  }

  async getSuggestions(query: string, limit: number = 8): Promise<SearchSuggestion[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();

    // Fetch in parallel
    const [cafes, cities, amenities, articles] = await Promise.all([
      this.searchRepository.getCafeSuggestions(normalizedQuery, limit),
      this.searchRepository.getCitySuggestions(normalizedQuery, Math.floor(limit / 2)),
      this.searchRepository.getAmenitySuggestions(normalizedQuery, Math.floor(limit / 2)),
      this.searchRepository.getArticleSuggestions(normalizedQuery, limit)
    ]);

    // Combine and sort by relevance (simple heuristic)
    // 1. Exact matches first
    // 2. Starts with query
    // 3. Contains query
    
    const combined = [...cafes, ...cities, ...amenities, ...articles];
    
    return combined
      .sort((a, b) => {
        const aLabel = a.label.toLowerCase();
        const bLabel = b.label.toLowerCase();
        
        const aExact = aLabel === normalizedQuery;
        const bExact = bLabel === normalizedQuery;
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        const aStarts = aLabel.startsWith(normalizedQuery);
        const bStarts = bLabel.startsWith(normalizedQuery);
        
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
        return 0;
      })
      .slice(0, limit);
  }
}
