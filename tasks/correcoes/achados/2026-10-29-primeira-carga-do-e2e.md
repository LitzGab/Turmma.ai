# Achados das revisões — `tasks/correcoes/2026-10-29-primeira-carga-do-e2e.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-29 17:12:19 · `tasks/correcoes/2026-10-29-primeira-carga-do-e2e.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- A carga em rede lenta só continua testada se algum caso de e2e ainda fizer a primeira carga com a rede do perfil. Antes, 110 casos faziam `goto('/entrar')` com a rede lenta. Agora os casos de `material`, `privacidade`, `coordenacao-introducao`, `analista`, `governanca` e cinco casos do professor abrem a tela sem ela, por `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-primeira-carga-do-e2e/e2e/__fixtures__/segundo-fator.ts` (`abrirPelaApiSemMedirAPrimeiraCarga`) e `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-primeira-carga-do-e2e/e2e/__fixtures__/casca.ts` (`entrarPelaApiSemMedirAPrimeiraCarga`). Vale registrar na correção quais casos ainda fazem isso (`entrar.spec.ts`, `mfa.spec.ts`, `convite.spec.ts`), para que a próxima rodada de cortes não leve todos eles para o ajudante.
- A correção concluiu que o runner leva uns três vezes a máquina nos casos de galeria, e não o dobro que `tools/ci/duracao-do-e2e.ts` supõe. O portão da duração fica mais fraco enquanto isso não muda. Já está no `TODO.md`; falta um dono com data.

Nada do diff toca `apps/`, `packages/`, `tools/`, migration, fila, gateway de IA nem o cenário de carga. Nenhum caso alterado chama provedor de IA, real ou pago. O `codigoDoPassoAnterior` usado na troca de escola já existia em `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-primeira-carga-do-e2e/e2e/__fixtures__/sessao.ts:413`. O servidor continua aceitando cada passo do código do segundo fator uma vez só (`mfa_ultimo_passo`); o teste só deixou de esperar a virada do relógio.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-29 17:12:27 · `tasks/correcoes/2026-10-29-primeira-carga-do-e2e.md`

