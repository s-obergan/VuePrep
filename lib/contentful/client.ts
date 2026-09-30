import { ApolloClient, gql, InMemoryCache, type DocumentNode } from '@apollo/client/core'
import {
  CombinedGraphQLErrors,
  ServerError,
  ServerParseError,
} from '@apollo/client/errors'
import { ApolloLink, from } from '@apollo/client/link'
import { HttpLink } from '@apollo/client/link/http'
import { tap } from 'rxjs'

import { graphqlEndpoint, type ContentfulConfig } from './config'
import { ContentfulHttpError, ContentfulQueryError } from './errors'

export interface RequestOptions {

  config: ContentfulConfig
  variables?: Record<string, unknown>

  signal?: AbortSignal
}

const documents = new Map<string, DocumentNode>()

function documentFor(source: string): DocumentNode {
  let document = documents.get(source)
  if (document === undefined) {
    document = gql(source)
    documents.set(source, document)
  }
  return document
}

const logLink = new ApolloLink((operation, forward) => {
  if (!import.meta.dev) return forward(operation)

  const { operationName, variables } = operation
  const startedAt = Date.now()

  console.info(`[contentful] → ${operationName}`, variables)

  return forward(operation).pipe(
    tap({
      next: () => {
        console.info(`[contentful] ← ${operationName} in ${Date.now() - startedAt}ms`)
      },
      error: (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error)
        console.warn(`[contentful] ✕ ${operationName} failed: ${message}`)
      },
    }),
  )
})

let memoised: { key: string; client: ApolloClient } | undefined

function clientFor(config: ContentfulConfig): ApolloClient {
  const key = `${graphqlEndpoint(config)}#${config.accessToken}`
  if (memoised?.key === key) return memoised.client

  const client = new ApolloClient({

    cache: new InMemoryCache(),
    link: from([
      logLink,
      new HttpLink({
        uri: graphqlEndpoint(config),
        headers: { Authorization: `Bearer ${config.accessToken}` },
      }),
    ]),

    queryDeduplication: false,

    devtools: { enabled: import.meta.dev },
  })

  memoised = { key, client }
  return client
}

export async function request<TData>(query: string, options: RequestOptions): Promise<TData> {
  const { config } = options
  const client = clientFor(config)

  let result
  try {
    result = await client.query<TData>({
      query: documentFor(query),
      variables: options.variables,

      fetchPolicy: 'no-cache',
      context: {
        queryDeduplication: false,
        ...(options.signal === undefined ? {} : { fetchOptions: { signal: options.signal } }),
      },
    })
  } catch (error) {
    throw toContentfulError(error, config)
  }

  const data: TData | undefined | null = result.data
  if (data === undefined || data === null) {
    throw new ContentfulQueryError('Contentful returned no data and no errors.')
  }

  return data
}

function toContentfulError(error: unknown, config: ContentfulConfig): Error {

  if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
    return error
  }

  if (ServerError.is(error)) {
    const body = parseBodyText(error.bodyText)
    return new ContentfulHttpError(
      httpMessage(error.statusCode, error.response?.statusText ?? '', body),
      error.statusCode,
    )
  }

  if (ServerParseError.is(error)) {
    return new ContentfulHttpError(
      `Contentful responded ${error.statusCode} with a body that was not JSON.`,
      error.statusCode,
    )
  }

  if (CombinedGraphQLErrors.is(error)) {
    const details = error.errors.map((graphQLError) => graphQLError.message)
    return new ContentfulQueryError(
      `Contentful rejected the query: ${details.join('; ')}`,
      details,
    )
  }

  return new ContentfulHttpError(
    `Could not reach Contentful at ${config.host}. Check your network connection.`,
    undefined,
    { cause: error },
  )
}

function parseBodyText(text: string): unknown {
  if (text === '') return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function messageFromBody(body: unknown): string | undefined {
  if (typeof body === 'string') {
    const trimmed = body.trim()
    return trimmed === '' ? undefined : trimmed.slice(0, 200)
  }

  if (typeof body !== 'object' || body === null) return undefined

  const record = body as Record<string, unknown>
  if (typeof record.message === 'string') return record.message

  if (Array.isArray(record.errors) && record.errors.length > 0) {
    const first: unknown = record.errors[0]
    if (typeof first === 'object' && first !== null) {
      const message = (first as Record<string, unknown>).message
      if (typeof message === 'string') return message
    }
  }

  return undefined
}

function httpMessage(status: number, statusText: string, body: unknown): string {
  const detail = messageFromBody(body) ?? statusText

  const hint =
    status === 401 || status === 403
      ? ' The access token is missing, wrong, or belongs to a different space or environment.'
      : status === 404
        ? ' Check the space ID and environment name.'
        : ''

  return `Contentful responded ${status}${statusText === '' ? '' : ` ${statusText}`}: ${detail}${hint}`
}
