# Correção — o acesso da turma sobrevive ao fim do vínculo do professor que o gerou

**Origem:** validacao.md da A1 (`tasks/prd-apresentacao-escola/validacao.md`, ressalva maior G1; `TODO.md`, item do
acesso da turma depois do encerramento do vínculo)
**Subagentes obrigatórios:** privacy-guardian, tenancy-guardian, infra-guardian
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

Encerrar o vínculo do professor com a turma (`POST /v1/vinculos/:id/encerrar`, `desligamento` ou `realocacao`) não toca
o `acesso_turma` que ele gerou (A1, tarefa 4.0). O professor que saiu fica com um link e um código que abrem a página
pública da sala e mostram os nomes livres da turma (nomes de menores) até vencerem, por até 30 dias, ou até alguém gerar
outro. A coordenação não tem o `revogar` do acesso (não é célula dela, P2), e o único remédio era o
`ops:revogar-acessos-sala`, que derruba a escola inteira. Esbarra na regra 20, item 18.

A eliminação do professor (`CicloDeVidaService.eliminar`) tinha o mesmo furo: apagava os vínculos e o usuário, e o
acesso ficava vigente, com `criado_por` nulo.

## Causa

Nenhum caminho que termina vínculo de professor revoga acesso: `VinculoService.encerrar` só muda o estado do vínculo, e
`CicloDeVidaService.eliminar` apaga os vínculos e deixa a FK `set null` cuidar do autor. Só a virada do ano
(`AnoLetivoRepository.virarSala`) revoga, e de todas as turmas do ano.

Os caminhos de vínculo, todos lidos:

- `encerrar` (coordenação, `desligamento` ou `realocacao`, que é a desalocação): termina o vínculo. **Entra.**
- `contestar` (professor): só sai de `pendente` ou `contestado` (`#decidir`); o confirmado contestado é `CONFLITO`. Nunca
  termina um vínculo que deu acesso, e não precisa revogar nada.
- Vínculo pendente removido: não existe rota; o único `delete from vinculo` é a eliminação do usuário. **Entra.**
- Virada do ano: já revogava todos os acessos do ano.
- Desativação do usuário (`CicloDeVidaService.desativar`): não termina vínculo, e fica fora desta correção (ver
  "Fora do escopo").

A concorrência tinha uma segunda causa, que a correção precisa fechar junto: o gerar confere o vínculo confirmado num
`exists` dentro do `select … from turma for share`. Em `READ COMMITTED`, se o gerar espera a trava da turma enquanto o
encerramento termina, a linha da turma não mudou e o Postgres não reconfere a condição: o `exists` fica com o retrato de
antes, e o gerar grava um acesso novo para quem acabou de sair.

## Teste que reproduz

`apps/api/test/acesso-fim-do-vinculo.int.test.ts`, Postgres e Redis reais:

- `encerrar o último vínculo do professor na turma revoga o acesso que ele gerou …` (desligamento e realocação)
- `a eliminação do professor revoga o acesso que ele gerou …`
- `o gerar parado depois do insert: o encerrar espera a turma e revoga o acesso que acabou de nascer`
- `o encerrar parado com a turma travada: o gerar espera, reconfere o vínculo e sai NAO_ENCONTRADO`

- `a eliminação pelo comando do operador, sem usuário nem ano no contexto, revoga com o operador como autor`
- `o acesso vencido de quem saiu não é revogado de novo nem ganha auditoria`
- `o gerar parado depois do insert: a eliminação espera a turma e revoga o acesso que acabou de nascer`
- `a eliminação parada com a turma travada: o gerar espera, reconfere o vínculo e sai NAO_ENCONTRADO` (os dois da
  eliminação ficam vermelhos sem a `travarContraOGerarDoProfessor`, conferido tirando a chamada)
- `o encerrar espera a turma sem segurar o vínculo: quem tem a turma (o excluir, a eliminação) alcança o vínculo, sem
  deadlock` (um segurador trava a turma, o encerrar espera, e o segurador pede `FOR KEY SHARE` no vínculo, como a FK do
  `delete` da turma; vermelho com o encerrar travando o vínculo antes da turma)
- `a eliminação trava também a turma do vínculo ainda pendente …` (`for share nowait` na turma dá 55P03 com a eliminação
  parada; vermelho com o filtro `confirmado` na trava das turmas)
