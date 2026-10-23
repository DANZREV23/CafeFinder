import { fetchApi } from './api';

export interface Reward {
  id: string;
  programId: string;
  name: string;
  description?: string;
  pointsCost: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  stockLimit?: number | null;
  startsAt?: string;
  endsAt?: string;
  termsAndConditions?: string;
  createdAt: string;
  updatedAt: string;
  program?: {
    id: string;
    name: string;
    cafeId: string;
    cafe?: {
      id: string;
      name: string;
      slug: string;
      city?: string;
      address?: string;
      photos?: { url: string }[];
    };
  };
}

export interface LoyaltyProgram {
  id: string;
  cafeId: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'PAUSED' | 'SUSPENDED';
  pointsEnabled: boolean;
  pointsPerVisit: number;
  minimumRedemptionPoints: number;
  termsAndConditions?: string;
  startsAt?: string;
  endsAt?: string;
  rewards?: Reward[];
  cafe?: {
    id: string;
    name: string;
    slug: string;
    city?: string;
  };
}

export interface LoyaltyAccount {
  id: string;
  programId: string;
  userId: string;
  pointsBalance: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
  status?: string;
  joinedAt: string;
  program?: LoyaltyProgram;
  transactions?: LoyaltyTransaction[];
}

export interface LoyaltyTransaction {
  id: string;
  accountId: string;
  type: 'EARN' | 'REDEEM' | 'ADJUSTMENT' | 'EXPIRE' | 'REVERSAL';
  points: number;
  description?: string;
  createdAt: string;
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  accountId: string;
  pointsSpent: number;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'REDEEMED' | 'CANCELLED' | 'EXPIRED';
  codeHint?: string;
  plainCode?: string;
  notes?: string;
  rejectionReason?: string;
  requestedAt: string;
  approvedAt?: string;
  redeemedAt?: string;
  expiresAt?: string;
  reward?: Reward;
  account?: LoyaltyAccount;
}

export interface CustomerLoyaltyDashboard {
  accounts: LoyaltyAccount[];
  redemptions: RewardRedemption[];
  pendingCheckIns: any[];
  availableRewards: Reward[];
}

