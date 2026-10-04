# Tech Spec — A escola montada pela coordenação

**PRD:** `tasks/prd-apresentacao-escola/prd.md`
**Status:** aprovada (26/09/2026, `/revisar-spec` rodada 5); correções e autores em `revisao-spec.md`.

## 1. Resumo da abordagem

Três tabelas e o convite de professor. A reivindicação é pública, presa ao link ou ao código; a aprovação cria o
aluno numa transação.

## 2. Módulos afetados

- `packages/nucleo`, `packages/shared`: migrations, auditoria, contratos `.strict()`, `MATRIZ`, `MENSAGENS_DA_SALA`
- `apps/api/src/estrutura` (lista, `encerrar`); novos `professores` e `sala`
- `apps/api/src/sessao`: convite com `tipo`; `AcessoDaSala`; eliminação; `ContadorEmJanela`; `/v1/eu`
- Expurgo (`packages/nucleo/src/retencao`, `apps/worker`), com o `@SemEscopo` reescrito; `ops:revogar-acessos-sala`
- `apps/web`, `infra/k6`, `infra/grafana/alertas`

## 3. Modelo de dados

```
lista_nome     id, escola_id*, ano_letivo_id*, turma_id*, nome?, matricula?, estado* (livre|reivindicado|aprovado),
               usuario_id?, criado_por?, criado_em*
reivindicacao  id, escola_id*, ano_letivo_id*, turma_id*, lista_nome_id?, chave_envio?, senha_hash?,
               teve_matricula_errada?, estado* (pendente|aprovada|recusada|encerrada), solicitada_em*,
               decidida_em?, decidida_por?, decidida_como? (professor|coordenacao)
acesso_turma   id, escola_id*, ano_letivo_id*, turma_id*, token_hash*, codigo_hmac*, validade_dias* (1|7|30),
               expira_em*, revogado_em?, criado_por?, criado_em*
```

- Ids `uuidv7()`. FKs compostas com a escola: à `lista_nome`, `on delete set null (lista_nome_id)`; à `turma`, a do
  acesso com `on delete cascade`, e a turma só sai sem acesso vigente; ao `usuario`, `usuario_id` sem ação,
  `criado_por` e `decidida_por` com `set null (coluna)`, e a autoria fica na auditoria. O `delete` da turma e o gerar
  pegam a trava da linha da turma (`for update` e `for share`); desde a correção `2026-10-03-acesso-sobrevive-ao-vinculo`,
  o encerrar do vínculo e a eliminação do professor também (`for no key update`), e o gerar reconfere o vínculo num
  comando próprio depois da trava
- Fim do vínculo de quem gerou (correção `2026-10-03-acesso-sobrevive-ao-vinculo`, G1 da validação; regra 20, item 18):
  quando termina o último vínculo `confirmado` do professor na turma (o encerrar, por `desligamento` ou `realocacao`, ou
  a eliminação do usuário), o acesso vigente daquela turma que ele gerou (`criado_por`) é revogado na mesma transação,
  com `acesso_turma.revogado`. Outro vínculo confirmado dele na turma segura o acesso; o de outro professor fica. A
  desativação não termina vínculo e não revoga (`TODO.md`, F2)
- `lista_nome`: check `aprovado ⇔ usuario_id ⇔ nome e matrícula nulos`; matrícula única por escola e ano, com `trim`;
  índice `(escola_id, ano_letivo_id, turma_id, estado)`
- `reivindicacao`: um pendente por nome; `(escola_id, chave_envio)` único parcial, nas não nulas; chave, hash e
  `teve_matricula_errada` só em pendente, e o pendente com os três (check `reivindicacao_segredo_so_pendente`, 6.0) e
  com o nome (check `reivindicacao_pendente_com_nome`, 6.0: o `set null` da FK num pendente falha, e o `encerrar` e a
  eliminação fecham ou apagam o pedido antes de apagar o nome);
  `estado` e `decidida_como` nos valores acima, por check; índice `(escola_id, turma_id, estado, solicitada_em)` e, para
  o `set null` da FK achar os pedidos do nome que sai sem varrer os da escola, `(escola_id, lista_nome_id)` (6.0); sem
  `dispositivo` (PRD, 10.2)
- `acesso_turma`: `token_hash` único; turma e `codigo_hmac` únicos por escola entre os não revogados
- Código: 8 caracteres de `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (31⁸ ≈ 8,5 × 10¹¹), em dois grupos de 4; HMAC com
  `SALA_CHAVE_CODIGO`, separada da dos contadores

Migrations de expandir: 0018 `convite.tipo` aceita `professor`; 0019 lista; 0020 acesso; 0021 reivindicação. Revertido o código, o
convite de professor em aberto ativa como o de coordenador, com o papel do `usuario`.

## 4. API

Sob `/v1`, escopo do contexto; uma célula da `MATRIZ` por rota:

- `PATCH`, `DELETE disciplinas/:id`, `turmas/:id` (coordenador): excluir com nome, vínculo (de qualquer estado, também
  o encerrado), pedido ou acesso vigente → `CONFLITO`; a turma de outro ano não se renomeia nem se exclui (`NAO_ENCONTRADO`).
  O 23503 vira `CONFLITO` só em `apps/api/src/estrutura/exclusao.ts`
- `POST turmas/:id/lista/previa` e `…/lista` (coordenador), até 200 linhas e 64 KB: `entra`, `ja_existe` (na lista ou
  aprovada na turma) ou `erro` por linha; grava só sem erro. O erro da linha é um de `ERROS_DA_LINHA_DA_LISTA`
  (`sem_nome`, `nome_invalido`, `sem_matricula`, `matricula_invalida`, `matricula_parece_documento`,
  `matricula_repetida`, `matricula_em_uso`); a gravação com erro que o texto sozinho mostra responde `ENTRADA_INVALIDA`,
  e com matrícula em uso, `CONFLITO` (2.0). `matricula_parece_documento` é a matrícula com forma de CPF pontuado ou de
  data, ou de CPF sem pontuação (11 algarismos com o dígito verificador certo) quando é mais da metade das matrículas
  preenchidas e pelo menos duas, pelas funções de `packages/shared/src/estrutura/documento-na-matricula.ts`, as mesmas
  da tela (regra 20, item 2; correção `2026-10-03-trava-de-documento-so-na-tela`, G2 da validação).
  Nome e matrícula seguem as regras do avulso (uma linha, sem caractere de controle, até 200 e 40). O separador é o da
  primeira linha que tem um; o cabeçalho dá a ordem das colunas; texto sem linha de aluno é `ENTRADA_INVALIDA` (2.0).
  A gravação e o avulso travam o ano em curso em `for share` (10.0, C10) e depois a turma em `for key share`
  (`TurmaRepository.travarContraExclusao`, C9); a gravação que
  perde para outra, ao mesmo tempo, a matrícula de **outra** turma volta atrás com `CONFLITO` (2.0)
- `POST turmas/:id/lista/nome`, `DELETE lista-nomes/:id`, `GET turmas/:id/lista` (coordenador; a leitura
  `nominal_auditado`): o avulso sem nome ou matrícula, ou com matrícula com forma de CPF pontuado ou de data (no
  contrato, `esquemaPedidoNomeAvulso`; o CPF sem pontuação sozinho passa), dá `ENTRADA_INVALIDA`; com matrícula na
  lista da escola (pelo
  índice único, 23505) ou em `credencial_matricula`, `CONFLITO`; nada gravado. Retira só `livre`, senão `CONFLITO`. A
  leitura é paginada por id e exige a finalidade de `FINALIDADES_DA_LEITURA_DE_ALUNOS`, conferida antes de procurar a
  turma. As cinco rotas são o recurso `lista_nome` da `MATRIZ` (`ler`, `previa`, `gravar`, `acrescentar`, `retirar`)
- `POST`, `GET professores` (coordenador): o link uma vez; a lista não diz se a conta existia. A lista traz usuário,
  nome e estado (`ESTADOS_DO_PROFESSOR`: `pendente`, `vencido`, `revogado`, `aceito`, `ativo`, `desativado`), paginada
  por usuário, sem e-mail; o `aceito` junta o ativo pelo convite e o que espera a primeira entrada (3.0). O e-mail de
  professor ativo, ou com convite em aberto, é `CONFLITO`; o de professor inativo o chama de volta, no mesmo usuário
- `POST professores/:usuarioId/convite/{refazer,revogar}`: só o de professor, o último `tipo = 'professor'` do usuário
  `professor`, pelas matrizes `REFAZER_`/`REVOGAR_CONVITE_DE_PROFESSOR_POR_ESTADO`: os dois só no convite em aberto
  (`pendente`, `vencido`); revogar o `revogado` é `NAO_ENCONTRADO`, o resto `CONFLITO` (3.0). Sem convite de professor:
  `NAO_ENCONTRADO`
- `POST turmas/:id/acesso`, `…/revogar`, `GET …/acesso` (professor, `turma_vinculada`; recurso `acesso_turma` da
  `MATRIZ`, `gerar`, `ler`, `revogar`): link e código uma vez, `{ token, codigo, expiraEm }`, com `no-store`; a web monta o
  link `/e/<slug>/turma#<token>`, como o do convite, e mostra o código com `exibirCodigoDaTurma` (4.0). O corpo do gerar é
  `{ validadeDias: 1 | 7 | 30 }`, sem padrão na API (o 7 é da tela). O GET, só `expiraEm`, `null` sem acesso vigente. Revogar
  sem acesso vigente (revogado, vencido, nunca gerado) é `NAO_ENCONTRADO`, como o convite já revogado (4.0)
