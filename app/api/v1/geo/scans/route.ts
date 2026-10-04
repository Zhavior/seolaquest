import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withApiHandler } from '@/src/modules/core/infrastructure/api-handler'
import { safeJson } from '@/src/modules/core/infrastructure/safeJson'
import { GeoScanService } from '@/src/modules/geo/application/GeoScanService'

export const GET = withApiHandler(async () => {
  const scans = await GeoScanService.listRecent()
  return NextResponse.json({ success: true, scans })
})

const PostGeoScanSchema = z.object({
  query: z.string().min(3, 'Use at least 3 characters for the query.').max(300, 'Query is too long.'),
  brandDomain: z.string().min(3, 'Enter a domain like example.com.').max(253, 'Domain is too long.'),
})

// Runs the engine call inline (one request ≈ one scan) rather than through the
// durable job queue: this is a single-user prototype and the caller wants the
// raw result back. Move to a job when scans are scheduled.
export const POST = withApiHandler(async (req) => {
  const input = PostGeoScanSchema.parse(await safeJson(req))
  const scan = await GeoScanService.runScan(input)
  return NextResponse.json({ success: scan.status === 'COMPLETED', scan }, { status: scan.status === 'COMPLETED' ? 200 : 502 })
})
