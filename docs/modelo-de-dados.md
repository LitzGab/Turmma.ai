# Modelo de dados

Notação: `→` referência, `*` obrigatório.

## Estrutura institucional

```
Rede*            nome, tipo (prefeitura | grupo | independente), ipsSaida (IP público de saída
                 da rede, não é dado de pessoa)
Escola*          → rede*, nome, slug*, inatividadeAlunoMin (30), inatividadeEquipeMin (120)
AnoLetivo*       → escola*, ano, inicio, fim, situacao (planejado | em_curso | encerrado)
Serie*           → escola*, etapa (ef_anos_finais | em), ano (6–9 | 1–3)
Turma*           → escola*, anoLetivo*, serie*, nome (2ºB), turno?
Disciplina*      → escola*, nome, area? (área da BNCC)
```

Tudo isso existe desde o F1. `slug` é o endereço de entrada da escola (`/e/:slug`), e a
inatividade da sessão é configurável por escola, com padrão diferente para aluno e equipe.
`situacao` tem unicidade parcial: um `em_curso` por escola. `Periodo` (bimestre), `inep`,
`endereco` e a configuração de retenção entram quando a funcionalidade que os usa chegar.

Rede e escola nascem só pelo operador Turmma (`ops:escola` ou o painel da operação, A0b), e o
**id delas pode vir do pedido**: a web sorteia um UUID v4 ou v7 ao abrir o diálogo, e o comando
sorteia um v4 (`randomUUID()`) a cada execução. O clique duplo repete o mesmo id, que o banco
recebe com `on conflict do nothing` e devolve sem criar outra (Tech Spec da A0b, seções 5 e 7c).
Só esse id, e só nessas duas tabelas, vem de fora; o resto continua `uuidv7()` do banco. O cliente
não escolhe um id legível: o contrato só aceita v4 e v7.

## Pessoas e vínculos

Implementado no F1. A forma exata das tabelas, com unicidades, índices e checks, está na
seção 3 da Tech Spec do F1 (`tasks/prd-identidade-e-tenancy/techspec.md`); aqui fica o desenho.

```
Conta            email?, senhaHash?, mfaSegredoCifrado?, mfaAtivadoEm?, mfaUltimoPasso?
                 (global, sem escola: é a identidade de login da equipe)
CodigoRecuperacao* → conta*, hmac*, usadoEm?
Usuario*         → escola*, conta? (nulo no aluno), papel*, nome*, desativadoEm?
CredencialMatricula* → escola*, usuario*, matricula*, senhaHash*
ContaExterna*    → escola*, usuario*, provedor* (google | microsoft), tenant?, sujeito*
ProvedorEscola*  → escola*, provedor*, valor* (hd | tid), removidoEm?
Vinculo*         → escola*, anoLetivo*, usuario*, turma*, disciplina?, papel*,
                   estado* (pendente | confirmado | contestado | encerrado),
                   contestacao? (nao_leciono | turma_errada | disciplina_errada | outro),
                   complemento?, motivoEncerramento? (fim_do_ano | desligamento | realocacao),
                   criadoPor*, decididoEm?, encerradoEm?
Sessao*          → escola*, conta?, usuario*, metodo* (email | matricula | externo), familia*,
                   refreshHash*, ultimoUsoEm*, expiraEm*, encerradaEm?, motivo?
RegistroAcesso*  → escola?, usuario?, evento* (login | login_falho | renovacao | saida), ip*, em*
Convite          → escola*, tokenHash*, tipo (coordenador | professor), usuario*, expiraEm,
                   usadoEm?, revogadoEm?
```

**A identidade é global, os vínculos são por escola** (decidido na Tech Spec do F1). `Conta`
não tem `escolaId` porque é o login; `Usuario` é a pessoa *naquela* escola, com o papel dela.
Um professor em duas escolas é uma `Conta` com dois `Usuario`, e o escopo de tenant continua
inteiro na regra 10: toda tabela de domínio tem `escolaId`, e quem resolve a fronteira é o
único módulo autorizado a consultar sem escopo (`ResolucaoDeTenantRepository`, com
`@SemEscopo` e teste de arquitetura que prova que só `sessao` a importa).

**O aluno é `Usuario` sem `Conta`**, com `CredencialMatricula`. Não tem e-mail (regra 20).
Matrícula é única por `(escolaId, matricula)`, nunca globalmente: dois alunos em escolas
diferentes podem ter a mesma.

`ContaExterna.sujeito` é o identificador opaco da conta Google ou Microsoft da escola (D48);
e-mail, nome e foto que o provedor devolve são descartados antes de gravar. Uma conta externa
por usuário na escola. `ProvedorEscola` é a lista de domínios Google (`hd`) e tenants
Microsoft (`tid`) que a escola cadastrou: o que não está nela não entra, e o domínio retirado
ganha `removidoEm` em vez de ser apagado.

`Vinculo` é criado pela escola (coordenação, grade importada ou Classroom), nasce `pendente` e
só dá acesso quando o professor o confirma (D3 revista, regra 60 item 8a). O professor não cria
o próprio vínculo: confirma ou contesta. `complemento` é texto livre de até 140 caracteres, com
aviso de não escrever nome de aluno, e é apagado na virada do ano, quando o vínculo passa a
`encerrado` com motivo `fim_do_ano`.

`papel`: `rede` · `coordenador` · `professor` · `aluno` · `responsavel`. A matriz de quem
alcança o quê é declarada num lugar só, em `packages/shared/src/permissao/matriz.ts`.

### Lista de nomes da turma — A1

Implementado na A1 (tarefa 2.0). A forma exata está na seção 3 da Tech Spec da A1
(`tasks/prd-apresentacao-escola/techspec.md`) e na migration `0019_lista_nome.sql`.

