---
name: criar-prd
description: Cria o PRD de uma funcionalidade, a partir do contexto do projeto e do roadmap
argument-hint: <nome-funcionalidade em kebab-case>
---

Você vai escrever o documento que responde **o que vamos construir e por quê**. Ele não
fala de tecnologia: essa é a função da Tech Spec, no passo seguinte.

A razão de o PRD existir separado: quando decisão de produto e decisão técnica se misturam,
você acaba com uma arquitetura elegante resolvendo um problema que ninguém tinha. Aqui
decidimos o problema; depois decidimos a solução.

<critical>NÃO GERE O PRD SEM ANTES FAZER PERGUNTAS DE CLARIFICAÇÃO</critical>
<critical>EM HIPÓTESE NENHUMA FUJA DO TEMPLATE</critical>
<critical>O PRD DESCREVE O QUÊ E POR QUÊ. NUNCA COMO.</critical>

Funcionalidade alvo: `$ARGUMENTS`

## Contexto que você precisa ler antes

- `docs/visao-produto.md` — o que é o produto e para quem. Sem isso, você vai escrever
  requisito genérico de software escolar, e não deste software escolar
- `docs/fluxos.md` — provavelmente esta funcionalidade é um dos sete fluxos, ou parte de
  um. O fluxo já traz os casos de borda reais
- `CLAUDE.md` — o que já foi decidido, para você não perguntar de novo
- `ROADMAP.md` — confirme que as dependências estão `[x]`. Se não estiverem, PARE e diga
  qual falta
- `docs/glossario.md` — escreva no vocabulário do domínio
- `docs/interface.md` — se a funcionalidade tem tela: a navegação e o comportamento do chat,
  das ferramentas e do feed já estão decididos lá
- `docs/negocio.md` — se a funcionalidade mexe com preço, consumo de IA, governança ou
  demonstração
- Se o PRD depende de uma **decisão em aberto** do `CLAUDE.md` (lista de agentes, teto do
  tutor, cobrança), PARE e sugira `/descobrir <tema>` antes. Não feche essa decisão dentro
  do PRD
- Se a funcionalidade toca dado de pessoa ou IA sobre aluno: `docs/lgpd.md` e
  `docs/regulacao.md`

## Fluxo

### 1. Esclarecer (obrigatório)

<critical>Não pergunte o que o `CLAUDE.md` ou o `docs/fluxos.md` já respondem. Liste as
decisões que você assumiu de lá e pergunte só o que ficou realmente em aberto. Perguntar o
que já está escrito desperdiça o tempo de quem responde e faz o processo parecer teatro.</critical>

Pergunte sobre: o problema real de quem usa, o comportamento esperado nos casos de borda,
o que fica **fora** de escopo, e quem pode fazer o quê.

Uma pergunta que toda funcionalidade precisa responder: **quais papéis tocam isso e o que
cada um pode e não pode fazer?** Se essa matriz ficar implícita, ela vira uma decisão
tomada no meio do código por quem estiver implementando.

### 2. Pesquisar, quando houver regra externa

BNCC, correção de redação do Enem, regra de nota de rede pública, LGPD, licitação, API de
terceiro: acione o subagente `domain-researcher` antes de escrever. Regra oficial chutada
vira retrabalho caro e, às vezes, problema jurídico.

### 3. Redigir

Siga `.claude/skills/criar-prd/template.md` (e calibre o nível de detalhe com `exemplo-preenchido.md`, na mesma pasta) exatamente. Máximo 2.000 palavras.

**Todo requisito precisa ser verificável.** Se você não consegue imaginar o teste que prova
aquele requisito, o requisito está vago. Reescreva.

```
ruim:  RF3 — O sistema deve ser rápido ao corrigir provas.
bom:   RF3 — A correção de uma turma de 40 provas objetivas conclui em até 2 minutos,
              e o professor recebe aviso no feed quando termina.

ruim:  RF7 — O tutor não deve dar respostas prontas.
bom:   RF7 — Quando o aluno pede a resposta de um exercício da lista ativa, o tutor
              recusa e devolve uma pergunta que avança o raciocínio, citando a página
              do material onde o conceito está.
```

### 4. Salvar

Crie `tasks/prd-$ARGUMENTS/` e salve `prd.md`.

### 5. Reportar

Caminho do arquivo, resumo em até cinco linhas, e a lista das perguntas que ficaram abertas
e que a Tech Spec vai herdar.

## Checklist

- [ ] Visão de produto, fluxos, CLAUDE.md e glossário lidos
- [ ] Dependências do roadmap confirmadas concluídas
- [ ] Perguntas feitas, sem repetir o que já estava escrito
- [ ] `domain-researcher` acionado se havia regra externa
- [ ] Matriz de permissão por papel definida
- [ ] Dado pessoal listado, com finalidade e retenção
- [ ] Classificação de risco do CNE declarada, se há IA no caminho do aluno
- [ ] Requisitos numerados e verificáveis
- [ ] Casos de borda são os do domínio escolar, não genéricos
- [ ] Salvo em `tasks/prd-$ARGUMENTS/prd.md`
