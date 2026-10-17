# Achados das revisões — `tasks/correcoes/2026-10-17-troca-de-escola-sem-ir-para-a-entrada.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-17 17:21:17 · `tasks/correcoes/2026-10-17-troca-de-escola-sem-ir-para-a-entrada.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: Painel da coordenação no computador e no celular, escola cheia e vazia).
Estados: ok. A correção não altera tela. As fotos mostram o Painel com dado e o Painel vazio, e este tem "Tudo em dia" e "A escola está montada", que dizem o próximo passo. Carregando e erro não foram tocados.
Acessibilidade: sem mudança. Não há alteração de componente, de foco, de contraste ou de rótulo.
Chromebook fraco: sem impacto no produto. A espera de até 5 s existe só no teste e só em 1 caso de cada 6. O teste novo roda em 1 s.
Celular: nas fotos de 360 px não há rolagem horizontal nem texto cortado.

- **Escola cheia, celular:** o diálogo de incidente de segurança ocupa a altura do aparelho. O texto continua depois do corte, e o diálogo rola dentro dele, como se vê pela rolagem do rodapé. Esse diálogo não foi alterado por esta tarefa.
- **Escola vazia, celular:** a barra de abas fica no rodapé, sobre o conteúdo, como no desenho da navegação.

Ação oficial protegida: sim. A tarefa não toca ação oficial. O diálogo de incidente mostra o que foi decidido, ou seja, o que aconteceu, os dados alcançados e as datas, antes de a coordenação confirmar.

Bloqueantes: nenhum.

- **Código da árvore:** a correção é só de teste e de fixture (`e2e/__fixtures__/sessao.ts:364-390`, os dois specs e `tools/ci/codigo-do-autenticador.test.ts`). O produto não muda.
- **Teste novo (regra 40):** o caso principal usa relógio falso a 100 ms da virada do passo e confere com `passoDoCodigo`, da própria API. Os 4 testes passam. A mutação declarada, `return 0`, deixa o primeiro caso vermelho, porque o código de `-30` sai da janela da API. O teste não passa por acaso.
- **Texto da tela:** nas fotos está tudo em português do Brasil, sem termo técnico e com data no formato local.

Recomendações:
- O caso da escola cheia mostra "Segunda linha do texto.", que é dado sintético da fixture. Não é defeito de produto, mas na vitrine de demonstração convém um texto de incidente mais realista.
- No celular, o título "Incidente de segurança sem ..." fica truncado no cartão do Painel, na foto da escola cheia. Dá para deixá-lo quebrar em duas linhas, porque o título é o que diz o que está pendente. Não vem desta tarefa.

## test-engineer · 1ª rodada · APROVADO · 2026-10-17 17:21:42 · `tasks/correcoes/2026-10-17-troca-de-escola-sem-ir-para-a-entrada.md`

VEREDITO: APROVADO

**Cenários exigidos:** esta correção mexe só no teste e na fixture. Não muda regra de produto, então não se aplicam os cenários de permissão, de isolamento nem de concorrência. Para o defeito, os cenários exigidos são estes:
1. Código do passo anterior gerado perto da virada (a menos de 1 s dela) e conferido depois dela. É o caso do traço da run 39062201162.
2. Código gerado no meio do passo, longe da virada: não pode haver espera, e os passos de -30, 0 e +30 têm de sair em ordem crescente, como o `mfa_ultimo_passo` exige.
3. Os limites da conta de espera: espera zero com mais de 5 s até a virada, e espera quando faltam 5 s ou menos.
4. Depois da espera, o relógio já está no passo seguinte, e não 1 ms antes dele.
5. Os dois specs que tinham o defeito (`painel-da-coordenacao` e `sino-da-coordenacao`) passam a usar a fixture corrigida.

