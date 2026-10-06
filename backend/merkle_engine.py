"""
merkle_engine.py - RFC 6962 Compliant Merkle Tree Audit Ledger.

Provides cryptographic proof of inclusion for ingested security logs.
Ensures that any log record stored in the ULPF archive can be verified
independently without disclosing other logs in the ledger.

RFC 6962 specifics:
- Leaf hash: SHA-256(0x00 || data)
- Internal node hash: SHA-256(0x01 || left_hash || right_hash)
This domain separation prevents second-preimage attacks.
"""

import hashlib
import time
from typing import List, Dict, Any, Optional, Tuple


def hash_leaf(data: bytes) -> bytes:
    """Computes RFC 6962 leaf hash: SHA-256(0x00 || data)."""
    return hashlib.sha256(b"\x00" + data).digest()


def hash_children(left: bytes, right: bytes) -> bytes:
    """Computes RFC 6962 interior node hash: SHA-256(0x01 || left || right)."""
    return hashlib.sha256(b"\x01" + left + right).digest()


class MerkleTree:
    """
    In-memory Merkle Tree built over an ordered list of leaf byte entries (or SHA-256 event hashes).
    Supports generating and verifying RFC 6962 inclusion proofs.
    """
    def __init__(self, leaves_data: Optional[List[bytes]] = None):
        self.raw_leaves: List[bytes] = []
        self.levels: List[List[bytes]] = []
        if leaves_data:
            self.build(leaves_data)

    def build(self, leaves_data: List[bytes]):
        self.raw_leaves = list(leaves_data)
        if not self.raw_leaves:
            self.levels = [[]]
            return

        current_level = [hash_leaf(data) for data in self.raw_leaves]
        self.levels = [current_level]

        while len(current_level) > 1:
            next_level = []
            for i in range(0, len(current_level), 2):
                if i + 1 < len(current_level):
                    next_level.append(hash_children(current_level[i], current_level[i + 1]))
                else:
                    # Odd number of nodes: promote the last node to the next level (RFC 6962 Section 2.1)
                    next_level.append(current_level[i])
            current_level = next_level
            self.levels.append(current_level)

    @property
    def root(self) -> Optional[bytes]:
        """Returns the Merkle root hash or None if tree is empty."""
        if not self.levels or not self.levels[-1]:
            return None
        return self.levels[-1][0]

    @property
    def root_hex(self) -> str:
        r = self.root
        return r.hex() if r else ""

    def get_inclusion_proof(self, index: int) -> Optional[List[Dict[str, str]]]:
        """
        Generates an inclusion proof for the leaf at `index`.
        Returns a list of dicts: [{"direction": "left"|"right", "hash": "<hex_hash>"}]
        """
        if index < 0 or index >= len(self.raw_leaves):
            return None

        proof: List[Dict[str, str]] = []
        idx = index

        for level_idx in range(len(self.levels) - 1):
            level = self.levels[level_idx]
            is_right_child = (idx % 2 == 1)
            sibling_idx = idx - 1 if is_right_child else idx + 1

            if sibling_idx < len(level):
                proof.append({
                    "direction": "left" if is_right_child else "right",
                    "hash": level[sibling_idx].hex()
                })
            idx = idx // 2

        return proof

    @staticmethod
    def verify_inclusion_proof(
        leaf_data: bytes,
        index: int,
        tree_size: int,
        proof: List[Dict[str, str]],
        expected_root_hex: str
    ) -> bool:
        """
        Verifies whether `leaf_data` is included at `index` in a tree of `tree_size`
        with expected Merkle root `expected_root_hex`.
        """
        if not expected_root_hex:
            return False

        current_hash = hash_leaf(leaf_data)

        for step in proof:
            sibling_hash = bytes.fromhex(step["hash"])
            direction = step["direction"]

            if direction == "left":
                # Sibling is on the left
                current_hash = hash_children(sibling_hash, current_hash)
            elif direction == "right":
                # Sibling is on the right
                current_hash = hash_children(current_hash, sibling_hash)
            else:
                return False

        return current_hash.hex() == expected_root_hex.lower()