VEREDITO: APROVADO
Tela vista: não. A correção só muda teste e fixture de e2e, e o diff não toca nada em `apps/` nem em `packages/`. Não houve foto nem medida de rolagem a 1366 × 768, e a tela do produto é a mesma de antes.
Estados: ok. Carregando, vazio, erro e com dado continuam como estavam. Os casos que mudaram de entrada (pela API, com o segundo fator já configurado) afirmam o mesmo que afirmavam, e a entrada pela tela segue coberta por `entrar.spec.ts`, `mfa.spec.ts` e `convite.spec.ts`, como a tarefa descreve.
Acessibilidade: ok. As asserções de axe, foco visível, teclado (Enter e Esc no `ChipFonte`) e contraste dos temas claro e escuro seguem nos casos, na mesma ordem. Os casos divididos em `e2e/pecas-ia.spec.ts` mantêm essas asserções, cada um abrindo a galeria de novo.
Chromebook fraco: ok. As medições de alvo de toque agora vão ao navegador numa ida só (`evaluateAll` em `e2e/pecas-botoes.spec.ts`, `page.evaluate` em `e2e/pecas-ia.spec.ts`), o que reduz o custo sob CPU ×4. A rede e a CPU emuladas do perfil continuam valendo nos testes. O ajudante `abrirPelaApiSemMedirAPrimeiraCarga` tira só a rede lenta da primeira carga, e o nome e o comentário dizem o que ele não mede.
Celular: ok. Os pisos de 44 px (ação principal) e 24 px continuam afirmados no projeto `celular`, e a asserção `expect(medidas.length).toBeGreaterThan(0)` impede que o teste passe sem medir nada.
Ação oficial protegida: sim. Nenhum fluxo de aprovação foi alterado.
Bloqueantes: nenhum. Pelo diff, nenhuma asserção de UI foi removida. As linhas removidas com `expect` em `pecas-botoes` e `pecas-ia` reaparecem nos corpos refeitos. A que sumiu em `material.spec.ts` (o `toHaveURL` de `/coordenacao/material`) volta dentro de `abrirPelaApiSemMedirAPrimeiraCarga`. Não conferi nesse último caso se a espera `aguardar` cobre a mesma URL. É ponto para o `test-engineer`.
Recomendações:
- Em `e2e/pecas-ia.spec.ts`, em torno da linha 17, o bloco novo com `SECOES_DA_CONVERSA` e `ALVOS_DE_ACAO` foi inserido entre o comentário "Os hex da 9.1…" e a constante `RGB` a que ele se refere. Mova o bloco para antes do comentário.
- Há uma linha em branco sobrando antes do `})` do primeiro caso dividido, logo antes do caso "o ChipFonte abre pelo teclado".

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-29 17:12:51 · `tasks/correcoes/2026-10-29-primeira-carga-do-e2e.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum novo. A correção só muda e2e e fixtures. `git status -- apps packages` está vazio, e nenhum seed, job, importação ou webhook foi tocado. Todos com autor humano? Sim, sem mudança.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok. O caso que cobre rejeitar com motivo (`/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-primeira-carga-do-e2e/e2e/pecas-sobrepor.spec.ts`, "rejeitar o lote pede o motivo") virou um caso próprio. Ele mantém o motivo de 8 a 500 caracteres, o botão vermelho de confirmar e o estado "Rejeitado". O aviso de auditoria no diálogo de aprovação continua no caso "a ação de perigo com aviso". Os selos "Esperando você", "Aprovado", "Rejeitado" e "Faz e avisa" continuam afirmados em `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-primeira-carga-do-e2e/e2e/pecas-galeria.spec.ts`.

Supervisão do tutor: ok. Não foi tocada.

Autonomia declarada e visível: sim. `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-primeira-carga-do-e2e/e2e/coordenacao-introducao.spec.ts` só trocou a forma de entrar no caso de `/coordenacao/agentes`, e as asserções seguem iguais.

Bloqueantes: nenhum.

O que conferi contra a regra 70 neste diff:
- **Itens 6 e 8.** Em `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-primeira-carga-do-e2e/e2e/governanca.spec.ts`, os casos "o que a IA gerou e se uma pessoa aprovou, sem professor" e "a série com um professor só" (corte por série com dois ou mais professores, D45) só mudaram a entrada, que passou a ser pela API. As asserções continuam as mesmas.
- **Item 8 (nominal só com auditoria).** Em `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-primeira-carga-do-e2e/e2e/analista.spec.ts`, o dado nominal ainda avisa da auditoria antes, pede turma e finalidade e grava uma auditoria por leitura (`auditoriasNoBanco(..., 'analista.nominal_lido')` com `toHaveLength(2)`). O caso "o alerta é hipótese com contexto, e o recorte de um professor só aparece sem número" ficou igual.
- **Asserções removidas.** As únicas linhas `expect` apagadas estão em `pecas-ia` e `pecas-botoes`. Foram reescritas numa só chamada ao navegador, com os mesmos pisos e rótulos, e ganharam uma asserção a mais (`medidas.length > 0`). Nenhuma trata de nota, aprovação, autonomia ou rótulo de IA.
- **Casos de segunda pessoa na mesma aba** (`privacidade`, `material`, `analista`, `governanca`, `areas`). O login da segunda pessoa continua pela tela. Só o segundo fator dela passou a ser configurado pela API, então a prova de que a aba não mostra o dado da pessoa anterior continua.

Recomendações:
- Em `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-primeira-carga-do-e2e/e2e/pecas-ia.spec.ts:17-21`, as constantes novas (`SECOES_DA_CONVERSA`, `ALVOS_DE_ACAO`) entraram entre o comentário "Os hex da 9.1 do `docs/interface.md`…" e o `const RGB` a que ele se refere. O comentário agora parece descrever `SECOES_DA_CONVERSA`. Não toca a regra 70 e fica para o `revisor-geral`.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-29 17:13:10 · `tasks/correcoes/2026-10-29-primeira-carga-do-e2e.md`

VEREDITO: APROVADO

A correção mexe só em teste e em ajudante de teste do e2e. Nenhum arquivo de `apps/` ou `packages/` mudou, e não há migration, rota, DTO, log de produto nem envio externo.

Campos pessoais tocados: nenhum campo novo. Os ajudantes usam e-mail e senha da equipe de teste, que vêm de `criarEquipeComSenha`. São contas da equipe (coordenação e professor), nunca de aluno, e o tipo já existia.

Fora da tabela de dados do `docs/lgpd.md`: nada, porque não entrou campo novo.

Autorização por objeto: ok. Conferi os casos de segunda pessoa e de outra escola, um por um. As asserções de que a pessoa seguinte não vê o que a anterior via continuam iguais, sem nenhuma removida:
- `privacidade.spec.ts`: retenção da anterior, empresas da anterior, troca de escola e empresas de outra escola.
- `material.spec.ts`: "Capítulo da escola A" não aparece para B, nem pelo endereço do painel.
- `analista.spec.ts` e `governanca.spec.ts`: segunda pessoa.

Nos casos de segunda pessoa, a segunda pessoa continua entrando pela tela, na mesma aba (`entrarPelaTelaComSegundoFator`). Só a configuração do segundo fator dela passou para a API. É isso que mantém a prova de que a aba não mostra dado da pessoa anterior.

Logs: limpos. As duas mensagens de `throw new Error` em `e2e/__fixtures__/segundo-fator.ts` (a do `/v1/sessao/email` e a do `/v1/sessao/mfa`) levam só o status e a etapa, sem e-mail, segredo ou código. O rótulo `quem` de `pecas-ia.spec.ts` lê o texto das peças da galeria estática, que é o mesmo de antes e não tem dado de pessoa.

Auditoria: presente. Em `analista.spec.ts` ("grava uma auditoria por leitura", "abrir duas vezes grava duas auditorias", "a falha da leitura … não grava auditoria") mudou só a assinatura do caso, para receber `request`. As asserções sobre `auditoriasNoBanco` ficaram como estavam. No diff inteiro do e2e, as linhas de asserção removidas são todas de `pecas-botoes` e `pecas-ia`, que agora medem tudo numa ida só ao navegador, e as asserções voltam iguais. Nenhuma é de auditoria ou de isolamento.

Envio externo: nenhum.

Seed/fixture: sintético. A pessoa vem de `criarEquipeComSenha` e a escola de `criarEscolaSintetica`. Os nomes de empresa usam um sufixo aleatório (`marca()`), e o material é "Capítulo da escola A". O sincronismo do segundo fator (`deixarOPassoSeguinteLivre`) usa só o segredo gerado no próprio teste, e o `codigoDoPassoAnterior` que ele chama já existia em `e2e/__fixtures__/sessao.ts:413`.

Bloqueantes: nenhum.

Recomendações:
- Os comentários dos ajudantes novos, em `e2e/__fixtures__/segundo-fator.ts` e `e2e/__fixtures__/casca.ts`, dizem o que eles não medem: a primeira carga na rede lenta e a entrada pela tela. Vale acrescentar uma frase: caso sobre isolamento na mesma aba (segunda pessoa) deve continuar com o login da segunda pessoa pela tela, como esta correção fez. Assim, uma correção futura de prazo não troca esse login pela API e esvazia a prova de que a aba não mostra dado da pessoa anterior.
- Fora da minha regra, só para registro: `abrirMaterial` em `e2e/material.spec.ts` deixou de chegar ao Material pelo menu (`irPelaCoordenacao(page, 'Material')`) e agora abre direto pelo endereço. Isso é da cobertura de navegação, que o `frontend-reviewer` olha. Não é LGPD.

Pergunta de fechamento: esta correção não muda nada do que o sistema guarda sobre um aluno nem de para onde isso vai, então a resposta é a mesma de antes dela.

Arquivos lidos:
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-primeira-carga-do-e2e/tasks/correcoes/2026-10-29-primeira-carga-do-e2e.md`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-primeira-carga-do-e2e/e2e/__fixtures__/segundo-fator.ts`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-primeira-carga-do-e2e/e2e/__fixtures__/casca.ts`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-primeira-carga-do-e2e/e2e/privacidade.spec.ts`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-primeira-carga-do-e2e/e2e/material.spec.ts`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-primeira-carga-do-e2e/e2e/analista.spec.ts`

## revisor-geral · 1ª rodada · APROVADO · 2026-10-29 17:13:55 · `tasks/correcoes/2026-10-29-primeira-carga-do-e2e.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. É correção, sem Tech Spec. A decisão de não pôr nova tentativa no `perfis.ts` está escrita na correção, com o motivo.
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade e e2e dos arquivos alterados)
Bloqueantes: nenhum

