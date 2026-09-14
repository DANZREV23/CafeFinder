import { CafeSubmissionStatus } from '@prisma/client';

export interface CreateSubmissionDto {
  name: string;
  shortDescription: string;
  description: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  priceRange?: number;
  amenityIds?: string[];
}

export interface UpdateSubmissionDto {
  name?: string;
  shortDescription?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  priceRange?: number;
  amenityIds?: string[];
}

export interface SubmissionResponseDto {
  id: string;
  submittedById: string;
  cafeId: string | null;
  name: string;
  shortDescription: string;
  description: string;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  priceRange: number | null;
  status: CafeSubmissionStatus;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  photos: {
    id: string;
    url: string;
    caption: string | null;
  }[];
  amenities: {
    id: string;
    name: string;
  }[];
}