```
ListaNome*       → escola*, anoLetivo*, turma*, nome?, matricula?,
                   estado* (livre | reivindicado | aprovado), usuario?, criadoPor?, criadoEm*
```

`ListaNome` é a lista que a coordenação sobe por turma, colada ou em arquivo (até 200 linhas e
64 KB por envio, com prévia linha a linha), ou nome a nome (o aluno que chega em maio). O aluno
entra pelo link ou pelo código da turma, reivindica um nome e só vira `Usuario` com matrícula e
senha **depois da aprovação humana** (D4). No F1 o aluno e o vínculo dele vêm do seed sintético.

- **Aprovado ⇔ usuário ⇔ nome e matrícula nulos**, por check no banco: o aprovado guarda só o
  estado e o usuário, e o nome e a matrícula passam a viver no `Usuario` e na
  `CredencialMatricula` (`docs/lgpd.md`). O livre e o reivindicado têm os dois, e nenhum usuário.
- **Matrícula única por escola e ano**, com `btrim`, nunca no sistema (regra 60, item 6). É o
  alvo do `on conflict do nothing` da gravação: a mesma lista enviada duas vezes, mesmo ao mesmo
  tempo, entra uma vez. Na prévia, a matrícula que já está na lista da turma, ou do aluno aprovado
  nesta turma (8.0), sai `ja_existe`; a da lista de outra turma da escola, ou de outro aluno da escola
  (`CredencialMatricula`), sai com erro. O nome avulso confere a credencial depois do `insert`, e a
  gravação lê a lista antes da credencial: a matrícula que está sendo aprovada nunca entra de novo
  como nome livre (C12).
- Turma, usuário e autor por FK composta com a escola. A turma com nome na lista não se exclui
  (`CONFLITO`). O autor (`criadoPor`) vira nulo se a pessoa for eliminada, e a autoria fica na
  auditoria (`lista.gravada`).
- **O nome livre sai de fato** quando a coordenação o retira (`lista_nome.retirado` na
  auditoria): é pré-cadastro, sem conta nem histórico, e a minimização vence a exclusão lógica.
  O reivindicado e o aprovado não saem por aí.
- A coordenação lê a lista com finalidade, e cada leitura grava `turma.lista_lida`. O professor
  não lê a lista.
- **Virada e eliminação** (10.0): o encerramento do ano apaga os nomes livres e reivindicados do
  ano, na mesma transação, depois de fechar os pedidos pendentes como `encerrada` e revogar os
  acessos; o aprovado fica. A gravação e o avulso travam o ano em curso em `FOR SHARE` antes da
  turma: o nome que nasce junto com o encerramento é alcançado por ele, ou não nasce. A eliminação
  do aluno aprovado apaga, antes do usuário, os pedidos da linha dele e a linha.

### Acesso da turma — A1

Implementado na A1 (tarefa 4.0). A forma exata está na seção 3 da Tech Spec da A1 e na migration
`0020_acesso_turma.sql`.

```
AcessoTurma*     → escola*, anoLetivo*, turma*, tokenHash*, codigoHmac*, validadeDias* (1 | 7 | 30),
                   expiraEm*, revogadoEm?, criadoPor?, criadoEm*
```

`AcessoTurma` é o link da sala e o código da turma que o professor com vínculo **confirmado** gera
(RF9), e que o aluno usa para abrir a turma e reivindicar o nome (5.0 e 6.0). Os dois valem juntos,
pela mesma validade. A coordenação não gera acesso.

- **O link e o código aparecem uma vez**, na resposta do gerar (`no-store`): o token do link (a web
  monta `/e/<slug>/turma#<token>`) e o código de 8 caracteres de um alfabeto de 31, sem 0, 1, I, L e
  O, mostrado em dois grupos de 4. O banco guarda só o SHA-256 do token (a mesma peça do convite) e
  o HMAC do código com `SALA_CHAVE_CODIGO`, uma chave só dele. A leitura devolve só `expiraEm`.
- **Vigente** é o não revogado e não vencido. "Gerar novo" revoga todo acesso não revogado da turma,
  também o de outro professor, na mesma transação do novo; a auditoria do novo
  (`acesso_turma.gerado`) lista os que ele derrubou. Revogar sem acesso vigente responde como
  inexistente.
- **Quem gerou e saiu**: quando termina o último vínculo `confirmado` do professor na turma (o
  encerrar da coordenação, por `desligamento` ou `realocacao`, ou a eliminação do usuário), o acesso
  vigente daquela turma que ele gerou é revogado na mesma transação, com `acesso_turma.revogado`.
  Outro vínculo confirmado dele na turma (outra disciplina) segura o acesso, e o acesso de outro
  professor não é tocado (correção `2026-10-03-acesso-sobrevive-ao-vinculo`).
- Índices únicos parciais entre os não revogados: um acesso por turma (dois gerar ao mesmo tempo:
  um grava, o outro `CONFLITO`) e o código único na escola (a colisão do sorteio sorteia de novo num
  savepoint, até três vezes, e depois 503). O token é único no sistema, porque o link não diz a escola.
- Turma por FK composta com a escola e o ano, `on delete cascade`: a turma só se exclui sem acesso
  vigente (`CONFLITO`), e o revogado ou vencido sai com ela. O autor (`criadoPor`) vira nulo se o
  professor for eliminado, e a autoria fica na auditoria.
- **Travas**: o gerar trava o ano em curso e a linha da turma em `FOR SHARE`, e reconfere o vínculo
  num comando próprio depois da trava; o excluir (`FOR UPDATE`), o encerrar do vínculo e a eliminação
  do professor (`FOR NO KEY UPDATE`) travam a turma num comando próprio, antes do vínculo, do
  `delete` e da revogação: a ordem é sempre turma → vínculo. O ano
  encerrado não ganha acesso novo, o excluir nunca leva, pela cascata, um acesso que acabou de ser
  entregue, e o acesso gerado no mesmo instante em que o vínculo termina cai com ele (ou o gerar sai
  inexistente).

