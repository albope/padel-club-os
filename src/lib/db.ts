import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

// This prevents creating new connections on every hot-reload in development
const db = globalThis.prisma ?? prismaClientSingleton()

export { db }

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db
