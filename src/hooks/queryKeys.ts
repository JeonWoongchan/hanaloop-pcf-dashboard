export const queryKeys = {
    countries: {
        all: ['countries'] as const,
    },
    companies: {
        all: ['companies'] as const,
        detail: (id: string) => ['companies', id] as const,
    },
    posts: {
        all: ['posts'] as const,
        byCompany: (companyId: string) => ['posts', 'company', companyId] as const,
    },
    activityRecords: {
        all: ['activityRecords'] as const,
        byCompany: (companyId: string) => ['activityRecords', 'company', companyId] as const,
    },
    ghgEmissions: {
        byCompany: (companyId: string) => ['ghgEmissions', 'company', companyId] as const,
    },
} as const;