**A página pública da sala** (`POST /v1/salas/abrir`, tarefa 5.0) não tem sessão: o aluno chega com o
slug da escola e o link ou o código, e a escola, o ano e a turma saem da linha do acesso vigente. As duas
consultas sem escopo que ela alcança são estas, cada uma com `@SemEscopo` e a justificativa no código:

| Repository e método | O que faz | Justificativa |
|---|---|---|
| `ResolucaoDeTenantRepository.acessoDaSalaPorToken` | acha o acesso vigente pelo hash do token, conferido contra a escola do slug, no ano `em_curso` dela | o link e o código da sala não dizem a escola; o token é único no sistema, e o slug é conferido contra a escola da linha no mesmo comando; devolve só escola, ano e turma |
| `ResolucaoDeTenantRepository.acessoDaSalaPorCodigo` | acha o acesso vigente pelo HMAC do código, buscado já na escola do slug, no ano `em_curso` dela | o link e o código da sala não dizem a escola; o código é único só dentro da escola e a chave do HMAC é uma só, então o mesmo código em duas escolas tem o mesmo HMAC, e só o slug as separa; devolve só escola, ano e turma |

Ficam em `sessao`, e não em `sala`, porque a `ResolucaoDeTenantRepository` é a fronteira da resolução
de tenant e só `sessao` a importa (teste de arquitetura I1): o `sala` alcança as duas pelo `AcessoDaSala`,
de `apps/api/src/sessao/acesso-da-sala.ts`, que devolve só a escola, o ano e a turma e roda o resto no
contexto delas. Inexistente, vencido, revogado, de ano encerrado, de turma excluída (a cascata levou o
acesso), de outra escola e slug inexistente respondem o mesmo `NAO_ENCONTRADO`. A página mostra o nome
da turma e os nomes `livre` da lista, com id e nome, sem matrícula, em ordem de nome e até 500
(`MAXIMO_DE_NOMES_NA_SALA`), lidos a cada abertura; não grava registro de acesso nem lê cookie.

### Pedido de reivindicação — A1

Implementado na A1 (tarefa 6.0). A forma exata está na seção 3 da Tech Spec da A1 e na migration
`0021_reivindicacao.sql`.

```
Reivindicacao*   → escola*, anoLetivo*, turma*, listaNome?, chaveEnvio?, senhaHash?,
                   teveMatriculaErrada?, estado* (pendente | aprovada | recusada | encerrada),
                   solicitadaEm*, decididaEm?, decididaPor?, decididaComo? (professor | coordenacao)
```

`Reivindicacao` é o pedido do aluno pelo próprio nome da lista, pela página pública da sala
(`POST /v1/salas/reivindicar`), com a matrícula e a senha que ele cria. Só a aprovação de uma pessoa
cria o aluno (D4; 8.0). Não há `dispositivo`: nada liga o pedido ao navegador nem ao IP (PRD, 10.2).

- **O pedido nasce `pendente`** com o hash argon2id da senha, a `chaveEnvio` que a página sorteia a
  cada envio e `teveMatriculaErrada`, lido do contador de matrícula errada daquele nome pelo mesmo acesso da turma
  (7.0: sim se houve alguma na janela de 10 min, sem número nem hora). Os três
  existem só no pendente, e o pendente tem os três (check); a decisão e o encerramento os apagam. O
  pendente sempre aponta para o nome (check): o nome de um pendente não se apaga, e o encerramento e
  a eliminação fecham ou apagam o pedido antes.
- **Na mesma transação**, o `insert` do pedido e, depois, o `update` condicional do nome da lista
  para `reivindicado`, por id, escola, ano, turma do acesso, `livre` e matrícula. O hash roda antes,
  sempre, no semáforo do login, no balde da escola, fora da transação.
- **Uma resposta só**: nome inexistente, de outra turma ou escola, de ano encerrado, tomado ou com a
  matrícula errada dão o mesmo `REIVINDICACAO_RECUSADA`, sem gravar. A FK violada, qualquer 23505 ou o
  `update` sem linha voltam a transação, e um comando novo relê a chave na escola e na turma do
  acesso: achou, é o reenvio do mesmo envio (`enviado`, sem pedido novo); não achou, a recusa. O nome
  da restrição nunca é lido.
- Índices únicos parciais: a chave de envio, na escola (não no sistema); um pendente por nome.
  Índices pelo escopo: `(escola, turma, estado, solicitadaEm)`, para os pedidos da turma, e
  `(escola, listaNome)`, para o `set null` da FK achar os pedidos do nome que sai.
- Turma por FK composta com a escola e o ano, sem ação: a turma com pedido não se exclui
  (`CONFLITO`). O nome por FK composta com a escola, `on delete set null (lista_nome_id)`: o nome
  que sai deixa o pedido decidido sem nome. Quem decidiu, `on delete set null (decidida_por)`, com a
  autoria na auditoria.
- O reivindicado não se retira da lista (`CONFLITO`), e o login com a matrícula e a senha do pedido
  pendente responde como senha errada: a credencial só nasce na aprovação.
