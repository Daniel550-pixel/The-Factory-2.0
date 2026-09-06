# Obsidian + Claude Knowledge Adapters

The Factory exposes read-only discovery adapters. They enumerate candidate source material; they do not mirror a vault or import automatically.

## Obsidian

Set:

```text
FACTORY_OBSIDIAN_VAULT=<absolute path to the Obsidian vault>
```

The adapter enumerates Markdown notes while excluding `.obsidian`, `.git`, and `node_modules` directories.

Endpoint:

```text
GET /api/knowledge/adapters/obsidian/items
```

Read one selected note:

```text
GET /api/knowledge/adapters/OBSIDIAN/item?path=<relative-note-path>
```

## Claude

Export or place selected Claude conversation material in a dedicated local directory and set:

```text
FACTORY_CLAUDE_EXPORT_DIR=<absolute path to the Claude export directory>
```

The adapter currently enumerates `.md`, `.txt`, and `.json` files. It does not assume a specific Claude export schema; the selected file is returned as source material for the governed transaction layer.

Endpoints:

```text
GET /api/knowledge/adapters/claude/items
GET /api/knowledge/adapters/CLAUDE/item?path=<relative-export-path>
```

## Import boundary

Adapter discovery is read-only. A selected item must still pass:

`Discover → Manifest → Dry Run → Review → Approve → Drift Check → Atomic Ingest → Event Ledger`

No adapter endpoint writes Factory Memory directly.