- `GET turmas/:id/reivindicacoes`, `POST reivindicacoes/decidir` (professor, `turma_vinculada`; coordenador,
  `unidade`, e a leitura `nominal_auditado`; recurso `reivindicacao` da `MATRIZ`, `ler` e `decidir`): o pedido traz
  `teveMatriculaErrada` (sim ou não); até 40 ids, cada um `decidida`, `ja_decidida` ou `nao_encontrada`. A leitura traz
  só os pendentes, `{ id, nome, solicitadaEm, teveMatriculaErrada }`, paginada por id (8.0). O corpo do decidir é
  `{ ids, decisao: 'aprovar' | 'recusar' }`, sem id repetido; a resposta, 200 `{ resultados: [{ id, resultado }] }`, na
  ordem do pedido, com o id como o banco o guarda (8.0)
- `GET minha-turma` (aluno, `proprio`; recurso `minha_turma`): escola, turma (id e nome) e série, sem colegas; com dois
  vínculos confirmados no ano (a transferência, F2), o mais novo (8.0)
- `POST salas/abrir` e `…/reivindicar` (anônimas, `no-store`, sem cookie): `{ slug, token | codigo }`; reivindicar
  leva `listaNomeId` (UUID), `matricula` (as regras da lista: uma linha, sem espaço nas pontas, até 40), `senha` (de 12
  até o teto da senha) e `chaveEnvio` (UUID), e responde 200 `{ resultado: 'enviado' }`, igual no pedido novo e no
  reenvio; a recusa é `REIVINDICACAO_RECUSADA` com 409 (6.0). O abrir responde 200
  `{ turma: { nome }, nomes: [{ id, nome }] }`, os livres em ordem de nome e até 500 (`MAXIMO_DE_NOMES_NA_SALA`, regra 80,
  itens 3 e 8); o contrato limita o tamanho do slug, do token e do código, e não o formato: token ou código fora do
  formato é `NAO_ENCONTRADO`, como o inexistente (5.0)

`convites/consultar` e `/aceitar` não mudam (seção 13).

**Uma resposta só.** Acesso inexistente, vencido, revogado, de ano encerrado, de turma excluída ou de outra escola:
`NAO_ENCONTRADO`. Nome inexistente, de outra turma ou escola, de ano encerrado, tomado ou com matrícula errada:
`REIVINDICACAO_RECUSADA`, sem gravar. No lote, id inexistente, de outra escola ou ano ou, para o professor, sem vínculo
confirmado, pendente ou já decidido: `nao_encontrada`.

## 5. Fluxo

1. Cadastro: `contaParaConvite`, `usuarioConvidado(papel: professor)` e o convite sob `travarEscola`.
2. O professor aceita, confirma o vínculo e gera o acesso, que projeta ou compartilha pelo WhatsApp (P27). O aceite do
   professor responde `entrar` com o bilhete, também com a conta nova (o de coordenador com a conta nova continua em
   `configurar_mfa`), e a entrada por e-mail termina em `pronta` (3.0).
3. O aluno abre `/e/<slug>/turma#<token>`, que tira o fragmento do endereço antes da primeira chamada, ou digita o
   código; escolhe o nome e digita matrícula e senha.
4. `salas/reivindicar`: resolve o acesso; chave já gravada na escola e na turma do acesso → `enviado`, sem hash;
   limites; argon2id no `SemaforoDeHash`, balde da escola, **sempre**; a transação: `for share` no ano, o `insert`
   da `reivindicacao` com a chave e o `teve_matricula_errada` lido do contador do nome e, **depois**, o `update
   lista_nome` condicional em id, escola, ano, turma, `livre` e matrícula. FK violada, qualquer 23505 ou `update` sem
   linha: a transação volta atrás, e um comando novo relê a chave na escola e na turma do acesso. Achou, `enviado`,
   sem contar; não achou, `REIVINDICACAO_RECUSADA`. O nome da restrição nunca é lido.
5. **Quem conta.** Toda falha que rodou o hash conta no teto da turma. No contador do nome, só a matrícula errada:
   **antes do hash** (7.0), uma leitura com escola, ano e turma do acesso confere o nome `livre` e com matrícula diferente
   da digitada (a chave de outro pedido da escola enviada com a matrícula certa, do E21, não trava o nome); sendo, o
   `INCR` do nome conta a tentativa na hora, e ela só passa enquanto não exceder o teto: as tentativas ao mesmo tempo no
   mesmo nome não passam juntas (regra 80, item 7). O `teve_matricula_errada` do pedido é lido do mesmo contador depois
   do hash, logo antes da transação, com as erradas que chegaram junto.
6. Decisão, uma transação por id: `for share` no ano (10.0); `update` condicional em id, escola, ano em curso, pendente e,
   para o professor, `exists` do vínculo confirmado na turma do pedido. Aprovada: usuário, credencial com o hash,
   vínculo `aluno` confirmado com `decidido_em`, a `lista_nome` sem nome e matrícula, e o contador de login da
   matrícula zerado. Recusada: o nome volta a `livre`. Hash, chave e `teve_matricula_errada` saem nos dois. Sem
   linha, uma leitura com o mesmo alcance, aplicado **antes** do estado, separa `ja_decidida` de `nao_encontrada`.
   O condicional escolhe a linha num `select … for update` com todas essas condições, e o `update` vem pela chave: o hash
   que vai à credencial sai na mesma escrita, e o `returning` só devolve o valor novo; a decisão que chega ao mesmo
   tempo espera a trava e, relida a linha já decidida, não a acha (C3). O vínculo do aluno tem quem aprovou em
   `criado_por`. O contador zerado depois do commit é o da origem `outro`: o `educa_dispositivo` que faria a tentativa
   contar como `conhecido` só nasce de um login certo com a matrícula, que antes da aprovação não existia (8.0).