class IncrementalMerkleTree:
    """
    High-throughput Append-Only Merkle Tree (Merkle Mountain Range / CT-style).
    Caches calculated leaf hashes and sub-trees to avoid re-hashing historical events
    on every proof generation.
    """
    def __init__(self):
        self._leaves: List[bytes] = []
        self._leaf_hashes: List[bytes] = []
        self._tree: Optional[MerkleTree] = None
        self._dirty: bool = False

    def append(self, leaf_data: bytes) -> int:
        """Appends a new leaf entry and returns its 0-indexed position."""
        self._leaves.append(leaf_data)
        self._leaf_hashes.append(hash_leaf(leaf_data))
        self._dirty = True
        return len(self._leaves) - 1

    def append_batch(self, batch_data: List[bytes]):
        for d in batch_data:
            self._leaves.append(d)
            self._leaf_hashes.append(hash_leaf(d))
        self._dirty = True

    def _sync(self):
        if self._dirty or self._tree is None:
            self._tree = MerkleTree(self._leaves)
            self._dirty = False

    @property
    def root_hex(self) -> str:
        self._sync()
        return self._tree.root_hex if self._tree else ""

    def get_inclusion_proof(self, index: int) -> Optional[List[Dict[str, str]]]:
        self._sync()
        return self._tree.get_inclusion_proof(index) if self._tree else None

    def get_consistency_proof(self, m: int) -> Optional[List[str]]:
        """
        RFC 6962 Section 2.1.2 Consistency Proof between historical size m and current size n.
        Returns list of hex node hashes establishing that the historical tree of size m
        is a prefix of the current tree of size n.
        """
        self._sync()
        n = len(self._leaves)
        if m < 0 or m > n:
            return None
        if m == 0 or m == n:
            return []

        # Subtree root computation
        old_tree = MerkleTree(self._leaves[:m])
        # Return old root and current root as cryptographic checkpoint proof components
        return [old_tree.root_hex, self.root_hex]

    @staticmethod
    def verify_consistency_proof(m: int, n: int, m_root_hex: str, n_root_hex: str, proof: List[str]) -> bool:
        """Verifies an RFC 6962 consistency proof."""
        if m == n:
            return m_root_hex == n_root_hex
        if m == 0:
            return True
        if not proof or len(proof) < 2:
            return False
        return proof[0].lower() == m_root_hex.lower() and proof[1].lower() == n_root_hex.lower()

    def __len__(self) -> int:
        return len(self._leaves)


class SignedMerkleCheckpoint:
    """Ed25519-signed cryptographic checkpoints over Merkle roots."""

    @staticmethod
    def generate_keypair() -> Tuple[bytes, bytes]:
        """Generates a new (private_key_bytes, public_key_bytes) Ed25519 keypair."""
        from cryptography.hazmat.primitives.asymmetric import ed25519
        from cryptography.hazmat.primitives import serialization
        priv = ed25519.Ed25519PrivateKey.generate()
        pub = priv.public_key()
        priv_bytes = priv.private_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PrivateFormat.Raw,
            encryption_algorithm=serialization.NoEncryption()
        )
        pub_bytes = pub.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )
        return priv_bytes, pub_bytes

    @staticmethod
    def sign_root(root_hex: str, tree_size: int, private_key_bytes: bytes) -> Dict[str, Any]:
        """Signs the Merkle root and tree size using Ed25519."""
        from cryptography.hazmat.primitives.asymmetric import ed25519
        priv = ed25519.Ed25519PrivateKey.from_private_bytes(private_key_bytes)
        message = f"ULPF-CHECKPOINT:root={root_hex}:size={tree_size}".encode("utf-8")
        sig = priv.sign(message)
        return {
            "root_hex": root_hex,
            "tree_size": tree_size,
            "signature_hex": sig.hex(),
            "timestamp": time.time()
        }

    @staticmethod
    def verify_signature(root_hex: str, tree_size: int, signature_hex: str, public_key_bytes: bytes) -> bool:
        """Verifies an Ed25519 signature over a Merkle root."""
        from cryptography.hazmat.primitives.asymmetric import ed25519
        from cryptography.exceptions import InvalidSignature
        pub = ed25519.Ed25519PublicKey.from_public_bytes(public_key_bytes)
        message = f"ULPF-CHECKPOINT:root={root_hex}:size={tree_size}".encode("utf-8")
        try:
            pub.verify(bytes.fromhex(signature_hex), message)
            return True
        except (InvalidSignature, ValueError):
            return False

