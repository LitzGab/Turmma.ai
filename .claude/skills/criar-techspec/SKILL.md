---
name: criar-techspec
description: Cria a Tech Spec de uma funcionalidade, a partir do PRD
argument-hint: <nome-funcionalidade em kebab-case>
---

Você vai escrever o documento que responde **como vamos construir**. O PRD já decidiu o quê.

A razão de a Tech Spec existir separada: se a arquitetura for decidida no meio da
implementação, cada tarefa toma uma decisão diferente e o sistema perde unidade. Aqui ela é
decidida uma vez, com calma, por alguém que olhou o código inteiro antes.

<critical>EXPLORE O PROJETO ANTES DE PERGUNTAR</critical>
<critical>NÃO GERE A TECH SPEC SEM PERGUNTAS DE CLARIFICAÇÃO</critical>
<critical>NÃO REPITA OS REQUISITOS DO PRD. AQUI É O COMO.</critical>

Funcionalidade alvo: `$ARGUMENTS`

## Entradas

- PRD obrigatório: `tasks/prd-$ARGUMENTS/prd.md`
- Template: `.claude/skills/criar-techspec/template.md`
- Desenho vigente: `docs/arquitetura.md` e `docs/modelo-de-dados.md`
- Regras: `.claude/rules/` — cada uma explica por que existe; leia o porquê, não só a lista.
  As regras 30 e 50 só carregam sozinhas ao ler arquivo do caminho delas: leia-as se a
  funcionalidade tem IA ou tela
- Contexto: `CLAUDE.md`, `docs/visao-produto.md` e as decisões citadas no PRD, por extenso, em
  `docs/decisoes.md`
- Tela: `docs/interface.md`
- Carga e operação: `docs/infra.md`
- Pendências herdadas: a seção 6 do `validacao.md` de cada funcionalidade de que esta
  depende. O que ficou recomendado para "a próxima que mexer nisso" entra aqui ou é
  descartado com motivo
- Skills técnicas da stack em `.claude/skills/` (NestJS, Drizzle, Postgres, BullMQ, React,
  TanStack Query, Tailwind, Vitest, Playwright). Use como referência, respeitando os
  conflitos listados na seção "Skills" do `CLAUDE.md`

## Fluxo

### 1. Ler o PRD inteiro

Não pule. Tech Spec escrita a partir do título da funcionalidade é como nascem os sistemas
que resolvem outra coisa.

### 2. Explorar o projeto

Mapeie módulos existentes, entidades já criadas, pontos de integração e padrões em uso.
Reaproveitar o que existe vale mais do que criar algo novo e mais bonito. Um segundo jeito
de fazer a mesma coisa é dívida permanente.

### 3. Pesquisar

- Dúvida sobre biblioteca: documentação oficial, não blog
- Regra externa ou API de terceiro: **acione `domain-researcher`**, no mínimo três buscas
- Toca modelo de IA: acione `llm-integrator`, que vai cobrar perfil e estimativa de custo
- Gera conteúdo pedagógico: acione `pedagogia-reviewer` para definir o critério de qualidade
  antes de existir código

<critical>Premissa não confirmada em fonte oficial entra marcada como `⚠️ NÃO VERIFICADO`,
com interface abstrata e implementação falsa propostas. Não invente endpoint, campo nem
comportamento de terceiro: isso vira uma tarefa que falha na integração real, semanas
depois, quando ninguém lembra de onde veio a suposição.</critical>

### 4. Esclarecer

Pergunte sobre fluxo de dados, interfaces principais, o que é síncrono, o que vai para fila,
e **o que acontece quando cada parte falha**. Essa última é a mais esquecida e a que mais
gera bug em produção.

Não pergunte o que as regras já definem. Cite a regra e siga.

### 5. Seções obrigatórias

Toda Tech Spec deste projeto tem quatro seções que não são opcionais. Elas existem porque
são exatamente os quatro lugares onde este produto pode morrer:

- **Isolamento** — como o escopo de escola e ano letivo é aplicado aqui, e quais testes de
  isolamento serão escritos (`rules/10`)
- **Dado pessoal** — o que é coletado, o que vai para log, o que entra em auditoria, para
  onde é enviado, qual a retenção. Campo novo entra na tabela de `docs/lgpd.md` **nesta
  tarefa**, não numa futura (`rules/20`)
- **Conformidade CNE** — se há IA no caminho do aluno: classificação de risco, onde está a
  aprovação humana, como o professor supervisiona (`rules/70`)
- **Carga e falha** — em que ponto do modelo de carga de `docs/infra.md` esta funcionalidade
  entra, o que ela faz na manhã de segunda, qual fila e prioridade usa, que limite por escola
  aplica, onde há corrida de concorrência, e o que o usuário vê quando cada dependência cai
  (`rules/80`). Funcionalidade fora do caminho quente declara isso em uma linha

Se a funcionalidade chama modelo, uma quarta: **perfis de IA e custo estimado**.

### 6. Mapear conformidade

Cada decisão contra `.claude/rules/`. Desvio precisa de justificativa escrita e alternativa
considerada. Desvio silencioso é o que faz a regra perder força.

### 7. Salvar e medir

`tasks/prd-$ARGUMENTS/techspec.md`. Depois meça: `wc -w tasks/prd-$ARGUMENTS/techspec.md`.

**Teto de 2.000 palavras.** A Tech Spec do F1 saiu com 5.393, e cada uma das 20 tarefas manda o
implementador e os revisores lerem pedaços dela. Acima do teto:
- tire o que repete o PRD, as regras ou `docs/arquitetura.md` (cite em vez de copiar);
- detalhe de uma tarefa só (nome de arquivo, assinatura de função menor) vai para o `N_task.md`,
  não para a Tech Spec;
- se ainda passar, proponha dividir a funcionalidade e pergunte. Subir o teto só com o usuário
  aceitando, e o motivo escrito no topo do documento.

### 8. Próximo passo

Reporte o caminho, as palavras e o próximo comando: `/revisar-spec $ARGUMENTS`. As tarefas só são
geradas com a Tech Spec revisada.

## Checklist

- [ ] PRD lido inteiro
- [ ] Projeto explorado, reaproveitamento considerado
- [ ] `domain-researcher` acionado para toda dependência externa
- [ ] Premissas não verificadas marcadas com ⚠️
- [ ] Seção de isolamento preenchida
- [ ] Seção de dado pessoal preenchida e `docs/lgpd.md` atualizado se houver campo novo
- [ ] Seção de conformidade CNE preenchida, quando aplicável
- [ ] Seção de carga e falha preenchida, e `infra-guardian` consultado se toca caminho quente
- [ ] Perfis de IA e custo estimado, se aplicável
- [ ] Comportamento em falha definido
- [ ] Até 2.000 palavras, medido com `wc -w`, ou teto excedido com aceite escrito
- [ ] Salvo em `tasks/prd-$ARGUMENTS/techspec.md`
- [ ] Próximo passo apontado: `/revisar-spec $ARGUMENTS`
