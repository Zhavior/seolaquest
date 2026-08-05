import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logger } from '@/src/modules/core/infrastructure/logger'

export async function GET() {
  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
      },
    })
  } catch (error) {
    logger.error({ err: error, event: 'health_probe_failed' }, 'Health probe failed')
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        services: {
          database: 'disconnected',
        },
      },
      { status: 503 }
    )
  }
}