7. **A mesma matrícula na lista e na aprovação** (8.0, C12, herdado da 2.0): a aprovação tira a matrícula da lista e a
   grava na credencial num commit só. O nome avulso confere a credencial **depois** do `insert`: o `insert` que chega
   no meio da aprovação espera o commit no índice único e entra, e a conferência, num comando novo, acha a credencial e
   volta tudo com `CONFLITO`. A gravação e a prévia leem a lista **antes** da credencial, cada uma num comando: o
   anterior ao commit ainda acha a matrícula na lista, e o posterior já a acha na credencial. Sem trava nova.

## 6. Isolamento

- Repositories com `exigirEscolaDoContexto` e `exigirAnoEmCurso`; `turma_vinculada` pelo `exists` de
  `TurmaRepository.aberta`; `minha-turma` pelo vínculo de aluno confirmado no ano em curso
- A rota pública resolve o acesso pelo `AcessoDaSala`, de `apps/api/src/sessao`, que devolve só escola, ano e turma ao
  `sala`. Ele chama `acessoDaSalaPorToken` e `acessoDaSalaPorCodigo`, novos na `ResolucaoDeTenantRepository`, com
  `@SemEscopo` ("o link e o código da sala não dizem a escola"), que exigem o ano `em_curso` e o slug da escola (I1,
  I2). Os dois recebem o slug e o juntam à escola da linha no mesmo comando; o `sala` calcula o hash do token e o HMAC
  do código (a chave é dele), e o `AcessoDaSala` roda o resto no contexto da escola e do ano achados, por
  `naEscolaSemUsuario`, que passou a receber `{ escolaId, anoLetivoId? }` (5.0). Pelo código (7.0), o `AcessoDaSala` lê
  antes a escola do slug (`escolaPorSlug`, o `@SemEscopo` que o login por matrícula já usa), numa consulta que devolve a
  conexão, e roda entre ela e a busca do acesso a `GuardaDoCodigo` que o `sala` passa (a espera de 1 s acima do teto) e,
  sem acesso achado, a contagem do código errado; o slug inexistente responde `NAO_ENCONTRADO` sem contar. O
  `AcessoDaSalaAchado` leva também o id do acesso, que entra na chave do contador do nome
- `ops:revogar-acessos-sala` recebe o id da escola do log e monta o contexto como os outros `ops:*`, sem `@SemEscopo`;
  id que não é UUID dá `ArgumentoInvalido` (saída 2). O `update` é `AcessoDaTurmaRepository.revogarVigentesDaEscola`, com a
  escola do contexto e sem o ano: o comando não tem ano no contexto, e um vigente de outro ano não abre a sala; a
  existência da escola é o `AcessoDaEscolaRepository.nome` na mesma transação; imprime `{"revogados":N}` (9.0)

## 7. Dado pessoal

- **Campos**: as linhas da A1 em `docs/lgpd.md`. Log só com ids; nada vai a terceiro
- **Auditoria**: `professor.cadastrado`, sem campo nenhum; `convite.*` com o tipo, também os do coordenador, e o
  `contaNova` só no `convite.criado` do coordenador (3.0); `lista.gravada`, também no avulso,
  só com ids e contagens (`ids` das linhas que entraram, `gravados`, `jaExistentes`; a entidade é a turma, 2.0);
  `lista_nome.retirado` (a turma e o estado `livre`, 2.0); a prévia não audita: não grava nada nem devolve nome gravado, só
  diz, das matrículas que a própria coordenação digitou, quais estão na lista da turma ou em uso na escola, e só a
  coordenação da escola chega a ela (2.0, recomendação do `privacy-guardian`); `acesso_turma.gerado` (turma, validade, `expiraEm` e os ids que ele derrubou em `substituidos`) e
  `acesso_turma.revogado` (a turma), sem token nem código (4.0; também um por acesso que o fim do vínculo de quem gerou
  derruba, com o autor do encerrar ou da eliminação, correção `2026-10-03-acesso-sobrevive-ao-vinculo`); `reivindicacao.decidida` com `decidida_como`, sem
  `teve_matricula_errada` (8.0: a turma, o estado, `decididaComo` e o `alunoId` que a aprovação criou, nulo na recusa, para
  a pergunta "o que o sistema guarda deste aluno" achar a decisão dele); `turma.reivindicacoes_lidas` com a quantidade e
  a finalidade (8.0). A coordenação grava `turma.lista_lida` e `turma.reivindicacoes_lidas` a cada leitura; o
  professor, não
- **Registro de acesso**: as rotas públicas não o gravam, para não ligar o pedido ao IP
- **`chaveEnvio`**: sorteada por envio, só na memória da página
- **Virada de ano**: o `encerrar`, na mesma transação, revoga os acessos, fecha os pendentes como `encerrada`, sem
  hash, chave, `teve_matricula_errada` nem `decidida_por` (recusar é decisão humana, regra 70 item 2), e apaga os
  nomes livres e reivindicados, nessa ordem (`AnoLetivoRepository.virarSala`, 10.0): o check
  `reivindicacao_pendente_com_nome` recusa o nome apagado antes de o pendente fechar. A auditoria `ano_letivo.encerrado`
  ganha `acessosRevogados`, `pedidosEncerrados` e `linhasDaListaApagadas`, só contagens. Revoga todo acesso ainda não
  revogado do ano, vencido ou não; o já revogado guarda a hora dele, que é de onde o expurgo conta
- **Nome livre sai de fato**: é pré-cadastro, sem conta nem histórico; a minimização vence a exclusão lógica
- **Eliminação**: apaga, antes do usuário e na mesma transação, os pedidos da `lista_nome` do aluno e depois a linha
  (`CicloDeVidaRepository.apagarDaListaDeNomes`, 10.0); a auditoria `usuario.eliminado` ganha `linhaDaListaApagada` e
  `pedidosApagados`. O pedido do titular, no F3, cobre as duas (`TODO.md`)
- **Retenção do pedido decidido**: "vigência + 5 anos" não tem expurgo na A1; entra no F3 (`TODO.md`, 10.0)
- **Retenção**: pedido, vigência + 5 anos, sem nome; acesso e convite, 30 dias após vencer, revogar ou usar, pelo
  `sistema.expurgar-acesso` (10.0: o alvo `acesso_turma`, e o convite, de qualquer tipo, com `order by` pelo prazo)
- **DTO**: a página pública sem matrícula; link e código só na resposta que os cria

## 7b. Conformidade CNE

Sem IA. Não se aplica.

## 7c. Carga e falha

- **Caminho quente**: login. RF19, ~0,7/s; primeiro dia da escola (2.100), ~7/s
- **`rl:ip`**: `salas/*` contam no anônimo (3.000/min); a escola dá ~1.300/min. Várias escolas da mesma rede atrás de
  um IP de saída passam do teto: limite conhecido da A1, e o `rl:ip:sala` fica para o F2
