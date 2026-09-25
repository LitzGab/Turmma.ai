# Arquitetura

## Princípios

1. **Portabilidade.** Hospedagem e provedor de modelo em aberto; rede pública pode exigir
   dado no Brasil. Tudo em container, nada proprietário no caminho crítico.
2. **Isolamento por escola acima de tudo.** É a decisão que não pode ser retrabalhada.
3. **Web-first e responsiva**, do computador fraco de escola (Chromebook como referência)
   ao celular (D51). Sem app nativo, sem fluxo que dependa de celular (Lei 15.100/2025, D43).
4. **Aprovação humana no caminho de tudo que vale.** Exigência do CNE.

## Desenho

```
apps/web        React + Vite + TS     coordenador, professor, aluno, (família depois)
apps/api        NestJS + TS           API REST, domínio, autorização
apps/realtime   WebSocket             modo sala: professor vê a turma ao vivo
apps/worker     BullMQ                agentes, ingestão, correção, notificação
packages/shared tipos e contratos

Postgres · Redis · S3-compatível · LLMProvider (Ollama | OpenAI-compatível)
```

## Camadas do backend

```
módulo
 ├── controller     HTTP, validação, zero regra
 ├── service        regra de negócio
 ├── repository     único acesso a dados, escopo de tenant sempre
 └── dto            contrato de saída explícito, nunca a entidade serializada
```

Módulos: `escola`, `serie`, `turma`, `disciplina`, `usuario`, `convite`, `ingestao`,
`material`, `questao`, `avaliacao`, `correcao`, `nota`, `tutor`, `sala`, `agente`,
`governanca`, `notificacao`, `ia`, `auditoria`, `titular`.

## Multi-tenant

Escopo aplicado no repository, a partir do token. Toda tabela de domínio tem `escolaId`;
as que variam por período têm `anoLetivoId`. Id é UUID. Teste de isolamento acompanha todo
módulo novo. Ver `rules/10`.

**O único alcance entre escolas é o módulo `operacao`** (A0b, painel da operação Turmma), e só
para o operador com sessão (`@RotaDeOperacao`). Ele cria rede e escola pelos casos de uso do
`ops:escola`, e lê entre escolas por um só repository, o `PainelRepository`, em que cada método
é `@SemEscopo` com a justificativa do painel (regra 10, item 9), devolvendo id, nome e número,
nunca pessoa. Nenhum outro módulo lê fora da escola do token, e credencial de escola não alcança
rota do painel (teste C46). O desenho está na Tech Spec da A0b
(`tasks/prd-apresentacao-painel/techspec.md`, seções 6 e 11).

## Autenticação e identidade

- **Coordenador, professor, responsável:** e-mail + senha. Segundo fator para coordenador.
- **Aluno:** escola + matrícula + senha. Sem e-mail, sem telefone.
- **Conta da escola (D48):** onde a escola tem Google Workspace ou Microsoft, professor e
  aluno entram com essa conta, por adaptador opcional (regra 00, item 7). Guardamos só o
  identificador opaco da conta; e-mail e foto do aluno são descartados antes de gravar.
  Importação de turmas e vínculos do Classroom pelo mesmo adaptador.
- **Entrada no sistema:** coordenador cria séries e turmas, sobe a lista de nomes, importa
  grade e calendário e aloca professor × turma × disciplina → professor entra por link de
  convite e **confirma** o vínculo → aluno entra pela conta da escola ou pelo link da sala,
  reivindica o próprio nome e **o professor aprova**. Só depois da aprovação o aluno define
  senha e existe de verdade. Vínculo não confirmado não dá acesso a aluno.
