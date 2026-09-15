# Educa.ia — contexto e decisões

> **Antes deste arquivo, leia `docs/visao-produto.md`.** Ele explica o que estamos
> construindo e para quem. Este aqui registra o que já foi decidido e por quê, para não
> rediscutirmos a mesma coisa toda semana.
>
> Nome provisório. Verificar INPI e domínio antes de fixar: já existem "IA Educa Brasil"
> e "Eduka.ai" no mercado. Repositório: https://github.com/LitzGab/Educa.ia

---

## Em uma frase

Um assistente com agentes de IA supervisionados para a escola: o professor tem chat e
ferramentas que produzem a partir do material que a escola pode usar, o aluno usa IA em
sala com o professor vendo, a coordenação organiza a escola e acompanha o uso de IA e o
desempenho de alunos e professores, e a família acompanha. A IA prepara o trabalho e avisa;
a escola aprova (D44).

## O recorte

**Anos finais do Ensino Fundamental (6º ao 9º) e Ensino Médio**, em **escolas particulares
e redes públicas**, começando por Joinville (D43, D20). Em sala, o aluno usa **qualquer
computador da escola** (Chromebook, notebook, laboratório). **Web-first e responsivo**: a
Lei 15.100/2025 tirou o aparelho pessoal da sala, então nada no produto pode depender do
telefone do aluno; mas toda tela funciona também no celular, para o aluno fora da escola e
para professor e coordenação em qualquer lugar (D51).

## Quem constrói

**Joaquim** implementa, com o Claude executando as tarefas do processo SDD e o Joaquim
revisando. **Gabriel** cuida de marca, landing page, benchmark e comercial. Mercado, preço
e concorrência estão em `docs/negocio.md`.

## Quem é quem

| Papel | Usa | Paga | O que precisa |
|---|---|---|---|
| Coordenação | sim | decide a compra | governança de IA e de ensino, alertas, auditoria |
| Professor | sim | não | tempo, e confiança de que nada entra no boletim sem ele |
| Aluno | sim | não | uma IA que ensina em vez de entregar a resposta |
| Família | fase posterior | sim, via mensalidade | nota, entrega, alerta |
| Prefeitura | não diretamente | contrato | governança de rede e resposta pronta sobre LGPD |

A regra que orienta as prioridades: **professor e aluno precisam gostar e usar; coordenação
e família precisam confiar.** Se o professor não gostar, a escola não renova. Se a família
não confiar, a escola não compra.

---

## Decisões tomadas

O texto completo de cada decisão, com o motivo e as revisões, está em `docs/decisoes.md`.
**Leia a decisão lá antes de citá-la, de discuti-la de novo ou de implementar algo que dependa
dela.** Aqui fica uma linha por decisão, para saber que ela existe e onde procurar.