Recomendações:
1. `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-primeira-carga-do-e2e/e2e/pecas-ia.spec.ts:17-21`: as duas constantes novas (`SECOES_DA_CONVERSA` e `ALVOS_DE_ACAO`) entraram entre o comentário "Os hex da 9.1 do `docs/interface.md`…" e o `const RGB`. O comentário agora fica em cima das seções da conversa, e o `RGB` perdeu a descrição. As constantes devem ir para antes desse comentário ou para depois do `RGB`.
2. `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-primeira-carga-do-e2e/e2e/pecas-ia.spec.ts:178`: o comentário diz que o caso dividido "são três", mas são quatro: o texto e os chips, o ChipFonte pelo teclado, o Esc e o Tab, e o toque.
3. `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-primeira-carga-do-e2e/e2e/analista.spec.ts:32`: a função `entrar` ainda recebe `hasTouch`, mas não usa mais. O lint não acusa porque `comEntregas`, que vem depois, é usado. Tirar o parâmetro e as passagens dele.
4. `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-primeira-carga-do-e2e/e2e/privacidade.spec.ts:64`: `entrarNaPrivacidade` ganhou `irPelaCoordenacao(page, 'Pedidos', …)` antes de `abrirARetencao`, que já vai por Registros e Privacidade sozinha (`coordenacao.ts:53`). O caso dá um passo de navegação a mais, sem motivo escrito. Tirar o passo ou explicar por que ele está ali.
5. `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-primeira-carga-do-e2e/e2e/privacidade.spec.ts:70-86`: o arquivo continua com um `entrarPelaApiComSegundoFator` próprio, cópia do que está no fixture. Isso já existia antes desta correção, mas a correção existe justamente para juntar a receita num lugar só. Usar o do `segundo-fator.ts` ou o `abrirPelaApiSemMedirAPrimeiraCarga`.
6. Documento da correção e `TODO.md`, quatro desacertos de texto:
   - A tabela da "Correção" manda ver em "Provas" os tempos de `areas:572` e de `pecas-ia:173`, e "Provas" não traz nenhum dos dois.
   - O `TODO.md` diz "os cinco de 90 s" e lista seis.
   - O `TODO.md` não traz o `pecas-ia:261`, que a recomendação (3) do documento cita.
   - O documento dá a recomendação do `duracao-do-e2e.ts` a "quem tocar o portão da duração", e o `TODO.md` a dá ao Orquestrador.
