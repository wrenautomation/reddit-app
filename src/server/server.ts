import {once} from 'node:events'
import type {IncomingMessage, ServerResponse} from 'node:http'
import {settings} from '@devvit/web/server'
import type {PartialJsonValue} from '@devvit/web/shared'
import {
  type Done,
  Endpoint,
  EndpointMethod,
  type ErrorRsp,
  type Job,
  type RelayReq,
  type RelayRsp,
} from '../shared/api.ts'

/** Wren's relay route: the app's one fetch domain (README, "Fetch Domains"). */
const RELAY_URL = 'https://app.wrenautomation.com/__reddit/relay'

export async function onReq(
  reqMsg: IncomingMessage,
  rspMsg: ServerResponse,
): Promise<void> {
  try {
    await route(reqMsg, rspMsg)
  } catch (err) {
    // Never the stack to a caller: log it, answer the bare message.
    console.error(`server error; ${err instanceof Error ? err.stack : err}`)
    const error = err instanceof Error ? err.message : 'server error'
    writeJson<ErrorRsp>(500, {error, status: 500}, rspMsg)
  }
}

async function route(
  reqMsg: IncomingMessage,
  rspMsg: ServerResponse,
): Promise<void> {
  const endpoint = reqMsg.url?.slice(1).split('?')[0] as Endpoint
  const method = EndpointMethod[endpoint]
  if (method !== reqMsg.method) {
    writeJson<ErrorRsp>(404, {error: 'not found', status: 404}, rspMsg)
    return
  }
  switch (endpoint) {
    case Endpoint.Poll:
      writeJson<{ran: number}>(200, await routePoll(), rspMsg)
      return
    case Endpoint.Run:
      writeJson<Done>(200, await routeRun(reqMsg), rspMsg)
      return
    default:
      endpoint satisfies never
  }
}

/** Each minute: send the last results, take the next jobs, run them. */
async function routePoll(): Promise<{ran: number}> {
  const token = await settings.get<string>('relayToken')
  if (!token) return {ran: 0}
  let done: Done[] = []
  // A few rounds a minute at most, so a full queue drains before the next tick.
  for (let round = 0; round < 3; round++) {
    const rsp = await fetch(RELAY_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({done} satisfies RelayReq),
    })
    if (!rsp.ok) throw Error(`relay answered ${rsp.status}`)
    const {jobs} = (await rsp.json()) as RelayRsp
    if (!jobs.length) return {ran: round}
    done = await Promise.all(jobs.map(run))
  }
  return {ran: 3}
}

/** wren calls the app itself, once Reddit grants managed tokens: one job in, its result out. */
async function routeRun(reqMsg: IncomingMessage): Promise<Done> {
  return run(await readJson<Job>(reqMsg))
}

/** One job, through the Devvit Reddit client. Paths are added as wren's callers need them. */
async function run(job: Job): Promise<Done> {
  return {
    id: job.id,
    ok: false,
    status: 501,
    error: `${job.method} ${job.path} not built`,
  }
}

function writeJson<T extends PartialJsonValue>(
  status: number,
  json: Readonly<T>,
  rsp: ServerResponse,
): void {
  const body = JSON.stringify(json)
  const len = Buffer.byteLength(body)
  rsp.writeHead(status, {
    'Content-Length': len,
    'Content-Type': 'application/json',
  })
  rsp.end(body)
}

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Uint8Array[] = []
  req.on('data', chunk => chunks.push(chunk))
  await once(req, 'end')
  return JSON.parse(`${Buffer.concat(chunks)}`)
}