- Um usuário pode ter vínculo em mais de uma escola; o token carrega a escola ativa.
- Convite é token único, com validade curta, uso único e revogável.
- **O `SessaoModule` é global desde a A0**, como o `BancoModule` e o `LimiteModule`. Ele exporta o
  semáforo do hash de senha, o hash, o contador de tentativas e o cliente do Redis de fila do login,
  e o `OperacaoModule` (a entrada, o convite e o segundo fator do operador Turmma) recebe a **mesma
  instância**: o teto do semáforo é o das threads do processo, e dois semáforos dobrariam o argon2
  que a instância aceita ao mesmo tempo; o contador é um só, com o prefixo `login-op` separando as
  contas do operador das da escola, e o seguro em memória dele, com o Redis fora, vale para as duas.
  Montar outro `SessaoModule` na operação criaria a segunda instância de cada peça sem ninguém ver.
- **As rotas de entrada da operação contam por IP num balde próprio** (`rl:ip:op`, A0b), com o teto
  do limite anônimo: a rede de uma escola, que sai por um IP só, não recusa nem rebaixa o operador
  que está nela, e as tentativas contra a entrada do operador não gastam o limite dos alunos.

## Assíncrono

Nada demorado em request. Filas: `ingestao`, `agentes`, `correcao`, `notificacao`,
`expurgo`, `exportacao-titular`, com três prioridades (interativa, normal, lote) e limite de
concorrência por escola. Lote não urgente roda fora do horário letivo.

A entrega é **pelo menos uma vez** (D49): o job nasce no Postgres, o despachante publica no
BullMQ quando a escola tem vaga, e a reconciliação republica o que o Redis perdeu. Por isso
todo processador recebe chave de idempotência e precisa tolerar reexecução sem duplicar
efeito, principalmente chamada de IA paga e aviso.

## Carga e operação

Cada escola entra com centenas de usuários, concentrados no horário de aula e atrás de um
único IP. O modelo de carga, a topologia, os limites, a meta de disponibilidade e o portão
da primeira escola real estão em `docs/infra.md` e na regra 80.

## Tempo real (modo sala)

O professor vê a turma usando o tutor ao vivo: quem está travado, quem pediu resposta
pronta, quais dúvidas se repetem. WebSocket com sala por turma, autorizada pelo vínculo do
professor. Fora da aula, modo casa: registro e resumo, sem tempo real.

Sinal é derivado de evento, não de vigilância: o professor vê **uso e dificuldade**, não
uma janela permanente sobre o comportamento do aluno.

## Camada de IA

```
Serviço de domínio → LLMProvider (porta)
                       ├── OllamaAdapter        dev e teste, custo zero
                       └── OpenAICompatAdapter  produção
```

Roteamento por perfil: `rapido`, `padrao`, `complexo`, `visao`. O perfil é declarado pelo
caso de uso; o modelo concreto é configuração.

**Orçamento de tokens** por aluno, por turma e por escola é obrigatório, com corte suave e
aviso ao coordenador antes do limite. O tutor tem pacote mensal por turma e freio diário por
aluno (D38). Teto de R$ 5 por aluno na particular (D39); na rede, derivado do contrato
(D41). Tudo é configuração, nunca constante. O tutor gasta muito mais que geração de prova — a margem do
R$ 30/aluno depende de medir isso desde a primeira chamada.

Guardrails: escopo de assunto por turma aplicado no servidor, detecção de pedido de
resposta pronta, filtro de conteúdo, recusa testada e não apenas pedida no prompt.

## Ingestão

Ver `docs/ingestao.md`. Pipeline único, adaptador por fonte, rastreabilidade até a página.

## Frontend

SPA, TanStack Query para estado de servidor, tipos vindos de `packages/shared`. Alvo de
desempenho: computador de escola, que é fraco, com o Chromebook de entrada como referência,
e celular em rede móvel. Toda tela é responsiva desde a primeira versão (D51). Lista longa
virtualizada, bundle enxuto, nada que assuma máquina boa.

## Observabilidade sem exposição

Log estruturado com `escolaId` e `usuarioId`. **Nunca nome, resposta, nota ou conversa.**
Métrica de custo de IA por escola, por perfil e por aluno. Alerta de falha em série de
agente. Auditoria de leitura de dado de aluno, exportação, alteração de nota e de permissão.
