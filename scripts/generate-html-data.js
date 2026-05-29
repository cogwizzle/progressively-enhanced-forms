import { readFileSync, writeFileSync } from 'fs'

const cem = JSON.parse(readFileSync('custom-elements.json', 'utf-8'))

const tags = cem.modules.flatMap(mod =>
  mod.declarations
    .filter(d => d.customElement)
    .map(d => ({
      name: d.tagName,
      description: d.description,
      attributes: (d.attributes ?? []).map(attr => ({
        name: attr.name,
        description: attr.description,
        values: attr.type?.text === 'boolean'
          ? [{ name: 'true' }, { name: 'false' }]
          : undefined,
      })),
    }))
)

writeFileSync('vscode-html-data.json', JSON.stringify({ version: 1.1, tags }, null, 2))
console.log(`Generated vscode-html-data.json (${tags.length} element${tags.length === 1 ? '' : 's'})`)
