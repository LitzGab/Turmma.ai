# Achados das revisões — `tasks/correcoes/2026-10-26-areas-entrar-estoura-o-prazo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-26 11:43:03 · `tasks/correcoes/2026-10-26-areas-entrar-estoura-o-prazo.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A mudança mexe só no harness de um caso do e2e: a primeira navegação do caso passa por `carregarSemRedeLenta` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/areas.spec.ts:625`. O produto, o schema, os DTOs e a API ficam como estavam.

Fora da tabela de dados do docs/lgpd.md: nada, porque não há campo novo.

Autorização por objeto: ok. Nenhuma rota, repository ou DTO mudou. O caso continua cobrindo a troca de escola pelo seletor com usuários de duas escolas e as mesmas asserções de antes.

Logs: limpos. O comentário novo em `e2e/areas.spec.ts:622-624` cita só o número da execução da esteira e os pedidos de rede, sem dado de pessoa. A tarefa também não acrescenta log.

Auditoria: não se aplica. A mudança não lê dado de aluno por coordenação ou rede, não exporta nada e não altera nota, permissão nem saída de IA.

Envio externo: nenhum. O que o `carregarSemRedeLenta` (`e2e/__fixtures__/perfis.ts:93-102`) faz é ligar e desligar a limitação de rede do navegador do teste pelo CDP. Nada sai para provedor de IA nem para terceiro.

Seed/fixture: sintético. Os nomes e e-mails vêm de `criarEquipeComSenha` e `criarUsuarioEmOutraEscola` (`e2e/__fixtures__/sessao.ts:94-95`), no formato "Professora sintética <marca>" e `<papel>-<marca>@educa.invalid`. São usuários da equipe da escola, não alunos, e o domínio `.invalid` não recebe e-mail. O texto da tarefa em `tasks/correcoes/2026-10-26-areas-entrar-estoura-o-prazo.md` traz só identificadores da esteira e nomes de arquivo, sem dado real.

Pergunta de fechamento: a mudança não altera o que o sistema guarda sobre um aluno nem para onde envia, então a resposta continua igual à da rodada 4 aprovada.

Bloqueantes: nenhum.

Recomendações:
- `e2e/areas.spec.ts:627` perdeu o espaço depois do `=` (`const escolherA =page.getByRole(...)`). Não afeta dado pessoal, mas é diferença de formatação que o lint ou o `revisor-geral` pode apontar, e vale corrigir antes do commit.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-26 11:43:04 · `tasks/correcoes/2026-10-26-areas-entrar-estoura-o-prazo.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. A mudança fica toda num caso e2e que não grava nem lê `Nota` — todos com autor humano? sim (nenhum caminho novo)
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. A tarefa não cria nem muda nenhuma saída de IA que chegue ao aluno.
Supervisão do tutor: ok. O tutor não é tocado.
Autonomia declarada e visível: sim. Nada muda em governança nem na declaração de autonomia dos agentes.

O diff mexe só no teste `e2e/areas.spec.ts`, no caso "troca de escola pelo seletor".
- A primeira carga do caso, `page.goto('/entrar')`, passa a rodar dentro de `carregarSemRedeLenta`, um auxiliar que já existe em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/__fixtures__/perfis.ts:93`. Ele tira a rede lenta durante o `goto` e devolve a rede do perfil logo depois, no `finally`.
- O produto não muda e o caso afirma as mesmas coisas.
- Nada toca nota, correção, devolutiva de discursiva ou redação (D46/D55), o tutor, a autonomia dos agentes, a auditoria, indicador de professor (D45), nem supervisão e vigilância (item 7).

Também não há tela a conferir, porque a tarefa não muda nada do que a pessoa vê.

Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/areas.spec.ts:627` perdeu um espaço por engano: `const escolherA =page.getByRole(...)`. Isso não é da regra 70; é para o `revisor-geral` ou o formatador acertarem antes do commit.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-26 11:43:06 · `tasks/correcoes/2026-10-26-areas-entrar-estoura-o-prazo.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok (a tarefa não mexe nisso; muda só o teste e2e)
Fila e prioridade: ok (não mexe nisso)
Concorrência: protegida (não há operação nova que possa ser disparada duas vezes)
Índice e paginação: ok (não há query nova)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não há código novo no caminho quente nem alerta novo)
Bloqueantes: nenhum

O diff de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/areas.spec.ts` toca uma única chamada. Só o `page.goto('/entrar')` do caso passa por `carregarSemRedeLenta`. A entrada por e-mail, a troca pelo seletor e as asserções da gaveta continuam na rede do perfil. A CPU continua limitada. O auxiliar (`e2e/__fixtures__/perfis.ts:93-102`) devolve a rede do perfil no `finally`, então o resto do caso não fica sem limitação. O `npx eslint e2e/areas.spec.ts --max-warnings=0` passou.

Recomendações:
- `e2e/areas.spec.ts:627`: a linha da variável `escolherA` perdeu o espaço depois do `=` (`const escolherA =page.getByRole(...)`). É uma mudança acidental, fora do objetivo da correção. O lint não pega, porque o repositório não tem formatador. Vale devolver o espaço antes do commit.
- O registro da correção já leva para a `/retro` a recomendação de tentar de novo a primeira navegação no fixture, se a trava voltar uma terceira vez. Concordo. Os outros 104 `page.goto('/entrar')` continuam expostos à mesma trava, e um `carregarSemRedeLenta` por caso não escala.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-26 11:43:09 · `tasks/correcoes/2026-10-26-areas-entrar-estoura-o-prazo.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A correção mexe só em teste, não toca produto nem contrato, e não diverge de nada que precise entrar na `techspec.md` ou no `cenarios.md`.
Portão local: carimbo válido. Ele cobre typecheck, lint, segredo, dependências, unidade e alvo.
Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/areas.spec.ts:627`: o diff mudou uma linha que a correção não descreve e tirou um espaço por engano: `const escolherA =page.getByRole(...)`. O lint não pega porque o projeto não tem formatador. Volte para `const escolherA = page.getByRole(...)` antes do commit, para o diff ficar só com o que a correção declara.
- A troca de `page.goto('/entrar')` por `carregarSemRedeLenta(page, () => page.goto('/entrar'))` segue o padrão que já existe em `e2e/acesso-suspenso.spec.ts:208`. A entrada por e-mail e a troca de escola continuam na rede do perfil, então a cobertura do caso não muda.
- A correção registra que não houve vermelho determinístico e que não houve mutação. Os dois têm justificativa, e o documento diz com honestidade o que a correção não prova. Mantenha na `/retro` a recomendação de que, se a trava aparecer pela terceira vez, a investigação sobe para o harness (`e2e/__fixtures__/perfis.ts`) em vez de ganhar mais um `carregarSemRedeLenta` caso a caso.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/correcoes/2026-10-26-areas-entrar-estoura-o-prazo.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/areas.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/__fixtures__/perfis.ts`, para conferir como `carregarSemRedeLenta` funciona.

