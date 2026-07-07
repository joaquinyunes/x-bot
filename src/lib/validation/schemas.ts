import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const createAccountSchema = z.object({
  userId: z.string().min(1),
})

export const actionSchema = z.object({
  url: z.string().url(),
  action: z.enum(['like', 'retweet', 'comment']),
  commentText: z.string().optional(),
})

export const createCampaignSchema = z.object({
  accountIds: z.array(z.string()).min(1),
  urls: z.array(z.string().url()).min(1),
  comments: z.array(z.string()).optional().default([]),
  commentsPerUrl: z.record(z.string(), z.array(z.string())).optional(),
  browsersCount: z.number().int().min(1).max(5).optional().default(1),
})

export const seedSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
})

export const createClientSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
})
