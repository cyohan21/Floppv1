import { useRef } from 'react'

type RateLimitConfig = {
    maxAttempts: number,
    windowMs: number,
    cooldownMs?: number
}

export const useRateLimit = (config: RateLimitConfig) => {
    const attempts = useRef(0) // Amount of attempts
    const windowStart = useRef(0) // Time of the first initial attempt
    const lastAttempt = useRef(0) // Time of the last attempt

    const isAllowed = () => {
        const now = Date.now()

        // Check if reset window has expired
        if (now - windowStart.current > config.windowMs) {
            attempts.current = 0
            windowStart.current = now
        }

        // Check cooldown
        if (config.cooldownMs && now - lastAttempt.current < config.cooldownMs) {
            return {
                allowed: false,
                message: `Please wait ${config.cooldownMs / 1000} seconds in between requests.`
            }
        }

        // Check max attempts
        if (attempts.current >= config.maxAttempts) {
            return {
                allowed: false,
                message: `You have made too many requests. Please wait ${config.windowMs / 60000} minutes. then try again.`
            }
        }

        return { allowed: true }
    }

    const recordAttempt = () => {
        const now = Date.now()
        attempts.current += 1
        lastAttempt.current = now
        if (attempts.current === 1) {
            windowStart.current = now
        }
    }

    return { isAllowed, recordAttempt }
}