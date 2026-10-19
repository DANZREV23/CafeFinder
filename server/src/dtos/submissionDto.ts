import { CafeSubmissionStatus } from '@prisma/client';

export interface CreateSubmissionDto {
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  address: string;
  city: string;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  priceRange?: number | null;
  amenityIds?: string[];
}

export interface UpdateSubmissionDto extends Partial<CreateSubmissionDto> {
  status?: CafeSubmissionStatus;
  rejectionReason?: string | null;
}

export interface SubmissionResponseDto {
  id: string;
  submittedById: string;
  cafeId?: string | null;
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  address: string;
  city: string;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  priceRange?: number | null;
  status: CafeSubmissionStatus;
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  photos: Array<{
    id: string;
    url: string;
    caption?: string | null;
  }>;
  amenities: Array<{
    id: string;
    name: string;
  }>;
}