- **A decisão** (8.0): o professor com vínculo confirmado na turma e a coordenação leem os pendentes
  (a coordenação com finalidade, gravando `turma.reivindicacoes_lidas`) e decidem até 40 por vez, uma
  transação por pedido. A aprovação cria o `Usuario` aluno com o nome da lista, a `CredencialMatricula`
  com a matrícula da lista e o hash do pedido, o `Vinculo` de aluno `confirmado` com `decididoEm` e quem
  aprovou em `criadoPor`, e deixa o nome `aprovado`, sem nome nem matrícula; a recusa devolve o nome a
  `livre`. Nas duas, o hash, a chave e a marca saem, e `reivindicacao.decidida` guarda quem decidiu e
  como (`professor` ou `coordenacao`). O pedido fora do alcance de quem decide responde como o
  inexistente, e o já decidido que ele alcança, `ja_decidida`.
- **O ano travado** (10.0): a reivindicação e cada decisão travam o ano em curso em `FOR SHARE` no
  começo da transação. O encerramento, que muda o ano antes de tudo, ou espera e fecha o pedido
  pendente como `encerrada` (sem hash, chave, marca nem quem decidiu: não é decisão), ou chega antes e
  faz a reivindicação ser recusada e a decisão sair `nao_encontrada`, sem gravar. O pedido decidido ou
  encerrado fica sem nome quando a linha da lista sai, e não tem expurgo na A1 (`TODO.md`, F3).

### Ainda não existe — F2

```
Responsavel      → usuario*, aluno*, parentesco
```

`Convite` no F1 é só de coordenador, criado por comando do operador. Na A1 (tarefa 3.0) entra o tipo
`professor`: a coordenação cadastra o professor (nome e e-mail) e o convite nasce junto, válido por
7 dias (o de coordenador, 72 h; os dois em `VALIDADE_DO_CONVITE_HORAS_POR_TIPO`, de `@educa/shared`).
O convite de professor reusa a conta global: o e-mail que já tem conta em outra escola cliente
ganha outro `Usuario` na escola, com a mesma `Conta`, e aceita com a senha que já tinha; o que não
tem ganha a conta sem senha, definida no aceite. Nada na lista nem na auditoria da coordenação diz
qual dos dois foi (a conta global é o quarto afrouxamento da D71, só com dado sintético). O aceite do
professor não leva ao segundo fator. O `tipo` separa os dois convites em toda escrita: o operador só
alcança o de coordenador, e a coordenação só o de professor, com o filtro no `where` dos dois lados.
Cadastrar, refazer e revogar o de professor pegam a mesma trava por escola do de coordenador. O
convite `sala` não existe: o aluno entra pelo acesso da turma (`AcessoTurma`, A1).

Na A0b o convite da primeira coordenação também nasce pelo painel da operação, pelo mesmo caso de
uso do comando, e o painel também o refaz. Gerar, refazer e revogar pegam uma trava por escola (`pg_advisory_xact_lock(7_000_003,
hashtext(escola_id))`) e só então leem o estado da coordenação (`estadoDaCoordenacao`), que decide
pela matriz da Tech Spec da A0b (seção 5): no máximo um convite em aberto por escola. O índice
único parcial `convite_pendente_unico (escola_id, usuario_id) where usado_em is null and
revogado_em is null` é a rede de segurança da trava, e a recusa dele sai como `CONFLITO`. O refazer
revoga o convite de origem por um `update` condicional (só em aberto) e cria outro para o mesmo
usuário, com `convite.refeito` na auditoria (a origem, o usuário e a validade).

A lista do painel lê o mesmo estado para as escolas da página, e por isso `Usuario` ganhou o índice
parcial `usuario_coordenador_ativo_idx (escola_id) where papel = 'coordenador' and desativado_em is
null` (A0b, tarefa 5.0): sem ele, a pergunta "há coordenador ativo?" varre os usuários de todas as
escolas, que crescem com os alunos.

## Operação Turmma

Implementado na A0 (D76). A forma exata das tabelas, com unicidades, índices e checks, está na
seção 3 da Tech Spec da A0 (`tasks/prd-apresentacao-operacao/techspec.md`); aqui fica o desenho.

```
Operador                  apelido* (único), nome?, email? (único), senhaHash?, mfaSegredoCifrado?,
                          mfaChaveVersao?, mfaVersao*, mfaAtivadoEm?, mfaUltimoPasso?, criadoEm*,
                          desativadoEm?
CodigoRecuperacaoOperador → operador*, hmac*
ConviteOperador           → operador*, tokenHash*, expiraEm* (72 h), usadoEm?, revogadoEm?
SessaoOperador            → operador*, refreshHash*, refreshHashAnterior?, rotacionadoEm?, criadaEm*,
                            ultimoUsoEm*, expiraEm* (8 h), encerradaEm?, motivo?
AcessoOperacao            → operador?, evento* (entrada | entrada_falha | saida), ip*, em*
AuditoriaOperacao         autor* (apelido ou bootstrap), acao*, → operadorAlvo*, em*
```

**São da nossa equipe, não de escola**, e por isso não têm `escolaId` (Tech Spec da A0, seção 11).
O que impede que isso vire atalho para dado de escola é a cerca, provada por teste de arquitetura
(C45): só o `OperadorRepository` as toca, e ele não toca outra tabela; o expurgo só apaga, pelo
prazo, `AcessoOperacao`, `SessaoOperador` e `ConviteOperador`. O operador desativado não guarda
dado pessoal, por check no banco: fica o apelido, que é o que vai para `Auditoria.autorOperador`.
Um convite pendente por operador, por único parcial.

**O painel da operação** (A0b, D76) lê entre escolas, e é a exceção da regra 10, item 9. O desenho
está na Tech Spec da A0b (`tasks/prd-apresentacao-painel/techspec.md`, seções 6 e 11), e as consultas
sem escopo que uma rota do painel alcança são estas, cada uma com `@SemEscopo` e a justificativa no
código:

