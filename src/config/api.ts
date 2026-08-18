export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://132.154.156.82:5999',
  timeout: 15000,
  endpoints: {
    auth: {
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      me: '/api/auth/me',
    },
    users: {
      list: '/api/users/',
      create: '/api/users/',
      get: (id: number) => `/api/users/${id}`,
      update: (id: number) => `/api/users/${id}`,
      deactivate: (id: number) => `/api/users/${id}`,
    },
    admin: {
      config: '/api/admin/config',
    },
    payment: {
      initiate: '/api/payment/initiate',
      receipt: (id: number) => `/api/payment/receipt/${id}`,
    },
    collector: {
      summary: '/api/collector/summary',
      payments: '/api/collector/payments',
    },
    dashboard: {
      summary: '/api/dashboard/summary',
      collectors: '/api/dashboard/collectors',
      payments: '/api/dashboard/payments',
    },
  },
  backendPages: {
    payQr: (paymentId: number) => `/pay/qr/${paymentId}`,
    payCash: (paymentId: number) => `/pay/cash/${paymentId}`,
    payReceipt: (paymentId: number) => `/pay/receipt/${paymentId}`,
    receipt: (receiptNo: string) => `/receipt/${receiptNo}`,
  },
} as const
