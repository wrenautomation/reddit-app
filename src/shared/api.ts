import type {JsonValue} from '@devvit/web/shared'

/** Generic error detail for all responses. */
export type ErrorRsp = {error: string; status: number}

/** One Reddit call wren asks for, in the Data API's words (`POST /api/submit`). */
export type Job = {
  id: string
  method: 'GET' | 'POST'
  path: string
  input: {[key: string]: JsonValue}
}

/** What a job answered: the Data API's JSON, or why it failed. */
export type Done =
  | {id: string; ok: true; body: JsonValue}
  | {id: string; ok: false; status: number; error: string}

/** The poll's one exchange: results go up, the next jobs come down. */
export type RelayReq = {done: Done[]}
export type RelayRsp = {jobs: Job[]}

export type Endpoint = (typeof Endpoint)[keyof typeof Endpoint]
export const Endpoint = {
  Poll: 'internal/relay/poll',
  Run: 'external/run',
} as const

export const EndpointMethod = {
  [Endpoint.Poll]: 'POST',
  [Endpoint.Run]: 'POST',
} as const satisfies {[endpoint: string]: 'GET' | 'POST'}
