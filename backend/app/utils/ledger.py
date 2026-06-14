"""
F4 — Immutable Credential Ledger pure functions.
No DB access here — all stateless and fully unit-testable.

Leaf hash payload (must stay consistent with seed script):
  "{user_id}|{artifact_name}|{artifact_type}|{confidence}|{verified_at_iso}|{status}"
"""
import hashlib


def sha256hex(data: str) -> str:
    return hashlib.sha256(data.encode()).hexdigest()


def compute_leaf_hash(
    user_id: str,
    artifact_name: str,
    artifact_type: str,
    confidence: float,
    verified_at_iso: str,  # datetime.isoformat() — must be identical each time
    status: str = "verified",
) -> str:
    payload = f"{user_id}|{artifact_name}|{artifact_type}|{confidence}|{verified_at_iso}|{status}"
    return sha256hex(payload)


def compute_merkle_root(leaf_hashes: list[str]) -> str:
    """
    Build a Merkle root from an ordered list of leaf hashes.
    Odd-length layers duplicate the last node (standard Bitcoin-style Merkle tree).
    Returns sha256("") for an empty list.
    """
    if not leaf_hashes:
        return sha256hex("")
    nodes = list(leaf_hashes)
    while len(nodes) > 1:
        if len(nodes) % 2 == 1:
            nodes.append(nodes[-1])
        nodes = [sha256hex(nodes[i] + nodes[i + 1]) for i in range(0, len(nodes), 2)]
    return nodes[0]
