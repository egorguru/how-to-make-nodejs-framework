const http = require('node:http')
const url = require('node:url')

const { Router } = require('./router')
const { compose } = require('./compose')

class Framework extends Router {

  constructor() {
    super()

    this._server = http.createServer()
    this._middleware = []
    this._contentTypeParsers = {
      'application/json': body => JSON.parse(body),
    }
    this._responseProcessors = {
      'text/plain': (res, body) => res.end(body),
      'application/json': (res, body) => res.end(JSON.stringify(body)),
    }
  }

  middleware(...fns) {
    this._middleware.push(...fns)
    return this
  }

  addContentTypeParser(contentType, parser) {
    this._contentTypeParsers[contentType] = parser
  }

  addResponseProcessor(contentType, processor) {
    this._responseProcessors[contentType] = processor
  }

  start(port) {
    this._server.on('request', this._createListener())
    return new Promise(resolve => {
      this._server.listen(port, () => resolve())
    })
  }

  _createListener() {
    const middleware = compose(this._middleware)
    return async (req, res) => {
      const context = {
        request: await this._createRequest(req),
        response: {
          raw: res,
          status: 200,
          contentType: 'application/json',
          headers: {},
          body: '',
        },
      }
      try {
        await middleware(context)
        const routerHandler = this._find(context)
        await routerHandler(context)
      } catch (error) {
        console.log(error)
        context.response.status = 500
        context.response.contentType = 'text/plain'
        context.response.body = 'Internal Server Error'
      }
      await this._finishResponse(context)
    }
  }

  async _createRequest(req) {
    const parsedUrl = new url.URL(req.url, `http://${req.headers.host}`)
    return {
      raw: req,
      headers: req.headers,
      method: req.method,
      path: parsedUrl.pathname,
      query: this._parseQuery(parsedUrl.searchParams),
      body: await this._readRequestBody(req),
    }
  }

  _parseQuery(searchParams) {
    const result = {}
    for (const [key, value] of searchParams.entries()) {
      result[key] = value
    }
    return result
  }

  _readRequestBody(req) {
    return new Promise(resolve => {
      let buffer = ''
      req.on('data', chunk => {
        buffer += chunk
      })
      req.on('end', () => {
        const contentTypeParser = this._contentTypeParsers[req.headers['content-type']]
        const body = contentTypeParser === undefined ? buffer : contentTypeParser(buffer)
        resolve(body)
      })
    })
  }

  async _finishResponse(ctx) {
    const { raw: res, status, contentType, headers, body } = ctx.response
    res.writeHead(status, { ...headers, 'content-type': contentType })
    await this._responseProcessors[contentType](res, body)
  }

  stop() {
    return new Promise((resolve, reject) => {
      this._server.close(err => {
        if (err !== undefined) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }
}

exports.Framework = Framework
