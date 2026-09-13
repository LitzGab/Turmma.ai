# Modelo de dados

Notação: `→` referência, `*` obrigatório.

## Estrutura institucional

```
Rede*            nome, cnpj, tipo (prefeitura | grupo | independente)
Escola*          → rede*, nome, inep, endereco, config, retencaoConfig
AnoLetivo*       → escola*, ano, inicio, fim, ativo
Periodo          → anoLetivo*, nome (1º bimestre), inicio, fim
Serie*           → escola*, nome (1º ano), etapa
Turma*           → escola*, anoLetivo*, serie*, nome (2ºB), turno
Disciplina*      → escola*, nome, area
```

## Pessoas e vínculos

```
Usuario*         → escola*, nome, papel, email?, matricula?, senhaHash, status, mfa?
Vinculo*         → usuario*, turma*, disciplina?, papel*, anoLetivo*
Responsavel      → usuario*, aluno*, parentesco
Convite          → escola*, token*, tipo (professor | sala), turma?, expiraEm, usadoEm,
                   revogadoEm?, criadoPor*
ListaNome*       → turma*, nome*, status (livre | reivindicado | aprovado), origem
Reivindicacao*   → listaNome*, dispositivo, solicitadoEm*, aprovadoPor?, aprovadoEm?,
                   rejeitadoEm?
```

`ListaNome` é a lista que o coordenador sobe. O aluno entra pelo link da sala, reivindica
um nome e só vira `Usuario` com matrícula e senha **depois da aprovação do professor**.

`email` e `matricula` são mutuamente exclusivos por papel: aluno tem matrícula, os demais
têm e-mail. Unicidade de matrícula é por `(escolaId, matricula)`.

`papel`: `rede` · `coordenador` · `professor` · `aluno` · `responsavel`

## Grade horária e calendário

```
GradeHoraria*    → escola*, anoLetivo*, nome
TempoAula*       → gradeHoraria*, diaSemana*, ordem*, inicio*, fim*
Alocacao*        → tempoAula*, turma*, disciplina*, professor*, sala?
EventoCalendario → escola*, tipo (feriado | recesso | evento), inicio, fim
Aula             → alocacao*, data*, conteudo?, status, observacao?
```

`Aula` é a instância concreta gerada a partir de `Alocacao` mais o calendário escolar. É a
camada onde o professor registra o que deu e é a fonte do agente Rotina.

## Conteúdo

```
FonteMaterial*   → escola*, tipo (scraper | upload), adaptador?, autorizacaoDoc*,
                   autorizadoPor*, autorizadoEm*, ativo
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
escola para a fonte — sem ela, o adaptador não roda (`docs/regulacao.md` seção 4).

`origemMaterial` e `origemPagina` são a rastreabilidade: o professor confere de onde a
questão saiu.

## Avaliação

```
Avaliacao*       → turma*, disciplina*, professor*, periodo*, titulo*, modo*, peso,
                   dataAplicacao, status
ItemAvaliacao*   → avaliacao*, questao?, enunciado?, pontos*, ordem*
Aplicacao        → avaliacao*, aluno*, iniciadoEm, entregueEm, origem
Resposta         → aplicacao*, item*, conteudo, arquivoUrl?
Correcao         → resposta*, pontosObtidos, feedback?, origem (auto | ia | professor),
                   aprovadaPor?, aprovadaEm?
Nota*            → aluno*, avaliacao*, valor*, lancadaPor*, lancadaEm*
```

`modo`: `online_objetiva` · `online_discursiva` · `papel_foto` · `entrega` · `presencial`

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

```
AdaptacaoAluno*  → escola*, anoLetivo*, aluno*, tipos* (fonte_ampliada | tempo_extra |
                   enunciado_simplificado | leitor_de_tela | outro), detalhe?,
                   registradaPor* (coordenação), registradaEm*, revisarEm*
```

`AdaptacaoAluno` guarda **o que adaptar, nunca o porquê**: sem diagnóstico, laudo ou CID
(D35). `detalhe` é texto curto e revisado; campo livre que vira prontuário é reprovação no
`privacy-guardian`. Leitura por professor é limitada às turmas dele e fica em auditoria.

## Tutor, sala e supervisão

```
PoliticaTutor*   → turma*, modo* (bloqueado | socratico | livre), definidaPor*,
                   foraDaSala* (bool, padrão falso), foraDaSalaDefinidoPor?
SessaoTutor*     → aluno*, turma*, disciplina?, modo (sala | casa), iniciadaEm, encerradaEm
MensagemTutor*   → sessao*, autor (aluno | tutor), conteudo*, criadaEm*
SinalAluno       → sessao*, tipo (travado | pediu_resposta | fora_de_escopo | duvida |
                   atencao_humana),
                   detalhe, criadoEm*
SalaAoVivo       → turma*, professor*, abertaEm, fechadaEm
```

`MensagemTutor` tem retenção de 12 meses e acesso restrito ao professor da turma. A rede
nunca alcança conteúdo de conversa — apenas agregado.

`foraDaSala` é decisão da escola, por turma, e nasce desligado (D19). O `modo` é do
professor; o `foraDaSala` é da coordenação. Sem ele ligado, `SessaoTutor` com modo `casa` é
recusada no servidor.

## Comunicação, conta e conformidade

```
Evento*          → escola*, tipo*, entidade*, entidadeId*, payload, em*
Notificacao      → usuario*, evento*, titulo*, corpo*, canal*, lidaEm?, enviadaEm?
Contrato         → rede*|escola*, inicio, fim, licencas, valor, docTratamentoDados*
Auditoria*       → usuario*, escola*, acao*, entidade*, entidadeId, antes?, depois?, em*,
                   ip?, finalidade?
SolicitacaoTitular → escola*, titular*, tipo (acesso | correcao | eliminacao |
                   portabilidade | compartilhamento), status, solicitadaEm*, atendidaEm?
Incidente        → escola*, detectadoEm*, descricao, titularesAfetados, comunicadoEm?
```

`Evento` é o motor: nota aprovada, tarefa não entregue, aluno travado. A `Notificacao` é
uma leitura dele. Isso permite construir o motor agora e ligar o canal da família depois
sem refazer nada.

## Regras transversais

1. Toda tabela de domínio tem `escolaId`. As que variam por período têm `anoLetivoId`.
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
