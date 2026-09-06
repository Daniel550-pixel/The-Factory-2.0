import fs from 'node:fs/promises';
import path from 'node:path';

export interface KnowledgeAdapterItem {
  itemId: string;
  path: string;
  name: string;
  size: number;
  modifiedAt: string;
  sourceType: 'OBSIDIAN' | 'CLAUDE';
}

function configuredRoot(envName: string): string {
  const root = process.env[envName]?.trim();
  if (!root) throw new Error(`${envName} is not configured`);
  return path.resolve(root);
}

function safePath(root: string, relativePath: string): string {
  const resolved = path.resolve(root, relativePath);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error('Requested path escapes the configured knowledge source root');
  }
  return resolved;
}

async function walk(root: string, sourceType: 'OBSIDIAN' | 'CLAUDE'): Promise<KnowledgeAdapterItem[]> {
  const results: KnowledgeAdapterItem[] = [];
  const visit = async (directory: string) => {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === '.obsidian' || entry.name === 'node_modules') continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(absolute);
        continue;
      }
      const extension = path.extname(entry.name).toLowerCase();
      const allowed = sourceType === 'OBSIDIAN'
        ? extension === '.md'
        : ['.md', '.txt', '.json'].includes(extension);
      if (!allowed) continue;
      const stat = await fs.stat(absolute);
      const relative = path.relative(root, absolute).replace(/\\/g, '/');
      results.push({
        itemId: `${sourceType.toLowerCase()}:${relative}`,
        path: relative,
        name: entry.name,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        sourceType,
      });
    }
  };
  await visit(root);
  return results.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}

export async function listObsidianNotes(): Promise<KnowledgeAdapterItem[]> {
  return walk(configuredRoot('FACTORY_OBSIDIAN_VAULT'), 'OBSIDIAN');
}

export async function listClaudeExports(): Promise<KnowledgeAdapterItem[]> {
  return walk(configuredRoot('FACTORY_CLAUDE_EXPORT_DIR'), 'CLAUDE');
}

export async function readKnowledgeAdapterItem(sourceType: 'OBSIDIAN' | 'CLAUDE', relativePath: string): Promise<{
  item: KnowledgeAdapterItem;
  content: string;
}> {
  const root = configuredRoot(sourceType === 'OBSIDIAN' ? 'FACTORY_OBSIDIAN_VAULT' : 'FACTORY_CLAUDE_EXPORT_DIR');
  const absolute = safePath(root, relativePath);
  const stat = await fs.stat(absolute);
  if (!stat.isFile()) throw new Error('Knowledge adapter path is not a file');
  const extension = path.extname(absolute).toLowerCase();
  const allowed = sourceType === 'OBSIDIAN' ? extension === '.md' : ['.md', '.txt', '.json'].includes(extension);
  if (!allowed) throw new Error('File type is not supported by this knowledge adapter');
  const content = await fs.readFile(absolute, 'utf8');
  const itemId = `${sourceType.toLowerCase()}:${path.relative(root, absolute).replace(/\\/g, '/')}`;
  return {
    item: {
      itemId,
      path: path.relative(root, absolute).replace(/\\/g, '/'),
      name: path.basename(absolute),
      size: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      sourceType,
    },
    content,
  };
}
