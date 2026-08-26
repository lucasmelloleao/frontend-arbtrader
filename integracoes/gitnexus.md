# Integração: GitNexus

**O que é:** GitNexus indexa seu repositório num grafo de código (símbolos, relações, fluxos de
execução) e expõe ferramentas via MCP para entender código, avaliar impacto e navegar com segurança.
É de terceiros: instale pela fonte oficial. Aqui está como o método o usa.

## Por que entra no método

O maior risco ao editar com IA é o **blast radius invisível**: mudar um símbolo e quebrar callers
que ninguém mapeou. O GitNexus dá a disciplina de **impact analysis antes de editar** e
**detect_changes antes de commitar**: vira parte do `feature-audit` e do `workflow-refactor` (como
fase opcional).

## Setup (passo a passo)

1. **Instale o CLI** (global): `npm install -g gitnexus` (ou `bun add -g gitnexus`). Confirme: `gitnexus --version`.
2. **Registre o MCP server** no Claude Code. Via CLI:
   ```bash
   claude mcp add gitnexus -- gitnexus mcp
   ```
   Ou direto no config de MCP (`~/.claude.json`, em `mcpServers`):
   ```json
   "gitnexus": { "command": "gitnexus", "args": ["mcp"] }
   ```
3. **Indexe o repo** (na raiz do projeto): `gitnexus analyze`: gera `.gitnexus/` (adicione ao `.gitignore`). Reindexe quando o índice ficar stale.
4. Reinicie o Claude Code e confirme que as ferramentas `mcp__gitnexus__*` (e os recursos `gitnexus://`) aparecem.

## A disciplina (o que o método exige)

- **Antes de editar** qualquer função/classe/método: rode `mcp__gitnexus__impact({ target, direction: "upstream" })`
  e reporte o blast radius (callers diretos, processos afetados, nível de risco).
- **Antes de commitar**: rode `mcp__gitnexus__detect_changes()` para confirmar que as mudanças só afetam o
  escopo esperado.
- **Para explorar** código desconhecido: `mcp__gitnexus__query({ query: "conceito" })` em vez de grepar.
- **Para contexto** de um símbolo: `mcp__gitnexus__context({ name })`.
- **Para renomear**: `mcp__gitnexus__rename` (entende o call graph): nunca find-and-replace.

## Bloco para o seu `CLAUDE.md`

Cole (e ajuste o nome do repo) para tornar a disciplina padrão do projeto:

```markdown
<!-- gitnexus:start -->
## GitNexus: Code Intelligence

Este projeto é indexado pelo GitNexus. Use as ferramentas MCP para entender código, avaliar
impacto e navegar com segurança. Se alguma ferramenta avisar que o índice está stale, rode
`npx gitnexus analyze` no terminal primeiro.

- **DEVE rodar impact analysis antes de editar qualquer símbolo.** Antes de modificar uma função,
  classe ou método, rode `mcp__gitnexus__impact({ target, direction: "upstream" })` e reporte o blast
  radius (callers diretos, processos afetados, nível de risco).
- **DEVE rodar `mcp__gitnexus__detect_changes()` antes de commitar** para verificar que as mudanças só
  afetam o escopo esperado.
- Ao explorar código desconhecido, use `mcp__gitnexus__query()` em vez de grep.
- Para contexto completo de um símbolo, use `mcp__gitnexus__context({ name })`.
- NUNCA renomeie símbolos com find-and-replace: use `mcp__gitnexus__rename`.
<!-- gitnexus:end -->
```

## Sem GitNexus

O kit funciona sem ele: as skills `feature-audit`/`workflow-refactor` tratam o pré-voo de impacto como
opcional. Sem a ferramenta, faça o mapeamento manual (grep dos símbolos exportados) e registre o
risco: **nunca infira o blast radius sem evidência**.