## test-engineer · 1ª rodada · APROVADO · 2026-10-26 11:43:12 · `tasks/correcoes/2026-10-26-areas-entrar-estoura-o-prazo.md`

VEREDITO: APROVADO

Cenários exigidos: a correção muda só um teste e nenhuma regra, então a pergunta é se o caso continua provando o que provava. O caso "troca de escola pelo seletor, de 'Início' para 'Início': a gaveta não fica aberta por cima" (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/areas.spec.ts:619`) precisa ainda:
- entrar na escola A e trocar para a escola B pelo seletor;
- afirmar que a gaveta fica fechada depois da troca, que o endereço continua `/professor/nova-conversa` e que o "Sair" aparece;
- rodar esses passos na rede e na CPU do perfil, nos projetos `celular` e `chromebook` (regra 50.1).

Cobertos:
- Só a primeira carga de `/entrar` (linha 625) sai da rede do perfil, por `carregarSemRedeLenta`. É o auxiliar que já existia em `e2e/__fixtures__/perfis.ts:93`. Ele tira a limitação de rede só durante o `goto` e a devolve num `finally`, e a CPU não muda.
- A entrada por e-mail, a troca e as asserções (linhas 626 a 638) seguem sem mudança e na rede do perfil.
- O caso nunca afirmou nada sobre o tempo de baixar `/entrar`, então nenhuma asserção ficou mais fraca. Se o produto deixar a gaveta aberta na troca, o caso continua vermelho como antes.
- A seção "Mutações" com "Nenhuma" está certa: nada mudou em `apps/*/src` nem em `packages/*/src`, e o `git diff` não traz código novo com condição. O RF17 não se aplica.
- Não há `.skip`, teste comentado, mock nem chamada a provedor de IA.
- O documento admite o que a correção não prova, já que a trava não se reproduziu. Também deixa registrado o que fazer se ela aparecer uma terceira vez: levar o problema para o harness, em vez de pôr mais um `carregarSemRedeLenta` em cada caso.
- As durações medidas depois da correção (10,8 a 11,0 s no `celular`, 10,1 s no `chromebook`) ficam abaixo de metade do prazo de 30 s, o limite do `duracao-do-e2e`. Nesta rodada não rodei o e2e. Rodei só o `eslint` no arquivo, que passou sem aviso.

Bloqueantes: nenhum.

Recomendações:
- `e2e/areas.spec.ts:627`: o diff traz uma mudança que a correção não pediu e que o documento não descreve. O espaço depois do `=` sumiu: `const escolherA =page.getByRole(...)`. O lint não reclama, mas é ruído no diff. Volte a escrever `const escolherA = page.getByRole(...)`.
- O comentário das linhas 622 a 624 diz "travou uma vez na esteira", e o documento fala em duas ocorrências em nove dias (esta e a de 17/10, em outro caso). O comentário fala só deste caso, o que é defensável, mas dá para citar também a correção `2026-10-17-casca-carregando-estoura-o-goto`. Assim, quem ler o código vê que é um padrão que se repete e encontra o gatilho da recomendação para o harness.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-26 11:43:13 · `tasks/correcoes/2026-10-26-areas-entrar-estoura-o-prazo.md`

```
VEREDITO: APROVADO
Tabelas verificadas: nenhuma tabela nova nem alterada (a correção muda só teste e2e)
Queries verificadas: nenhuma query, repository ou endpoint alterado
Teste de isolamento: não se aplica. Nenhum escopo novo pede teste. O caso alterado em /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/areas.spec.ts:619 continua trocando a sessão para a escola B (criarUsuarioEmOutraEscola) e conferindo a pessoa da outra escola. A única mudança é a rede emulada na primeira carga de /entrar. A entrada, a troca e as asserções seguem na rede do perfil.
Bloqueantes: nenhum
Recomendações:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/areas.spec.ts:627: `const escolherA =page.getByRole(...)` perdeu o espaço depois do `=`. É só formatação, sem efeito no isolamento. Corrija para o formatador ou o lint da esteira não acusarem.
```

Durante a auditoria rodei `npx biome format`. O projeto não tem configuração do biome, e o npx baixou para o próprio cache um pacote `biome` de terceiros (0.3.3), que não tem relação com o projeto e não formatou nada. A árvore do repositório não mudou com isso. Os arquivos novos em `tasks/correcoes/achados/` não vieram desta auditoria.
