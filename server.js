// Production web server for the MrBen player site front-end.
// Serves the Vite build in ./dist over HTTP with SPA routing, gzip compression and
// the same security headers we previously set at the edge (ported from vercel.json).
// Runs standalone inside its own container — no Vercel, no external platform.
import express from 'express'
import compression from 'compression'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, 'dist')
const PORT = Number(process.env.PORT) || 8080
const HOST = process.env.HOST || '0.0.0.0'

// CSP and Permissions-Policy are overridable via env so the API origin can change
// without a rebuild; the defaults below match this app's original policy.
const CSP = process.env.CSP || "default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self' https://www.googletagmanager.com https://connect.facebook.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://*.mrben.ai https://*.mrben.com https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com; frame-src 'self' https:; form-action 'self'; frame-ancestors 'none'"
const PERMISSIONS_POLICY = process.env.PERMISSIONS_POLICY || "camera=(), microphone=(), geolocation=(), usb=(), payment=()"

const app = express()
app.disable('x-powered-by')
app.use(compression())

app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', PERMISSIONS_POLICY)
  res.setHeader('Content-Security-Policy', CSP)
  next()
})

// Liveness/readiness probe for the container platform.
app.get('/healthz', (_req, res) => res.status(200).type('text/plain').send('ok'))

// Hashed build assets can cache for a year; the HTML shell must never be cached.
app.use(express.static(DIST, {
  index: false,
  etag: true,
  maxAge: '1y',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache')
  },
}))

// SPA fallback — every unmatched route returns index.html.
app.get('*', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache')
  res.sendFile(path.join(DIST, 'index.html'))
})

const server = app.listen(PORT, HOST, () => {
  console.log(`[mrben:player site] serving ${DIST} on http://${HOST}:${PORT}`)
})
const shutdown = () => server.close(() => process.exit(0))
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
