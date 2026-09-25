# Correção — a Tech Spec, os cenários e quatro documentos da A0b ficaram atrás do código

**Origem:** validacao.md de apresentacao-painel (rodada 1, 25/09/2026, seção 4: o achado maior e os menores 1 a 6)
**Subagentes obrigatórios:** `revisor-geral` (mais de cinco arquivos), `tenancy-guardian` (o registro do desvio da regra 10, item 9)
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

A validação da A0b achou seis decisões tomadas nas tarefas, e aprovadas pelos revisores delas, que nunca voltaram para a
Tech Spec nem para os cenários, cuja lista se diz fechada (`cenarios.md:4`), e seis documentos que dizem menos, ou outra
coisa, que o código:

- W10: o 401 diz "Sua sessão terminou. Entre de novo."; a tela mostra "…Entre de novo para continuar." (`6_task.md:75-77`);
- W10: o `CONFLITO` depois de uma tentativa incerta mostra "confira a lista", texto que a spec não tem (`6_task.md:90-99`);
- E9: "pelo índice (23505 vira `CONFLITO`)", mas quem segura o refazer sem a trava é o `update` condicional (`3_task.md:85-90`);
- matriz (`techspec.md:74`): `sem_convite` × revogar dá `CONFLITO`, e o código responde `NAO_ENCONTRADO`;
- `techspec.md:137`: "`docs/lgpd.md` não muda", e ele mudou nas tarefas 2.0, 7.0 e 9.0;
- `techspec.md:209`: o desvio da regra 10, item 9 estaria em `docs/modelo-de-dados.md` ("Operação Turmma"), que não tem
  o `PainelRepository` nem os `@SemEscopo`;
- menores 1 a 6: `README.md:64`, `docs/lgpd.md` (painel e `rl:ip:op`), `docs/interface.md:324-325`, PRD RF2 "Como se
  prova", `docs/modelo-de-dados.md:25-26` (o id do comando) e `techspec.md:25` (duas migrations, e são três).

## Causa

As tarefas registravam a divergência resolvida no próprio `N_task.md`, os revisores a aprovavam ali, e nenhum passo do
processo levava a decisão de volta para a spec. O `/validar` é o primeiro a ler a spec contra o código inteiro, e só ele
pegou. Os documentos transversais (`README.md`, `docs/`) sofrem do mesmo jeito: a tarefa que muda o comportamento atualiza
a linha que lembra, não as outras que falam da mesma coisa. O padrão é assunto do `/retro` da A0b.

## Teste que reproduz

A correção é só de documento: nenhum arquivo de `apps/`, `packages/`, `infra/` ou `e2e/` muda, e não há teste a escrever. A
evidência que substitui o vermelho é a conferência de cada ponto contra o código, com arquivo e linha:

