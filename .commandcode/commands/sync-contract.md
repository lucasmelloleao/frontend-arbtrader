---
description: Força revalidação 1:1 entre schemas/types e o YAML do backend
argument-hint: src/features/auth ou src/features/<feature>/<recurso>.schema.ts
---

# Sync Contract

Entrada: $ARGUMENTS

Ativa: `api-contract`.

Resolve `$API_CONTRACT_PATH`, localiza o(s) spec(s) OpenAPI correspondente(s) ao path fornecido, e valida que os arquivos do cliente (`*.schema.ts`, `api.types.ts`) estão 1:1 com o contrato.

Saída: para cada drift encontrado, file:line + campo divergente + YAML source. Se YAML não localizado → STOP e pergunta ao usuário.

**Não** modifica nada sem aprovação: apenas reporta o drift.