| Repository e método | O que faz | Justificativa |
|---|---|---|
| `PainelRepository.redes` | a lista de redes para criar escola | acima do tenant; só id, nome e tipo, até 200, sem escola nem pessoa |
| `PainelRepository.escolas` | a lista de escolas, com o estado da coordenação e as contagens do ano em curso | só id, nome, endereço e número, sem pessoa |
| `PainelRepository.uso` | o uso de infra de cada escola no último dia fechado e no mês dele | só id, nome e número, sem pessoa |
| `RedeEEscolaRepository.criarRede`, `criarEscola` | cria, ou lê pelo id o pedido repetido | a rede fica acima do tenant, e a escola é o próprio tenant, que nasce ali; só o comando ou o painel cria, e devolve só o id |
| `ResolucaoDeTenantRepository.contaParaConvite` | acha ou cria a conta pelo e-mail no convite da coordenação | a conta é global e não tem escola; não lê nada dela e devolve só o id e se é nova |
| `ResolucaoDeTenantRepository.escolaDoConviteParaOperador` | a escola do convite de coordenação | recebe só o id do convite, e a escola dele vira o contexto, nunca o argumento |

O `PainelRepository` é o único lugar da leitura entre escolas: os três métodos dele são todos
`@SemEscopo`, e só o `painel.service.ts` o importa (teste de arquitetura I1). Os outros quatro já
existiam para os comandos `ops:*` e passaram a servir também ao painel, com a justificativa "comando
ou painel" (o `ops` continua com os dois, I2, e o `sessao` não ganhou nenhum). Eles servem às
escritas: fora a leitura da escola do convite, que só devolve o `escola_id`, as escritas abrem o
contexto da escola antes de tocar qualquer tabela dela, e o resto do gerar, refazer e revogar roda
com escopo. Não há tabela nova: o painel lê `rede`, `escola`, `ano_letivo`, `turma`,
`vinculo`, `usuario`, `convite` e `uso_infra_diario`, e devolve só id, nome, endereço, estado e
número. A alternativa recusada, uma chamada por escola no contexto dela, espalharia a exceção por
todos os repositories que a lista toca.

## Grade horária e calendário

```
GradeHoraria*    → escola*, anoLetivo*, nome
TempoAula*       → gradeHoraria*, diaSemana*, ordem*, inicio*, fim*
Alocacao*        → tempoAula*, turma*, disciplina*, professor*, sala?
EventoCalendario → escola*, tipo (feriado | recesso | evento), inicio, fim
Aula             → alocacao*, data*, conteudo?, status, observacao?
```

`Aula` é a instância concreta gerada a partir de `Alocacao` mais o calendário escolar. É a
camada onde o professor registra o que deu e é a fonte do "seu dia e sua semana", função do
Assistente de ensino (`docs/agentes.md`).

## Conteúdo

```
FonteMaterial*   → escola*, tipo (scraper | upload), adaptador?, autorizacaoDoc*,
                   autorizadoPor*, autorizadoEm*,
                   titularidade* (escola | professor | licenciado | dominio_publico | enem),
                   licencaDoc?, licenciante?, licencaValidaAte?, ativo
Material*        → escola*, fonte*, titulo, versao*, disciplina?, serie?, arquivoUrl,
                   status (pendente | processado | falhou), processadoEm?
Capitulo         → material*, titulo, ordem, paginaInicio, paginaFim
HabilidadeBNCC   → codigo*, descricao, etapa, componente     (tabela pública, sem escola)
TrechoIndexado   → material*, capitulo?, texto, embedding, pagina*, habilidades[]
Questao*         → escola?|publica, enunciado*, tipo*, alternativas?, gabarito*,
                   disciplina, assunto, dificuldade, habilidades[],
                   fonte (propria | enem | vestibular), origemMaterial?, origemPagina?
```

`escola` nulo significa banco público (ENEM, vestibulares), visível a todos. Material
ingerido **nunca** cruza de escola. `autorizacaoDoc` registra a autorização escrita da
escola para a fonte. Quando `titularidade` é `licenciado`, `licencaDoc` e `licenciante` são
obrigatórios. Sem autorização e, quando couber, sem licença, nem o upload nem o adaptador
processam (D5 revista, `docs/regulacao.md` seção 5). **Quem sobe é a coordenação** (D75):
`autorizadoPor` é sempre alguém com papel de coordenação na escola, e professor e aluno não
criam `FonteMaterial` nem `Material`. `titularidade` diz de quem é o material — `professor`
é o material de autoria do professor, que entra pelas mãos da coordenação —, não quem subiu.

`origemMaterial` e `origemPagina` são a rastreabilidade: o professor confere de onde a
questão saiu.

## Avaliação

```
Avaliacao*       → turma*, disciplina*, professor*, periodo*, titulo*, modo*, peso,
                   dataAplicacao, status
ItemAvaliacao*   → avaliacao*, questao?, enunciado?, pontos*, ordem*
Aplicacao        → avaliacao*, aluno*, iniciadoEm, entregueEm, origem, saidasDaAba?
Resposta         → aplicacao*, item*, conteudo, arquivoUrl?
Correcao         → resposta*, pontosObtidos?, feedback?, origem (auto | ia | professor),
                   aprovadaPor?, aprovadaEm?
Diagnostico      → escola*, anoLetivo*, aplicacao*, habilidade*, acertos, total,
                   observacao?, geradoEm*
Nota*            → aluno*, avaliacao*, valor*, lancadaPor*, lancadaEm*
```

`Diagnostico` é o resultado formativo por habilidade, que existe antes da nota oficial (D46).
Em item discursivo ou de redação **não existe `Correcao` com `origem = ia`**: a IA não
corrige, não avalia, não pontua e não escreve `feedback` sobre o texto do aluno nessas
modalidades, nem como rascunho para o professor ver (D55, revisão da D46, ratificada em
23/09/2026). Ali a `Correcao` nasce com `origem = professor`. O que a IA produz
para discursiva e redação é a **rubrica da avaliação**, que pertence ao item e não à resposta
de ninguém.