| D | Decisão |
|---|---|
| D1 | Sistema inteiro como alvo; escola piloto gratuita no 1º semestre de 2027 com o que estiver pronto, com o portão de LGPD e infra antes dela |
| D2 | O cliente é a instituição: sem cadastro público, sem plano avulso de professor |
| D3 | Onboarding por convite: a coordenação importa turmas, nomes, grade e calendário e aloca o professor, que só confirma o vínculo |
| D4 | A identidade do aluno passa por aprovação humana (reivindicação de nome) |
| D5 | Pipeline único de ingestão, só com material cuja licença permite o uso; apostila de terceiro sem licença não entra |
| D6 | Indexação por série, disciplina, capítulo e habilidade da BNCC, com rastreio até a página |
| D7 | Nota nunca é publicada sem aprovação humana |
| D8 | O tutor é sempre visível ao professor: sala ao vivo, casa com registro e resumo |
| D9 | Todo agente tem nível de autonomia declarado e visível à coordenação |
| D10 | A escola é controladora dos dados; nós somos operadores |
| D11 | WhatsApp e portal da família depois; o motor de eventos entra agora |
| D12 | Backend e frontend separados, multi-tenant por escola, tudo em container, sem trava de fornecedor |
| D13 | IA por porta e adaptador, com Ollama local no desenvolvimento |
| D14 | Orçamento de tokens por aluno e por escola é requisito, medido desde a primeira chamada |
| D15 | Construção do zero, sem reaproveitar produto anterior |
| D16 | A stack está ratificada (seção "Stack") |
| D17 | Agentes têm nome de função, não nome próprio |
| D18 | Chat e ferramentas são o mesmo motor; o chat pergunta antes de abrir a ferramenta como cartão |
| D19 | Tutor fora da sala é configuração da escola por turma, desligada por padrão |
| D20 | Escola particular e rede pública são alvo juntas desde o início |
| D21 | O banco público de questões vem das provas oficiais do ENEM e entra no F7 |
| D22 | A ingestão começa pelo upload de PDF licenciado; adaptador de scraper só com escola real e licença |
| D23 | Commit direto no `main`, um commit por tarefa; o portão de qualidade fica no processo (revista pela D53) |
| D24 | Na primeira semana a coordenação vê quatro coisas: escola cadastrada sem trabalho manual, governança de IA, prova e plano com página citada, tutor em sala com sinais |
| D25 | Infra do primeiro ano para até dez escolas; API, realtime e worker separados e sem estado |
| D26 | Banco, Redis e storage são serviços gerenciados |
| D27 | 99,5% de disponibilidade no horário letivo, prova resiliente, deploy só fora do horário |
| D28 | Hospedagem em região Brasil |
| D29 | Modelo em produção por API com contrato e reserva; no pico, fila curta e depois modelo menor |
| D30 | Infra custa até R$ 2 por aluno por mês, sem contar IA |
| D31 | Três ambientes; F0 e validação inicial 100% locais; staging antes da primeira demonstração externa ou do piloto |
| D32 | Sete agentes: Rotina, Corretor, Planejador, Monitor de turma, Tutor, Adaptador e Analista; Mensageiro da família depois |
| D33 | Nota de objetiva aprovada em lote, com os casos fora da curva abertos antes |
| D34 | Aluno em risco nomeado só ao professor da turma; coordenação vê agregado, nominal com auditoria |
| D35 | A coordenação registra a adaptação necessária, nunca o diagnóstico |
| D36 | Assunto pessoal delicado no tutor vai para um humano, com CVV em risco à vida; o professor recebe o sinal sem o conteúdo |
| D37 | O provedor de modelo sai de avaliação com amostras sintéticas (finalistas Maritaca e Google) |
| D38 | Tutor com pacote mensal por turma (300 trocas por aluno) e freio de 60 trocas por dia por aluno |
| D39 | IA custa até R$ 5 por aluno por mês no pacote completo da escola particular |
| D40 | A escola paga por aluno com uso normal incluso; não há crédito visível |
| D41 | Na rede pública, pacote de rede com piso em torno de R$ 10; orçamento de IA é configuração por rede |
| D42 | O provedor de hospedagem é escolhido quando o staging for criado, por critério fixo |
| D43 | Recorte: 6º ao 9º ano e Ensino Médio, em qualquer computador da escola |
| D44 | O produto se apresenta como assistente com agentes supervisionados |
| D45 | O professor é medido em espelho: vê o próprio dado; coordenação vê agregado; sem ranking nem decisão sobre ele |
| D46 | Primeiro o diagnóstico formativo, depois a nota oficial; sem nota proposta em discursiva e redação |
| D47 | O tutor é supervisionado, não aprovado resposta por resposta |
| D48 | Login pela conta Google ou Microsoft da escola quando existe, matrícula quando não; só o identificador opaco |
| D49 | Fila de jobs mantida, com entrega pelo menos uma vez e idempotência obrigatória |
| D50 | Preço por aluno com faixas de pacote: base e completo com tutor |
| D51 | Toda tela nasce responsiva e usável no celular, sem que nenhum fluxo dependa dele |
| D52 | Testes de integração da infra fora do portão de toda tarefa, na esteira |
| D53 | Processo enxugado onde repetia trabalho: `test-engineer` primeiro, caducidade pelo que o revisor audita, portão com carimbo, `revisor-geral`, `/revisar-spec`, `/corrigir` e `/retro` |

---

## Conflitos já resolvidos

Registrados porque cada um deles já voltou uma vez.

**Login do aluno.** A reivindicação de nome é o *cadastro*. O *login* recorrente é escola +
matrícula + senha, definida pelo aluno no momento da reivindicação. Aluno não tem e-mail no
sistema. Onde a escola tem conta Google ou Microsoft, o login e a importação vêm dela, e
guardamos só o identificador da conta, nunca o e-mail (D48).

**Notificação à família.** O motor de eventos entra agora; a interface do responsável e o
WhatsApp ficam para depois.

**Importação por planilha.** Sobrevive, reduzida: a coordenação sobe lista de nomes por
turma, grade horária e calendário, não cadastro completo de pessoa (D3 revista). Professor
e aluno entram por link.

**Scraper de material.** Permitido, com cinco condições: licença ou parceria com o dono do
conteúdo, autorização escrita da escola registrada no sistema, credencial fornecida pela
escola, conteúdo preso ao tenant dela, e nada que contorne pagamento ou bloqueio técnico de
terceiro. Fonte que proíbe sai, e **o upload não cobre o caso**: apostila de terceiro sem
licença não entra por nenhum caminho (D5 revista). O primeiro caminho implementado é o
upload de material com licença (D22).

