# Correção — o hook do commit ignora o instantâneo de conteúdo e caduca revisão por carimbo de hora

**Origem:** uso, no commit da correção `2026-09-22-corte-de-100-ms-do-redis-recusa-o-desafio-no-e2e`
**Subagentes obrigatórios:** nenhum guardião pela natureza (só `tools/processo/`, fora de `PASTAS_DE_CODIGO`)
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

Com a correção do Redis pronta, aprovada pelo `test-engineer` (6ª rodada) e pelo `infra-guardian`
(4ª rodada), e com o portão local verde nas cinco suítes, o commit ficou bloqueado:

```
Commit bloqueado: revisões de tasks/correcoes/2026-09-22-corte-de-100-ms-…md incompletas.
- infra-guardian: apps/api/src/sessao/configuracao-de-login.ts mudou em 2026-09-22 19:45:09, depois do início da 4ª rodada (2026-09-22 19:43:25).
- test-engineer: apps/api/src/config.test.ts mudou em 2026-09-22 19:45:09, depois do início da 6ª rodada (2026-09-22 19:43:14).
- portão local: apps/api/src/config.test.ts mudou em 2026-09-22 19:45:09, depois do início do último (2026-09-22 19:12:16).
```

E, na mesma árvore, no mesmo instante:

```
$ node tools/processo/portao-local.ts conferir tasks/correcoes/2026-09-22-corte-de-100-ms-…md
portão local válido para o código atual (typecheck, lint, test, e2e, infra)
```

Os dois olham a mesma árvore e respondem o contrário. O conteúdo estava correto: os instantâneos das
duas últimas rodadas e o do portão batiam por hash, arquivo por arquivo, com a árvore. O que andou foi
só o `mtime`, quando os dois revisores fizeram teste de mutação — alteram o arquivo, rodam a suíte,
restauram byte a byte —, que é justamente o que torna a revisão deles boa.

São **dois** critérios errados para a mesma pergunta, e o `TODO.md` já dizia que vão juntos: *"Vai junto na
mesma correção: `avaliarPortao` chama `alteracaoQueCaduca` e `avaliarCarimbo` sem passar o instantâneo,
enquanto o `conferir` do `portao-local.ts` passa — dois critérios para a mesma pergunta, na direção oposta do
defeito."* A primeira versão desta correção levava só a metade do `mtime`, e com isso **desarmava** a outra:
passar o instantâneo ao hook tirava a única defesa que restava contra carimbar código que nenhuma suíte rodou
(`test-engineer`, rodada 1). As duas estão aqui.

## Causa

`avaliarPortao` (`tools/processo/revisoes.ts`) chama `alteracaoQueCaduca` e `avaliarCarimbo` **sem o
quarto argumento**, o instantâneo de conteúdo. Os dois têm o parâmetro, e sem ele `mudouDeVerdade`
devolve `true` para qualquer arquivo — só o `mtime` decide:

```ts
const alteracao = alteracaoQueCaduca(revisor, ultima.inicio, entrada.alteracoes)   // sem instantâneo
const carimbo = avaliarCarimbo(entrada.carimbo, suitesExigidas(entrada.obrigatorios), entrada.alteracoes)
```

Quem grava os instantâneos é o próprio `revisoes.ts` (`gravarInstantaneo`, por rodada e para o
portão). Quem os lê é só o `portao-local.ts conferir`. O hook, que é quem bloqueia o commit, nunca os
abre.

A intenção contrária está escrita em dois lugares, e os dois viraram mentira no caminho do hook:

- `portao-local.ts`: *"O conteúdo que estas suítes provaram. Arquivo que volta ao mesmo conteúdo não
  invalida o carimbo."*
- `revisoes.test.ts`, no caso "arquivo que voltou ao mesmo conteúdo não invalida o carimbo nem a
  rodada": *"O revisor prova a guarda mutando o arquivo e restaurando. O mtime anda, o conteúdo não."*

**Esse caso já existia e passava** — porque chama `avaliarCarimbo` e `alteracaoQueCaduca` direto, com o
instantâneo na mão. A unidade estava certa; a fiação até o hook, não. É a mesma forma do defeito que a
correção do Redis acabou de tratar: a regra provada num nível e furada no nível que roda de verdade.

O efeito é pior do que uma reprovação a mais. A partir do primeiro teste de mutação de um revisor, o
commit fica bloqueado **para sempre**: a única saída seria uma rodada em que nenhum revisor tocasse em
arquivo nenhum, ou seja, uma rodada sem teste de mutação. A guarda empurra para a revisão pior.

**A segunda metade, na direção oposta.** `portao-local.ts` gravava o instantâneo do portão **no fim** da
corrida. Arquivo editado enquanto as suítes rodavam entrava nele como se tivesse sido testado: o `conferir`
respondia "válido" para código que nunca passou pelo portão. Enquanto o hook não lia o instantâneo, o `mtime`
barrava esse caso por acidente. Ler o instantâneo sem consertar a hora de gravá-lo trocaria "invalida sem
motivo" por "valida sem prova".

## Teste que reproduz

`tools/processo/revisoes.test.ts` › *"o hook não caduca revisão nem carimbo por arquivo restaurado ao
mesmo conteúdo"*: o mesmo cenário do caso que já existia, agora por `avaliarPortao`, que é o que o
hook chama.

Vermelho antes, com as três linhas da esteira reproduzidas:

```
AssertionError: expected [ 'infra-guardian: apps/api/…', 'test-engineer: apps/api/…', 'portão local: apps/api/…' ] to deeply equal []
```

Verde depois. O controle negativo entra no mesmo caso: com o hash diferente, os três bloqueios voltam.

