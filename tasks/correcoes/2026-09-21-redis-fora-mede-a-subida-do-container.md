# Correção — o teste do Redis fora mede a subida do container dentro do orçamento da regra

**Origem:** retrospectiva do F1 (`tasks/prd-identidade-e-tenancy/retro.md`), e previsto por escrito
pelo `test-engineer` e pelo `infra-guardian` na correção
`2026-09-20-reconciliacao-espera-o-redis-subir-dentro-do-orcamento`
**Subagentes obrigatórios:** `infra-guardian` (fila, Redis, resiliência sob carga)
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

Nenhum vermelho ainda — é o defeito irmão, apontado quando o primeiro foi corrigido:

> `apps/despachante/test/redis-fora.int.test.ts:97` — mesmo `composeAssincronoOuFalha('start',
> 'redis-fila')` sem `aguardarSaudavel`, com poll de 60 s absorvendo a subida do container. Não é
> urgente (a folga é 3× maior), mas é a mesma fragilidade e, quando ela aparecer, virá com a mesma
> mensagem ilegível.

A guarda de lint criada na retrospectiva (`guardas/esperar-servico-do-compose`) o apontou como a
única ocorrência restante no repositório.

## Causa

A mesma da correção de 20/09, e ela está provada lá com medição: `start` devolve quando o Docker
aceitou o comando, **não** quando o Redis responde. O prazo do `expect.poll` fica sendo um orçamento
dividido entre o container subir — que cresce com a carga da máquina — e a regra que o teste prova
(com o Redis de volta, a rodada seguinte despacha os 50 jobs).

Aqui a folga é maior (60 s contra os 30 s do caso anterior), e é por isso que este ainda não quebrou.
Folga não é garantia: é a mesma aposta na velocidade da máquina, e foi ela que produziu três
correções em cinco dias.

## Teste que reproduz

`tools/guardas/guardas.test.ts` › "reprova subir serviço e medir sem esperar, e deixa passar quem
espera ou usa `--wait`", com a fixture `tools/guardas/__fixtures__/esperar-servico.ts` — entram no
commit da retrospectiva, logo em seguida.

A guarda é o que impede a quarta ocorrência: sem a correção deste arquivo, `npm run lint` fica
vermelho assim que ela é registrada. Vermelho antes / verde depois, com a prova no lint.

## Correção

Uma linha: `await aguardarSaudavel('redis-fila')` depois do `start`, no teto padrão, mais o prazo do
caso alargado. (A primeira tentativa apertou a espera para 30 s; foi descartada — ver abaixo.)

O prazo de 60 s do poll fica como está, e aqui a razão é diferente da correção de 20/09: **o que este
caso prova é exatamente-uma-vez, não latência.** Um orçamento largo não esconde a regra que ele existe
para pegar, e apertá-lo sem medir seria o palpite que a correção anterior evitou. Medir a recuperação
depois do `healthy` e registrar o número fica no `TODO.md`.

**O prazo do caso sobe de 180 s para 240 s, e a espera fica no teto padrão.** O `test-engineer`
apontou que, com a espera dentro do caso, o pior caso encostava nos 180 s e a falha voltaria a ser
"test timed out" — o vermelho ilegível que esta classe existe para acabar. A primeira saída tentada
foi apertar a espera para 30 s, e o `infra-guardian` mostrou que ela era pior: **contradizia o
documento irmão**, que afirma que "no runner da esteira a subida sozinha passa dos 30 s", e nasceria
vermelha lá.

Registrado, porque a frase é minha e estava errada em espécie: aquele "passa dos 30 s" é
**inferência, não medição**. O que foi medido é 11,2 s sob contenção total nesta máquina e cerca de
6,5 s na esteira (`Starting` → `Healthy` do `redis-fila`, execução 35517746419). Não havendo medição
do pior caso do runner, alargar o prazo do caso é a saída que não aposta: a espera mantém o teto
padrão de 60 s, igual aos outros 28 usos do repositório, e a folga vem de onde não custa nada.

## Evidência

Os dois resultados abaixo foram obtidos com a guarda aplicada por cima desta árvore (ela entra no
commit seguinte, o da retrospectiva). **Neste commit, `npm run lint` passa com e sem a linha** — a
guarda ainda não existe no `main`, e é por isso que a ordem é esta: registrar a guarda antes da
correção deixaria o `main` vermelho.

- `npm run lint` com a guarda registrada e **sem** esta linha: reprova em
  `apps/despachante/test/redis-fora.int.test.ts:97`.
- Com a linha: lint limpo no repositório inteiro, e `tools/guardas/guardas.test.ts` verde com a guarda
  nova (65 casos naquela árvore; sem o stash são 62, porque a guarda ainda não existe aqui).
- Portão local: rodado sobre esta árvore, já com o teto padrão e o prazo de 240 s. O resultado da
  rodada anterior, com o teto de 30 s, não vale como evidência deste código.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-21 09:32:25 | 2026-09-21 09:36:49 | `test-engineer` | 1 | APROVADO | aae33b1583d46f934 |
| 2026-09-21 10:01:05 | 2026-09-21 10:02:06 | `test-engineer` | 2 | APROVADO | a30c346f839eabc2c |
| 2026-09-21 10:00:56 | 2026-09-21 10:03:47 | `infra-guardian` | 1 | APROVADO | a9ac4026850d124fa |
| 2026-09-21 10:04:41 | 2026-09-21 10:05:55 | `infra-guardian` | 2 | APROVADO | a98acbf4bc408beae |
| 2026-09-21 10:04:48 | 2026-09-21 10:06:46 | `test-engineer` | 3 | APROVADO | a1fca5560930a2ae3 |