**Correção de discursiva e redação.** A IA não propõe nota nelas enquanto o texto final do
CNE não for publicado e lido; entrega só devolutiva (D46).

**Tutor e aprovação prévia.** O tutor é supervisionado, não aprovado resposta por resposta.
A regra 70, item 3, declara essa exceção (D47).

**Fila de jobs.** A auditoria de 13/09/2026 propôs trocar por fila só no Postgres. Ficou
como está, com entrega pelo menos uma vez e idempotência obrigatória (D49).

**Processo de construção.** A mesma auditoria propôs teto de tamanho por tarefa, assinatura
humana no portão e revisor de simplicidade. Os vetos e o portão de qualidade no processo
ficaram (D23). Em 15/09/2026 o processo foi enxugado onde repetia trabalho, sem tirar revisão:
`test-engineer` primeiro, caducidade pelo que o revisor audita, portão local com carimbo,
`revisor-geral` no lugar da autorrevisão, `/revisar-spec`, `/corrigir` e `/retro` (D53).

**Nome dos agentes.** O desenho da call tinha nomes próprios; os docs usam função. Fica a
função (D17).

**Escola particular ou rede pública.** As duas, como alvo juntas desde o início, com a rede
em pacote com piso de preço (D20 e D41 revistas).

**Chromebook.** Deixou de ser filtro de mercado: vale qualquer computador da escola. Continua
como referência de máquina fraca para desempenho (D43, regra 50).

**Celular.** O produto não depende do celular em nenhum fluxo, mas toda tela funciona nele
(D51). "Sem dependência de celular" e "responsivo para celular" não se contradizem: o
primeiro é sobre o que o fluxo exige, o segundo sobre onde a tela funciona.

---

## Decisões em aberto

Use `/descobrir <tema>` para fechar uma, e `/registrar-decisao` para escrevê-la.

Todas têm dono e momento. Nenhuma trava o F0.

| Decisão | Dono | Quando fecha |
|---|---|---|
| Provedor de modelo principal e reserva | Joaquim | avaliação de `docs/avaliacao-de-modelos.md`, antes de a F5 ficar pronta (D37) |
| Provedor de hospedagem | Joaquim | quando o staging for criado, antes da primeira demonstração externa ou do piloto (D42) |
| Identidade visual (paleta, tipografia, logo) | Gabriel | **antes do PRD do F2**, a primeira tela real |
| Nome, INPI e domínio | Gabriel | antes do material de venda e do piloto |
| Sistemas de ensino das escolas-alvo, licença do material e primeiro adaptador | quem conduzir o piloto | nas entrevistas com escolas; até lá só upload de material com licença (D5, D22) |
| Quais funcionalidades formam a fatia do piloto, e quais das quatro coisas da D24 ele precisa ter | Joaquim e Gabriel | antes do PRD da primeira funcionalidade depois do F1 (D1 revista) |
| Valores das faixas de preço e teto de IA do pacote base | Gabriel e Joaquim | com a planilha de custo por pacote, validados no piloto (D50, D39) |
| Indicadores de desempenho do professor e do aluno (quais, limiar, texto do alerta) | Joaquim e Gabriel | antes do PRD do F12 (D45, D46) |
| Texto final das diretrizes do CNE e o que muda na correção e nos sinais do tutor | Joaquim, com advogado | quando a resolução for publicada pelo MEC (D46) |

---

## Stack

**Backend** NestJS + TypeScript, Postgres, Drizzle, BullMQ + Redis, JWT próprio, storage
S3-compatível. **Frontend** React + Vite + TypeScript, TanStack Query, Tailwind, web-first
e responsivo, do computador fraco de escola (Chromebook como referência) ao celular (D51). **Tempo real** WebSocket para o modo sala. **IA** interface `LLMProvider`
com adaptadores Ollama e OpenAI-compatível. **Testes** Vitest e Playwright. **Infra**
Docker Compose.

O critério que guiou tudo isso: nada pode impedir que o sistema inteiro suba em um servidor
no Brasil, se um contrato exigir.

---

## As seis regras que não se negociam

1. **Vazamento entre escolas encerra a empresa.** Escopo de tenant no repository, sempre.
   Regra 10.
2. **Dado de menor é o ativo mais perigoso do sistema.** Leia `docs/lgpd.md` antes de tocar
   em qualquer campo de pessoa. Regra 20.
3. **Nada que a IA produz vira nota, mensagem à família ou decisão sobre aluno sem aprovação
   humana registrada.** É lei. Regra 70.