7. Ordem das seções: o documento vai de "(a)" para "(c)" na "Causa" e depois apresenta "(b)" na "Correção". Fica mais fácil de ler na ordem.

Conferi três pontos de risco, e nenhum vira bloqueante:
- **Sequência dos códigos do segundo fator** (`deixarOPassoSeguinteLivre`): ativação com o passo anterior, entrada com o de agora e troca de escola com o seguinte. A ordem sempre cresce e cada código cai na janela de um passo para cada lado. O código do passo anterior espera a virada do relógio quando ela está perto. Sem a opção, o comportamento é o de antes.
- **Medidas numa ida só ao navegador** (`pecas-ia`, `pecas-botoes`): cada seção da galeria tem nome único (`apps/web/src/galeria/Secao.tsx`), e `getBoundingClientRect` dá zero numa peça escondida, então o caso ainda falha onde o `caixa` falhava. O canto medido é o `borderTopLeftRadius`, o mesmo que o `desenho` lia. Há asserção contra o lote vazio.
- **Casos divididos da galeria**: cada um abre a galeria de novo e define o que usa, sem depender do estado deixado pelo anterior.

## test-engineer · 1ª rodada · APROVADO · 2026-10-29 17:14:30 · `tasks/correcoes/2026-10-29-primeira-carga-do-e2e.md`

