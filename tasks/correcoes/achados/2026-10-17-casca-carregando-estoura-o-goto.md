# Achados das revisões — `tasks/correcoes/2026-10-17-casca-carregando-estoura-o-goto.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-17 13:35:27 · `tasks/correcoes/2026-10-17-casca-carregando-estoura-o-goto.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas, /sistema no computador e no celular, cheia e vazia)
Estados: ok. Esta correção não toca a tela. O caso "carregando" continua afirmando "Carregando o estado do sistema…", e os casos de erro e de dado ficaram como estavam. As fotos mostram o estado com dado. A foto "vazia" é igual à cheia porque /sistema só lista componentes e avisos. O aviso vazio convida ("Nenhum aviso por enquanto… Verifique de novo quando quiser") e traz o botão.
Acessibilidade: sem mudança. O caso mantém `violacoesGraves` depois do goto, enquanto a tela está em "carregando". A região de estado é lida por `getByRole('status')`.
Chromebook fraco: a correção tira só a rede emulada da primeira carga deste caso, e a CPU continua limitada. A tela não muda. O primeiro caso da suíte (com dado, em até 5 s) segue medindo a casca na rede lenta. `carregarSemRedeLenta` existe em `e2e/__fixtures__/perfis.ts:93`, restaura a rede do perfil no `finally` e falha de forma explícita se a página não vier do `test` de perfis.
Celular: a foto de 360 px não mostra rolagem horizontal, texto cortado nem sobreposição. O botão "Verificar de novo" tem altura aproximada de 46 px, acima dos 44 px da ação principal. Os dois projetos continuam rodando o caso.
Ação oficial protegida: não se aplica, porque a tela não tem ação oficial. Sim, nesse sentido.
Bloqueantes: nenhum. A foto não contradiz o código nem a pele: laranja da paleta, borda tracejada no vazio, datas e textos em pt-BR, sem termo técnico nem texto em inglês.
Recomendações:
- A correção declara não ter mutação nem vermelho determinístico, e a justificativa é honesta: a causa foi uma trava de rede emulada, vista uma vez em 174 casos, e o traço da esteira é a evidência. Vale o `/retro` acompanhar a esteira para confirmar que o caso não volta a estourar. Se voltar, a causa é outra.
- O comentário no spec cita o número da esteira (`39037149357`), que envelhece. Deixar só a descrição do sintoma seria mais durável.

Arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/casca.spec.ts` (linhas 133–150), `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/__fixtures__/perfis.ts` (linha 93).

## test-engineer · 1ª rodada · APROVADO · 2026-10-17 13:36:16 · `tasks/correcoes/2026-10-17-casca-carregando-estoura-o-goto.md`

VEREDITO: APROVADO

**Cenários exigidos.** A correção mexe só no teste, e não muda regra nenhuma do produto. Ela precisa mostrar quatro coisas:
- O caso "carregando" continua provando a regra 50.5 (o estado de carregamento existe e o dado o substitui), com a resposta de `/v1/sistema/estado` ainda segurada.
- A rede lenta continua sendo medida em algum caso da suíte, para a regra 50.1 não ficar sem prova.
- O helper devolve a rede do perfil mesmo quando a carga falha.
- A troca não esconde um defeito do produto que o caso pegaria.

**Cobertos.**
- As asserções de `e2e/casca.spec.ts:145-151` não mudaram. A rota segurada (linhas 136-139) também não, nem a liberação depois. O caso continua afirmando a mensagem "Carregando o estado do sistema…" e a troca dela pelo dado. Se o estado de carregamento fosse tirado da tela, o caso ficaria vermelho como antes.
- O primeiro caso, `e2e/casca.spec.ts:67` ("com dado… em até 5 s"), continua carregando com `page.goto` na rede do perfil. Os outros casos da suíte também. A rede lenta segue medida e a regra 50.1 não perde prova.
- `carregarSemRedeLenta` (`e2e/__fixtures__/perfis.ts:93-102`) devolve a rede do perfil no `finally`. Isso já tem teste próprio, em `e2e/pecas-galeria.spec.ts:174-186`: devolve quando a carga falha, mede dentro e fora, e recusa página que não veio do perfil.
- A CPU continua limitada durante o caso. A rede volta assim que o `goto` termina, então a verificação de violações graves (linha 147) já roda na rede do perfil.
- A causa veio do traço da esteira 39037149357: o pedido do estado nunca saiu, porque os scripts não chegaram. Os outros casos que carregam a mesma página na rede lenta continuam como estavam. Se a trava fosse do produto, ela ainda apareceria neles.

**"Mutações: Nenhuma" se sustenta.** A linha nova não é cláusula de regra do produto. Ela tira uma causa de ambiente do teste, e não há vermelho determinístico para provar. Falta de bloco aqui não é bloqueante. O documento explica o motivo e mostra a estabilidade: 60 de 60 no caso e 132 de 132 no arquivo inteiro.

Sem `.skip`, sem teste comentado. Nenhum mock esconde a regra: a rota segurada é a mesma de antes. O caso não chama provedor de IA. Concorrência não se aplica.

Não rodei o teste. A troca é de uma linha e as asserções são as mesmas. A estabilidade está registrada no documento.

**Bloqueantes:** nenhum.

**Recomendações:**
1. A causa ("trava da primeira carga sob a rede emulada") é uma hipótese apoiada no traço, não está confirmada. Vale registrar em `docs/mvp-rapido.md` ou no `/retro` que, se a mesma trava aparecer em outro caso que carrega na rede lenta, a investigação vai para o servidor estático da esteira, e não para mais um `carregarSemRedeLenta`. Uma hipótese é o limite de conexões por host com os dez `modulepreload` e latência de 562 ms. Usar o helper em mais casos tiraria, aos poucos, a prova da regra 50.1.
2. O comentário em `e2e/casca.spec.ts:140-142` pode citar o caso da linha 67 pelo nome, em vez de "o primeiro caso". Se a ordem da suíte mudar, a referência continua certa.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/casca.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/__fixtures__/perfis.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/correcoes/2026-10-17-casca-carregando-estoura-o-goto.md