| Ponto | O que o código faz | Onde |
|---|---|---|
| W10, 401 | `TEXTO_DA_SESSAO_ENCERRADA` é `MENSAGENS_DE_ERRO.SESSAO_ENCERRADA`, "Sua sessão terminou. Entre de novo para continuar." | `apps/web/src/operacao/textos.ts:10`; `packages/shared/src/erros/mensagens.ts:21`; `apps/web/src/operacao/textos.test.ts:44-46` |
| W10, tentativa incerta | `INDISPONIVEL_TENTE_DE_NOVO` ou resposta fora do contrato é incerta; o `CONFLITO` que vem depois, com os dados mudados, mostra `TEXTO_DA_TENTATIVA_INCERTA` no alerta da revisão, e não o do endereço repetido | `apps/web/src/operacao/textos.ts:73-84`; `apps/web/src/operacao/paginas/NovaEscola.tsx:71-78,181`; `e2e/operacao-escolas.spec.ts:25,413` |
| E9 | sem a trava, o segundo refazer para no `update` da origem (`usado_em is null and revogado_em is null`), não revoga nada e recebe `CONFLITO`; neste teste, o índice não é alcançado | `apps/api/src/sessao/convite.repository.ts:155-162`; `apps/api/src/sessao/convite.service.ts:254-255`; `apps/api/test/painel-convite.int.test.ts:748-801` (o resultado, e o aceite no meio do refazer); a condição do `update`, em `apps/api/src/sessao/convite.repository.int.test.ts:193-212` (`revogarParaRefazer`); o 23505, em `:155` |
| Matriz, `sem_convite` | sem convite de coordenação na escola, o id do refazer e do revogar não acha escola: `NAO_ENCONTRADO`, antes da matriz | `apps/api/src/sessao/convite.service.ts:248-249,282-283`; `packages/shared/src/operacao/painel.ts:102-103,108` (o refazer; a entrada `sem_convite` do `REVOGAR_`, `:121`, é `conflito` e nunca é alcançada); `apps/api/test/painel-convite.int.test.ts:50-69` (`REVOGAR` e `REFAZER` com `sem_convite: 404`) |
| `docs/lgpd.md` mudou | linha do convite de coordenador (2.0 e 7.0) e da sessão e da auditoria do operador (9.0) | `git show 90ae176 d5b6dab 77121f7 -- docs/lgpd.md`; `docs/lgpd.md:72,78,80` |
| `@SemEscopo` do painel | `PainelRepository.redes`, `escolas` e `uso`; `RedeEEscolaRepository.criarRede` e `criarEscola`; `ResolucaoDeTenantRepository.contaParaConvite` e `escolaDoConviteParaOperador`, cada um com a justificativa "comando ou painel" | `apps/api/src/operacao/painel.repository.ts:121,133,200`; `apps/api/src/ops/escola.repository.ts:25,34`; `apps/api/src/sessao/resolucao-de-tenant.repository.ts:448,464`; `apps/api/test/arquitetura.test.ts:96-118` (I1) |
| Menor 1 | o painel cria rede e escola pelos mesmos `criarRede` e `criarEscola` do `ops:escola` | `apps/api/src/operacao/painel.service.ts:32,118-127`; `apps/api/src/ops/escola.ts:156-157` |
| Menor 2 | a lista e o uso do painel devolvem, por escola, só turmas, professores e alunos do ano em curso e o uso de infra; o `rl:ip:op` guarda o IP como chave no Redis de cache (e no seguro em memória) pela janela de um minuto, como o `rl:ip` | `packages/shared/src/operacao/painel.ts:188-202` e o esquema do uso logo abaixo; `apps/api/src/operacao/painel.repository.ts:133,200`; `packages/nucleo/src/limite/chaves.ts:30`; `packages/nucleo/src/limite/limitador.ts:126-138,170` |
| Menor 3 | os sete estados e os textos de cada um | `packages/nucleo/src/convite/estado-da-coordenacao.ts`; `apps/web/src/operacao/estados-da-escola.ts:7-16` e o teste ao lado |
| Menor 4 | o par "gerar e refazer" saiu da E8 na rodada 2 do `/revisar-spec`; sob a trava, refazer só existe em `pendente` e `vencido`, onde gerar é `CONFLITO` | `revisao-spec.md:54`; `packages/shared/src/operacao/painel.ts:91-113` |
| Menor 5 | o comando sorteia `randomUUID()` (v4) para a rede e a escola | `apps/api/src/ops/escola.ts:156-157` |
| Menor 6 | três migrations: `0015` (índice `convite_pendente_unico`), `0016` (índice `usuario_coordenador_ativo_idx`), `0017` (os checks `auditoria_operacao_acao_valida` e `sessao_operador_motivo_valido` ganham `convite_operador.aceito` e `convite_aceito`) | `packages/nucleo/drizzle/0015_convite_pendente_unico.sql`, `0016_usuario_coordenador_ativo.sql`, `0017_operador_aceite.sql` |

## Correção

- `tasks/prd-apresentacao-painel/techspec.md`: seção 3 com as três migrations; seção 5, na matriz, `sem_convite` responde
  `NAO_ENCONTRADO` ao refazer e ao revogar; seção 7, `docs/lgpd.md` mudou nas tarefas 2.0, 7.0 e 9.0; seção 7c, a linha
  "Convite em aberto" diz que quem segura o refazer é o `update` condicional; seção 11, a linha da regra 10, item 9 aponta
  para o registro em `docs/modelo-de-dados.md`, que agora o tem. Nota de acerto no alto, sem mudar o status (a spec não
  tem histórico de revisões)
- `tasks/prd-apresentacao-painel/cenarios.md`: E9 pelo `update` condicional; W10 com o texto do 401, o da tentativa
  incerta e o `NAO_ENCONTRADO` no refazer; nota de acerto no alto (o documento não tem histórico de revisões)
- `tasks/prd-apresentacao-painel/prd.md`: nota no RF2 sobre a troca do par "gerar e refazer em paralelo" na rodada 2
- `docs/modelo-de-dados.md`: "Estrutura institucional" diz que o comando sorteia o id (v4); "Operação Turmma" ganha o
  painel, o `PainelRepository` e as exceções `@SemEscopo`, com a justificativa
- `docs/lgpd.md`: o que o painel vê de cada escola, e o `rl:ip:op` no "IP só em memória"
- `docs/interface.md`, seção 5a: os sete estados, remetendo ao W10
- `README.md`: o `ops:escola` e o painel criam pelo mesmo caso de uso
- `docs/arquitetura.md`, "Multi-tenant": remete à tabela de `docs/modelo-de-dados.md` para os quatro `@SemEscopo` dos
  comandos que as escritas do painel alcançam (recomendação do `tenancy-guardian`, para os dois documentos não
  divergirem de novo)

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-25 13:25:55 | 2026-09-25 13:29:06 | `test-engineer` | 1 | APROVADO | abb78ca0e4565cb63 |
| 2026-09-25 13:29:37 | 2026-09-25 13:30:10 | `test-engineer` | 2 | APROVADO | a9b28c487095b0bd9 |
| 2026-09-25 13:30:28 | 2026-09-25 13:32:09 | `tenancy-guardian` | 1 | APROVADO | ab7da149ffd23ddaa |
| 2026-09-25 13:30:21 | 2026-09-25 13:32:36 | `revisor-geral` | 1 | APROVADO | ac55fb193defff050 |
