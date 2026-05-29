/**
 * CORE CPMM ENGINE
 * Adapted from Manifold Markets (common/src/calculate-cpmm.ts)
 * 
 * This engine handles the math for a Constant Product Market Maker (CPMM)
 * specifically using the invariant: y^p * n^(1-p) = k
 */

export type BinaryPool = {
  YES: number;
  NO: number;
};

/**
 * Calculates the probability (price) of the YES outcome.
 * P = n / (y + n)
 */
export function getCpmmProbability(pool: BinaryPool, p: number): number {
  const { YES, NO } = pool;
  return (p * NO) / ((1 - p) * YES + p * NO);
}

/**
 * Calculates the shares received for a given bet amount.
 * amount: Amount of "Shots" to bet
 * outcome: 'YES' or 'NO'
 */
export function calculateCpmmPurchase(
  pool: BinaryPool,
  p: number,
  amount: number,
  outcome: 'YES' | 'NO'
): {
  shares: number;
  newPool: BinaryPool;
} {
  const { YES, NO } = pool;
  const k = Math.pow(YES, p) * Math.pow(NO, 1 - p);

  if (outcome === 'YES') {
    const newYES = YES + amount;
    const newNO = Math.pow(k / Math.pow(newYES, p), 1 / (1 - p));
    const shares = NO - newNO + amount;
    return {
      shares,
      newPool: { YES: newYES, NO: newNO },
    };
  } else {
    const newNO = NO + amount;
    const newYES = Math.pow(k / Math.pow(newNO, 1 - p), 1 / p);
    const shares = YES - newYES + amount;
    return {
      shares,
      newPool: { YES: newYES, NO: newNO },
    };
  }
}

/**
 * Utility to format probability as a percentage string.
 */
export function formatProbability(prob: number): string {
  return (prob * 100).toFixed(0) + '%';
}
