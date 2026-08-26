---
description: Validação completa pre-PR para garantir código pronto para review
---

# PR Ready

Ativa: `pr-ready`.

Executa as 9 verificações definidas em `pr-ready` (lint, typecheck, test, unused exports, diff scope, secrets, JSDoc, naming, contract alignment). Não duplicar regras aqui.

Saída: tabela com status por check + veredito READY / NOT READY.

Próximo passo quando READY: `/pre-review` (julgamento + selo), depois `/create-pr`.
