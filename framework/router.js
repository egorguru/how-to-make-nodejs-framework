const { PrefixTree } = require('./prefix-tree')
const { compose } = require('./compose')

class Router {

  constructor() {
    this._router = new PrefixTree()
    this._notFoundHandler = (ctx) => {
      ctx.response.status = 404
      ctx.response.contentType = 'text/plain'
      ctx.response.body = 'Not Found'
    }
  }

  get(path, ...handlers) {
    return this._add('GET', path, handlers)
  }

  head(path, ...handlers) {
    return this._add('HEAD', path, handlers)
  }

  post(path, ...handlers) {
    return this._add('POST', path, handlers)
  }

  put(path, ...handlers) {
    return this._add('PUT', path, handlers)
  }

  delete(path, ...handlers) {
    return this._add('DELETE', path, handlers)
  }

  options(path, ...handlers) {
    return this._add('OPTIONS', path, handlers)
  }

  patch(path, ...handlers) {
    return this._add('PATCH', path, handlers)
  }

  _add(method, path, handlers) {
    this._router.add(method, path, compose(handlers))
    return this
  }

  _find(ctx) {
    const { method, path } = ctx.request
    const route = this._router.find(method, path)
    if (route === null) {
      return this._notFoundHandler
    }
    const { params, value } = route
    ctx.request.params = params
    return value
  }
}

exports.Router = Router
