# Arquitetura

## Princípios

1. **Portabilidade.** Hospedagem e provedor de modelo em aberto; rede pública pode exigir
   dado no Brasil. Tudo em container, nada proprietário no caminho crítico.
2. **Isolamento por escola acima de tudo.** É a decisão que não pode ser retrabalhada.
3. **Web-first para Chromebook.** Sem app, sem dependência de celular (Lei 15.100/2025).
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

## Autenticação e identidade

- **Coordenador, professor, responsável:** e-mail + senha. Segundo fator para coordenador.
- **Aluno:** escola + matrícula + senha. Sem e-mail, sem telefone.
- **Entrada no sistema:** coordenador cria séries e turmas e sobe a lista de nomes →
  professor entra por link de convite e escolhe disciplina → aluno entra pelo link da sala,
  reivindica o próprio nome e **o professor aprova**. Só depois da aprovação o aluno define
  senha e existe de verdade.
- Convite é token único, com validade curta, uso único e revogável.

## Assíncrono

Nada demorado em request. Filas: `ingestao`, `agentes`, `correcao`, `notificacao`,
`expurgo`, `exportacao-titular`, com três prioridades (interativa, normal, lote) e limite de
concorrência por escola. Lote não urgente roda fora do horário letivo.

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

**Orçamento de tokens** por aluno e por escola é obrigatório, com corte suave e aviso ao
coordenador antes do limite. O tutor gasta muito mais que geração de prova — a margem do
R$ 30/aluno depende de medir isso desde a primeira chamada.

Guardrails: escopo de assunto por turma aplicado no servidor, detecção de pedido de
resposta pronta, filtro de conteúdo, recusa testada e não apenas pedida no prompt.

## Ingestão

Ver `docs/ingestao.md`. Pipeline único, adaptador por fonte, rastreabilidade até a página.

## Frontend

SPA, TanStack Query para estado de servidor, tipos vindos de `packages/shared`. Alvo de
desempenho: Chromebook de escola, que é fraco. Lista longa virtualizada, bundle enxuto,
nada que assuma máquina boa.

## Observabilidade sem exposição

Log estruturado com `escolaId` e `usuarioId`. **Nunca nome, resposta, nota ou conversa.**
Métrica de custo de IA por escola, por perfil e por aluno. Alerta de falha em série de
agente. Auditoria de leitura de dado de aluno, exportação, alteração de nota e de permissão.