- **Falhas**: banco fora, 503; Redis fora, o seguro em memória, teto dividido por `LIMITE_INSTANCIAS_API`
- **Métrica**: `sala.reivindicacao{resultado}` (`enviado`, `reenvio`, `recusada`, `limite`, `sem_acesso`, `indisponivel`,
  `erro`) e `sala.limite_atingido{tipo}` (`escola`, `nome`, `turma`), somada a cada pedido que um limite segura, sem
  escola (`METRICAS_COM_ESCOLA` é fechada), que vai no log `sala.limite_atingido` com o `tipo` e o `escolaId`, uma linha por
  escola, tipo e janela (7.0): a marca é mais uma chave do contador da sala (`sala:aviso-limite`, HMAC do tipo e da
  escola), e vale para todas as instâncias. A linha sai pelo logger JSON do processo, que o `main.ts` passa ao
  `AppModule` (o `Logger` do Nest só leva o evento); as duas métricas têm painel em `infra/grafana/paineis/fundacao.json`
- **Alerta** "Código da turma errado em massa numa escola": `sala.limite_atingido{tipo="escola"}` acima de 10 por
  minuto, somadas as instâncias, por 5 min (`infra/grafana/alertas/sala-codigo-errado-por-escola.yaml`); a rajada
  legítima não chega ao teto. O runbook, na entrada de mesmo nome, revoga os acessos da escola do log, sem ler IP. O ensaio
  (`npm run ensaio:alertas`) provoca o ataque sustentado; a rajada do primeiro dia é teste à parte, com o ataque parado,
  porque a regra soma as escolas (L12, 9.0)
- **Carga**: K1 e K2, em `infra/k6/reivindicacao-em-sala.js` e `npm run carga:sala` (9.0): a escola de cada fase montada
  pela API, o professor aprovando em lotes de até 40 com o aprovado entrando logo depois, a outra escola de outro container,
  e a fase `k2_redis_lento` para o `decidir` com o Redis de fila devagar (cenarios.md, K1 e K2)

**Limites.** O `ContadorEmJanela` ganha a janela por parâmetro (10 min). Com 60 códigos ativos, um IP no teto do
`rl:ip` acerta em 7 dias com ~0,2%, e N IPs, N vezes: é o que o alerta pega. O primeiro dia erra ~420 códigos.

| Conta (chave HMAC) | Teto em 10 min | Acima dele |
|---|---|---|
| código errado, por escola | 1.000 | `tipo="escola"`; 1 s de espera antes da busca, sem conexão do pool presa; o certo entra |
| matrícula errada em nome livre, por (`acesso_turma`, `listaNomeId`) | 5 | `tipo="nome"`; `LIMITE_EXCEDIDO` só a esse nome, até "Gerar novo" |
| hash sem pedido criado, por turma | 150 | `tipo="turma"`; hash rebaixado no balde da escola, nunca recusa |

O reenvio com a mesma chave não conta em nenhum; o paralelo de uma matrícula errada conta duas vezes no nome, aceito.
Não há contador por navegador. `LIMITE_EXCEDIDO` sai com `Retry-After`, o que falta da janela da chave do nome. "Acima" é a
partir do teto: o 1.001º código, a 6ª matrícula e o 151º hash já são segurados (7.0). Os três contadores ficam num
`ContadorEmJanela` próprio da sala, no Redis de fila e com a chave de HMAC do login (`LOGIN_CHAVE_CONTADOR`), e o seguro
dele entra em `limite.seguro_ativo`. O teto da escola é brando: a leitura antes da busca e a soma depois dela deixam a
rajada em paralelo passar do teto pelo que estiver em voo, e a espera atrasa cada tentativa sem limitar o volume, que só
o `rl:ip` limita; quem responde ao volume é o alerta e o `ops:revogar-acessos-sala` (9.0). Risco aceito: quem conhece o
slug percebe pela espera que a escola está acima do teto; não diz nada de pessoa.

**Corridas**: C1 a C11; colisão do código sorteia de novo num savepoint. **Travas das escritas em turma** (4.0, pendência
da 1.0): trava o ano em curso em `FOR SHARE` a escrita que faz nascer no ano algo que o encerramento precisa desligar ou
fechar (criar turma; gerar acesso; na 6.0 e na 8.0, o pedido e a aprovação); a que só troca o nome (renomear) ou tira linha
(excluir) não trava o ano, e trava a linha da turma (o próprio `update`; o `for update` do excluir). O gerar pega o ano antes
da turma, e o `encerrar` atualiza o ano antes de tudo: nenhuma ordem cruzada. A gravação e o avulso da lista (2.0) também
fazem nascer linha no ano: desde a 10.0 travam o ano em `FOR SHARE`, antes da turma, como o gerar (C10). A reivindicação e a
decisão (10.0) travam o ano no começo da transação delas; o ano que deixou de estar em curso faz a reivindicação voltar atrás
(`REIVINDICACAO_RECUSADA`, sem gravar) e o id da decisão sair `nao_encontrada`. **Turma e vínculo** (correção
`2026-10-03-acesso-sobrevive-ao-vinculo`): o encerrar do vínculo trava a turma (`FOR NO KEY UPDATE`) antes do vínculo, e a
eliminação trava, em ordem de id, toda turma em que o professor tem vínculo, em qualquer estado, antes de apagá-los; o
excluir já travava a turma antes de a FK pedir o vínculo. A ordem é sempre turma → vínculo. O gerar que esperou a turma
reconfere o vínculo num comando próprio (em `READ COMMITTED`, a linha da turma não mudou e o `exists` do `FOR SHARE` ficaria
com o retrato antigo) e sai `NAO_ENCONTRADO`; o gerar que já tinha a turma termina antes, e o acesso dele cai na revogação.

## 9. Frontend

- **Casca** (`docs/interface.md` 11.1): coordenação, Estrutura (pedidos dentro da turma) e Professores; professor,
  Turmas; aluno, Minha turma.
  Guarda de papel em `rotas.tsx` (W2, W12)
- **Seletor** (P30): escola, rede e papel, sem número de turmas; a troca faz `resetQueries` com o token novo
- **Fronteira**: a `FronteiraDaOperacao` vira genérica em `componentes/`, com `Suspense` e `EstadoCarregando` em volta
  de cada área nova, que tem teto no `.size-limit.json`
- **Decidido na 11.0** (divergências registradas em `11_task.md`):
  - Endereços: `/` é a página inicial dos três papéis enquanto não há Estrutura (13.0) nem "Nova conversa" (A2); as
    áreas ficam em `/coordenacao`, `/professor` e `/aluno`, e "Turmas" em `/professor/turmas` (era `/vinculos`). A área da
    coordenação e a do aluno nascem sem tela, e respondem "Página não encontrada" até a tarefa da tela dela
  - A guarda segue com o papel que já conhecia enquanto o `/v1/eu` refaz depois de uma sessão nova (o login por cima),
    para a área não desmontar com o rascunho dentro (regra 80, item 6)
  - Linhas da lateral com 44 px também no computador, e não 36: o "Sair" é ação principal (D59, regra 50, item 2a) e tem
    o tamanho dos itens (P18). Abaixo de 768 px o "Sair" fica também na barra do topo, a um toque
  - Orçamento: com três áreas, o Rolldown separa React e o roteador num `parte-*` que a entrada importa junto. O teto de
    150 kB mede `index-*` e `parte-*` (o primeiro carregamento, `docs/interface.md` 10.4), e o `index-*` sozinho continua
    medido, para o build sem entrada reprovar. Tetos de partida: coordenação 30 kB, professor 20 kB, aluno 10 kB; a 12.4
    (aluno, 5 kB), a 13.4 e a 15.3 os ajustam
  - Ícones: `lucide-react` entra, ícone a ícone (`docs/interface.md` 9.4)
  - A fronteira põe o título da falha pelo gancho da tela da falha (`useTituloDaAba`), e não no `componentDidCatch`: a
    rota de antes devolve o título dela no efeito de desmontagem, que roda depois e apagaria o da falha. Ao assumir, ela
    fecha a gaveta e leva o foco ao título da falha, também na página inteira da operação; e o botão dela diz "Tentar de
    novo", como o `EstadoErro` (era "Tente de novo" na operação; E4 da A0 e `techspec.md` da A0 acompanham)
  - A página inicial do professor aponta para Turmas ("Confira e confirme as suas turmas em Turmas"); a da coordenação
    e a do aluno dizem que o que eles fazem aparece nas próximas versões, até a 13.0 e a 12.0
  - A gaveta fecha também na troca de escola e na troca de pessoa (o seletor vai de `/` para `/`), e não só na troca de
    endereço