`modo`: `online_objetiva` · `online_discursiva` · `papel_foto` · `entrega` · `presencial`

`saidasDaAba` é a contagem de vezes em que a aba da prova perdeu o foco, **só em avaliação
online**. Fica na `Aplicacao`, nunca no aluno: não é somada entre avaliações, não vira
indicador, e só o professor da turma lê (D70).

<critical>`Nota` só existe com `lancadaPor` preenchido por um humano. Correção de IA
preenche `Correcao`, nunca `Nota` diretamente.</critical>

## Correção por foto

```
FolhaResposta    → avaliacao*, aluno*, codigo*, versao
Captura          → folhaResposta*, imagemUrl*, status, confianca, revisadoPor?
```

`codigo` é impresso na folha e identifica aluno e avaliação sem depender de OCR de nome.

## Agentes

```
Agente*          → escola?, chave*, nome*, avatar, descricao, autonomia* (1..4), ativo
ThreadAgente*    → agente*, usuario*, ultimaLeitura
MensagemAgente*  → thread*, autor (agente | usuario), conteudo*, anexos?
Entrega          → mensagem*, tipo*, payload*, status (pendente | aprovada | rejeitada),
                   aprovadaPor?, aprovadaEm?, justificativa?
ExecucaoAgente   → agente*, escola*, gatilho*, entrada, saida, perfilIa, modelo, tokens,
                   custo, duracao, status, erro?, enviadoExternamente (bool)
OrcamentoIa      → escola*, anoLetivo*, limiteMensal, consumoAtual, alertaEm
PacoteTutor      → escola*, anoLetivo*, turma*, mes*, trocasPorAluno* (padrão 300),
                   freioDiarioPorAluno* (padrão 60), consumoTrocas
ConsumoIa        → escola*, usuario*, perfil*, tokens*, custo*, em*
```

`autonomia` é visível ao coordenador em tela. Nível 3 e 4 seguem `docs/agentes.md`.

**Autonomia e suspensão por função** (D9, D32 e D60 revistas em 23/09/2026). Com três agentes,
um por pessoa da escola, a autonomia deixa de caber num campo do `Agente`: ela é declarada por
**função** (correção de objetiva, adaptação, seu dia e sua semana…). O P01 de
`docs/pendencias-dos-mockups.md` pede `FuncaoAgente → agente*, chave*, nome*, autonomia*,
altoRisco*, ativo`; `funcao*` em `Entrega` e em `ExecucaoAgente`, que também filtra a thread do
Assistente; e a suspensão como registro próprio, `escola*, funcao*, suspensaPor*, em*, motivo`,
com auditoria. **A detalhar na Tech Spec da A2**, que traz o runtime mínimo de agente; o bloco
acima continua sendo o desenho do F1 até lá.

```
AdaptacaoAluno*  → escola*, anoLetivo*, aluno*, tipos* (linguagem_direta | resposta_escrita |
                   fonte_ampliada | tempo_extra | enunciado_simplificado | leitor_de_tela |
                   outro), detalhe?,
                   registradaPor* (coordenação), registradaEm*, revisarEm*
```

`AdaptacaoAluno` guarda **o que adaptar, nunca o porquê**: sem diagnóstico, laudo ou CID
(D35). `detalhe` é texto curto e revisado; campo livre que vira prontuário é reprovação no
`privacy-guardian`. Leitura por professor é limitada às turmas dele e fica em auditoria. A
ferramenta Adaptação e o Tutor recebem só os `tipos` (D66, D67). A lista de tipos fecha no PRD;
precisa cobrir pelo menos o aluno surdo e o que não fala.

## Tutor, sala e supervisão

```
PoliticaTutor*   → turma*, modo* (bloqueado | socratico | livre), definidaPor*,
                   foraDaSala* (bool, padrão falso), foraDaSalaDefinidoPor?,
                   busca* (bool, padrão falso), buscaAte?, buscaDefinidaPor?
BuscaEscola*     → escola*, liberada* (bool, padrão falso), liberadaPor?, tetoDiarioPorAluno*
FonteAprovada*   → escola?, dominio*, faixa* (anos_finais | medio | ambas), ativa*
BuscaTutor       → sessao*, consulta* (escrita pelo modelo), fontesAbertas, criadaEm*
ContextoTurma*   → turma*, disciplina*, conteudoAtual, listaAtiva?, focoDaSemana,
                   definidoPor*, validoAte
ReforcoAluno*    → turma*, disciplina*, aluno*, habilidades* (códigos da lista),
                   definidoPor*, revisarEm*
SessaoTutor*     → aluno*, turma*, disciplina?, modo (sala | casa), iniciadaEm, encerradaEm
MensagemTutor*   → sessao*, autor (aluno | tutor), conteudo*, criadaEm*
SinalAluno       → sessao*, tipo (travado | pediu_resposta | fora_de_escopo | duvida |
                   atencao_humana),
                   detalhe, criadoEm*
SalaAoVivo       → turma*, professor*, abertaEm, fechadaEm
```

`MensagemTutor` tem retenção de 12 meses e acesso restrito ao professor da turma. A rede
nunca alcança conteúdo de conversa — apenas agregado.

A **memória do Tutor cobre a trajetória inteira do aluno**, e é quase toda leitura: `Aplicacao`,
`Resposta`, `Correcao` (com a devolutiva do professor), `Diagnostico`, `SinalAluno`,
`ContextoTurma`, `ReforcoAluno` e os `tipos` de `AdaptacaoAluno`. O que é novo é o resumo da
sessão, em formato fixo, e o índice para recuperar por relevância:

