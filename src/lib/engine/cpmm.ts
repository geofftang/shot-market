/**
 * MULTI-OUTCOME CPMM ENGINE (Maniswap)
 * 
 * Supports N mutually exclusive outcomes.
 * Invariant: Product(pools) = k
 * Probability P_i = (1/pool_i) / Sum(1/pool_j)
 */

export type MultiPool = Record<string, number>;

/**
 * Calculates the probability (price) of a specific outcome.
 * P_i = (1/s_i) / Sum(1/s_j)
 */
export function getMultiProbability(pool: MultiPool, answerId: string): number {
  const ids = Object.keys(pool);
  const inverseSum = ids.reduce((acc, id) => acc + 1 / pool[id], 0);
  return (1 / pool[answerId]) / inverseSum;
}

/**
 * Calculates all probabilities for a pool.
 */
export function getMultiProbabilities(pool: MultiPool): Record<string, number> {
  const ids = Object.keys(pool);
  const inverseSum = ids.reduce((acc, id) => acc + 1 / pool[id], 0);
  const probs: Record<string, number> = {};
  ids.forEach(id => {
    probs[id] = (1 / pool[id]) / inverseSum;
  });
  return probs;
}

/**
 * Calculates the shares received for a given bet amount on a specific answer.
 * amount: Amount of "Shots" to bet
 */
export function calculateMultiPurchase(
  pool: MultiPool,
  answerId: string,
  amount: number
): {
  shares: number;
  newPool: MultiPool;
} {
  const ids = Object.keys(pool);
  const k = ids.reduce((acc, id) => acc * pool[id], 1);

  // 1. New pools for all other outcomes increase by the bet amount
  const newPool: MultiPool = { ...pool };
  ids.forEach(id => {
    if (id !== answerId) {
      newPool[id] = pool[id] + amount;
    }
  });

  // 2. New pool for the chosen outcome is recalculated to maintain k
  const otherProduct = ids
    .filter(id => id !== answerId)
    .reduce((acc, id) => acc * newPool[id], 1);
  
  newPool[answerId] = k / otherProduct;

  // 3. Shares received = (original inventory + bet) - new inventory
  const shares = (pool[answerId] + amount) - newPool[answerId];

  return {
    shares,
    newPool,
  };
}

/**
 * Utility to format probability as a percentage string.
 */
export function formatProbability(prob: number): string {
  return (prob * 100).toFixed(0) + '%';
}
