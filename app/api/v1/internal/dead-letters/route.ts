import { OperationalHealthService } from '@/src/modules/operations/application/OperationalHealthService'
import { verifyMachineBearer } from '@/src/modules/core/security/machineBearer'

export async function GET(request: Request) {
  const authorization = verifyMachineBearer(
    request.headers.get('authorization'),
    process.env.OPS_SECRET,
  )
  if (authorization === 'missing_config') {
    return Response.json({ status: 'unavailable' }, { status: 503 })
  }
  if (authorization !== 'authorized') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const snapshot = await OperationalHealthService.snapshot()
    return Response.json({ checkedAt: snapshot.checkedAt, counts: snapshot.counts })
  } catch {
    return Response.json({ status: 'unavailable' }, { status: 503 })
  }
}