**Cobertos:**
- **Cenário 1:** coberto pelo teste em `tools/ci/codigo-do-autenticador.test.ts:21`. Ele usa relógio falso e confere com o `passoDoCodigo` da própria API (`apps/api/src/sessao/segundo-fator.ts:45`), sem mock da regra. A mutação declarada (`return 0`) fica vermelha pelo motivo certo. Sem a espera, o código sai às `VIRADA-100` e é do passo s-1. A conferência acontece no passo s+1, cuja janela vai de s a s+2, então `passoDoCodigo` devolve `undefined`. Com a fixture corrigida, o código sai às `VIRADA+50` e é do passo s, que cai dentro da janela.
- **Cenário 2:** coberto em `:34`, que verifica os passos exatos de -30, 0 e +30.
- **Cenário 3:** coberto em `:46`.
- **Cenário 4:** coberto em `:54`. Esse teste também mata a mutação que tiraria a `FOLGA_DA_VIRADA_MS`, porque a soma deixaria de ser estritamente maior.
- **Cenário 5:** o `grep` não acha mais nenhum `codigoDoAutenticador(…, -30)` em `e2e/`. Os dois pontos de uso estão trocados (`painel-da-coordenacao.spec.ts:201` e `sino-da-coordenacao.spec.ts:188`).
- O teste roda no projeto de unidade (`vitest.config.ts:46` inclui `tools/ci/**`) e passa: 4 de 4. Não há `.skip`, nem mock do que está sendo testado, nem provedor pago.
- O prazo é provado com relógio falso, e não com carga na máquina.

**Bloqueantes:** nenhum.

**Recomendações:**
- `tools/ci/codigo-do-autenticador.test.ts:21`: o nome diz "confere 1 s depois", mas a conferência acontece uns 10,85 s depois de o código ser gerado, porque o teste avança 10 s e depois mais 1 s. O caso continua válido e é até mais exigente. Vale acertar o nome ou o comentário da linha 26 para não enganar quem ler.
- `tools/ci/codigo-do-autenticador.test.ts:46`: o limite exato (`VIRADA + 25_000`, quando faltam exatamente 5 000 ms) não é testado. Trocar `<=` por `<` em `e2e/__fixtures__/sessao.ts:376` não deixaria nenhum teste vermelho. O efeito é pequeno (1 ms de diferença no limite), mas uma asserção nesse ponto fecha a conta.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tools/ci/codigo-do-autenticador.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/__fixtures__/sessao.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/painel-da-coordenacao.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/sino-da-coordenacao.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/correcoes/2026-10-17-troca-de-escola-sem-ir-para-a-entrada.md`

## test-engineer · 2ª rodada · APROVADO · 2026-10-17 17:27:04 · `tasks/correcoes/2026-10-17-troca-de-escola-sem-ir-para-a-entrada.md`

VEREDITO: APROVADO

Cenários exigidos: nesta rodada, só as duas recomendações da 1ª rodada que a Mesa mandou aplicar, mais as duas mutações que o documento declara. O código digitado no lugar do autenticador precisa continuar valendo quando a API o confere perto da virada do passo de 30 s. Isso já tinha sido aprovado na 1ª rodada e a fixture não mudou.

Cobertos:
- **Recomendação 1 (o nome que não batia com o teste), feita.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tools/ci/codigo-do-autenticador.test.ts:28`, o avanço fixo de 10 s virou `vi.runAllTimersAsync()`. Como a espera da fixture é o único temporizador pendente, o relógio anda só o que ela espera: 150 ms (100 ms até a virada mais 50 ms de folga). O código sai em VIRADA + 50, a API confere em VIRADA + 1 050, e "confere 1 s depois" agora é verdade.
- **A 1ª mutação continua valendo com essa mudança.** Ela troca a espera por `return 0`, e aí não fica temporizador nenhum. O código do passo anterior sai em VIRADA − 100 e cai dois passos atrás do da conferência. A API aceita só um passo para cada lado, então `toBeDefined` fica vermelho.
- **Recomendação 2 (o limite exato), feita.** A linha 52 testa o caso de faltarem exatamente 5 000 ms (`VIRADA + 25_000`) e exige espera de pelo menos 5 000 ms. Com a comparação `<=`, a espera é 5 050 ms. Trocada por `<`, a espera vira 0 e o teste fica vermelho pelo motivo certo, que é o que o novo bloco de "Mutações" do documento declara.
- `npx vitest run tools/ci/codigo-do-autenticador.test.ts` passou: 4 de 4. Não há `.skip`, mock nem provedor pago. O relógio é falso, e a conferência é a `passoDoCodigo` da própria API.

Bloqueantes: nenhum.

Recomendações: nenhuma nova. As duas recomendações do frontend-reviewer que ficaram sem aplicar estão registradas no documento da correção, com destino e motivo.
