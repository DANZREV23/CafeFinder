export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'USER' | 'OWNER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface Amenity {
  id: string;
  name: string;
  label: string;
  icon?: string;
}

export interface CafeAmenity {
  cafeId: string;
  amenityId: string;
  amenity: Amenity;
}

export interface CafePhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  altText?: string;
  isCover: boolean;
}

export interface CafeHours {
  id: string;
  dayOfWeek: number;
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface Cafe {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  priceRange: number;
  ratingAverage: number;
  reviewCount: number;
  featured: boolean;
  trending: boolean;
  verified?: boolean;
  coffeeType?: string;
  status: string;
  photos?: CafePhoto[];
  amenities?: CafeAmenity[];
  hours?: CafeHours[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
  };
}

export interface ListResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