Mais três casos, dos achados da 1ª rodada:

- **o caminho que roda de verdade**, `portao()` sobre o repositório de fixture, com os instantâneos em disco:
  mutar e restaurar passa, editar de verdade bloqueia na rodada e no carimbo. Sem ele, tirar o repasse — a
  linha que causou este defeito — não deixava nada vermelho;
- **arquivo que o revisor não viu** (ausente de um instantâneo não vazio) continua caducando a rodada: é o
  `anterior === undefined` de `mudouDeVerdade`, e sem ele uma rodada valeria para código nunca aberto;
- **`carimbarSeNadaMudou`**: com o arquivo editado no meio da corrida, recusa e não grava carimbo nem
  instantâneo; de volta ao conteúdo do início, carimba, e o instantâneo gravado é o do **início**.

Mais dois, da 2ª rodada, sobre o que ainda estava só afirmado:

- **o portão rodado como processo**, `node tools/processo/portao-local.ts` com `CLAUDE_PROJECT_DIR` num repositório
  de fixture cujo `npm run test` edita `apps/codigo.ts` no meio da corrida: saída diferente de zero, sem carimbo e
  sem a chave `portao` no `conteudo.json`; com a suíte limpa, carimba e o instantâneo é o do início. Eu tinha
  escrito que isso exigiria rodar o portão inteiro — não exige: quem decide as suítes é o `package.json` que o
  script recebe, e o portão do fixture roda em menos de um segundo;
- **o instantâneo sobrevive a rodadas em paralelo**: a asserção entrou no caso que já existia para o índice.

As mutações que importam ficam vermelhas: `instantaneos: {}` no hook, "arquivo desconhecido conta como inalterado"
em `mudouDeVerdade`, a chave de rodada errada, a guarda de `carimbarSeNadaMudou` removida, **a leitura do conteúdo
movida do início para o fim** (que passava em 38 de 38) e **a trava do `conteudo.json` removida** (3 de 5 execuções).

## Correção

`avaliarPortao` passou a receber os instantâneos e o caminho do documento, e a repassá-los aos dois
avaliadores — o da rodada pela `chaveDaRodada`, o do portão pela `CHAVE_DO_PORTAO`. O hook lê com
`lerInstantaneos`, como o `portao-local.ts` já fazia. Nenhuma regra mudou: o que muda é que o hook
passa a enxergar o conteúdo, e não só o relógio.

Sem instantâneo — rodada antiga, gravada antes desta mudança — o comportamento continua o de hoje, pelo
`mtime`: é a leitura restrita, e ela caduca sozinha na primeira rodada nova.

`documento` e `instantaneos` são **obrigatórios** na assinatura, de propósito: foi o parâmetro opcional,
esquecido na chamada, que criou este defeito. Agora esquecer o repasse não compila.

E a segunda metade: `portao-local.ts` lê o conteúdo **no início** e, no fim, recusa o carimbo se alguma coisa
mudou durante a corrida — as suítes não provaram esse conteúdo. A decisão mora em `carimbarSeNadaMudou`, no
`revisoes.ts`, para ter teste de unidade; **onde** o conteúdo é lido é do script, e está provado pelo caso que o
roda como processo. As duas coisas têm caso próprio, e a mutação de cada uma fica vermelha.

E a trava: `gravarInstantaneo` fazia ler-modificar-gravar num arquivo que é de todos os documentos, sem trava. Com
seis revisores em paralelo — que é como este processo roda, `revisor-geral` junto com os guardiões —, 4 de 6
execuções perderam o instantâneo de um deles. A rodada que fica sem instantâneo cai no `mtime` e volta a bloquear o
commit de quem fez teste de mutação: o defeito de volta pela porta dos fundos. Agora usa `comTrava`, o mesmo idioma
do índice, na mesma ordem (documento, depois conteúdo).

O instantâneo **da rodada** continua gravado no fim dela, de propósito: a mutação do revisor mora dentro dessa
janela, e fechá-la invalidaria o teste de mutação que se pede a ele.

`TODO.md`: o item "Defeito do carimbo do portão local" sai, com as duas metades feitas.

## O que fica em aberto

`spawnSync` no caso do script trava o event loop, então o timeout de 60 s não corta de verdade: com a máquina
saturada o caso levou 199 s antes de o vitest reportar o estouro. Não é falso verde, e quatro casos anteriores do
arquivo estouram antes dele na mesma carga — `spawn` com promessa faria o timeout cortar (`test-engineer`).

A asserção da trava é detector fraco: mata a mutação em 1 de 16 execuções na máquina do revisor, 3 de 5 na minha.
A defesa que vale é a trava em si, pela regra 80, item 7; mais escritores ou uma barreira de partida entre os
processos fariam a mutação morrer sempre.

As entradas de `.processo/conteudo.json` nunca são podadas: o arquivo cresce por documento e por rodada. Não afeta
veredito nenhum e cresce devagar; vale uma linha de expurgo quando o documento é commitado (`test-engineer`).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-22 20:09:13 | 2026-09-22 20:16:10 | `test-engineer` | 1 | REPROVADO | ae9c76eddcabeee13 |
| 2026-09-22 21:02:42 | 2026-09-22 21:09:30 | `test-engineer` | 2 | REPROVADO | a3f719b6607f98e9a |
| 2026-09-22 21:42:35 | 2026-09-22 22:04:41 | `test-engineer` | 3 | REPROVADO | a0ccb03ebb69707d0 |
| 2026-09-22 22:36:39 | 2026-09-22 22:40:26 | `test-engineer` | 4 | APROVADO | a812b9524b89e0cfe |