- `isolamento: o encerramento numa escola não toca o acesso de outra …` (confere também que o de B cai)
- `isolamento no repository: no contexto da escola A, a revogação de quem saiu não alcança o acesso que o professor de B
  gerou` (contexto forjado; só a cláusula de escola separa, e o mesmo pedido no contexto de B revoga)

Rodados contra o código de antes: 6 de 8 vermelhos (o acesso continuava vigente e abria a sala; nas duas corridas, o
encerrar não travava a turma e a espera na trava estourou o prazo). O do repository nasceu com o método. Os dois que
provam o que **não** cai (outro vínculo do mesmo professor na turma; quem sai não é quem gerou, nem quem foi substituído
por outro gerar) passam antes e depois: são a guarda contra a revogação larga demais. Depois da correção, 15 de 15
verdes, e as suítes vizinhas (`acesso-da-turma`, `vinculo`, `ciclo-de-vida`, `turma-acesso`, `estrutura`, `virada-do-ano`,
`arquitetura`) seguem verdes.

## Mutações

Cada peça da correção tem o teste que a derruba: a revogação (os dois encerrar e a eliminação), a cláusula de escola (o
isolamento no repository, com controle positivo em B), o `criado_por` (quem sai não é quem gerou), o `not exists` (outro
vínculo na turma), o `isNull(revogado_em)` (o substituído não é auditado de novo), o `gt(expira_em, now())` (o vencido),
a trava do encerrar e a da eliminação (as quatro corridas), a ordem turma → vínculo do encerrar e a trava da turma do
vínculo pendente na eliminação (os dois de "a ordem das travas"), e a reconferência do vínculo no gerar (as corridas em que o
encerrar ou a eliminação param com a turma travada). O filtro `turmaId` do encerrar não tem teste próprio: ele não muda o
resultado, porque o `not exists` já segura o acesso da outra turma em que o professor continua; serve para a revogação
não varrer os acessos da escola inteira a cada encerramento (`test-engineer`, 2ª rodada).

## Correção

Sem migration: o `acesso_turma` já guarda quem gerou (`criado_por`, Tech Spec da A1, seção 3).

- `AcessoDaTurmaRepository.revogarDeQuemSaiu(usuarioId, turmaId?)`: revoga o acesso **vigente** que o usuário gerou
  (`criado_por`) nas turmas em que ele não tem mais vínculo `confirmado` de professor (`not exists` ligado à escola, ao
  ano e à turma do próprio acesso), e devolve id e turma. Escopo pela escola do contexto, sem o ano (a eliminação pode
  rodar pelo comando do operador, sem ano no contexto).
- `VinculoService.encerrar`: lê a turma do vínculo sem trava (`VinculoRepository.turmaDe`), trava a turma em
  `FOR NO KEY UPDATE` (`TurmaRepository.travarContraOGerar`), só então trava e relê o vínculo, encerra, e revoga o acesso
  de quem saiu daquela turma, com um `acesso_turma.revogado` por acesso, autor a coordenação. A ordem turma → vínculo é a
  do excluir (que trava a turma e depois a FK pede o vínculo) e a da eliminação: a ordem cruzada abria deadlock
  (`infra-guardian` e `revisor-geral`, 1ª rodada). `NO KEY UPDATE` barra o gerar (`FOR SHARE`) e deixa passar o
  `FOR KEY SHARE` das FKs para a turma (pedido de reivindicação, lista); o excluir continua em `FOR UPDATE`.
  `VinculoRepository.travar` passa a devolver também o usuário e a turma do vínculo.
- `CicloDeVidaService.eliminar`: trava em `FOR NO KEY UPDATE`, em ordem de id, as turmas onde o usuário tem vínculo de
  professor **em qualquer estado** (`travarContraOGerarDoProfessor`; o pendente que ele confirma no meio da eliminação
  daria acesso numa turma destravada, `infra-guardian`), apaga os vínculos, revoga o acesso que ele gerou com auditoria (autor a sessão ou o
  operador, como o resto da eliminação), e só então apaga o usuário, que anularia o `criado_por`.
- `TurmaRepository.travarComVinculoDoProfessor` (o gerar): depois da trava `FOR SHARE`, reconfere a turma com o vínculo
  num comando próprio. Sem isso, o gerar que esperou o encerramento seguiria com o `exists` do retrato antigo.
  `travarParaExcluir` virou `travarContraOGerar(id, modo)`, porque agora serve ao excluir e ao encerrar.