- **Decidido na 12.0** (divergências registradas em `12_task.md`):
  - O seletor deixa o `details` e vira um botão com `aria-expanded` que abre uma lista (padrão de divulgação, sem setas):
    abre por clique, toque, Enter ou Espaço, o foco vai para a escola de agora, o Tab percorre as outras, e o Esc fecha
    só a lista, devolvendo o foco ao botão, sem fechar a gaveta. A lista traz **todos** os acessos da conta, a escola de
    agora com a marca de escolhido (ícone e `aria-current`); escolhê-la só fecha a lista, sem troca nem token novo. Cada
    linha tem o nome acessível "escola, rede · papel". Durante a troca, as linhas ficam em `aria-disabled`, e não
    `disabled`, para o foco não cair no `body`; o toque repetido não manda outra troca. Reabrir apaga o aviso da troca
    recusada
  - Com uma escola só, fica o nome dela, sem a rede: o aluno não tem `acessos`, e o `/v1/eu.escola` não traz rede (a 12.1
    põe a rede só nos acessos)
  - A etapa `escolher` do login leva o mesmo `esquemaAcessoDaConta`, e por isso também o `redeNome`; a tela da escolha
    continua mostrando escola e papel. Essa etapa vem antes do segundo fator da coordenação: o que ela expõe é escola,
    rede e papel de cada acesso da própria conta, e mais nada; campo novo no `esquemaAcessoDaConta` passa pelo
    `privacy-guardian` (recomendação dele na 12.0)
  - A página inicial do aluno aponta para "Minha turma", como a do professor aponta para Turmas
  - "Minha turma" com `NAO_ENCONTRADO` (sem vínculo confirmado no ano em curso: a virada, ou o aluno sem turma) diz a quem
    recorrer, sem "Tentar de novo"; os outros erros são o `EstadoErro`. A série vem por extenso de `nomeDaSerie`, em
    `packages/shared`, que a Estrutura da 13.0 reaproveita
  - Teto do chunk `aluno-*`: 5 kB (a "Minha turma" mede perto de 1 kB)
- **Decidido na 13.0** (divergências registradas em `13_task.md`):
  - A coordenação abre em Estrutura (`/coordenacao/estrutura`): a página inicial a leva para lá, sem ficar no histórico.
    A turma aberta, com a lista, fica em `/coordenacao/estrutura/turmas/:turmaId`; os links de dentro da área são
    relativos à base dela
  - Estrutura numa tela só (ano letivo, séries, disciplinas, turmas e alocação), com o roteiro do que falta; a lista de
    nomes, na turma aberta. A lista de nomes fica sem marca no roteiro: saber se cada turma tem lista seria uma leitura
    auditada por turma
  - `Dialogo`, `CLASSES_DO_BOTAO_SECUNDARIO` e `useDialogoDaTela` saem de `operacao/` para `componentes/` (antecipado da
    14.1), com o aviso de inatividade da operação pelo `rodape` do `Dialogo`: importar de `operacao/` reprovaria o B2
  - A lista é lida com a finalidade fixa `conferencia_de_cadastro` e não envelhece sozinha (`staleTime` infinito); as
    listas da estrutura vêm em até 10 páginas de 100, e acima disso a tela diz que mostra só as primeiras (turmas e
    disciplinas; a alocação corta sem aviso acima de 1.000 vínculos ou professores, o que não acontece numa escola do
    recorte: `TODO.md`)
  - A prévia avisa o título antes da lista, o cabeçalho não reconhecido e a coluna que parece CPF ou data; esta última
    segura a gravação (regra 20, item 2), e a API também a recusa: a linha vem com `matricula_parece_documento`
    (correção `2026-10-03-trava-de-documento-so-na-tela`). A gravação recusada pela API tira a prévia; a que cai por
    rede ou servidor a
    mantém. O arquivo em UTF-16 com BOM (o "Texto Unicode" do Excel) também é lido, com teto de 128 KB. Com dois alunos
    de mesmo nome, o "Retirar" e a confirmação dizem a matrícula
  - A alocação oferece só os professores de `ESTADOS_DO_PROFESSOR_ALOCAVEIS` (seção 13)
  - As listas e as escolhas vêm na ordem da escola (a API pagina pela criação): séries pela etapa e pelo ano, turmas pela
    série e pelo nome, disciplinas e professores pelo nome; os anos letivos, do mais novo ao mais antigo. Na alocação, o
    item que saiu da lista sai da escolha, e o "Alocar" seguinte não reenvia quem a API acabou de recusar
  - O roteiro não marca o passo cuja leitura ainda carrega ou falhou. O ano letivo novo não grava período de outro ano,
    porque o ano não se altera nem se exclui depois: o início cai no ano e o fim, nele ou no seguinte, **no contrato**
    (`esquemaPedidoCriarAnoLetivo`, em `packages/shared`; a API recusa com `ENTRADA_INVALIDA`, E1), e na tela o período
    acompanha o ano digitado e o erro vai para o campo. O anúncio de cada ação aparece na seção dela, e o erro de campo
    leva o foco ao campo. A planilha (`.xlsx`, `.xls`, `.ods`) é recusada com o que fazer
  - Na lista colada, o foco só vai ao título da prévia e ao alerta quando a resposta chega, uma vez, e só do `body`
    (onde o botão desligado durante o pedido o deixa) ou de um botão: a prévia e o alerta que voltam porque o texto voltou a um valor anterior, e
    a resposta que chega com a pessoa já de volta no campo, não tiram o foco dele
  - A web pede a API sem cache HTTP (`cache: 'no-store'` no `chamarApi`): respostas com nome e matrícula não ficam em
    disco no computador da escola. O nome avulso tem a mesma trava da lista colada para matrícula que parece CPF ou
    data, pela mesma função do contrato que a API usa (`pareceDocumento`), e os dois campos ficam fora do corretor
    ortográfico. O arquivo que o navegador não consegue ler tem aviso. Na
    turma nova, a série que saiu da lista sai da escolha
  - A tela segura antes de enviar o texto vazio, o texto acima de 64 KB e a lista acima de 200 nomes e um cabeçalho (o
    que a API recusaria; entre 200 e 201 linhas, decide a API). A prévia mostra como erro a linha que a API marca como
    CPF ou data. Os
    diálogos de criar, renomear, excluir e retirar fecham com a lista já recarregada, e o foco vai ao título da seção
    quando o botão que abriu saiu com o item. O `perigo` tem duas classes em `componentes/botao-secundario.ts` (texto em
    `erro` na linha; cheio só na confirmação). O vazio da Alocação diz o que falta (turma, disciplina ou professor
    alocável), com o título do W4. "Sem rastro" (nome e matrícula fora de `localStorage`, `sessionStorage`, IndexedDB,
    Cache Storage e do endereço) é provado no e2e, porque a web não tem ambiente de DOM na unidade
  - Teto do chunk `coordenacao-*`: 20 kB (mede ~12 kB)
