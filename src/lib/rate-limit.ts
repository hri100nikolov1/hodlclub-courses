type RateLimitRecord = {
  count: number
  firstAttempt: number
  blockedUntil?: number
}

const store = new Map<string, RateLimitRecord>()

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 минути
const BLOCK_MS = 15 * 60 * 1000  // блокиране за 15 минути

// Почистване на стари записи на всеки 30 минути
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of store.entries()) {
    if (now - record.firstAttempt > BLOCK_MS * 2) {
      store.delete(key)
    }
  }
}, 30 * 60 * 1000)

export function checkRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const record = store.get(key)

  // Ако е блокиран — провери дали блокирането е изтекло
  if (record?.blockedUntil) {
    if (now < record.blockedUntil) {
      const retryAfter = Math.ceil((record.blockedUntil - now) / 1000)
      return { allowed: false, retryAfter }
    } else {
      store.delete(key)
    }
  }

  // Нов прозорец или много стар запис
  if (!record || now - record.firstAttempt > WINDOW_MS) {
    store.set(key, { count: 1, firstAttempt: now })
    return { allowed: true }
  }

  // Достигнат лимит — блокирай
  if (record.count >= MAX_ATTEMPTS) {
    store.set(key, { ...record, blockedUntil: now + BLOCK_MS })
    return { allowed: false, retryAfter: Math.ceil(BLOCK_MS / 1000) }
  }

  // Увеличи броя опити
  store.set(key, { ...record, count: record.count + 1 })
  return { allowed: true }
}

export function resetRateLimit(key: string): void {
  store.delete(key)
}
