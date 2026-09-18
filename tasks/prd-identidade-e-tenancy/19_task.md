# Tarefa 19.0 — Telas de entrada da escola, do MFA e do convite

**Funcionalidade:** identidade-e-tenancy · **Depende de:** 18.0, 6.0, 7.0, 11.0, 13.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`, `test-engineer`

## Objetivo

O aluno entra pelo endereço da escola, com matrícula ou com a conta Google ou Microsoft
dela. O coordenador configura e usa o segundo fator sem celular. O primeiro coordenador
aceita o convite sem que o token fique na URL. Tudo funciona no Chromebook e no celular.

## Contexto necessário

- `docs/visao-produto.md` (sempre), seção 4 (Enzo e Lara, com 11 a 17 anos, no computador da escola)
- `prd.md`:
  - RF7: matrícula no endereço da escola;
  - RF8 a RF10: conta da escola;
  - RF11: conta segurada;
  - RF12: MFA sem celular;
  - RF20: telas;
  - casos de borda "Admin da escola não liberou o app" e "Escola revoga o app".
- `techspec.md`:
  - seção 4 (`/v1/escolas/:slug/acesso`, `/v1/sessao/matricula`, `/externa/:provedor/iniciar`, `/v1/sessao/mfa`, `/v1/conta/mfa/configurar` e `/ativar`, `/v1/convites/consultar` e `/aceitar`);
  - seção 5, "Externo" (`?falha=provedor`), "TOTP", "Tentativas" (5 erros consomem o desafio) e "Convite" (conta nova e conta existente, que leva à etapa `entrar`);
  - seção 9;
  - seção 12 (retorno do Google e da Microsoft não verificado: todo `error` vira a mesma mensagem, e a tela avisa antes do botão).
- `.claude/rules/50-frontend.md`:
  - item 2: nada exige telefone, porque a Lei 15.100 tirou o celular da sala. O segredo precisa aparecer em texto para KeePassXC ou Bitwarden desktop.
  - item 2a: `inputmode` e `autocomplete` certos.
  - item 7: token fora da URL.
  - item 11: rótulo e foco.
  - item 12: erro diz o que fazer.
- `.claude/rules/20-lgpd-menores.md`, itens 2 e 8. Do aluno não aparece e-mail nem foto do provedor. O convite é token de uso único e não pode ir para o histórico do navegador.
- `docs/interface.md`, seção 2 (área do aluno e linguagem para 11 anos) e seção 3 (MFA obrigatório da coordenação).
- Código existente: `apps/web/src/paginas/Casca.tsx` e `componentes/estado/*` (quatro estados), `e2e/__fixtures__/verificacoes.ts` e `perfis.ts`.
- Criado nas tarefas anteriores do F1:
  - `wouter`, `api/sessao.ts`, `/entrar`, cabeçalho e fixtures de sessão no e2e (18.0);
  - rotas de MFA (6.0);
  - convite e `ops:convite-coordenador` (7.0);
  - matrícula e `/acesso` (11.0);
  - `oidc-falso` no compose e na esteira, com o cookie `educa_oidc` (13.0).

## Subtarefas

- [ ] 19.1 — `/e/:slug`.
  - **Topo:** o nome da escola, vindo de `GET /v1/escolas/:slug/acesso`. Slug inexistente mostra "endereço não encontrado, confira com o professor", sem listar escolas.
  - **Formulário de matrícula:** `inputmode="numeric"`, `autocomplete="username"`, senha com `current-password`.
  - **Botões da conta da escola:** um por provedor devolvido, cada um com o aviso fixo de que a TI da escola precisa liberar o app para alunos.
  - **Retorno com `?falha=provedor`:** a mesma mensagem para qualquer `error`, com a matrícula como alternativa. O parâmetro sai da barra com `history.replaceState`.
  - **`CONTA_EXTERNA_NAO_LIGADA`:** orienta a entrar com a matrícula ou procurar o professor.
- [ ] 19.2 — MFA.
  - **`/mfa`:** código de 6 dígitos (`inputmode="numeric"`, `autocomplete="one-time-code"`), com o link "usar código de recuperação". Depois de 5 erros, o desafio é consumido e a tela leva de volta à entrada com a explicação.
  - **`/mfa/configurar`:** QR e segredo em texto, com botão copiar e a indicação de apps de computador. Ao ativar, mostra os 10 códigos de recuperação uma vez só, com botão copiar e o aviso de guardar.
  - **Cache:** respostas com `no-store` nunca vão para o cache do TanStack Query. Segredo e códigos ficam só no estado do componente e somem ao sair da tela.
- [ ] 19.3 — `/convite#token`.
  - **Leitura:** o token vem do fragmento e sai da barra com `history.replaceState` antes de qualquer chamada.
  - **Consulta:** `POST /v1/convites/consultar` mostra o nome da escola. Expirado, revogado ou inexistente têm a mesma mensagem ("peça um convite novo").
  - **Conta nova:** define a senha e segue para `/mfa/configurar`.
  - **Conta existente:** a etapa `entrar` leva a `/entrar`, com a explicação "você já tem acesso em outra escola, entre com a sua senha".
    - **Bilhete (7.0):** a resposta traz `bilhete` (30 min). A web o guarda só em memória e o manda no corpo do `POST /v1/sessao/email` (`bilhete`), nunca na URL nem em armazenamento do navegador. Sem ele, o login não ativa a escola do convite.
    - **Senha:** a tela não pede nem manda senha nova para quem cai em `entrar`. O aceite com senha curta responde `ENTRADA_INVALIDA` mesmo nesse caminho; a senha nova (mínimo 12) só é pedida depois de a API responder que a conta é nova. Por isso, a tela chama `aceitar` primeiro sem senha: conta nova responde `ENTRADA_INVALIDA` sem gastar o convite, e aí a tela pede a senha.
    - **Passou dos 30 min:** o convite já foi usado e o usuário continua inativo; a mensagem pede um convite novo à escola (o operador gera outro).
- [ ] 19.4 — Testes.

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/paginas/EntrarNaEscola.tsx` | novo |
| `apps/web/src/paginas/Mfa.tsx`, `apps/web/src/paginas/ConfigurarMfa.tsx` | novo |
| `apps/web/src/paginas/Convite.tsx` | novo |
| `apps/web/src/rotas.tsx`, `apps/web/src/api/sessao.ts` | alterado |
| `packages/shared/src/erros/mensagens.ts` (`CONTA_EXTERNA_NAO_LIGADA`, `MFA_NECESSARIO`) | alterado |
| `e2e/entrar-na-escola.spec.ts`, `e2e/mfa.spec.ts`, `e2e/convite.spec.ts` | novo |
| `e2e/__fixtures__/sessao.ts` (aluno pela matrícula, conta ligada no `oidc-falso`, convite) | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: aluno entra em `/e/:slug` com matrícula e senha só por teclado e só por toque, nos projetos `chromebook` e `celular`, com teclado numérico na matrícula | e2e | RF7 e RF20 |
| isolamento: a matrícula 1234 da escola A, com a senha de A, no endereço da escola B é recusada com a mensagem genérica, e na A entra | e2e | a tela não contorna a escola do endereço |
| conta da escola: aluno ligado entra pelo `oidc-falso`; aluno sem ligação vê a orientação de usar a matrícula; `error` do provedor volta com a mesma mensagem, e `?falha` some da barra | e2e | RF8 a RF10 e a premissa ⚠️ da seção 12 tratada na tela |
| privacidade: depois do login pela conta da escola, nenhuma tela nem o DOM mostram e-mail, nome ou foto vindos do provedor | e2e | regra 20, item 2 |
| MFA: coordenador configura copiando o segredo em texto (sem QR), ativa, vê os códigos uma vez, sai, entra com o código e depois com um código de recuperação; o mesmo código de recuperação não passa de novo | e2e | RF12 sem celular |
| borda: 5 códigos errados levam de volta à entrada com explicação, e o sexto, mesmo certo, não entra sem refazer a senha | e2e | o desafio consumido da 6.0 aparece na tela |
| convite: o token some da barra antes da primeira chamada; o aceite leva a `/mfa/configurar`; convite expirado mostra "peça um convite novo"; e-mail que já coordena outra escola vai para `/entrar` sem campo de senha nova | e2e | regra 20, item 8, e a regra da conta existente da Tech Spec |
| borda: `CONTA_SEGURADA` em `/e/:slug` mostra em português quanto esperar, e os outros alunos do mesmo computador seguem entrando | e2e | RF11 na tela |
| acessibilidade e layout: 360 px sem rolagem horizontal, axe sem violação séria, rótulo em todo campo e alvo de 44 px nos botões | e2e | regra 50, itens 2a e 11 |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [ ] Todos os revisores obrigatórios com rodada na seção "Revisões", iniciada depois da
  última alteração de código, e APROVADO nos que têm veto
- [ ] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

- Sessão em memória, renovação, `/entrar` e "Sair": 18.0.
- Escolher e trocar escola, `/vinculos` e timer de inatividade: 20.0.
- Tela do coordenador para cadastrar domínio Google ou tenant Microsoft, e para configurar a inatividade: F2. No F1 é só API (13.0 e 5.0).
- Checklist da TI da escola para liberar o app: pergunta em aberto do PRD, fora do F1.
- Passkey: depois do F1.

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->