export const loyaltyService = {
  // Public
  getPublicRewards: async (params: { page?: number; limit?: number; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    return fetchApi<{ success: boolean; data: Reward[]; pagination: any }>(`/loyalty/rewards?${query.toString()}`);
  },

  getCafeLoyalty: async (cafeId: string) => {
    return fetchApi<{ success: boolean; data: { program: LoyaltyProgram | null; account: LoyaltyAccount | null; rewards: Reward[] } }>(`/loyalty/cafes/${cafeId}`);
  },

  // Customer
  getCustomerDashboard: async () => {
    return fetchApi<{ success: boolean; data: CustomerLoyaltyDashboard }>(`/loyalty/my-dashboard`);
  },

  enroll: async (cafeId: string) => {
    return fetchApi<{ success: boolean; data: LoyaltyAccount; message?: string }>(`/loyalty/cafes/${cafeId}/enroll`, {
      method: 'POST',
    });
  },

  leave: async (programId: string) => {
    return fetchApi<{ success: boolean; message: string }>(`/loyalty/programs/${programId}/leave`, {
      method: 'POST',
    });
  },

  leaveProgram: async (programId: string) => {
    return fetchApi<{ success: boolean; message: string }>(`/loyalty/programs/${programId}/leave`, {
      method: 'POST',
    });
  },

  checkIn: async (cafeId: string, visitNotes?: string) => {
    return fetchApi<{ success: boolean; data: any; message: string }>(`/loyalty/cafes/${cafeId}/check-in`, {
      method: 'POST',
      body: JSON.stringify({ visitNotes }),
    });
  },

  redeemReward: async (rewardId: string, notes?: string) => {
    return fetchApi<{ success: boolean; data: RewardRedemption; message?: string }>(`/loyalty/rewards/${rewardId}/redeem`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  cancelRedemption: async (redemptionId: string) => {
    return fetchApi<{ success: boolean; data: RewardRedemption; message?: string }>(`/loyalty/redemptions/${redemptionId}/cancel`, {
      method: 'POST',
    });
  },

  regenerateCode: async (redemptionId: string) => {
    return fetchApi<{ success: boolean; data: { plainCode?: string; verificationCode?: string; code?: string; codeHint?: string } }>(`/loyalty/redemptions/${redemptionId}/code`, {
      method: 'POST',
    });
  },

  // Owner
  getOwnerOverview: async (cafeId?: string) => {
    const query = cafeId ? `?cafeId=${encodeURIComponent(cafeId)}` : '';
    return fetchApi<{ success: boolean; data: any }>(`/owner/loyalty/overview${query}`);
  },

  upsertOwnerProgram: async (cafeId: string, data: Partial<LoyaltyProgram>) => {
    return fetchApi<{ success: boolean; data: LoyaltyProgram }>(`/owner/loyalty/cafes/${cafeId}/program`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  createOwnerReward: async (cafeId: string, data: Partial<Reward>) => {
    return fetchApi<{ success: boolean; data: Reward }>(`/owner/loyalty/cafes/${cafeId}/rewards`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateOwnerReward: async (cafeId: string, rewardId: string, data: Partial<Reward>) => {
    return fetchApi<{ success: boolean; data: Reward }>(`/owner/loyalty/cafes/${cafeId}/rewards/${rewardId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteOwnerReward: async (cafeId: string, rewardId: string) => {
    return fetchApi<{ success: boolean; data: any }>(`/owner/loyalty/cafes/${cafeId}/rewards/${rewardId}`, {
      method: 'DELETE',
    });
  },

  getOwnerCustomers: async (cafeId: string, search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return fetchApi<{ success: boolean; data: any[] }>(`/owner/loyalty/cafes/${cafeId}/customers${query}`);
  },

  issueOwnerPoints: async (cafeId: string, data: { accountId: string; points: number; mode?: 'VISIT_EARN' | 'ADJUSTMENT'; type?: string; description?: string; reason?: string }) => {
    const payload = {
      ...data,
      mode: data.mode || (data.type === 'EARN' ? 'VISIT_EARN' : 'ADJUSTMENT'),
    };
    return fetchApi<{ success: boolean; data: any }>(`/owner/loyalty/cafes/${cafeId}/points`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  reviewCheckIn: async (cafeId: string, checkInId: string, approved: boolean, pointsAwarded?: number, ownerNotes?: string) => {
    return fetchApi<{ success: boolean; data: any }>(`/owner/loyalty/cafes/${cafeId}/check-ins/${checkInId}/review`, {
      method: 'POST',
      body: JSON.stringify({
        decision: approved ? 'APPROVED' : 'REJECTED',
        approved,
        pointsAwarded,
        ownerNotes,
        rejectionReason: ownerNotes,
      }),
    });
  },

  processOwnerRedemption: async (cafeId: string, redemptionId: string, action: 'APPROVE' | 'REJECT' | 'REDEEM', rejectionReason?: string, verificationCode?: string) => {
    return fetchApi<{ success: boolean; data: any }>(`/owner/loyalty/cafes/${cafeId}/redemptions/${redemptionId}/process`, {
      method: 'POST',
      body: JSON.stringify({ action, rejectionReason, verificationCode }),
    });
  },

  // Admin
  getAdminOverview: async () => {
    return fetchApi<{ success: boolean; data: any }>(`/admin/loyalty`);
  },

  adminUpdateProgramStatus: async (programId: string, status: 'ACTIVE' | 'PAUSED' | 'SUSPENDED') => {
    return fetchApi<{ success: boolean; data: any }>(`/admin/loyalty/programs/${programId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  adminUpdateAccountStatus: async (accountId: string, status: string) => {
    return fetchApi<{ success: boolean; data: any }>(`/admin/loyalty/accounts/${accountId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  adminReconcileLedgers: async () => {
    return fetchApi<{ success: boolean; data: any }>(`/admin/loyalty/reconcile`, {
      method: 'POST',
    });
  },
};
