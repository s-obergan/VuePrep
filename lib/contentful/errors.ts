export class ContentfulError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ContentfulError'
  }
}

export class ContentfulConfigError extends ContentfulError {
  constructor(message: string) {
    super(message)
    this.name = 'ContentfulConfigError'
  }
}

export class ContentfulHttpError extends ContentfulError {

  readonly status: number | undefined

  constructor(message: string, status?: number, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ContentfulHttpError'
    this.status = status
  }
}

export class ContentfulQueryError extends ContentfulError {

  readonly details: readonly string[]

  constructor(message: string, details: readonly string[] = []) {
    super(message)
    this.name = 'ContentfulQueryError'
    this.details = details
  }
}