4. **Nenhum módulo chama provedor de IA direto.** Sempre pela porta, sempre com perfil e
   orçamento. Regra 30.
5. **Teste prova regra de negócio.** "Retornou 200" não é teste. Regra 40.
6. **O horário de aula é sagrado.** Dimensione para a manhã de segunda, limite por usuário
   e por escola (nunca só por IP), e nenhuma resposta de prova se perde. Regra 80.

---

## Mapa dos documentos

**Para entender o produto:** `docs/visao-produto.md`, `docs/fluxos.md`, `docs/glossario.md`
**Para entender a interface:** `docs/interface.md`
**Para entender o negócio:** `docs/negocio.md` (mercado, preço, concorrência). Não é leitura
obrigatória para implementar
**Para não quebrar a lei:** `docs/lgpd.md`, `docs/regulacao.md`
**Para construir:** `docs/arquitetura.md`, `docs/modelo-de-dados.md`, `docs/agentes.md`,
`docs/ingestao.md`
**Para não cair no horário de aula:** `docs/infra.md`, `docs/runbook.md`
**Para escolher modelo e medir custo de IA:** `docs/avaliacao-de-modelos.md`
**Para saber o que já foi decidido, por extenso:** `docs/decisoes.md`
**Para trabalhar:** `README.md`, `ROADMAP.md`, `TODO.md`, `.claude/rules/`, `.claude/skills/`

As regras 30 (IA) e 50 (frontend) carregam sozinhas só quando se lê arquivo do caminho delas
(`paths:` no topo de cada uma). Quem escreve PRD, Tech Spec ou tarefa que envolve IA ou tela lê
a regra explicitamente.

---

## Skills

**Do processo** (nossas, em `.claude/skills/`), na ordem em que entram: `/status`,
`/descobrir`, `/registrar-decisao`, `/criar-prd`, `/criar-techspec`, `/revisar-spec`,
`/criar-tasks`, `/executar-tasks`, `/executar-task`, `/executar-review`, `/corrigir`, `/validar`,
`/retro`.

**Revisores** (em `.claude/agents/`): em toda tarefa, `test-engineer` primeiro e depois
`revisor-geral` com os guardiões marcados, em paralelo. O hook `tools/processo/revisoes.ts`
registra as rodadas, guarda o que foi exigido em `achados-revisoes.md` e bloqueia o commit sem
revisão válida, sem portão local carimbado (`node tools/processo/portao-local.ts`), ou que leve
código sem `(tarefa N.0)` nem `(correção <slug>)` (D53).

**Técnicas** (de terceiros, instaladas via skills.sh, versões em `skills-lock.json`):
`nestjs-best-practices`, `drizzle-orm-patterns`, `supabase-postgres-best-practices`,
`bullmq-specialist`, `vercel-react-best-practices`, `tanstack-query-best-practices`,
`tailwind-design-system`, `frontend-design`, `accessibility`, `vitest`,
`playwright-best-practices`, `lgpd-brasil`. Atualizar com `npx skills update -p`, e ler o
diff antes de commitar: skill vira instrução para o Claude.

<critical>As skills de terceiros são referência técnica genérica. Quando conflitam com
`.claude/rules/` ou com uma decisão (`docs/decisoes.md`), a regra e a decisão vencem. Os conflitos
já conhecidos:</critical>

- **Escopo de tenant.** `supabase-postgres-best-practices` recomenda RLS. Aqui o escopo é
  aplicado no repository, a partir do token (regra 10). RLS pode entrar como segunda camada
  de defesa, nunca no lugar do repository
- **React.** `vercel-react-best-practices` é escrita para Next.js. Somos SPA com Vite: ignore
  Server Components, Server Actions e tudo que depende de servidor Next. As regras de bundle,
  re-render e carregamento valem, e valem ainda mais no Chromebook fraco (regra 50)
- **Visual.** `frontend-design` pede ousadia estética. Aqui o limite é Chromebook fraco,
  acessibilidade e a professora com quarenta minutos de intervalo (regra 50). Fonte pesada,
  animação e efeito que custam CPU ficam de fora. A identidade visual ainda está em aberto
- **Playwright.** Viewport de celular, toque e rede móvel **se aplicam** (D51): toda tela
  roda nos projetos `chromebook` e `celular`. Geolocalização, permissões de aparelho, PWA
  instalável e app nativo não se aplicam (regra 50, item 2)
- **LGPD.** `lgpd-brasil` resume a lei. O que vale para o código é `docs/lgpd.md` e a regra
  20, que são mais restritivos (aluno sem e-mail, sem CPF, sem foto)
- **NestJS.** A organização em controller, service, repository e DTO de `docs/arquitetura.md`
  prevalece sobre qualquer outra estrutura sugerida
