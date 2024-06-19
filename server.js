const fs = require('node:fs')

const { Framework } = require('./framework')

const app = new Framework()

app.addResponseProcessor('image/jpeg', (res, body) => res.end(body))

app.addResponseProcessor('image/png', (res, body) => body.pipe(res))

app.middleware((ctx, next) => {
  console.log('First middleware')
  console.log('Headers:', ctx.request.headers)
  console.log('Path:', ctx.request.path)
  console.log('Query:', ctx.request.query)
  console.log('Body:', ctx.request.body)
  return next()
})

app.get('/api/test', (ctx, next) => {
  console.log('Second middleware')
  return next()
}, ctx => {
  ctx.response.body = { message: 'GET /api/test handler' }
})

app.get('/api/test-param/:paramName', ctx => {
  ctx.response.body = {
    message: 'GET /api/test-param/:paramName handler',
    param: ctx.request.params.paramName,
  }
})

app.get('/api/test-query', ctx => {
  ctx.response.body = {
    message: 'GET /api/test-query handler',
    query: ctx.request.query,
  }
})

app.post('/api/test-body', ctx => {
  ctx.response.body = {
    message: 'POST /api/test-body handler',
    body: ctx.request.body,
  }
})

app.get('/api/image', async ctx => {
  const imageBuffer = await fs.promises.readFile('image.jpg')
  ctx.response.contentType = 'image/jpeg'
  ctx.response.body = imageBuffer
})

app.get('/api/image-stream', async ctx => {
  const imageStream = fs.createReadStream('image.png')
  ctx.response.contentType = 'image/png'
  ctx.response.body = imageStream
})

;(async () => {
  await app.start(8080)
  console.log('Server has been started')
})()