VEREDITO: APROVADO

**Cenários exigidos:** a correção só mexe em teste e fixture de e2e, então os cenários que pedi são os da troca, e não os do domínio escolar:
- **Caminho feliz:** cada caso dividido ou com entrada nova afirma o que afirmava, sem perder asserção.
- **Borda 1:** caso que dependia do estado deixado pela parte anterior do caso original continua com sentido depois da divisão.
- **Borda 2:** a medida feita numa ida só ao navegador não pode passar vazia nem pular seção sem avisar.
- **Borda 3:** a troca de escola tem dois logins da mesma conta, com o passo do TOTP valendo uma vez só e sem esperar o relógio.
- **Permissão:** a segunda pessoa na mesma aba não vê o dado da primeira.
- **Isolamento:** a coordenação de B não abre o material da escola A pelo endereço.

**Cobertos:**
- **Nenhuma asserção saiu.** Contei as linhas com `expect` por spec, antes e depois. Ficaram iguais em 10 specs e subiram em 4 (`pecas-ia` 165→167, `pecas-botoes` 48→49, `privacidade` 104→106, `material` 181→184).
- **Os casos divididos se sustentam sozinhos.** Cada um começa por `abrirGaleria` e, quando precisa, monta de novo o estado de partida. Por exemplo, os testes do Esc e do Tab de `pecas-ia` reabrem o chip, e o terceiro de `pecas-sobrepor` sai do `decisao` vazio para "Suspensa" e "Aprovado".
- **A medida numa ida só equivale à antiga.** `secao()` é `[data-galeria="…"]`, o mesmo seletor que o `querySelector` usa, e os 10 nomes de seção aparecem uma vez só em `apps/web/src`. `desenho().canto` é `borderTopLeftRadius`, o mesmo valor do `evaluateAll`.
- **A medida não passa vazia.** As guardas `medidas.length > 0` e `toHaveLength(37)` cuidam disso, e as mutações `minimo = 400` e `'13px'` provam que o laço novo afirma de verdade.
- **O passo do segundo fator se sustenta.** A ativação usa o passo anterior (`-30`), com a espera pela virada em `codigoDoPassoAnterior`, a entrada usa o passo de agora (`0`) e a troca, o seguinte (`+30`). Cada passo é maior que o anterior e cabe na janela de um passo, mesmo com uma virada no meio. Sem a opção, o caso da troca de escola (`privacidade:216`) ficaria vermelho, porque o `+30` já teria sido gasto na entrada. A opção está, portanto, provada pelo próprio caso.
- **Permissão e isolamento continuam provados.** Nos casos de segunda pessoa (`privacidade:253` e `:430`, `material:543`, `analista`, `governanca:270`, `areas:572`), só o segundo fator da segunda pessoa passou para a API. O login dela continua pela tela, na mesma aba, e as asserções de "não vê o da anterior" ficaram. O `material:543` (escola B, painel de A pelo endereço) também ficou.
- **As quatro mutações** caem nos casos novos certos. O documento registra que o portão viu cada uma ficar vermelha.
- **Não há código de produção no diff**, então nenhuma cláusula fica sem bloco. A falta de bloco para o `carregarSemRedeLenta` do ajudante está justificada no documento.
- Não encontrei `.skip`, teste comentado, mock da coisa testada nem provedor de IA. Nenhum caso afirma concorrência.

**Bloqueantes:** nenhum.

