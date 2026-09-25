import { fetchApi } from './api';
import { ApiResponse } from '../types';

export interface SearchSuggestion {
  type: 'cafe' | 'city' | 'amenity' | 'article';
  id?: string;
  label: string;
  subtitle: string;
  slug?: string;
}

export interface SearchSuggestionsResponse {
  query: string;
  suggestions: SearchSuggestion[];
}

export const searchService = {
  getSuggestions: async (query: string, limit: number = 8, signal?: AbortSignal) => {
    return fetchApi<ApiResponse<SearchSuggestionsResponse>>(
      `/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`,
      { signal }
    );
  }
};
