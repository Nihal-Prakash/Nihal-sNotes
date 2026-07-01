---
title: "Byte Order"
slug: "byte-order"
topic: "networking"
tags: ["networking", "endianness", "binary", "c"]
summary: "Short note explaining big-endian network byte order, little-endian host byte order, and portable conversion helpers like htons, htonl, ntohs, and ntohl."
pinned: false
order: 20
sourceType: "markdown"
sourcePath: "exports/raw/markdown-sample/ebd86a54-9b9c-4454-a512-7ccc899beda5_ExportBlock-06fa7d01-87c9-4c22-89f4-46b203f17f06.zip"
createdAt: "2026-06-30"
updatedAt: "2026-06-30"
---
Computers store multi-byte values in different byte orders:

- **Big-Endian** (“Network Byte Order”): stores the most significant byte first, e.g., `b3 4f` for `0xb34f`.
- **Little-Endian** (used by Intel CPUs): stores the least significant byte first, e.g., `4f b3`.

Network protocols use Big-Endian, but a machine’s **Host Byte Order** can vary by CPU architecture. To write portable code, always convert values to Network Byte Order when building packets.

C provides functions for this:

- `htons()` — Host to Network Short (16-bit)
- `htonl()` — Host to Network Long (32-bit)
- And reverse versions: `ntohs()`, `ntohl()`.

These functions convert only if necessary, making code endian-independent.

---

If you want, I can also compress this into a **one-sentence ultra-minimal** version without losing technical accuracy. Would you like that?
