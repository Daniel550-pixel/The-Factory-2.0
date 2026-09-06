# The Factory — Claude & Obsidian Knowledge Integration

## Purpose

The Factory treats external project knowledge as an explicit ingestion boundary. Claude conversations and Obsidian notes are not copied wholesale into the runtime and are not treated as unquestioned truth.

## Supported sources

- **Obsidian** — selected Markdown notes from the user's vault.
- **Claude** — selected conversation exports or distilled project knowledge.

## Ingestion contract

1. Select the source type.
2. Identify the source and optional vault/export path.
3. Paste only the material that belongs in Factory knowledge.
4. The Memory Explorer chunks the material into bounded records.
5. Each chunk receives a deterministic SHA-256 content identity.
6. Each chunk receives provenance metadata and source tags.
7. Obsidian material enters as `RAW_OBSERVATION`.
8. Claude-derived material enters as `DISTILLED_KNOWLEDGE`.
9. The resulting records are committed through `/api/memory` and become visible to Factory context assembly.

## Deliberate non-goals

- No blind repository mirroring.
- No automatic import of an entire Obsidian vault.
- No assumption that Claude output is authoritative.
- No API credentials are stored in Factory Memory.
- No external source silently bypasses the existing provenance model.

## Current UI

The **Memory Explorer → Ingest Knowledge** panel is the current ingestion boundary. Use it for selected Obsidian notes and selected Claude exports while the deeper connector/automation layer is developed.

## Next integration layer

The next step is to move ingestion from manual paste into authenticated source adapters that can enumerate selected Obsidian files and approved Claude exports, while preserving the same hash, chunk, provenance, and memory-commit contract.
