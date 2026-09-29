// Highest stage a row has reached: C (4) > A (3) > U (2) > T (1) > none (0)
export const stageRank = (r) => (r.c ? 4 : r.a ? 3 : r.u ? 2 : r.t ? 1 : 0)
export const RANK_LETTER = { 4: 'c', 3: 'a', 2: 'u', 1: 't' }

// One entry per work station for ONE employee: the row that got furthest.
export function stationsFor(assignments) {
  const best = new Map()
  assignments.forEach((r) => {
    const cur = best.get(r.workStationCode)
    if (!cur || stageRank(r) > stageRank(cur)) best.set(r.workStationCode, r)
  })
  return [...best.values()]
}

// How many stations sit at each stage, and the % fully completed (C only).
export function summarize(assignments) {
  const stations = stationsFor(assignments)
  const counts = { c: 0, a: 0, u: 0, t: 0, none: 0 }
  stations.forEach((r) => {
    counts[RANK_LETTER[stageRank(r)] ?? 'none']++
  })
  const total = stations.length
  return { ...counts, total, pct: total ? Math.round((counts.c / total) * 100) : 0 }
}