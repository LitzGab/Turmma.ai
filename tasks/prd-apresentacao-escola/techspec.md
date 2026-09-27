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
  pegam a trava da linha da turma (`for update` e `for share`)
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
  (`sem_nome`, `nome_invalido`, `sem_matricula`, `matricula_invalida`, `matricula_repetida`, `matricula_em_uso`); a
  gravação com erro que o texto sozinho mostra responde `ENTRADA_INVALIDA`, e com matrícula em uso, `CONFLITO` (2.0).
  Nome e matrícula seguem as regras do avulso (uma linha, sem caractere de controle, até 200 e 40). O separador é o da
  primeira linha que tem um; o cabeçalho dá a ordem das colunas; texto sem linha de aluno é `ENTRADA_INVALIDA` (2.0).
  A gravação e o avulso travam a turma em `for key share` (`TurmaRepository.travarContraExclusao`, C9); a gravação que
  perde para outra, ao mesmo tempo, a matrícula de **outra** turma volta atrás com `CONFLITO` (2.0)
- `POST turmas/:id/lista/nome`, `DELETE lista-nomes/:id`, `GET turmas/:id/lista` (coordenador; a leitura
  `nominal_auditado`): o avulso sem nome ou matrícula dá `ENTRADA_INVALIDA`; com matrícula na lista da escola (pelo
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
  `acesso_turma.revogado` (a turma), sem token nem código (4.0); `reivindicacao.decidida` com `decidida_como`, sem
  `teve_matricula_errada` (8.0: a turma, o estado, `decididaComo` e o `alunoId` que a aprovação criou, nulo na recusa, para
  a pergunta "o que o sistema guarda deste aluno" achar a decisão dele); `turma.reivindicacoes_lidas` com a quantidade e
  a finalidade (8.0). A coordenação grava `turma.lista_lida` e `turma.reivindicacoes_lidas` a cada leitura; o
  professor, não
- **Registro de acesso**: as rotas públicas não o gravam, para não ligar o pedido ao IP
- **`chaveEnvio`**: sorteada por envio, só na memória da página
- **Virada de ano**: o `encerrar`, na mesma transação, revoga os acessos, fecha os pendentes como `encerrada`, sem
  hash, chave, `teve_matricula_errada` nem `decidida_por` (recusar é decisão humana, regra 70 item 2), e apaga os
  nomes livres e reivindicados
- **Nome livre sai de fato**: é pré-cadastro, sem conta nem histórico; a minimização vence a exclusão lógica
- **Eliminação**: apaga, antes do usuário e na mesma transação, a `lista_nome` do aluno e os pedidos dela; o pedido do
  titular, no F3, cobre as duas (`TODO.md`)
- **Retenção**: pedido, vigência + 5 anos, sem nome; acesso e convite, 30 dias após vencer, revogar ou usar
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
fazem nascer linha no ano e ainda não travam o ano: a 10.0 decide, com o C10.

## 9. Frontend

- **Casca** (`docs/interface.md` 11.1): coordenação, Estrutura (pedidos dentro da turma) e Professores; professor,
  Turmas; aluno, Minha turma.
  Guarda de papel em `rotas.tsx` (W2, W12)
- **Seletor** (P30): escola, rede e papel, sem número de turmas; a troca faz `resetQueries` com o token novo
- **Fronteira**: a `FronteiraDaOperacao` vira genérica em `componentes/`, com `Suspense` e `EstadoCarregando` em volta
  de cada área nova, que tem teto no `.size-limit.json`
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
- **Lista**: arquivo lido como texto (UTF-8 ou windows-1252), com exemplo

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

- ⚠️ NÃO VERIFICADO: `wa.me/?text=` abre o WhatsApp no Chromebook e no celular; senão, copia
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
- **Alocação antes do aceite** (3.0): o professor cadastrado fica inativo até o aceite, e a alocação do F1 só aceita
  professor ativo (`VinculoRepository.pessoaAtivaComPapel`). O W1, o RF7 e o passo 1 da seção 5 descrevem a coordenação
  alocando antes do aceite. Decide o Joaquim antes da 13.0 (a tela de alocação): ou a alocação passa a aceitar o
  professor com convite em aberto, correção na API com o `tenancy-guardian` e o `privacy-guardian` (vínculo de quem nunca
  entrou), ou a tela e o W1 alocam depois da primeira entrada. Até lá, o E10 aloca depois da entrada
- **Ator dentro da sala** vê o código novo projetado e pode travar os nomes de novo
- **A fronteira movida** pode mudar a A0b; o e2e dela roda junto
