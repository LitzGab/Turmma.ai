# Correção — o e2e "duas abas" do acesso suspenso cai na esteira porque a segunda aba pede antes da primeira

**Origem:** esteira `39037075898` (`033a871`), `e2e/acesso-suspenso.spec.ts:169` (`chromebook`), a segunda vez que cai (a primeira foi a `38990594424`, no `TODO.md`).
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- O `frontend-reviewer` veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção. `revisor-geral`: a correção mexe em um arquivo fora de `tasks/` e `TODO.md`, e não toca `.github/`, `tools/ci/` nem `tools/processo/`. -->

## Sintoma

`expect(getByRole('heading', { level: 1, name: 'Acesso suspenso' })).toBeVisible({ timeout: 20 s })` na linha 182 (a primeira aba, depois de ir a "Ferramentas") não encontra o título, e o teste estoura os 30 s. Na esteira os outros três casos do arquivo levaram 12 a 25 s.

## Fora desta correção

Nada: nenhuma tarefa em curso na árvore (`git status` limpo).

## Causa

**Não é o teto de 30 s** (a hipótese do `TODO.md`, `test.slow()`): é uma corrida, provada no trace da esteira (artefato `traco-do-e2e-1`).

O teste afirma que "a primeira aba é a que pede primeiro": só o 403 dela apaga o cookie, e a segunda, depois, renova sem cookie (401) e recebe o login por cima. A linha do tempo do trace mostra o contrário:

| instante (ms) | aba | requisição |
|---|---|---|
| 273368 | segunda | a saudação "Bom dia" aparece; `esperarNovaConversa` volta |
| 273352 (saída) | segunda | `GET /v1/meus-vinculos` → **401** (chegou depois de a marca ir ao banco) |
| 273473 | segunda | `POST /v1/sessao/renovar` → **403** (o cookie é apagado aqui) |
| 273561 a 273667 | primeira | clique em "Ferramentas" |
| 274280 | primeira | `GET /v1/artefatos` → 401 |
| 274852 | primeira | `POST /v1/sessao/renovar` → **401**, sem cookie |

A saudação só espera o `/v1/eu`. Ao montar, a Nova conversa dispara quatro consultas (`apps/web/src/areas/professor/Home.tsx`: `consultaEu`, `consultaMeusVinculos`, `consultaTime` e `consultaEntregasPendentes`, esta a `GET /v1/entregas?estado=pendente&limite=…`, que a casca da escola também dispara), e o trace só mostrou duas delas a caminho (`/v1/meus-vinculos` e `/v1/time`). Qualquer leitura a caminho basta: quando `agendarEliminacaoNoBanco` rodou, na máquina lenta da esteira, a segunda aba ainda tinha leitura sem resposta, e foi ela quem levou o 403 primeiro. A primeira aba renovou sem cookie, recebeu 401 e mostrou o diálogo "Sua sessão expirou", e não o título. Na máquina local as leituras voltam antes da saudação (10 de 10 verdes, 12 s), e por isso nunca apareceu. A hipótese foi revista duas vezes: o teto de 30 s (`TODO.md`), depois as duas leituras do trace, e por fim a terceira (`/v1/entregas`), achada na auditoria do `test-engineer`. O defeito é do teste (o que ele supõe da ordem), e não da tela nem da API.

## Teste que reproduz

`e2e/acesso-suspenso.spec.ts › duas abas: …`. A segunda aba passa a ser aberta com toda leitura (`GET /v1/…`) atrasada em 1,5 s (`page.route`), que é a esteira lenta forçada, e não esperada. Sem a espera por zero requisições a caminho ela reproduz a corrida na máquina de forma determinística:

- **Vermelho antes** (a linha `await expect.poll(() => aCaminho.size, …).toBe(0)` comentada): `acesso-suspenso.spec.ts:208`, `expect(heading "Acesso suspenso").toBeVisible()` → `element(s) not found`, no `chromebook`. Com a primeira versão (espera só por vínculos e time) o mesmo vermelho saiu em `:207`.
- **Verde depois:** o arquivo inteiro 5 vezes nos dois perfis (40 de 40, `--repeat-each 5 --workers 2`).

## Correção

Em `e2e/acesso-suspenso.spec.ts`, `abrirSegundaAbaQuieta` abre a segunda aba com toda leitura da API atrasada em `ATRASO_DA_REDE_LENTA_MS`, conta na própria aba o que saiu (`request`) e ainda não voltou (`requestfinished`, `requestfailed`) e só devolve a aba quando o `expect.poll` chega a zero. Não lista consultas: cobre também a que a tela ganhar depois. Com isso nada da segunda aba está a caminho quando a marca vai ao banco, e o 403 é da primeira, como o teste diz. O prazo do teste **não** mudou: a causa não é o tempo.

## Mutações

Sem a espera por zero requisições a caminho, o teste fica vermelho (a corrida volta): a mutação apaga o fechamento inteiro, e não a espera de duas respostas.

```mutacao
arquivo: e2e/acesso-suspenso.spec.ts
teste: e2e/acesso-suspenso.spec.ts › duas abas
  await esperarNovaConversa(aba, nome)
- await expect.poll(() => aCaminho.size, { timeout: PRAZO_DA_ENTRADA_MS }).toBe(0)
  await aba.unroute(eUmaLeitura)
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (2ª) | "Zero de passagem": o `expect.poll` pode ler zero entre uma resposta e uma consulta que dependa dela; exigir zero em duas leituras seguidas se a tela ganhar consulta dependente | Não aplicada: hoje a Nova conversa dispara tudo na montagem, e a recomendação é condicional. Vai para o `TODO.md`, para quem acrescentar consulta com `enabled` dependente na Nova conversa |
| test-engineer (2ª) | Prova de que o atraso pegou: um `expect` de que o `Set` teve mais de um item quando a saudação apareceu | Não aplicada: muda o teste e caducaria a rodada; quem prova hoje é o vermelho da mutação, provado pelo portão. Fica no `TODO.md` com a anterior |
| test-engineer (2ª) | Ouvintes de `request` presos na aba devolvida: `aba.off` ao lado do `unroute` | Recusada: não faz mal, a aba vive até o fim do teste |
| frontend-reviewer (1ª) | Sufixos hexadecimais da massa da vitrine | Recusada: massa de `tools/vitrine/`, fora desta correção |
| frontend-reviewer (1ª) | "Esperando você" some por inteiro sem entrega pendente | `/validar` da spec: tela da Nova conversa, nenhum `apps/web` muda aqui |
| frontend-reviewer (1ª) | Seletor de turma e botão de enviar abaixo de 44 px no celular | `/validar` da spec, junto com a tarefa que cuida dessa tela |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-17 12:24:34 | 2026-10-17 12:24:53 | `frontend-reviewer` | 1 | APROVADO | a84beeff182b945a1 |
| 2026-10-17 12:24:37 | 2026-10-17 12:26:32 | `test-engineer` | 1 | REPROVADO | aac96f52d0bf117b8 |
| 2026-10-17 12:37:45 | 2026-10-17 12:39:20 | `test-engineer` | 2 | APROVADO | a1e63f89b0dfdc0d4 |
