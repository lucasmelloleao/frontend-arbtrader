---
name: api-contract
description: 'Use quando estiver criando ou alterando qualquer `*.schema.ts`, `api.types.ts`, chamada via `apiClient`, ou mapper que conversa com o backend. Sintomas: prestes a escrever `object({...})` (valibot) que valida response, criar tipo `UserApiResponse`, criar chamada `apiClient(kyServer, "rota", schema)`, espelhar payload do backend.'
---

# API Contract

## Visão geral

O contrato do backend é a fonte da verdade. Antes de tocar qualquer arquivo que descreve contrato (schema, types/api, chamada de API), o agente **DEVE** abrir a especificação do endpoint na sua fonte de contrato (OpenAPI/Swagger) e espelhar 1:1. Não inferir do código existente: o código existente pode estar errado, é justamente por isso que estamos sincronizando.

> **Fonte de contrato** = a especificação OpenAPI/Swagger do seu backend. Pode ser um arquivo `openapi.yaml`/`swagger.json` no próprio repo, um repositório de docs separado, ou uma URL versionada. Aponte `$API_CONTRACT_PATH` para ela (ver Regra 1).

## Quando usar

- Criar/alterar `src/features/**/*.schema.ts`
- Criar/alterar `src/features/*/types/api.types.ts`
- Criar/alterar uma chamada `apiClient(kyServer, "rota", schema)` (RSC ou Server Action)
- Criar mapper API → domain em `utils/`

## Quando NÃO usar

- Schemas que validam SÓ formulário (sem ida ao backend): ex.: validação de senha local
- Tipos puramente de UI (`ui.types.ts`)
- Constantes de layout, tema, ids (formatação)

## Regras centrais: o fluxo

### Regra 1: resolver `$API_CONTRACT_PATH`

```bash
# Defina a var apontando para sua fonte de contrato (arquivo OpenAPI ou repo de docs).
# Ex. em .env.local (gitignored):
# API_CONTRACT_PATH=/caminho/para/openapi   (diretório com os specs)

source <(grep API_CONTRACT_PATH .env.local) 2>/dev/null
test -n "$API_CONTRACT_PATH" || { echo "STOP: API_CONTRACT_PATH não definido"; exit 1; }
test -e "$API_CONTRACT_PATH" || { echo "STOP: path inválido"; exit 1; }
```

Se `$API_CONTRACT_PATH` não existe ou aponta para local inválido → **STOP**, perguntar ao usuário. Nunca prosseguir inferindo.

### Regra 2: localizar a especificação do endpoint

```bash
# Specs por recurso (um arquivo por recurso):
ls "$API_CONTRACT_PATH" | grep -iE "<recurso>"
# OU, num único openapi.yaml, buscar o path:
grep -nE "/<recurso>" "$API_CONTRACT_PATH/openapi.yaml"
```

Se houver mais de um candidato → ler cada um e identificar o endpoint exato pelo `path:`.

### Regra 3: confirmar a operação no spec

Encontre o bloco do endpoint exato:

```yaml
paths:
  /api/v1/users/{userId}:
    get:
      summary: ...
      operationId: ...
      parameters: ...
      responses:
        200: ...
        400: ...
```

Anote: path, method, request body schema (se POST/PUT/PATCH), response 200 schema, status codes de erro.

### Regra 4: `api.types.ts` é a EXCEÇÃO: não o caminho padrão

O `*.schema.ts` (Regra 5) é a **fonte única** do tipo, e `InferOutput<typeof schema>` é o **único** tipo que nomeia o contrato. NÃO escreva o mesmo tipo à mão em `api.types.ts`: dois lugares declarando `UserApiResponse` é colisão de nome e drift garantido.

`types/api.types.ts` só existe quando o shape cru snake_case **antes** da validação genuinamente difere do output validado (ex.: campo que o valibot coage/transforma, então o tipo de entrada ≠ o de saída). Aí ele descreve só o cru, com **nome próprio** (`UserApiRaw`), nunca o nome do `InferOutput`. Se entrada e saída coincidem → pule `api.types.ts` e vá direto ao schema.

```typescript
// Só quando o cru difere do validado. Nome distinto do InferOutput.
/**
 * Shape cru de GET /api/v1/users/{userId} antes da validação valibot.
 * Source: $API_CONTRACT_PATH/users.yaml
 */
type UserApiRaw = {
  id: string;
  full_name: string;
  email: string | null;
  created_at: string;
};
```

### Regra 5: o schema valibot é a fonte única

O schema espelha o spec 1:1: é onde o contrato vive:

- **Mesmo nome de campo** (snake_case se o backend manda snake_case).
- **Mesma nullability** (`nullable(...)` se o spec disser `nullable: true`).
- **Mesma optionality** (`optional(...)` se o campo não estiver em `required:`).
- Sem campo a mais, sem campo a menos.
- Schema valida o que entra (request) E o que sai (response).
- `InferOutput<typeof schema>` é a fonte da verdade do tipo runtime.
- Named imports (NUNCA `import * as v`: `import/no-namespace` proíbe e quebra tree-shaking).
- **Proibido `any()`/`unknown()`/`looseObject`**: afrouxam a borda e o `no-explicit-any` do lint NÃO pega isso.
- valibot só em `*.schema.ts`. Toda mensagem custom em PT-BR.

```typescript
// features/users/user.schema.ts
import { object, string, nullable, pipe, minLength, email, type InferOutput } from 'valibot';

export const userApiResponseSchema = object({
  id: pipe(string(), minLength(1, 'ID ausente na resposta')),
  full_name: pipe(string(), minLength(1, 'Nome ausente na resposta')),
  email: nullable(pipe(string(), email('E-mail inválido'))),
  created_at: string(),
});

export type UserApiResponse = InferOutput<typeof userApiResponseSchema>;
```

