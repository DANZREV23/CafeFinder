export interface Amenity {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface CafePhoto {
  id: string;
  url: string;
  isCover: boolean;
  altText?: string;
}

export interface CafeHours {
  id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface Cafe {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description?: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  priceRange: number;
  ratingAverage: number;
  reviewCount: number;
  featured: boolean;
  trending: boolean;
  verified: boolean;
  photos: CafePhoto[];
  hours?: CafeHours[];
  amenities?: { amenity: Amenity }[];
  website?: string;
  phone?: string;
  email?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: {
    message: string;
    details?: any;
  };
}