- **Decidido na 14.0** (divergências registradas em `14_task.md`):
  - Professores fica em `/coordenacao/professores`, item da lateral depois de Estrutura: a lista pelo nome, com o estado do
    convite em texto e só as ações das matrizes (`REFAZER_`/`REVOGAR_CONVITE_DE_PROFESSOR_POR_ESTADO`). `vencido` diz para
    refazer; `revogado` e `desativado`, para cadastrar de novo o mesmo e-mail (a lista não traz e-mail, seção 4). O
    `aceito` não diz se a pessoa já entrou (E11). O erro da releitura com a lista na tela fica por cima dela, com "Tentar de
    novo"
  - O diálogo do convite de cópia única mora em `componentes/DialogoDoConvite.tsx` (o convite novo e o refeito), com a
    moldura, os textos, a mutação e o texto de cada falha vindos de quem usa; o link e a cópia em
    `componentes/link-do-convite.ts`, e o pedido pelo contrato em `componentes/pedido-de-convite.ts`. A operação usa os
    três, com o `DialogoDaOperacao` de moldura, sem mudar de comportamento além da pergunta de fechar (abaixo). O
    revogar da escola é a `ConfirmacaoDePerigo` da 13.0; o `ConfirmarConvite` continua na operação
  - A releitura que cai com a lista ainda vazia (logo depois do primeiro cadastro) mostra o erro, e não "Nenhum
    professor ainda". O resumo do cadastro avisa o nome que já está na lista ("Já há um professor com este nome na
    lista. Se é a mesma pessoa voltando, pode seguir…"), sem impedir: a lista só mostra o nome, e o e-mail na linha fica
    para decidir com a prova de posse (`TODO.md`). A etapa do link do cadastro diz o e-mail com que a pessoa entra; a do
    refazer, não, porque a lista não o traz
  - **A pergunta de fechar só vale enquanto há link em risco**: o pedido que falha com ela aberta volta à etapa dele, com
    a falha à vista e o foco nela; e "Voltar e corrigir" solta a falha, com o foco no campo do nome. Vale também para o
    convite da coordenação, na operação, que usa o mesmo diálogo
  - O `CONFLITO` do cadastro é do e-mail digitado ("Este e-mail já é de um professor desta escola, ativo ou com o convite
    em aberto…"): o diálogo continua com "Voltar e corrigir". O do refazer e o do revogar, e o `NAO_ENCONTRADO` deles,
    recarregam a lista e deixam só "Fechar", com os mesmos dois textos do convite da coordenação
    (`componentes/textos-do-convite.ts`). O refazer trava o botão com o pedido no ar e mostra o link da única resposta
  - **O diálogo aberto sai quando a sessão da aba muda** (venceu, ou outra pessoa entrou; `aoTrocarDeSessao`): o link é
    credencial do professor, e não fica na tela atrás do login por cima (regra 20, item 8). O `gcTime: 0` tira a resposta
    do `MutationCache` também nesse desmonte, sem `reset()`. Não custa nada à coordenação: a volta dela passa pelo segundo
    fator, que já desmonta a área
  - **O aceite serve aos dois tipos de convite com os mesmos textos**, porque a consulta diz só a escola (seção 4): "Você
    foi convidado para entrar em …", e a senha nova sem prometer o segundo fator. O convite que não vale diz a quem pedir
    nos dois casos ("Este convite não vale mais. Peça outro à coordenação da sua escola. Se o convite era para a
    coordenação, peça a quem enviou o link."), na tela do convite, na entrada e no segundo fator, e a tela oferece "Já
    aceitou o convite? Entrar". O professor com a conta nova vai à entrada com "Senha criada. Entre com o seu e-mail e a
    senha que você acabou de criar."; quem já tinha conta, com o aviso de antes. Depois de entrar, a página inicial dele
    aponta para Turmas (11.0). O passo da senha leva o foco ao campo "Senha nova"; o "mostrar" da senha vem com a peça da
    17.0
  - O aceite recomeça com outro link colado na aba (`hashchange`, também o mesmo link de novo): o fragmento sai da barra,
    a tela volta a conferir na hora, e a senha digitada e o aviso da tentativa anterior saem. O aceite ainda no ar com o
    link anterior é descartado quando volta, **sem guardar o bilhete nem o desafio** (`aceitarConviteNaVez`), e não segura
    o botão do link novo. O fragmento que não é token (`%` quebrado) cai em "O endereço do convite está incompleto", sem
    derrubar a tela. A consulta que cai por rede ou servidor tem "Tentar de novo", com o token da memória da tela; o
    convite usado ou revogado entre a consulta e o aceite mostra a tela do convite que não vale, sem o nome da escola
  - O vazio da Alocação diz no título só o que falta ("Crie uma disciplina primeiro"; "Crie uma turma e um professor
    primeiro" quando faltam os dois) e, quando falta o professor, leva à tela Professores; o passo "Professores" do
    roteiro também
  - Teto do chunk `coordenacao-*`: continua 20 kB (mede ~14,5 kB com os Professores, e a 16.0 ainda põe os pedidos
    nele). O diálogo do convite e os textos dele caem em pedaços `parte-*` que a coordenação divide com a operação, e
    conta no primeiro carregamento (123,8 kB de 150)
  - O `token` do contrato do convite de professor usa o `esquemaTokenDeLink` (pendência da 4.0)
- **Decidido na 15.0** (divergências registradas em `15_task.md`):
  - A turma aberta pelo professor fica em `/professor/turmas/:turmaId`, dentro de Turmas (o item da lateral continua
    selecionado), e abre pelo cartão do vínculo **confirmado** ("Abrir a turma"); o pendente, o contestado e o encerrado
    não oferecem o link. O nome e a série vêm do `GET /v1/turmas/:id`, que já servia o professor com vínculo confirmado.
    A turma que a API não acha (vínculo não confirmado ou encerrado, turma excluída, ano virado, outra escola,
    inexistente) tem uma resposta só na tela, com a quem recorrer e sem "Tentar de novo", na página e na seção do acesso
  - A seção "Acesso dos alunos": carregando; erro com "Tentar de novo"; "Sem acesso ativo" com o Gerar; e, com acesso,
    só "Vale até …", "Gerar novo" e "Revogar" (`perigo`). **A releitura que falha mostra o erro, e não o estado de
    antes**: "Sem acesso ativo" logo depois de gerar negaria o acesso que acabou de nascer
  - Gerar e "Gerar novo" são o mesmo diálogo: a validade em três opções (7 dias já escolhidos), o que acontece, e então
    o acesso, uma vez. "Gerar novo" diz antes que o link e o código de agora caem, também os de outro professor da
    turma, e que os nomes travados por matrícula errada destravam; o primeiro acesso não fala disso. O acesso gerado
    mostra o código em `font-mono`, de 36 px a 60 px, pelos dois grupos de `exibirCodigoDaTurma` (para o leitor de
    tela, soletrado), o endereço onde o
    aluno o digita (`<host>/e/<slug>/turma`), o link num campo de leitura, e avisa que quem tem o link ou o código vê os
    nomes livres da lista e que "Gerar novo" derruba o link que foi parar onde não devia
  - As peças de cópia única (a pergunta de fechar, a cópia, o campo do link, a falha com o foco, o foco de cada etapa)
    saíram de `componentes/DialogoDoConvite.tsx` para `componentes/copia-unica.tsx`, e o convite e o acesso as usam; a
    pergunta recebe o texto e o rótulo de voltar de quem a usa. `Anuncio`, `AlertaDaFalha`, `useEnvioUnico`,
    `DialogoDeFormulario` e `ConfirmacaoDePerigo` saíram de `areas/coordenacao/dialogos.tsx` para
    `componentes/dialogos.tsx` (nota da 13.0), `textoDaFalha` e `listaMudou` para `componentes/texto-da-falha.ts`, que a
    operação também passou a usar (o `textoDaFalha` dela é o mesmo, com o mapa de textos dela), e a classe do `select`,
    para `componentes/seletor.ts`. O `useEnvioUnico` recebe as opções da mutação como o `useMutation` as recebe
  - O link e o código vivem só na mutação do diálogo que os pediu (`gcTime: 0`, `reset()` ao fechar), e **a validade na
    seção vem sempre da leitura**, nunca da resposta do gerar: o gerar que responde atrasado, depois de outro, não troca
    o código na tela nem a validade. O `CONFLITO` do gerar (outro gerar ao mesmo tempo) e o `NAO_ENCONTRADO` recarregam
    a seção e deixam só "Fechar"; o `NAO_ENCONTRADO` do revogar (o acesso já caiu), também
  - **O diálogo aberto sai quando a sessão da aba muda**, sem ouvinte próprio: a turma aberta só desenha a seção com a
    turma e a escola (`/v1/eu`) lidas, e toda sessão que acaba ou muda esvazia as duas leituras. A releitura que cai
    por rede ou servidor com o dado já na tela **não** desmonta nada: o código pode estar projetado; a que responde
    `NAO_ENCONTRADO` (o vínculo encerrado com a tela aberta) tira a página inteira, com o diálogo, leva o foco ao
    aviso e tira o nome da turma do título da aba. Outra turma é outra
    tela (a `key` da rota)
  - **WhatsApp**: o botão abre `https://wa.me/?text=…` numa aba nova (`window.open`, sem deixar o `opener` com ela), com
    o texto de `textoDoWhatsApp`, que só recebe o nome da escola e o link. "Sem o WhatsApp" é o que a tela consegue
    saber: o navegador não abriu a aba nova. Aí o mesmo botão copia o texto e diz onde colar; sem área de transferência,
    seleciona o link no campo. Compartilhar conta como link copiado para a pergunta de fechar. O botão é `secundario`,
    sem o verde nem o símbolo do WhatsApp (D72: três cores; logotipo de terceiro fica de fora)
  - Teto do chunk `professor-*`: 10 kB (mede ~5,3 kB com Turmas e a turma aberta, e a 16.0 ainda põe os pedidos nele). Os
    diálogos e a cópia única caem em pedaços `parte-*` que as áreas dividem, e contam no primeiro carregamento (126,2 kB
    de 150)
- **Decidido na 16.0** (divergências registradas em `16_task.md`):
  - Os pedidos são a seção "Pedidos de nome" da turma aberta, embaixo do acesso (professor, `areas/professor/Turma.tsx`) e
    embaixo da lista de nomes (coordenação, `areas/coordenacao/ListaDaTurma.tsx`, e não `Estrutura.tsx`), com a mesma peça,
    `componentes/pedidos/ListaDePedidos.tsx`, que recebe quem decide. O link da Estrutura para a turma continua "Lista de
    nomes"
  - **Uma leitura traz até 100 pedidos** (a página máxima da API). Havendo mais, a tela diz que os próximos aparecem
    depois que estes forem decididos, em vez de paginar: quem decide tira os da frente
  - **Professor**: lê ao abrir a turma e relê a cada 15 s com a aba à vista (`agendarAtualizacao`, com `visibilitychange`);
    quando a aba volta, relê na hora e recomeça a contagem. A leitura não conta como atividade da sessão: o relógio de
    inatividade continua de ponteiro e teclado. A releitura que cai com a lista na tela deixa a lista, com o erro por
    cima; com a lista vazia, mostra o erro, e não o vazio
  - **Coordenação**: nenhuma leitura sem o clique em "Atualizar" — nem ao abrir a turma, nem ao voltar para a aba, nem
    quando a sessão volta a valer, nem depois de decidir (`enabled: false`). Nos dois papéis a lista não fica guardada fora da tela
    (`gcTime: 0`, recomendação do `privacy-guardian`). Antes do primeiro clique a seção diz o que fazer e que cada consulta fica na auditoria em nome dela. A
    finalidade é fixa, `conferencia_de_cadastro`, a mesma da lista de nomes da mesma tela
  - **Marcação por id, até 40**: com 40 marcados, as outras caixas ficam desligadas, descritas pelo texto do limite. Os
    botões "Aprovar N pedidos" (`oficial`, novo em `componentes/botao-secundario.ts`) e "Recusar N pedidos" (`perigo`) só
    existem com pedido marcado; sem nenhum, a seção diz como decidir, o limite e que não há aprovar todos. O pedido que
    sai da lista sai da marcação, e não volta marcado
  - **O diálogo acompanha a lista**: guarda os ids da abertura e mostra, deles, os que continuam pendentes; o que outra
    pessoa decidiu sai dele, com o aviso de quantos saíram, e o envio leva só os que continuam. Sem nenhum, só resta
    fechar. Depois da resposta, o diálogo mostra o resultado de cada pedido, com o nome que foi enviado: `decidida` é
    "Aprovado: já pode entrar com a matrícula e a senha" ou "Recusado: o nome voltou à lista"; os outros dois, os textos
    do W6. Fechado, o foco vai ao título da seção
  - **A lista depois da decisão**: todo id da resposta sai dela na hora, sem leitura (a leitura que estava no ar é
    descartada, para não trazer de volta o decidido); a do professor ainda é relida. **Depois de uma decisão que falha**
    (nota da 8.0): a do professor é relida, e a nova tentativa manda só os que continuam; a da coordenação sai da tela,
    com a marcação, e volta ao estado de antes da primeira leitura, com o diálogo dizendo para fechar e atualizar
  - **A turma que sai do alcance com a tela aberta** (a leitura dos pedidos responde `NAO_ENCONTRADO`): a página inteira
    dá lugar ao aviso da turma, com o foco nele, nos dois papéis. O aviso é um componente só,
    `componentes/TurmaIndisponivel.tsx`, com o texto de cada papel
  - **Os aprovados na lista de nomes da coordenação** viram uma contagem ("Aprovados nesta turma: N"; com página da lista ainda por ler,
    "Aprovados entre os primeiros M nomes: N"), sem cartão: a
    lista os traz sem nome nem matrícula (nota da 13.0). A decisão da coordenação recarrega a lista de nomes, como as
    outras escritas da tela
  - Tetos: `professor-*` 8 kB (mede ~5,5 kB) e `coordenacao-*` 16 kB (mede ~13,5 kB). Os pedidos caem num `parte-*` que
    as duas áreas dividem, e contam no primeiro carregamento (129,7 kB de 150)
- **Decidido na 17.0** (divergências registradas em `17_task.md`):
  - A página pública fica em `/e/:slug/turma`, na entrada (o primeiro carregamento mede ~133,7 kB de 150), e não usa o
    TanStack Query: as duas chamadas são anônimas, e o token não vai para chave nem fecho de consulta guardada. Cada abertura
    tem a sua vez, e a resposta de uma vez que passou (o código de antes, o link de antes) não muda a tela; o envio também
    confere a vez, e a página que sai não reenvia mais nada
  - O código em branco ou fora do formato (8 caracteres do alfabeto, depois de `normalizarCodigoDaTurma`) não sai da página:
    o em branco diz "Digite o código da turma que o professor mostrou."; o fora do formato, o texto do código do W9. Uma
    abertura por vez pelo código
  - A abertura que cai fora do `NAO_ENCONTRADO`: pelo código, o texto fica no campo (o 429 com os minutos, o 503 com "O
    sistema está cheio agora."); pelo link, o texto com "Tentar de novo", com o token da memória. A abertura não se repete
    sozinha. O limite sem `Retry-After` diz "Espere alguns minutos"
  - A recusa mantém a matrícula (com o foco nela) e o nome escolhido que continua livre, tira a senha e relê a lista; a
    releitura que cai deixa a lista de antes. O `NAO_ENCONTRADO` do envio leva ao campo do código, com o texto do caminho
  - A `chaveEnvio` é sorteada a cada envio e reaproveitada só no "Tentar de novo" do mesmo pedido, depois do quarto 503;
    mexer num campo faz o envio seguinte ser um pedido novo. Sem `Retry-After`, o reenvio espera 2 s; a variação vai de 0
    a 1 s
  - Botões: "Não é a sua turma? Usar outro código" na turma aberta; "Ir para a entrada da escola" e "Voltar à lista de
    nomes" depois do pedido, que não mostra o nome nem a matrícula e diz que quem decide é uma pessoa e que a recusa devolve
    o nome. "Voltar à lista de nomes" reabre pelo token ou pelo código que ficou na memória da aba, de propósito: o acesso é
    da turma inteira, e é o caminho do aluno seguinte no mesmo computador. O nome não escolhido diz "Escolha o seu nome na
    lista.", com o foco no primeiro nome
  - O `CampoDeSenha` (com "Mostrar", `aria-pressed`) fica em `componentes/`, e o aceite do convite passou a usá-lo; o
    `Campo` ganhou `descritoTambemPor` e `acao`; o token do fragmento saiu para `paginas/fragmento.ts`
- **Decisão**: "Aprovar N" (`oficial`) revisa turma, nomes e efeito, e avisa a coordenação da auditoria; "Recusar"
  (`perigo`) confirma; depois, texto por pedido (W6). Até 40, explicado. O pedido mostra se houve tentativa com
  matrícula errada no nome. Para o professor, atualiza a cada 15 s com a aba visível (W15); a coordenação usa
  "Atualizar"
- **Acesso**: "Gerar novo" confirma que o atual cai, inclusive o de outro professor da turma, e diz que destrava os
  nomes travados
- **Página pública**: nomes e `chaveEnvio` só em memória; um envio no ar; o 503 reenvia a mesma chave até 3 vezes,
  pelo `Retry-After` com variação aleatória, depois "Tentar de novo"; campos do W11; fica na entrada (150 kB)
- **Textos** (`MENSAGENS_DA_SALA`, exatos no W9): o servidor responde igual, e a página escolhe o de `NAO_ENCONTRADO`
  pelo caminho que usou, código ou link. O do limite, "Muitas tentativas agora. Espere N minutos ou chame o
  professor.", vale pelo nome e pelo `rl:ip`
- **Lista**: arquivo lido como texto (UTF-8 ou windows-1252; na 13.0, também UTF-16 com BOM), com exemplo

Quatro estados em toda tela (W4): carregando é `EstadoCarregando`; erro, `EstadoErro`.

## 10. Testes

Em `cenarios.md`, parte desta spec: lista fechada, um id por teste, com a cláusula que o quebra.

## 11. Conformidade com as regras

- **00**: lista na hora, sem fila, porque tem teto; nota em `docs/infra.md` 3.5
- **10**: dois `@SemEscopo` contidos em `sessao`. Desvio: a conta global de professor serve a várias escolas (RF7),
  quarto afrouxamento da D71, só com dado sintético
- **50**: seletor sem sigla e turno, que não existem, nem número de turmas, de outra escola
- **80**: o RF14 diz "segura o código"; o desenho segura por nome e só atrasa por escola: segurar o código trancaria a
  escola por um ator só
- **20, 40, 60, 70**: seções 7, 10 e 5; sem IA

## 12. Premissas não verificadas

- ⚠️ NÃO VERIFICADO: `wa.me/?text=` abre o WhatsApp no Chromebook e no celular; senão, copia. Na 15.0 o "senão" é o
  navegador que não abre a aba nova (o que a tela consegue saber): o botão copia o texto. O `wa.me` que abre e não
  carrega (a rede da escola o bloqueia, ou não há WhatsApp Web) a tela não tem como perceber, e continua sem verificação
  em Chromebook de escola: sobra o "Copiar link", na mesma etapa
- ⚠️ NÃO VERIFICADO: o Excel brasileiro grava CSV em windows-1252 com `;`; a leitura aceita os dois

## 13. Riscos técnicos

- **Conta global de professor**: o aceite revela se o e-mail tem conta, e a senha de uma conta global é definida por
  quem tem o link. Tolerado pela D71 revista; fecha com a prova de posse do e-mail, item do "Portão da
  primeira escola real" do `ROADMAP.md`. Dois canais a mais dizem à coordenação se o e-mail tinha conta (3.0), no
  mesmo risco e com o mesmo fechamento:
  - **cadastrar de novo o mesmo e-mail** entre o aceite e a primeira entrada da conta que já existia (uma janela que
    dura até essa entrada, que pode nunca vir): ela responde 201, porque o usuário segue inativo, e a conta nova, já
    ativa no aceite, `CONFLITO`. Fechar só isso prenderia para sempre quem aceitou e perdeu o bilhete;
  - **a auditoria do aceite**: `convite.aceito.usuarioAtivo` (do F1) e o `usuario.ativado_por_convite`, que só a conta
    que já existia grava. Nenhuma rota da coordenação lê a auditoria hoje; a tarefa que a exportar no dossiê (D61)
    decide, com o `privacy-guardian`, se esses campos saem ou são agregados
  - **o aviso da entrada depois do aceite** (14.0): a tela diz "Senha criada" quando mandou a senha e o aceite respondeu
    `entrar`, que é o professor com a conta nova. Se outro convite da mesma conta definiu a senha entre a consulta e o
    aceite, a API ignora a senha digitada, e o aviso diz "senha criada" de uma senha que não valeu; a entrada recusa, e
    o caminho é o outro convite. Borda aceita, com o mesmo fechamento
- **Alocação antes do aceite** (3.0; decidida pelo Joaquim em 27/09/2026, feita na 13.0): a alocação aceita o professor
  com convite em aberto. Alocável é o professor da escola da sessão com o estado de `estadoDoProfessor` em
  `ESTADOS_DO_PROFESSOR_ALOCAVEIS` (`pendente`, `aceito`, `ativo`; `VinculoRepository.professorAlocavel`, no lugar do
  `pessoaAtivaComPapel`). `vencido`, `revogado`, `desativado`, quem não é professor e o professor de outra escola
  respondem o `NAO_ENCONTRADO` do inexistente. O `aceito` vale nos dois casos que junta, para a alocação não dizer se o
  e-mail tinha conta (E11). O vínculo nasce `pendente` e não alcança a turma até o aceite, a entrada e a confirmação
  (P2); o convite revogado depois da alocação deixa o vínculo pendente, como já deixava revogar depois de alocar. O E10
  continua alocando depois da entrada; o E12 prova a alocação antes do aceite
- **Ator dentro da sala** vê o código novo projetado e pode travar os nomes de novo
- **A fronteira movida** pode mudar a A0b; o e2e dela roda junto
