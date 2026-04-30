import { PrismaClient } from '@prisma/client'
import BetterSqlite3 from 'better-sqlite3'
import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'
  const dbPath = databaseUrl.startsWith('file:')
    ? path.resolve(process.cwd(), databaseUrl.replace('file:./', '').replace('file:', ''))
    : databaseUrl
  const sqlite = new BetterSqlite3(dbPath)
  const adapter = new PrismaBetterSQLite3(sqlite)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const db =
  globalForPrisma.prisma ??
  createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
