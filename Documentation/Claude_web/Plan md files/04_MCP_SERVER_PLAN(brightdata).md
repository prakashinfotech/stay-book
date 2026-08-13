# 🤖 MCP SERVER INTEGRATION PLAN — BRIGHT DATA
## Booking.com Clone · Real Hotel Data via Bright Data MCP
> Full rewrite — replaces WinWin.travel plan — uses your actual API key, works today

---

## 🔍 What Is Bright Data MCP?

Bright Data MCP is a **fully hosted, production-grade** Web MCP server that gives your AI agents
real-time access to any public website — including Booking.com hotel listings — with built-in
CAPTCHA bypass, JS rendering, and anti-bot evasion. No Docker, no self-hosting.

| Property | Value |
|----------|-------|
| Your API Key | `cf19117a-f80b-4bc2-bc42-4c8e61349e67` |
| SSE Endpoint | `https://mcp.brightdata.com/sse?token=<API_KEY>&groups=travel` |
| Transport | SSE (Server-Sent Events) — Remote hosted |
| Free Tier | **5,000 requests/month — free, no credit card** |
| Key Travel Tool | `web_data_booking_hotel_listings` (structured Booking.com data) |
| General Tools | `search_engine`, `scrape_as_markdown` (both free Rapid tier) |
| Tool Group for Travel | `groups=travel` |
| Self-hosting needed | ❌ None |

> ⚠️ SECURITY: Never commit your API key to git.
> Store ONLY in `.env`. Add `.env` to `.gitignore` immediately.

---

## 🧰 Bright Data Tools Used in This Project

| Tool | Tier | Maps to Your App |
|------|------|-----------------|
| `search_engine` | Free (Rapid) | Search Google for Booking.com hotel URLs by city + dates |
| `scrape_as_markdown` | Free (Rapid) | Scrape any hotel page → clean Markdown for display |
| `web_data_booking_hotel_listings` | Pro / Travel group | Structured hotel JSON from a Booking.com URL |
| `scraping_browser_navigate` + friends | Pro / Browser group | Automate calendar interaction, dynamic pages |

**For MVP, two tools are enough:**
1. `search_engine` → find Booking.com hotel URLs for a city
2. `web_data_booking_hotel_listings` → extract structured data from each URL

---

## 🏗️ How It Fits Into Your Monorepo

```
booking-app/
├── client/                          ← React 18 (no change to structure)
│   └── src/
│       └── api/
│           └── brightdata.api.ts    ← NEW: frontend API calls
├── server/                          ← Express backend
│   └── src/
│       └── modules/
│           └── brightdata/          ← NEW: Bright Data MCP layer
│               ├── brightdata.routes.ts
│               ├── brightdata.controller.ts
│               ├── brightdata.service.ts
│               └── brightdata.types.ts
└── .env                             ← BRIGHTDATA_API_KEY lives here only
```

**Your DB + Prisma handles:** users, auth, OTP, partner listings, partner bookings.
**Bright Data MCP handles:** real hotel search, live Booking.com prices, structured hotel data.

---

## ✅ STEP 1 — Configure Environment

```bash
# server/.env  ← NEVER commit this file
BRIGHTDATA_API_KEY=cf19117a-f80b-4bc2-bc42-4c8e61349e67
BRIGHTDATA_MCP_URL=https://mcp.brightdata.com/sse
BRIGHTDATA_MCP_GROUPS=travel
```

```bash
# server/.env.example  ← commit this with empty values
BRIGHTDATA_API_KEY=
BRIGHTDATA_MCP_URL=https://mcp.brightdata.com/sse
BRIGHTDATA_MCP_GROUPS=travel
```

Add to `server/src/config/env.ts` Zod schema:
```typescript
const envSchema = z.object({
  // ... existing fields ...
  BRIGHTDATA_API_KEY:    z.string().min(1),
  BRIGHTDATA_MCP_URL:    z.string().url().default('https://mcp.brightdata.com/sse'),
  BRIGHTDATA_MCP_GROUPS: z.string().default('travel'),
})
```

