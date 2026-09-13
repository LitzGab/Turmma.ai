# Tech Spec — [nome da funcionalidade]

**PRD:** `tasks/prd-[func]/prd.md`
**Status:** rascunho | aprovado

## 1. Resumo da abordagem

Como isso será construído, em um parágrafo. Sem repetir os requisitos do PRD.

## 2. Módulos afetados

| Módulo | Novo ou alterado | O quê |
|---|---|---|

## 3. Modelo de dados

Tabelas novas e alteradas, com campos e relações. Marque `escolaId` e `anoLetivoId` onde
existem. Se alguma tabela de domínio não tem `escolaId`, justifique — ou corrija.

```
Entidade   campo tipo, campo tipo
```

Migrations necessárias e ordem.

## 4. API

| Método | Rota | Papel | Entrada | Saída |
|---|---|---|---|---|

## 5. Fluxo

Passo a passo do caminho principal. O que é síncrono, o que vai para fila, o que acontece
quando cada parte falha.

## 6. Isolamento (obrigatório)

Como o escopo de escola e ano letivo é aplicado nesta funcionalidade. Quais testes de
isolamento serão escritos. Referência: `.claude/rules/10-multitenancy.md`.

## 7. Dado pessoal (obrigatório)

| Item | Resposta |
|---|---|
| Campos pessoais tocados | |
| Novos campos (atualizar `docs/lgpd.md`) | |
| O que vai para log | deve ser só id |
| O que entra em auditoria | |
| O que é enviado a provedor externo | |
| Retenção e expurgo | |
| Autorização por objeto | como é feita |
| DTO de saída | campos expostos |

Referência: `.claude/rules/20-lgpd-menores.md` e `docs/lgpd.md`.

## 7b. Conformidade CNE (quando há IA no caminho do aluno)

Classificação de risco, onde está a aprovação humana, como o professor supervisiona, qual
o nível de autonomia do agente. Referência: `.claude/rules/70-conformidade-cne.md`.

## 7c. Carga e falha (obrigatório)

| Item | Resposta |
|---|---|
| Está no caminho quente? | login, tutor, sala, prova, fila, IA, nenhum |
| Carga na manhã de segunda | requisições/s, jobs, tokens/min, a partir de `docs/infra.md` seção 3 |
| Fila e prioridade | interativa, normal, lote |
| Limite por escola | concorrência, tamanho, quantidade |
| Rate limit | por usuário e por escola |
| Corridas de concorrência | onde e como são travadas (restrição, transação, idempotência) |
| Índices novos | começando pelo escopo |
| Migration | compatível com o código anterior? |
| Quando cada dependência cai | banco, Redis, provedor de IA, storage: o que o usuário vê |
| Métrica e alerta | o que mede, o que alerta, parágrafo do runbook |
| Cenário de teste de carga | novo ou alterado |

Referência: `.claude/rules/80-infra-e-carga.md` e `docs/infra.md`.

## 8. Uso de IA (quando aplicável)

| Caso de uso | Perfil | Entrada | Saída | Validação | Aprovação humana |
|---|---|---|---|---|---|

Custo estimado por professor/mês ou por aluno/mês. Onde ficam os prompts.

## 9. Frontend

Telas, estados, componentes reaproveitados. Como fica em Chromebook fraco, com throttling de rede e de CPU, e no celular a partir de 360 px, com toque e rede móvel (D51).

## 10. Testes

| Camada | O que será testado |
|---|---|
| Unidade | |
| Integração | |
| E2E | |
| Isolamento | |

## 11. Conformidade com as regras

| Regra | Como é atendida | Desvio e justificativa |
|---|---|---|

## 12. Premissas não verificadas

`⚠️ NÃO VERIFICADO` — o que não foi confirmado em fonte oficial, e qual interface abstrata
e implementação falsa serão usadas enquanto isso.

## 13. Riscos técnicos

O que pode dar errado e o que fazer se der.
