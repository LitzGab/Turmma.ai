# Validação — <funcionalidade>

## Rodada <n> — <DD/MM/AAAA>

**Escopo:** funcionalidade completa | tarefa N.0
**Commit validado:** `<hash>`
**Veredito: APROVADA | APROVADA COM RESSALVAS | REPROVADA**

### 1. RF a RF

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1 | ATENDIDO | `apps/.../arquivo.ts:linha` | `.../arquivo.test.ts` ("nome do caso") | |

Provas de mutação:

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| | | |

### 2. Regras de negócio, casos de borda e critério de pronto

| Item | Situação | Evidência |
|---|---|---|
| Regra: ... | cumprida | |
| Borda: ... | coberta · justificada · sem teste | |
| Pronto: ... | cumprido · faltando | |

### 3. Portão

| Portão | Resultado |
|---|---|
| `npm run typecheck` | ✅ / ❌ |
| `npm run lint` | ✅ / ❌ |
| `npm run test` | ✅ / ❌ (n passaram) |
| `npm run test:e2e` | ✅ / ❌ / não se aplica |
| `npm run test:infra` | ✅ / ❌ / não se aplica |
| Esteira do GitHub no commit validado | ✅ / ❌ / pendente / não verificado |
| Revisões com veto registradas e aprovadas | ✅ / ❌ |

### 4. Achados

**Críticos**
- `arquivo:linha`: o que está errado. Correção: ...

**Maiores**
- ...

**Menores**
- ...

**Positivos**
- ...

### 5. Conclusão

Por que o veredito é este e, se não for APROVADA, o caminho até ela.

### 6. Pendências herdadas

O que fica para depois sem bloquear, com o destino de cada uma (próxima funcionalidade que
mexer no assunto, `TODO.md`, `/descobrir`, `/registrar-decisao`).
