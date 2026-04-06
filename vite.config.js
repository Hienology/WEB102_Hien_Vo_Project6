import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import process from 'node:process'

function openSkyProxyPlugin(env) {
  const apiBase = (env.OPENSKY_API_BASE_URL || env.VITE_OPENSKY_API_BASE_URL || 'https://opensky-network.org/api').replace(/\/+$/, '')
  const tokenUrl = env.OPENSKY_TOKEN_URL || env.VITE_OPENSKY_TOKEN_URL || 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token'
  const clientId = env.OPENSKY_CLIENT_ID || env.VITE_OPENSKY_CLIENT_ID || ''
  const clientSecret = env.OPENSKY_CLIENT_SECRET || env.VITE_OPENSKY_CLIENT_SECRET || ''

  let cachedToken = ''
  let tokenExpiresAt = 0

  async function getAccessToken() {
    if (!clientId || !clientSecret) {
      throw new Error('Missing OpenSky credentials in .env.local (VITE_OPENSKY_CLIENT_ID / VITE_OPENSKY_CLIENT_SECRET).')
    }

    if (cachedToken && Date.now() < tokenExpiresAt - 30_000) {
      return cachedToken
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`OpenSky auth failed (${response.status}): ${text.slice(0, 180)}`)
    }

    const json = await response.json()
    if (!json?.access_token) {
      throw new Error('OpenSky auth returned no access_token.')
    }

    const expiresInMs = (Number(json.expires_in) || 1800) * 1000
    cachedToken = json.access_token
    tokenExpiresAt = Date.now() + expiresInMs
    return cachedToken
  }

  return {
    name: 'opensky-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/opensky/departures', async (req, res) => {
        try {
          if (req.method !== 'GET') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ message: 'Method not allowed' }))
            return
          }

          const url = new URL(req.url || '/', 'http://localhost')
          const airport = (url.searchParams.get('airport') || '').toUpperCase()
          const begin = url.searchParams.get('begin') || ''
          const end = url.searchParams.get('end') || ''

          if (!/^[A-Z0-9]{4}$/.test(airport) || !/^\d+$/.test(begin) || !/^\d+$/.test(end)) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ message: 'Invalid airport/begin/end query params' }))
            return
          }

          const token = await getAccessToken()
          const upstream = await fetch(
            `${apiBase}/flights/departure?airport=${encodeURIComponent(airport)}&begin=${encodeURIComponent(begin)}&end=${encodeURIComponent(end)}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )

          const body = await upstream.text()
          res.statusCode = upstream.status
          res.setHeader('Content-Type', 'application/json')
          res.end(body)
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              message: error instanceof Error ? error.message : 'OpenSky proxy error',
            })
          )
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), openSkyProxyPlugin(env)],
  }
})