---

## ✅ STEP 2 — Test in Claude Desktop First (5 minutes, zero code)

Before writing any code, verify your key works end-to-end.

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "brightdata": {
      "url": "https://mcp.brightdata.com/sse?token=cf19117a-f80b-4bc2-bc42-4c8e61349e67&groups=travel"
    }
  }
}
```

Restart Claude Desktop → try these prompts:
```
"Search for hotels in Ahmedabad on Booking.com for 2 adults, June 10–12 2026"

"Use web_data_booking_hotel_listings to get data from
 https://www.booking.com/hotel/in/marriott-ahmedabad.html"

"Find 3 budget hotels in Surat on Booking.com and list their price and rating"
```

This confirms your key works and shows you the exact JSON response shape before you write TypeScript types.

---

## ✅ STEP 3 — Install Dependencies

Bright Data Remote MCP is called over plain HTTP/SSE — no heavy SDK needed.

```bash
cd server
npm install node-fetch
npm install -D @types/node-fetch
```

> If you prefer the MCP SDK approach (optional):
> `npm install @modelcontextprotocol/sdk`

---

## ✅ STEP 4 — Types File

```typescript
// server/src/modules/brightdata/brightdata.types.ts

export interface BDSearchParams {
  city:     string
  checkin:  string   // YYYY-MM-DD
  checkout: string   // YYYY-MM-DD
  adults:   number
}

export interface BDRoomOption {
  name:  string
  price: string
  beds:  string | null
}

export interface BDHotelDetail {
  name:        string
  description: string
  address:     string
  rating:      number | null
  reviewCount: number | null
  amenities:   string[]
  rooms:       BDRoomOption[]
  images:      string[]
  sourceUrl:   string
}

export interface BDHybridResult {
  partnerListings: unknown[]    // your DB rows
  externalHotels:  BDHotelDetail[]
  bdAvailable:     boolean
}
```

---

## ✅ STEP 5 — Service Layer (Core Logic)

```typescript
// server/src/modules/brightdata/brightdata.service.ts

import { env }    from '../../config/env'
import { logger } from '../../config/logger'
import type { BDSearchParams, BDHotelDetail, BDHybridResult } from './brightdata.types'

// ─── Core MCP Tool Caller ─────────────────────────────────────────────────────

/**
 * Calls any Bright Data MCP tool via JSON-RPC over HTTP.
 * Bright Data's remote MCP supports direct POST calls — no SSE streaming needed
 * for simple tool invocations from a server-side context.
 */
