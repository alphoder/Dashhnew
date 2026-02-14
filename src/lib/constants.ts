export const APP_CONFIG = {
  name: 'DASHH',
  description: 'Engage and Earn with Instagram Stories',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

export const NETWORK_CONFIG = {
  solana: {
    cluster: process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'devnet',
    rpcEndpoint: process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com',
  },
} as const;

export const API_ROUTES = {
  posts: '/api/posts',
  donate: '/api/donate',
  redirect: '/api/redirect',
  upload: '/api/upload-to-arweave',
  campaigns: '/api/generate/campaigns',
} as const;

export const PAGINATION = {
  defaultPageSize: 10,
  maxPageSize: 100,
} as const;

export const VALIDATION = {
  minCampaignAmount: 0.01,
  maxTitleLength: 100,
  maxDescriptionLength: 500,
} as const;
