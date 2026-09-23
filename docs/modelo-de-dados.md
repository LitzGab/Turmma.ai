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
Convite          → escola*, tokenHash*, tipo (coordenador), usuario*, expiraEm, usadoEm?,
                   revogadoEm?
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

### Ainda não existe — F2

```
Responsavel      → usuario*, aluno*, parentesco
ListaNome*       → turma*, nome*, status (livre | reivindicado | aprovado), origem
Reivindicacao*   → listaNome*, dispositivo, solicitadoEm*, aprovadoPor?, aprovadoEm?,
                   rejeitadoEm?
```

`ListaNome` é a lista que o coordenador sobe. O aluno entra pelo link da sala, reivindica um
nome e só vira `Usuario` com matrícula e senha **depois da aprovação do professor**. No F1 o
aluno e o vínculo dele vêm do seed sintético.

`Convite` no F1 é só de coordenador, criado por comando do operador. Os tipos `professor` e
`sala`, e o vínculo do aluno vindo da lista, entram no F2.

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
   exceções são curtas e fixas: tabela pública sem dono (habilidades da BNCC, banco de questões
   público) e a identidade de login (`Conta`, `CodigoRecuperacao`), que é global por desenho e
   só é alcançada pelo módulo `sessao` — ver "Pessoas e vínculos".
2. Id é UUID. Nunca sequencial.
3. Nada é apagado de verdade: exclusão é lógica, com data e autor — exceto em pedido de
   eliminação do titular, que apaga de fato e propaga para backup na próxima rotação.
4. `Auditoria` registra toda escrita que afeta nota, vínculo ou permissão, **e toda leitura
   de dado de aluno por coordenador ou rede**, e toda exportação.
5. Aluno não tem e-mail nem telefone. Contato é do responsável.
6. Todo campo pessoal precisa estar na tabela de dados de `docs/lgpd.md`, com finalidade e
   retenção. Campo fora da tabela não entra em migration.
7. DTO de saída explícito. Nunca serialize a entidade inteira.
8. Seed de desenvolvimento e de demonstração é **sempre sintético**. Dump de produção em
   máquina de desenvolvimento é proibido.
