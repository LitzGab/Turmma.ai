---
name: descobrir
description: Entrevista para fechar uma decisão de produto em aberto (lista de agentes, teto do tutor, cobrança, identidade visual…) antes de ela virar PRD
argument-hint: <tema da decisão em aberto>
---

Você conduz uma conversa curta para transformar uma **decisão em aberto** em uma **decisão
tomada**, com motivo. Você não escreve PRD, não escreve código e não decide sozinho.

A razão de este comando existir: o `/criar-prd` pergunta sobre uma funcionalidade, mas
algumas perguntas são maiores que uma funcionalidade. "Quais são os agentes e o que cada um
faz sozinho?" atravessa F6, F9, F11 e F12. Se isso for decidido dentro do PRD de uma delas,
as outras herdam uma decisão que ninguém tomou de propósito.

<critical>A DECISÃO É DE QUEM RESPONDE. Você traz opções, consequências e uma recomendação.
Não registre nada que a pessoa não tenha escolhido.</critical>
<critical>NÃO PERGUNTE O QUE JÁ ESTÁ ESCRITO. Leia antes e cite de onde tirou.</critical>

Tema: `$ARGUMENTS`

## 1. Ler antes de perguntar

- `CLAUDE.md` — índice das decisões, conflitos resolvidos e a lista de decisões em aberto
- `docs/decisoes.md` — o texto completo das decisões que tocam o tema
- `docs/visao-produto.md` e `docs/fluxos.md` — o que o produto promete
- `docs/negocio.md` — preço, mercado e concorrência, quando a decisão mexe com custo ou venda
- O doc técnico do tema: `docs/agentes.md`, `docs/ingestao.md`, `docs/interface.md`,
  `docs/arquitetura.md`
- `.claude/rules/` — o que a lei e as regras já fecharam. Uma opção que viola a regra 10,
  20 ou 70 não é opção: diga isso e tire da mesa

Se o tema não estiver na lista de decisões em aberto, confirme com a pessoa que é mesmo uma
decisão nova antes de continuar.

## 2. Pesquisar, se houver fato externo

Preço de modelo, regra do CNE, formato do ENEM, termo de uso de sistema de ensino: acione
`domain-researcher`. Uma recomendação apoiada em número chutado é pior que nenhuma.

Se a decisão mexe com custo de IA, faça a conta. Ordem de grandeza basta, mas precisa
existir: tokens por interação × interações por aluno por dia × dias letivos × preço do
perfil. Compare com o alvo de R$ 30 por aluno por mês (D14).

## 3. Perguntar

- No máximo quatro perguntas por rodada, cada uma com duas a quatro opções concretas
- Cada opção diz **o que muda no produto** e **quanto custa** (em dinheiro, em prazo ou em
  risco), não só o nome
- A primeira opção é a sua recomendação, marcada como tal, com uma linha de porquê
- Pergunte o que de fato separa as opções. Se todas levam ao mesmo sistema, a pergunta não
  precisava ser feita
- Pare quando houver resposta suficiente para escrever a decisão. Três rodadas é o teto

## 4. Fechar

Mostre o resumo antes de registrar:

```
Decisão: <uma frase>
Motivo: <por que esta e não as outras>
Consequências: <o que muda no roadmap, nos docs, nas regras>
Continua em aberto: <o pedaço que não foi decidido, se houver>
```

Com a confirmação, rode `/registrar-decisao` passando esse resumo. Não edite o
`CLAUDE.md` por conta própria fora daquele fluxo.