async function callTool(
  toolName:  string,
  toolInput: Record<string, unknown>
): Promise<string> {
  const endpoint =
    `${env.BRIGHTDATA_MCP_URL}` +
    `?token=${env.BRIGHTDATA_API_KEY}` +
    `&groups=${env.BRIGHTDATA_MCP_GROUPS}`

  const response = await fetch(endpoint, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept':       'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id:      `${toolName}-${Date.now()}`,
      method:  'tools/call',
      params:  {
        name:      toolName,
        arguments: toolInput,
      },
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    logger.error('BD MCP HTTP error', { tool: toolName, status: response.status, errText })
    throw new Error(`Bright Data MCP ${toolName} failed: HTTP ${response.status}`)
  }

  const json = await response.json() as {
    result?: { content?: Array<{ type: string; text?: string }> }
    error?: { message: string }
  }

  if (json.error) {
    logger.error('BD MCP tool error', { tool: toolName, error: json.error })
    throw new Error(`Bright Data MCP ${toolName} error: ${json.error.message}`)
  }

  const textContent = json.result?.content?.find(c => c.type === 'text')
  return textContent?.text ?? ''
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const brightDataService = {

  /**
   * Step 1: Use Google search (via BD) to find Booking.com hotel URLs
   * for a given city and dates. Returns up to 5 clean hotel URLs.
   */
  async searchHotelUrls(params: BDSearchParams): Promise<string[]> {
    try {
      const query =
        `site:booking.com/hotel/ hotels in "${params.city}" ` +
        `checkin:${params.checkin} checkout:${params.checkout}`

      const raw = await callTool('search_engine', {
        query,
        engine:      'google',
        num_results: 10,
      })

      logger.info('BD searchHotelUrls', { city: params.city, rawLength: raw.length })

      // Extract Booking.com hotel URLs — strip query strings for clean canonical URLs
      const urlPattern = /https:\/\/www\.booking\.com\/hotel\/[a-z]{2}\/[^\s"'<>\)]+/g
      const matches    = [...new Set(raw.match(urlPattern) ?? [])]
      const cleaned    = matches.map(u => u.split(/[?#]/)[0]).filter(Boolean)

      return cleaned.slice(0, 5)
    } catch (error) {
      logger.error('BD searchHotelUrls failed', { error })
      return []
    }
  },

  /**
   * Step 2: Fetch structured hotel data from a Booking.com URL.
   * Uses web_data_booking_hotel_listings (Pro/Travel group tool).
   */
  async getHotelDetail(bookingUrl: string): Promise<BDHotelDetail | null> {
    try {
      const raw = await callTool('web_data_booking_hotel_listings', {
        url: bookingUrl,
      })

      // BD returns a JSON string — parse defensively
      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(raw)
      } catch {
        // Fallback: BD returned Markdown — extract key fields with regex
        logger.warn('BD hotel detail returned non-JSON, using fallback', { bookingUrl })
        return this._parseMarkdownFallback(raw, bookingUrl)
      }

      return {
        name:        String(parsed.name        ?? parsed.hotel_name ?? 'Hotel'),
        description: String(parsed.description ?? parsed.about      ?? ''),
        address:     String(parsed.address     ?? parsed.location    ?? ''),
        rating:      parsed.rating      ? Number(parsed.rating)      : null,
        reviewCount: parsed.num_reviews ? Number(parsed.num_reviews) : null,
        amenities:   Array.isArray(parsed.amenities)  ? (parsed.amenities as string[])  : [],
        rooms:       Array.isArray(parsed.room_types) ? (parsed.room_types as BDRoomOption[]) : [],
        images:      Array.isArray(parsed.images)     ? (parsed.images as string[])     : [],
        sourceUrl:   bookingUrl,
      }
    } catch (error) {
      logger.error('BD getHotelDetail failed', { bookingUrl, error })
      return null
    }
  },

  /**
   * Markdown fallback parser when web_data_booking_hotel_listings returns Markdown.
   */
  _parseMarkdownFallback(markdown: string, sourceUrl: string): BDHotelDetail {
    const nameMatch   = markdown.match(/^#\s+(.+)/m)
    const ratingMatch = markdown.match(/(\d+\.\d+)\s*\/\s*10/i)
    const priceMatch  = markdown.match(/(?:₹|INR|USD|\$)\s*([\d,]+)/i)

    return {
      name:        nameMatch?.[1]?.trim()  ?? 'Hotel',
      description: markdown.slice(0, 300).replace(/[#*]/g, '').trim(),
      address:     '',
      rating:      ratingMatch ? parseFloat(ratingMatch[1]) : null,
      reviewCount: null,
      amenities:   [],
      rooms: priceMatch ? [{
        name:  'Standard Room',
        price: priceMatch[0],
        beds:  null,
      }] : [],
      images:    [],
      sourceUrl,
    }
  },

  /**
   * Main search: find hotel URLs then enrich with structured data in parallel.
   * Returns up to 5 enriched hotel objects.
   */
  async searchHotels(params: BDSearchParams): Promise<BDHotelDetail[]> {
    const urls = await this.searchHotelUrls(params)
    if (urls.length === 0) return []

    const settled = await Promise.allSettled(
      urls.map(url => this.getHotelDetail(url))
    )

    return settled
      .filter((r): r is PromiseFulfilledResult<BDHotelDetail> =>
        r.status === 'fulfilled' && r.value !== null
      )
      .map(r => r.value)
  },

  /**
   * Scrape any URL as clean Markdown (free Rapid tier tool).
   * Useful for hotel review pages, location pages, etc.
   */
  async scrapeAsMarkdown(url: string): Promise<string> {
    try {
      return await callTool('scrape_as_markdown', { url })
    } catch (error) {
      logger.error('BD scrapeAsMarkdown failed', { url, error })
      return ''
    }
  },

  /**
   * Hybrid search: your DB partner listings + BD real hotel data, in parallel.
   * If BD fails, local results still return successfully.
   */
  async hybridSearch(
    params:        BDSearchParams,
    localSearch:   () => Promise<unknown[]>
  ): Promise<BDHybridResult> {
    const [localResult, bdResult] = await Promise.allSettled([
      localSearch(),
      this.searchHotels(params),
    ])

    return {
      partnerListings: localResult.status === 'fulfilled' ? localResult.value : [],
      externalHotels:  bdResult.status    === 'fulfilled' ? bdResult.value    : [],
      bdAvailable:     bdResult.status    === 'fulfilled',
    }
  },
}
```

---

## ✅ STEP 6 — Routes + Controller

```typescript
// server/src/modules/brightdata/brightdata.routes.ts

import { Router }   from 'express'
import { z }        from 'zod'
import { validate } from '../../middleware/validate.middleware'
import { brightDataController } from './brightdata.controller'
import rateLimit from 'express-rate-limit'

// Separate, tighter limiter for BD routes — each call uses quota
const bdLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max:      10,          // max 10 BD calls per minute per IP
  message:  { success: false, error: 'TOO_MANY_REQUESTS', message: 'Slow down' },
})

const searchSchema = z.object({
  city:     z.string().min(1, 'City is required'),
  checkin:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  checkout: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  adults:   z.coerce.number().int().min(1).max(20).default(1),
})

const urlSchema = z.object({
  url: z.string().url(),
})

const router = Router()

router.get('/bd/search',  bdLimiter, validate(searchSchema), brightDataController.search)
router.get('/bd/hotel',   bdLimiter, validate(urlSchema),    brightDataController.hotelDetail)
router.get('/bd/scrape',  bdLimiter, validate(urlSchema),    brightDataController.scrape)

export default router
```

```typescript
// server/src/modules/brightdata/brightdata.controller.ts

import { Request, Response, NextFunction } from 'express'
import { brightDataService } from './brightdata.service'
import { AppError }          from '../../middleware/error-handler.middleware'
import { logger }            from '../../config/logger'
import prisma                from '../../config/prisma'

export const brightDataController = {

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { city, checkin, checkout, adults } = req.query as Record<string, string>

      logger.info('BD /bd/search called', { city, checkin, checkout, adults })

      const result = await brightDataService.hybridSearch(
        { city, checkin, checkout, adults: Number(adults) },
        () => prisma.property.findMany({
          where: {
            city:   { contains: city, mode: 'insensitive' },
            status: 'ACTIVE',
          },
          take: 10,
        })
      )

      res.json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  },

  async hotelDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { url } = req.query as { url: string }
      const detail = await brightDataService.getHotelDetail(url)

      if (!detail) {
        throw new AppError(404, 'HOTEL_NOT_FOUND', 'Could not fetch hotel data')
      }
      res.json({ success: true, data: detail })
    } catch (error) {
      next(error)
    }
  },

  async scrape(req: Request, res: Response, next: NextFunction) {
    try {
      const { url }    = req.query as { url: string }
      const markdown   = await brightDataService.scrapeAsMarkdown(url)
      res.json({ success: true, data: { markdown } })
    } catch (error) {
      next(error)
    }
  },
}
```

Register in `server/src/index.ts`:
```typescript
import brightDataRoutes from './modules/brightdata/brightdata.routes'
app.use('/api', brightDataRoutes)
```

---

## ✅ STEP 7 — Frontend API + Search Page

```typescript
// client/src/api/brightdata.api.ts

import { apiClient } from './client'
import type { BDSearchParams, BDHotelDetail, BDHybridResult } from '../types'

export const brightDataApi = {
  search: (params: BDSearchParams) =>
    apiClient
      .get<{ success: boolean; data: BDHybridResult }>('/bd/search', { params })
      .then(r => r.data.data),

  hotelDetail: (bookingUrl: string) =>
    apiClient
      .get<{ success: boolean; data: BDHotelDetail }>('/bd/hotel', { params: { url: bookingUrl } })
      .then(r => r.data.data),

  scrape: (url: string) =>
    apiClient
      .get<{ success: boolean; data: { markdown: string } }>('/bd/scrape', { params: { url } })
      .then(r => r.data.data),
}
```

Update `client/src/features/search/search-page.tsx`:
```tsx
import { brightDataApi } from '../../api/brightdata.api'
import { useQuery }       from '@tanstack/react-query'

// Inside component:
const { data, isLoading, isError } = useQuery({
  queryKey:  ['bd-search', city, checkin, checkout, adults],
  queryFn:   () => brightDataApi.search({ city, checkin, checkout, adults }),
  staleTime: 5 * 60 * 1000,   // 5-min cache — protect your 5,000/month quota
  enabled:   !!city && !!checkin && !!checkout,
})

if (isLoading) return <Spinner />
if (isError)   return <ErrorBanner message="Search unavailable, try again" />

return (
  <div>
    {/* Your partner listings — from your own DB */}
    {data?.partnerListings.length > 0 && (
      <section>
        <h2>Partner Hotels</h2>
        {data.partnerListings.map(p => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </section>
    )}

    {/* Real Booking.com hotels — from Bright Data */}
    {data?.externalHotels.length > 0 && (
      <section>
        <h2>More Hotels on Booking.com</h2>
        {data.externalHotels.map((hotel, i) => (
          <ExternalHotelCard key={i} hotel={hotel} />
        ))}
      </section>
    )}
  </div>
)
```

---

## 🔴 ADVANCED TASKS (Phase 2)

### A. AI Concierge Chat Widget (Claude + Bright Data)

```typescript
// server/src/modules/agent/concierge.service.ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()  // uses ANTHROPIC_API_KEY from env

export async function streamHotelConcierge(
  userMessage: string,
  onChunk:     (text: string) => void
): Promise<void> {
  const stream = await anthropic.messages.stream({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: `
      You are a helpful hotel booking assistant for a travel platform.
      When users ask about hotels, search Booking.com using available tools.
      Present results conversationally: name, price, rating, key amenities.
      Always note that final availability should be confirmed on Booking.com.
    `,
    messages: [{ role: 'user', content: userMessage }],
  })

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      onChunk(chunk.delta.text)
    }
  }
}
```

```typescript
// server/src/modules/agent/concierge.routes.ts
router.post('/agent/chat', authenticate, async (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')

  try {
    await streamHotelConcierge(req.body.message, (text) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`)
    })
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: 'Agent failed' })}\n\n`)
  } finally {
    res.write('data: [DONE]\n\n')
    res.end()
  }
})
```

### B. Price Alert Cron Job

```typescript
// server/src/jobs/price-alert.job.ts
import cron from 'node-cron'

cron.schedule('0 7 * * *', async () => {  // 7am daily
  const alerts = await prisma.priceAlert.findMany({ where: { active: true } })

  for (const alert of alerts) {
    const hotels = await brightDataService.searchHotels({
      city:     alert.city,
      checkin:  alert.checkin,
      checkout: alert.checkout,
      adults:   alert.adults,
    })

    const cheapest = hotels
      .filter(h => h.rooms.length > 0)
      .sort((a, b) => {
        const priceA = parseFloat(a.rooms[0].price.replace(/[^\d.]/g, '')) || 9999
        const priceB = parseFloat(b.rooms[0].price.replace(/[^\d.]/g, '')) || 9999
        return priceA - priceB
      })[0]

    if (cheapest) {
      await emailService.sendPriceAlert(alert.userEmail, alert.city, cheapest)
    }
  }
})
```

### C. Redis Caching (Quota Protection)

When your 5,000 free requests/month starts running low, add Redis caching:

```typescript
// server/src/modules/brightdata/brightdata.cache.ts
import { createClient } from 'redis'

const redis = createClient({ url: env.REDIS_URL })
await redis.connect()

export async function cachedSearch(
  params: BDSearchParams,
  ttlSeconds = 3600   // 1 hour — same city+dates result is stable
): Promise<BDHotelDetail[]> {
  const key = `bd:hotels:${params.city}:${params.checkin}:${params.checkout}:${params.adults}`

  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached) as BDHotelDetail[]

  const fresh = await brightDataService.searchHotels(params)
  await redis.setEx(key, ttlSeconds, JSON.stringify(fresh))
  return fresh
}
```

### D. Pro Mode — Browser Automation

Unlock dynamic page interaction (availability calendars, filter interactions):

```bash
# Update your MCP URL to enable Pro
# server/.env
BRIGHTDATA_MCP_URL=https://mcp.brightdata.com/sse
# In the callTool function, change the endpoint construction:
# `?token=${key}&groups=${groups}&pro=1`
```

This unlocks `scraping_browser_navigate`, `scraping_browser_click_ref`, etc. for scraping dynamically rendered pages.

---

## ⚖️ Bright Data MCP vs Your Backend — Decision Table

| Scenario | Your Backend (Prisma) | Bright Data MCP |
|----------|----------------------|----------------|
| Partner registers + manages listing | ✅ | ❌ |
| User auth + OTP + JWT | ✅ | ❌ |
| Search your partner's own listings | ✅ | ❌ |
| Search real-world Booking.com hotels | ❌ | ✅ |
| Fetch structured data from hotel URL | ❌ | ✅ |
| Scrape any hotel detail page | ❌ | ✅ |
| AI concierge (natural language) | ❌ | ✅ |
| Real booking confirmation | ✅ (simulatePayment) | ❌ |
| Cancel / manage booking | ✅ | ❌ |

---

## 🚫 CRITICAL RULES

- `BRIGHTDATA_API_KEY` goes in `.env` ONLY — never hardcoded, never logged, never in `.env.example`.
- `staleTime: 5 * 60 * 1000` on ALL React Query BD calls — every call burns quota.
- Use `Promise.allSettled()` in hybridSearch — BD failure must never break local DB results.
- Always shape BD responses in controller via Zod or manual mapping before sending to client.
- Separate rate limiter on `/api/bd/*` routes — 10 req/min per IP is sensible.
- Log `toolName` + `city` on every BD call to track quota usage in Winston.
- When quota runs low → add Redis caching with 1-hour TTL for same city+dates.

---

## 📋 Build Order (3 Days)

```
DAY 1 — Setup + Verify
  ✅ Add env vars to .env (BRIGHTDATA_API_KEY etc.)
  ✅ Add to .gitignore, Zod env schema
  ✅ Paste config into Claude Desktop → test with real prompts
  ✅ Confirm web_data_booking_hotel_listings returns JSON for a Booking.com URL

DAY 2 — Backend
  ✅ Create brightdata.types.ts
  ✅ Create brightdata.service.ts (callTool, searchHotelUrls, getHotelDetail, hybridSearch)
  ✅ Create brightdata.routes.ts + brightdata.controller.ts
  ✅ Register routes in server/src/index.ts
  ✅ Test: GET /api/bd/search?city=Ahmedabad&checkin=2026-06-10&checkout=2026-06-12&adults=2

DAY 3 — Frontend
  ✅ Create client/src/api/brightdata.api.ts
  ✅ Add ExternalHotelCard component
  ✅ Update search-page.tsx with hybrid results (partner + BD sections)
  ✅ Verify staleTime caching is working (check network tab — no repeat calls)

PHASE 2 (when MVP is stable)
  ⬜ AI concierge SSE endpoint + chat widget
  ⬜ Redis caching for quota management
  ⬜ Pro mode for browser automation
  ⬜ Price alert cron job
```

Total to working Bright Data integration: **~3 days**.
Your 5,000 free requests/month is plenty for the entire development + demo phase.