**Recomendações** (nenhuma bloqueia; ficam para a validação e a retro):
1. **Comentário com a conta errada.** `e2e/pecas-ia.spec.ts:178-179` diz "são três", mas o caso virou quatro (`:180`, `:206`, `:224`, `:246`), como a tabela do documento diz.
2. **Medidas prometidas que faltam.** A tabela do documento manda ver "Provas" para `areas:572` e `pecas-ia:173`, mas "Provas" não traz esses números. Ou acrescentar as medidas, ou tirar a remissão.
3. **Passo novo não documentado.** `e2e/privacidade.spec.ts:67` e `:327` passam a ir por "Pedidos" antes de "Prazos de guarda", e o caminho antigo ia direto do Painel. Ou dizer no documento que o caminho mudou, ou voltar ao antigo.
4. **Terceira cópia da receita.** `e2e/privacidade.spec.ts:76-86` ainda guarda um `entrarPelaApiComSegundoFator` local, com o mesmo nome do ajudante da fixture. Isso contradiz o "num lugar só" do comentário de `segundo-fator.ts:149`.
5. **Parâmetro sem uso.** `e2e/analista.spec.ts:192`: o `hasTouch` de `entrar(...)` não é mais usado.
6. **`TODO.md` diverge do documento.** Diz "os cinco de 90 s" e lista seis, e não traz o `pecas-ia:261`, que as "Recomendações sem aplicar" do documento citam.
7. **Caminho não conferido.** Nos casos de segunda pessoa de `analista` e `governanca`, o `toHaveURL(/\/coordenacao\/painel$/)` que o ajudante antigo fazia saiu; em `material` e `privacidade` ele foi posto de volta. Vale conferir que o `esperarPainel` cobre o mesmo, ou acrescentar o `toHaveURL` também lá.
8. **A causa principal só se confirma na esteira.** O documento diz isso em "Provas": o runner leva uns três vezes a máquina nos casos da galeria, e o portão local supõe o dobro.