### Regra 6: a chamada vai por `apiClient` e o JSDoc cita o spec

`apiClient` (em `lib/api`) exige o schema → valida com valibot por construção (impossível buscar sem validar). Leitura roda em RSC; mutação em Server Action.

```typescript
import { apiClient } from '@/lib/api/client';
import { kyServer } from '@/lib/api/ky.server';
import { userApiResponseSchema, type UserApiResponse } from '@/features/users/user.schema';

/**
 * Busca um usuário por ID (server-side).
 *
 * Endpoint: GET /api/v1/users/{userId}
 * Source: $API_CONTRACT_PATH/users.yaml
 * Auth: cookie JWT same-site encaminhado pelo backend.
 *
 * @param userId - UUID do usuário.
 * @throws ApiError 404 quando o usuário não existe.
 */
async function getUser(userId: string): Promise<UserApiResponse> {
  return apiClient(kyServer, `api/v1/users/${userId}`, userApiResponseSchema);
}
```

### Regra 7: mapper SE houver diferença API → domain

- API entrega `snake_case` → domain expõe `camelCase`. Mapper em `utils/` (função pura).
- API entrega `created_at: string` → domain expõe `createdAt: Date`. Mapper.
- API entrega `status_id: number` → domain expõe `statusId: StatusId` (branded). Mapper.

```typescript
function mapApiUserToDomain(api: UserApiResponse): User {
  return {
    id: api.id,
    name: api.full_name,
    email: api.email,
    createdAt: new Date(api.created_at),
  };
}
```

### Regra 8: ordem de atualização

Quando o backend muda um endpoint:

1. Atualizar a fonte de contrato (`git -C $API_CONTRACT_PATH pull`, se for repo separado).
2. Atualizar `*.schema.ts` (valibot): a fonte única.
3. Atualizar `types/api.types.ts` **só se** o cru pré-validação diferir do output (Regra 4).
4. Atualizar mapper em `utils/`.
5. Atualizar a chamada `apiClient` (JSDoc + retorno).
6. **Só então** tocar RSC/Server Actions/componentes.

## Referência rápida

| Estou prestes a...                 | Faço o quê primeiro?                                             |
| ---------------------------------- | ---------------------------------------------------------------- |
| Criar schema de response           | Ler o spec do endpoint                                           |
| Adicionar campo numa chamada `apiClient` | Confirmar que o backend já entrega                         |
| Mexer em `api.types.ts`            | Comparar 1:1 com o spec                                          |
| Criar mapper                       | Ler shape no spec + decidir o que muda no domain                 |
| "Otimizar" tirando campo do schema | Ler spec: talvez o campo seja `required: true` e quebra runtime |

## Sinais de alerta: PARE

- Vontade de "deduzir o tipo a partir do código que já existe"
- Tentação de adicionar campo `?` "por precaução"
- Schema com `looseObject`/`unknown()`/`any()` para "aceitar o que vier"
- `unknown()` ou `any()` em qualquer field
- Mensagem de erro valibot em inglês ("Invalid email") em vez de PT-BR
- Chamada que captura erro e devolve `null` (deve propagar)
- Modificar componente antes de ter atualizado o contrato

## Racionalizações comuns

| Desculpa                                               | Realidade                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| "O spec está desatualizado, o código real é o backend" | Se o spec está desatualizado, abra issue na fonte de contrato. Não duplique o erro no cliente. |
| "É um endpoint legado, não vou abrir o spec"           | Legado é onde mais bug mora. Abre.                                             |
| "Sei de cabeça o que esse endpoint retorna"            | Memória mente. Abre o spec.                                                    |
| "Vai dar trabalho demais espelhar cada campo"          | Trabalho é uma vez. Drift custa todo PR.                                       |
| "Vou usar `any()`/`unknown()` no schema pra desbloquear" | Desbloqueia hoje, quebra runtime sem aviso amanhã.                           |
| "O backend nunca retorna esse campo nulo na prática"   | "Na prática" não é contrato. Se o spec diz `nullable: true`, o tipo carrega.   |

## Verificação

```bash
# 1. Env var existe e aponta para path válido
test -n "$API_CONTRACT_PATH" && test -e "$API_CONTRACT_PATH" \
  || echo "FAIL: API_CONTRACT_PATH inválido"

# 2. Toda chamada ao contrato deve citar o spec no JSDoc
rg -t ts "Endpoint: " src/features/ src/app/ -c
rg -t ts "Source:" src/features/ src/app/ -c
# Os números devem bater (todo Endpoint tem Source)

# 3. Nenhum resquício de Zod, e nenhum any()/unknown() em schema de borda
rg "from ['\"]zod['\"]|\bz\." src/features/ \
  && echo "VIOLAÇÃO: Zod proibido: use valibot em *.schema.ts"
rg "\b(any|unknown)\(\)" src/features/**/*.schema.ts \
  && echo "VIOLAÇÃO: any()/unknown() afrouxa a validação de borda"
```

## Quando há divergência spec × backend real

Se durante implementação você descobrir que o backend retorna algo diferente do spec:

1. **Não silencia no schema** (não troca por `looseObject`/`any()` nem afrouxa).
2. **Documenta** em `docs/contract-drift.md` (criar se não existir): endpoint + spec diz X + real é Y + data + responsável de fixar.
3. **Pergunta ao usuário** se o caminho é (a) atualizar a fonte de contrato ou (b) abrir bug no backend.
4. Só depois ajusta o cliente com a verdade confirmada.