```
ResumoSessaoTutor → sessao*, assunto*, habilidades, exercicio?, ondeTravou?, comoTerminou*
```

Não existe campo de texto livre sobre o aluno, escrito por modelo ou por professor (D66).

A busca tem **duas chaves**: `BuscaEscola.liberada` é da coordenação, `PoliticaTutor.busca` é do
professor, com prazo; sem as duas, e sempre durante avaliação e no modo casa, a busca é
recusada no servidor. `FonteAprovada` sem `escola` é a lista padrão nossa. `BuscaTutor.consulta`
é a que o modelo escreveu, sem o texto do aluno (D68).

`foraDaSala` é decisão da escola, por turma, e nasce desligado (D19). O `modo` é do
professor; o `foraDaSala` é da coordenação. Sem ele ligado, `SessaoTutor` com modo `casa` é
recusada no servidor.

## MVP de apresentação (A2 a A5) — o que está implementado

Implementado na fatia única do MVP de apresentação (D77), nas migrations `0022_mvp_apresentacao.sql` e
`0023_mvp_restricoes.sql` (a segunda só aperta: FKs com o ano letivo e a turma, gatilhos e duas colunas nulas). A forma exata, com
colunas, unicidades, checks e gatilhos, está em `docs/mvp-contratos.md` e no docblock de cada tabela; os blocos de
"Conteúdo", "Avaliação", "Agentes" e "Tutor, sala e supervisão", acima, continuam sendo o desenho definitivo, que cada fase
completa.

```
Material*          → escola*, disciplina*, titulo*, titularidade*, licenciante?, licenca*, declaracao*,
                     sha256*, tamanhoBytes*, paginas?, estado* (processando | pronto | falhou), falha?,
                     enviadoPor?, enviadoEm*, excluidoPor?, excluidoEm?
Trecho*            → escola*, disciplina*, material*, pagina*, texto*, busca (tsvector, português)
ExecucaoAgente*    → escola*, anoLetivo*, funcao*, tarefa*, solicitadaPor?, chaveEnvio*,
                     estado* (pendente | rodando | concluida | falhou), entrada*, resultado?, erro?, datas
ConsumoIa*         → escola*, aluno?, execucao?, tarefa*, funcao*, perfil*, origem*, modelo*, promptVersao*,
                     tokensDeEntrada*, tokensDeSaida*, custoMicros*, duracaoMs*, envioExterno*, tentativas*,
                     estado*, codigoDeErro?, entrada?, saida?, em*
ThreadAgente*      → escola*, anoLetivo*, usuario*, agente*
MensagemAgente*    → escola*, anoLetivo*, thread*, execucao*, autor* (usuario | agente), conteudo*, turma?, disciplina?
Artefato*          → escola*, anoLetivo*, turma*, disciplina*, tipo*, titulo*, conteudo*, origem? (versão adaptada),
                     execucao?, criadoPor?
Entrega*           → escola*, anoLetivo*, turma*, funcao*, tipo* (versao_adaptada | lote_de_correcao), artefato?,
                     atividadeAplicada?, execucao?, estado* (pendente | aprovada | rejeitada), decididaPor?,
                     decididaEm?, justificativa?
AtividadeAplicada* → escola*, anoLetivo*, turma*, artefato*, avaliativa*, estado* (aberta | encerrada),
                     aplicadaPor*, aplicadaEm*, encerradaEm?
TentativaAtividade*→ escola*, anoLetivo*, atividadeAplicada*, aluno*, iniciadaEm*, enviadaEm?
RespostaAtividade* → escola*, anoLetivo*, atividadeAplicada*, aluno*, questao* (1..20), alternativa* (0..3)
Correcao*          → escola*, anoLetivo*, entrega* (lote), atividadeAplicada*, aluno*, acertos*, total*, emBranco*,
                     porHabilidade*, destaques*, destaqueAbertoEm?, destaqueAbertoPor?
ValidacaoDoLote*   → escola*, anoLetivo*, entrega*, atividadeAplicada*, apresentado*, aberto*, confirmadaPor*,
                     confirmadaEm*
MensagemTutor*     → escola*, anoLetivo*, turma*, aluno*, execucao*, atividadeAplicada?, questao?, material?,
                     pagina?, autor* (aluno | tutor), tipo* (texto | assunto_delicado), texto*, citacoes?
SinalTutor*        → escola*, anoLetivo*, turma*, aluno*, execucao?, tipo* (travou | resposta_pronta |
                     duvida_repetida | atencao_humana), atividadeAplicada?, questao?, material?, pagina?
SuspensaoDeFuncao* → escola*, funcao*, motivo?, suspensaPor*, suspensaEm*, retomadaPor?, retomadaEm?
ResumoDoAnalista*  → escola*, anoLetivo*, execucao?, conteudo*, geradoEm*
```

O que a fatia tem de diferente do desenho definitivo, e por quê:

- **`Material` junta a fonte e o material**, e o arquivo não é guardado: ficam os metadados, a titularidade, a licença e a
  declaração, e o texto por página vai para `Trecho`, sem `embedding` (busca por texto completo em português). Não existe
  material sem a declaração de licença (check), e a recusa não grava linha (D5, D75).
- **Não existe `Nota`** (D46). `Correcao` é o diagnóstico formativo de objetiva, por aluno e por lote; `AtividadeAplicada`,
  `TentativaAtividade` e `RespostaAtividade` são a `Avaliacao`, a `Aplicacao` e a `Resposta`, finas, só para objetiva online.
- **A função não é tabela**: é o catálogo `FUNCOES`, em código (`packages/shared/src/time/funcoes.ts`). `Entrega`,
  `ExecucaoAgente` e `ConsumoIa` levam a chave dela, e `SuspensaoDeFuncao` é o registro próprio da suspensão (D60).