Documento da tarefa: `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-primeira-carga-do-e2e/tasks/correcoes/2026-10-29-primeira-carga-do-e2e.md`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-29 17:50:37 · `tasks/correcoes/2026-10-29-primeira-carga-do-e2e.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A correção mexe só em teste e fixture de e2e, e nenhum arquivo de `apps/` ou `packages/` mudou.
Portão local: carimbo válido. O `conferir` respondeu "portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)".
Bloqueantes: nenhum.

As oito recomendações da 1ª rodada foram aplicadas:
- **`e2e/privacidade.spec.ts`:** os dois passos `irPelaCoordenacao(page, 'Pedidos')` saíram. `entrarNaPrivacidade` volta a ir direto a `abrirARetencao`, como no HEAD. Os três `Pedidos` que já estavam no HEAD (`:193`, `:238`, `:273`) continuam.
- **`e2e/analista.spec.ts:32`:** `entrar` não recebe mais o `hasTouch` que não usava, e as cinco chamadas foram ajustadas.
- **`e2e/pecas-ia.spec.ts`:**
  - O comentário dos hex voltou a ficar sobre o `RGB`.
  - O comentário do caso dividido agora diz "quatro".
  - A linha em branco sobrando saiu.
- **Fixtures:** os comentários de `casca.ts` e `segundo-fator.ts` agora dizem que a segunda pessoa na mesma aba entra pela tela. Isso protege a prova das regras 10 e 20, item 5.
- **Painel:** `esperarPainel` (`e2e/__fixtures__/casca.ts:219-222`) confere o endereço e o título "Painel". Por isso nenhuma asserção saiu de `analista` nem de `governanca`.
- **Documento e `TODO.md`:** a tabela traz as medidas que faltavam. O `TODO.md` diz "seis de 90 s", inclui `pecas-ia:261` e registra o ajudante local de `privacidade.spec.ts`, com dono.

Recomendações:
- **`TODO.md:2268`:** falta uma vírgula em "`:519`) `pecas-sobrepor:504`". Sem ela, a frase lê como se `pecas-sobrepor:504` fosse parte da lista dos seis de 90 s.
- **`e2e/__fixtures__/segundo-fator.ts:132`:** a frase "Devolve o segredo, para o caso que precisa entrar de novo pela tela." fica no fim do parágrafo sobre a segunda pessoa, mas fala do retorno da função. Deveria voltar ao parágrafo anterior ou ganhar linha própria.

## test-engineer · 2ª rodada · APROVADO · 2026-10-29 17:50:55 · `tasks/correcoes/2026-10-29-primeira-carga-do-e2e.md`

VEREDITO: APROVADO

**Cenários exigidos:** esta é a rodada 2. Pela regra da rodada nova, olhei só o diff desde a minha rodada aprovada (`/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-29-primeira-carga-do-e2e/.processo/ordens/diff-r2.patch`), o que ele afeta e se as minhas oito recomendações da rodada 1 foram feitas. A correção só mexe em teste e fixture de e2e e não muda nenhum arquivo de `apps/` ou `packages/`. Por isso não há mutação a exigir, e o bloco "Mutações" não se aplica.

**Cobertos:**
- **`privacidade.spec.ts`:** os dois `irPelaCoordenacao(page, 'Pedidos')` saíram, de `entrarNaPrivacidade` e do caso da troca de escola. Comparado com o HEAD, `entrarNaPrivacidade` ficou como era: entra e vai direto a `abrirARetencao`. `abrirARetencao` continua indo pelo menu, com `irPelaCoordenacao(page, 'Prazos de guarda')`, que passa por Registros e depois pela aba Privacidade (`e2e/__fixtures__/coordenacao.ts:53`). Assim, o caso "abre Privacidade pela navegação" ainda prova a navegação pelo menu. Os três passos 'Pedidos' que o HEAD já tinha continuam no arquivo, nas linhas 193, 238 e 273. Nenhuma asserção saiu.
- **`analista.spec.ts`:** o `entrar` não recebe mais `hasTouch` (linha 32), e as cinco chamadas (linhas 41, 79, 107, 131 e 234) passam só `(page, request)`. Nenhuma passava `comEntregas`, então tirar o parâmetro não desalinhou nenhum argumento. O `hasTouch` segue sendo usado onde importa, em `irPelaCoordenacao(..., hasTouch)`.
- **Os comentários dos dois ajudantes** (`casca.ts:189-192`, `segundo-fator.ts:129-132`) agora dizem que, num caso de isolamento, a segunda pessoa na mesma aba entra pela tela. É o que os casos fazem:
  - `areas.spec.ts:597-599` e `privacidade.spec.ts:268-271` e `:447-450` configuram o segundo fator da segunda pessoa pela API, mas o login dela é pela tela, com `entrarPelaTelaComSegundoFator`.
  - O cache da primeira pessoa continua na aba, então esses casos ainda falhariam se a aba vazasse o dado anterior.
- **`pecas-ia.spec.ts`:** só mudaram a ordem das constantes, o comentário ("quatro") e uma linha em branco. Nenhuma asserção saiu.
- **Documento e `TODO.md`:** a tabela traz as medidas de `areas:572` (8,0 s) e de `pecas-ia:173` (1,8 / 6,5 / 2,0 / 2,2 s). O `TODO.md` diz "seis de 90 s", inclui `pecas-ia:261` e registra o `entrarPelaApiComSegundoFator` próprio de `privacidade.spec.ts`, com dono.
- **As oito recomendações da rodada 1:** as oito foram feitas, como diz a "Ordem de correção da rodada 1" do documento. A minha sobre a causa principal, que só se confirma na esteira, foi para "Sem ação", com o motivo escrito.
- **Pontos 4 a 6 da auditoria:** não há `.skip` nem teste comentado, e nenhum mock esconde a regra. Não há IA nem concorrência em jogo neste diff.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Os dois comentários novos citam "regra 10 (item 5)" e "regra 20 (item 5)". O item 5 da regra 10 trata do teste de isolamento de módulo, que fica na camada de integração. O que o caso da mesma aba prova é que a tela não mostra o dado anterior que ficou no cache. A remissão mais exata é "regra 20 (itens 4 e 5)", ou dizer em texto "a aba não mostra dado da pessoa anterior". Destino: quem tocar `casca.ts` ou `segundo-fator.ts`.
2. A seção "Provas" ainda descreve a árvore da rodada 1. As mudanças desta rodada só tiram passos e um parâmetro, sem efeito esperado em resultado nem em prazo. Mesmo assim, o carimbo do portão precisa valer para a árvore atual (`29d4cbbc…`) antes do commit, o que o hook já exige.
