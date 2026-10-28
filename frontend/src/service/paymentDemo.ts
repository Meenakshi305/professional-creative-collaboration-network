// Presentation-only payment simulation. No Stripe SDK, API calls, or real card data.
export type DemoOutcome = 'success' | 'declined'
export type DemoReceipt = { id: string; eventId: number; amount: number; currency: 'AUD'; createdAt: string }
export const demoCards = {
  success: '4242 4242 4242 4242', declined: '4000 0000 0000 0002'
} as const
export function createDemoReceipt(eventId: number, amount: number, outcome: DemoOutcome): DemoReceipt {
  if (!Number.isInteger(eventId) || eventId <= 0 || !Number.isFinite(amount) || amount <= 0)
    throw new Error('Choose a paid event with a valid price.')
  if (outcome === 'declined') throw new Error('Demo card declined. Choose the successful test scenario to try again.')
  if (outcome !== 'success') throw new Error('Unknown demo scenario.')
  return { id: `demo_${crypto.randomUUID()}`, eventId, amount, currency: 'AUD', createdAt: new Date().toISOString() }
}
