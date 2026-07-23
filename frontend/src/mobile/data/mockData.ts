// Re-exports the generated dataset under the original names every screen already
// imports, so this expansion (60 employers, 120 candidates, 6 universities, all cross-
// referenced — see generateDataset.ts) didn't require touching every call site.
export { allCandidates as mockCandidates, demoCandidate as mockCurrentCandidate } from "./generateDataset";
