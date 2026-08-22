import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, Token, BulkTokenResponse, PaginatedTokens, TokenConfig, GenerateTokenInput, BulkTokenInput } from '@/types'

export async function generateToken(input: GenerateTokenInput): Promise<Token> {
  const res = await apiClient.post<ApiResponse<Token>>(apiConfig.endpoints.token.generate, input)
  return res.data.data
}

export async function bulkGenerateTokens(input: BulkTokenInput): Promise<BulkTokenResponse> {
  const res = await apiClient.post<ApiResponse<BulkTokenResponse>>(apiConfig.endpoints.token.bulk, input)
  return res.data.data
}

export async function listTokens(query: { page?: number; perPage?: number; batchId?: string; search?: string; status?: string } = {}): Promise<PaginatedTokens> {
  const res = await apiClient.get<ApiResponse<PaginatedTokens>>(apiConfig.endpoints.token.list, { params: query })
  return res.data.data
}

export async function getToken(tokenNo: string): Promise<Token> {
  const res = await apiClient.get<ApiResponse<Token>>(apiConfig.endpoints.token.get(tokenNo))
  return res.data.data
}

export async function voidToken(tokenNo: string): Promise<Token> {
  const res = await apiClient.post<ApiResponse<Token>>(apiConfig.endpoints.token.void(tokenNo))
  return res.data.data
}

export async function getTokenConfig(): Promise<TokenConfig> {
  const res = await apiClient.get<ApiResponse<{ config: TokenConfig }>>(apiConfig.endpoints.admin.tokenConfig)
  return res.data.data.config
}

export async function updateTokenConfig(data: Partial<TokenConfig>): Promise<Partial<TokenConfig>> {
  const res = await apiClient.post<ApiResponse<Partial<TokenConfig>>>(apiConfig.endpoints.admin.tokenConfig, data)
  return res.data.data
}

export async function resetTokenCounter(): Promise<{ nextTokenStartsAt: number }> {
  const res = await apiClient.post<ApiResponse<{ nextTokenStartsAt: number }>>(apiConfig.endpoints.admin.tokenConfigReset)
  return res.data.data
}