- **A validação do lote é tabela própria** (D56), e o lote só fica aprovado com ela (gatilho no banco). A versão adaptada
  só é aplicada à turma com a entrega aprovada (gatilho no banco).
- **Não existe `AdaptacaoAluno`** nesta fatia: a versão adaptada leva só os tipos de adaptação e vai para a turma, sem
  vínculo com aluno (D35).
- **O Tutor não tem sessão, política nem resumo de sessão**: a conversa é `MensagemTutor`, por aluno, e a memória é leitura
  das tentativas, das correções de lote aprovado e dos sinais. `SinalTutor` não tem `detalhe`: é tipo fechado mais a
  referência ao trabalho, e `atencao_humana` não carrega referência nenhuma (D36, D57, D66).
- **O freio e o pacote do Tutor** são duas colunas de `configuracao_operacional_escola`, e não a `PacoteTutor` por turma.
- **`ConsumoIa` não tem usuário** (D64): só o aluno, nas funções do Tutor. `entrada` e `saida` ficam nulas onde a chamada
  leva conversa de pessoa (o Tutor e a proposta de ferramenta).
- **O uso do Tutor por turma** (`GET /v1/tutor/uso`) é leitura de `MensagemTutor`, sem tabela: por aluno, as trocas do dia,
  a última e em que ele estava (`questao`, `pagina`). É o que faz não existir uso invisível ao professor (D47).
- **Nada cruza de turma nem de ano letivo na mesma escola**: a entrega, a mensagem e o sinal do Tutor apontam para a
  aplicação com a turma, e as FKs para `Artefato` e `ExecucaoAgente` levam o ano.

## Comunicação, conta e conformidade

```
Evento*          → escola*, tipo*, entidade*, entidadeId*, payload, em*
Notificacao      → usuario*, evento*, titulo*, corpo*, canal*, lidaEm?, enviadaEm?
Contrato         → rede*|escola*, inicio, fim, licencas, valor, docTratamentoDados*
Auditoria*       → escola*, autorUsuario? | autorOperador?, acao*, entidade*, entidadeId,
                   antes?, depois?, finalidade?, requisicaoId*, em*    (F1)
SolicitacaoTitular → escola*, titular*, tipo (acesso | correcao | eliminacao |
                   portabilidade | compartilhamento), status, solicitadaEm*, atendidaEm?
Incidente        → escola*, detectadoEm*, descricao, titularesAfetados, comunicadoEm?
```

`Evento` é o motor: nota aprovada, tarefa não entregue, aluno travado. A `Notificacao` é
uma leitura dele. Isso permite construir o motor agora e ligar o canal da família depois
sem refazer nada.

## Indicadores de desempenho

```
IndicadorProfessor → escola*, anoLetivo*, professor*, periodo*, tipo*, valor*, calculadoEm*
IndicadorTurma     → escola*, anoLetivo*, turma*, disciplina*, habilidade?, periodo*, tipo*,
                     valor*, calculadoEm*
```

Os tipos concretos, os limiares e o texto dos alertas estão em aberto (`CLAUDE.md`, decisões em
aberto): os de turma e aluno fecham antes do PRD do F6, porque "Turmas" nasce lá (D69, D73);
os de professor, antes do PRD do F12. A coordenação só lê agregado de recorte com dois ou mais
professores (D45 revista). Tempo ocioso do aluno não é tipo de indicador. `IndicadorProfessor` é lido pelo próprio professor; a
coordenação lê agregado e o nominal com `Auditoria`; a rede só agregado; nenhum caminho o
liga a decisão sobre o professor (D45, regra 70 item 8). Os dois estão no mapa de dados de
`docs/lgpd.md`.

## Regras transversais

1. Toda tabela de domínio tem `escolaId`. As que variam por período têm `anoLetivoId`. As
   exceções são curtas e fixas, e esta lista é conferida contra as migrations por teste de
   arquitetura (`apps/api/test/arquitetura.test.ts`):
   - o próprio tenant: `Escola` e a `Rede` acima dela — ver "Estrutura institucional";
   - tabela pública sem dono (habilidades da BNCC, banco de questões público);
   - a identidade de login (`Conta`, `CodigoRecuperacao`), que é global por desenho e só é
     alcançada pelo módulo `sessao` — ver "Pessoas e vínculos";
   - as tabelas da operação Turmma (`Operador`, `CodigoRecuperacaoOperador`, `ConviteOperador`,
     `SessaoOperador`, `AcessoOperacao`, `AuditoriaOperacao`), da nossa equipe e não de escola,
     só alcançadas pelo `OperadorRepository` e pelo expurgo — ver "Operação Turmma".
2. Id é UUID. Nunca sequencial.
3. Nada é apagado de verdade: exclusão é lógica, com data e autor — exceto em pedido de
   eliminação do titular, que apaga de fato e propaga para backup na próxima rotação, e no nome
   livre da lista de nomes, pré-cadastro sem conta nem histórico, que sai de fato com a autoria na
   auditoria (A1, Tech Spec da A1, seção 7).
4. `Auditoria` registra toda escrita que afeta nota, vínculo ou permissão, **e toda leitura
   de dado de aluno por coordenador ou rede**, e toda exportação.
5. Aluno não tem e-mail nem telefone. Contato é do responsável.
6. Todo campo pessoal precisa estar na tabela de dados de `docs/lgpd.md`, com finalidade e
   retenção. Campo fora da tabela não entra em migration.
7. DTO de saída explícito. Nunca serialize a entidade inteira.
8. Seed de desenvolvimento e de demonstração é **sempre sintético**. Dump de produção em
   máquina de desenvolvimento é proibido.
