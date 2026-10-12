import { InquiryCategory, InquiryPriority, InquirySource, InquiryStatus } from '@prisma/client';

export interface CreateInquiryDto {
  cafeId: string;
  subject: string;
  message: string;
  category?: InquiryCategory;
  source?: InquirySource;
  eventId?: string;
  specialId?: string;
  guestName?: string;
  guestEmail?: string;
}

export interface CreateInquiryResponseDto {
  message: string;
}

export interface UpdateInquiryStatusDto {
  status: InquiryStatus;
}

export interface UpdateInquiryPriorityDto {
  priority: InquiryPriority;
}

export interface InquiryFilterDto {
  cafeId?: string;
  userId?: string;
  status?: InquiryStatus;
  priority?: InquiryPriority;
  category?: InquiryCategory;
  source?: InquirySource;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
