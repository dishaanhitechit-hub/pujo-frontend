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
      tokenConfig: '/api/admin/token-config',
      tokenConfigReset: '/api/admin/token-config/reset',
    },
    payment: {
      initiate: '/api/payment/initiate',
      receipt: (id: number) => `/api/payment/receipt/${id}`,
      byReceiptNo: (receiptNo: string) => `/api/payment/by-receipt/${receiptNo}`,
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
    pledge: {
      list: '/api/pledge/',
      create: '/api/pledge/',
      get: (id: number) => `/api/pledge/${id}`,
      pay: (id: number) => `/api/pledge/${id}/pay`,
      cancel: (id: number) => `/api/pledge/${id}/cancel`,
    },
    donor: {
      list: '/api/donor/',
      get: (id: number) => `/api/donor/${id}`,
    },
    token: {
      generate: '/api/token/generate',
      bulk: '/api/token/bulk',
      list: '/api/token/list',
      get: (tokenNo: string) => `/api/token/${tokenNo}`,
      void: (tokenNo: string) => `/api/token/${tokenNo}/void`,
    },
  },
  backendPages: {
    payQr: (paymentId: number) => `/pay/qr/${paymentId}`,
    payCash: (paymentId: number) => `/pay/cash/${paymentId}`,
    payCheque: (paymentId: number) => `/pay/cheque/${paymentId}`,
    payReceipt: (paymentId: number) => `/pay/receipt/${paymentId}`,
    receipt: (receiptNo: string) => `/receipt/${receiptNo}`,
    tokenView: (tokenNo: string) => `/token/${tokenNo}`,
    tokenPrint: (tokenNo: string) => `/token/print/${tokenNo}`,
    tokenPrintBulk: (batchId: string) => `/token/print/bulk/${batchId}`,
  },
} as const
