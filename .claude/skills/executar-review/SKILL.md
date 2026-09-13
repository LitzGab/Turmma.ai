---
name: executar-review
description: Portão de qualidade de uma tarefa, antes da conclusão
argument-hint: <caminho do N_task.md>
---

Você revisa o que foi implementado e dá um veredito: **APROVADO** ou **REPROVADO**.

Reprovar é normal e barato. O custo de deixar passar é outro: neste produto, um erro de
isolamento ou de dado pessoal não é um bug a ser corrigido na próxima sprint, é o fim de um
contrato. Revise como quem vai ter que explicar isso a uma coordenadora.

Não escreva elogio e não resuma o que o código faz. Aponte o que está errado e o que
precisa mudar.

Tarefa: `$ARGUMENTS`

## 1. Escopo

A tarefa fez o que o `N_task.md` pediu? Fez **mais** do que pediu?

Implementação que invade tarefa futura é reprovação. Ela quebra o sequenciamento, polui o
commit, e entrega código que ninguém auditou com o contexto certo.

## 2. Aderência à Tech Spec

Divergiu da arquitetura definida? Se divergiu e estava certo em divergir, isso deveria ter
sido reportado antes, não decidido em silêncio no meio da implementação.

## 3. Regras

| Regra | O que olhar |
|---|---|
| `00` | Controller sem regra, repository único no banco, nada demorado em request, DTO explícito |
| `10` | `escolaId` presente, escopo no repository, autorização por objeto, teste de isolamento efetivo |
| `20` | Log sem dado pessoal, campo novo na tabela de `docs/lgpd.md`, auditoria onde exigida, seed sintético |
| `30` | Sem SDK de provedor fora do adaptador, perfil declarado, orçamento, rastreabilidade da origem |
| `40` | Teste prova regra, casos de borda do domínio cobertos, nada de `.skip` |
| `50` | Quatro estados, Chromebook fraco, responsivo e usável no celular, ação oficial protegida, aluno sem ver dado de colega |
| `60` | Vocabulário do glossário, ano letivo como dimensão, reivindicação aprovada |
| `70` | Nota com autor humano em todo caminho, sem decisão autônoma, tutor supervisionado |
| `80` | Rate limit por usuário e escola, fila com prioridade, sem estado em memória, concorrência protegida, índice pelo escopo, migration compatível |

Para a regra 10 e a 20, faça sempre o mesmo teste mental: **troque o id na URL**. Quem não
deveria, alcança?

Para a regra 80, a pergunta é outra: **o que acontece com isso às 10h de segunda, com sessenta
turmas usando ao mesmo tempo atrás do IP da própria escola?**

## 4. Vetos

Leia a seção "Revisões" do `N_task.md`, que o hook escreve quando cada revisor termina. Não
aceite veredito citado de memória ou no relatório.

- Todo revisor da linha "Subagentes obrigatórios" tem rodada registrada?
- A última rodada de `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`,
  `infra-guardian` e `test-engineer`, quando obrigatórios, é APROVADO?
- Algum revisor ainda está rodando? Então espere: revisão não termina antes deles.

Revisor obrigatório sem rodada registrada é reprovação, não presunção de aprovação.

## 5. Qualidade de código

Nomes claros, função com uma responsabilidade, erro tratado, sem código morto, sem `any`,
sem comentário explicando o óbvio. Legibilidade acima de esperteza: quem vai ler isso daqui
a seis meses é alguém sem o contexto de hoje.

## 6. Portão automático

```bash
npm run typecheck && npm run test && npm run lint
```

## Veredito

```
VEREDITO: APROVADO | REPROVADO
Escopo: respeitado | invadiu tarefa futura | incompleto
Aderência à techspec: ...
Regras violadas: <lista ou nenhuma>
Vetos: ...
Portão: typecheck / test / lint / e2e
Problemas encontrados: <arquivo, linha, o quê>
Correções exigidas: <lista objetiva>
```