- Auditoria: o mesmo `acesso_turma.revogado` (`depois: { turmaId }`) do revogar do professor e do
  `ops:revogar-acessos-sala`; sem campo novo.
- Docs: `docs/lgpd.md` (retenção do acesso da turma, e que a desativação ainda não revoga), `docs/modelo-de-dados.md`
  (ciclo e travas do `AcessoTurma`), Tech Spec da A1 (seção 3, a auditoria da seção 7 e as travas da seção 8) e a linha
  "Turma sem professor alocado" do PRD da A1. `TODO.md`: item marcado como resolvido, e a desativação registrada.
- O cenário **E27** da A1 (`cenarios.md`; `decisao.int.test.ts`) dizia que o link antigo "ainda abre e aceita pedido"
  depois do encerramento: era o comportamento que esta correção tira. Agora o pedido chega pelo link antes do
  encerramento, o link deixa de aceitar pedido depois dele (404), e a coordenação decide o pendente como `coordenacao`.
  O "quebra sem" (o alcance `unidade` no `decidir`) não muda, e o PRD já dizia "turma sem professor: sem link da sala".

Portão local: `node tools/processo/portao-local.ts` sobre a árvore final (typecheck, lint, test). Sem tela, sem e2e;
sem `--infra` (não toca `infra/`, métricas, saúde nem borda).

O motivo na auditoria (`acesso_turma.revogado` com `motivo: 'fim_do_vinculo'`, recomendação do `privacy-guardian`) não
entrou: muda o schema da ação, e a causa já se lê no `vinculo.encerrado` ou no `usuario.eliminado` da mesma transação.

Contestar não entra no código: só sai de `pendente` ou `contestado`, e o vínculo confirmado, o único que gera acesso,
responde `CONFLITO`. O comentário em `#decidir` registra isso.

## Fora do escopo

A desativação do professor (`CicloDeVidaService.desativar`) não termina vínculo: o usuário deixa de entrar, os
vínculos continuam `confirmado`, e o acesso que ele gerou continua abrindo a sala até vencer. Fechar isso pede decidir se
a desativação encerra os vínculos (e então a revogação vem junto) e uma trava que o gerar enxergue no usuário, porque a
trava da turma sozinha não cobre o gerar que já passou pela guarda. Foi para o `TODO.md`, com destino no F2 (a tela de
estrutura que chama a desativação), antes do portão da primeira escola real.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-03 18:57:18 | 2026-10-03 18:58:14 | `test-engineer` | 1 | REPROVADO | aff41066afed15801 |
| 2026-10-03 19:10:21 | 2026-10-03 19:10:47 | `test-engineer` | 2 | APROVADO | aff41066afed15801 |
| 2026-10-03 19:12:49 | 2026-10-03 19:13:26 | `privacy-guardian` | 1 | APROVADO | acb0b71126c78404f |
| 2026-10-03 19:12:53 | 2026-10-03 19:13:28 | `tenancy-guardian` | 1 | APROVADO | a407d0dffe171e273 |
| 2026-10-03 19:13:02 | 2026-10-03 19:14:31 | `revisor-geral` | 1 | REPROVADO | ae224553743cf8613 |
| 2026-10-03 19:12:58 | 2026-10-03 19:15:07 | `infra-guardian` | 1 | REPROVADO | a8fe58519a7a3e44d |
| 2026-10-03 19:20:59 | 2026-10-03 19:21:28 | `test-engineer` | 3 | APROVADO | aff41066afed15801 |
| 2026-10-03 19:30:43 | 2026-10-03 19:31:09 | `infra-guardian` | 2 | APROVADO | a8fe58519a7a3e44d |
| 2026-10-03 19:30:50 | 2026-10-03 19:31:10 | `privacy-guardian` | 2 | APROVADO | acb0b71126c78404f |
| 2026-10-03 19:30:52 | 2026-10-03 19:31:11 | `tenancy-guardian` | 2 | APROVADO | a407d0dffe171e273 |
| 2026-10-03 19:30:47 | 2026-10-03 19:31:15 | `revisor-geral` | 2 | APROVADO | ae224553743cf8613 |
