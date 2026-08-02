import 'server-only'

import { lookup } from 'node:dns/promises'
import { request } from 'node:https'
import { assertPublicIpAddress, UnsafeCrmWebhookUrlError } from './crmWebhookUrl'

const REQUEST_TIMEOUT_MS = 5_000

type ResolvedAddress = { address: string; family: 4 | 6 }

export async function postCrmWebhook(
  url: string,
  payload: unknown,
  deliveryHeaders: { idempotencyKey: string; deliveryId: string } | null = null,
) {
  const target = new URL(url)
  let addresses: ResolvedAddress[]

  try {
    addresses = await lookup(target.hostname, { all: true, verbatim: true }) as ResolvedAddress[]
  } catch {
    throw new UnsafeCrmWebhookUrlError('CRM webhook hostname could not be resolved safely.')
  }

  if (!addresses.length) {
    throw new UnsafeCrmWebhookUrlError('CRM webhook hostname did not resolve to a public address.')
  }
  for (const { address } of addresses) assertPublicIpAddress(address)

  const body = JSON.stringify(payload)

  return new Promise<{ ok: boolean; status: number }>((resolve, reject) => {
    const req = request(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...(deliveryHeaders ? {
          'Idempotency-Key': deliveryHeaders.idempotencyKey,
          'X-CoQuest-Delivery-Id': deliveryHeaders.deliveryId,
        } : {}),
      },
      lookup: (_hostname, options, callback) => {
        const requestedFamily = typeof options === 'number' ? options : options.family
        const eligible = addresses.filter(({ family }) => !requestedFamily || family === requestedFamily)
        if (!eligible.length) {
          const error = Object.assign(new Error('No verified address for requested family'), {
            code: 'ENOTFOUND',
          })
          if (typeof options !== 'number' && options.all) callback(error, [])
          else callback(error, '', 4)
          return
        }
        if (typeof options !== 'number' && options.all) {
          callback(null, eligible)
          return
        }
        callback(null, eligible[0].address, eligible[0].family)
      },
      timeout: REQUEST_TIMEOUT_MS,
    }, (response) => {
      response.resume()
      response.on('end', () => {
        clearTimeout(absoluteTimeout)
        const status = response.statusCode ?? 0
        resolve({ ok: status >= 200 && status < 300, status })
      })
    })

    const absoluteTimeout = setTimeout(
      () => req.destroy(new Error('CRM webhook request timed out')),
      REQUEST_TIMEOUT_MS,
    )
    req.on('timeout', () => req.destroy(new Error('CRM webhook request timed out')))
    req.on('error', (error) => {
      clearTimeout(absoluteTimeout)
      reject(error)
    })
    req.end(body)
  })
}
