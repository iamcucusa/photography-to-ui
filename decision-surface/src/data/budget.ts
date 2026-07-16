// §H.3 dev-mode perf assertions. Production builds run the work unmeasured.

export function withBudget<T>(label: string, budgetMs: number, fn: () => T): T {
  if (!import.meta.env.DEV) return fn()
  const start = performance.now()
  const result = fn()
  const elapsed = performance.now() - start
  if (elapsed > budgetMs) {
    console.warn(`[perf] ${label}: ${elapsed.toFixed(1)}ms exceeds the ${budgetMs}ms budget (§H.3)`)
  }
  return result
}
