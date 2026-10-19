# Achados das revisões — `tasks/correcoes/2026-10-19-acesso-suspenso-passa-do-prazo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-19 12:56:24 · `tasks/correcoes/2026-10-19-acesso-suspenso-passa-do-prazo.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum (a correção só mexe em dois specs de e2e: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/acesso-suspenso.spec.ts` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/escola-e-vinculos.spec.ts`; nenhum código de produto muda)
Rate limit: ok (não se aplica, o diff não toca no limitador)
Fila e prioridade: ok (não se aplica)
Concorrência: protegida (não se aplica, o diff não tem operação nova)
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não se aplica)
Bloqueantes: nenhum
Recomendações:
- `e2e/escola-e-vinculos.spec.ts:476`: a passagem do vazio para a lista, quando a professora recarrega depois de a coordenação alocar, não tem mais teste, e o documento da correção diz isso. É exatamente o que acontece na manhã do primeiro dia, com a coordenação alocando enquanto o professor já está na tela. Vale um teste de integração ou de unidade da revalidação, para que essa passagem não dependa só da biblioteca.
- `e2e/acesso-suspenso.spec.ts:173`: a primeira carga do caso passou a rodar sem a rede lenta do perfil. Desde que algum outro caso continue medindo a carga fria da entrada da equipe na rede do Chromebook, está certo. Hoje nenhum caso do diff faz isso. Vale confirmar que um caso dedicado mede essa carga, para que o tempo da entrada não suma de todos os specs.
- Três casos ainda passam de 15 s (`acesso-suspenso:78` com 18,4 s, `escola-e-vinculos:212` com 22,4 s, `escola-e-vinculos:272` com 18,9 s). Com o runner da esteira levando perto do dobro do tempo, o de 22,4 s é o próximo a estourar. Vale registrar os três em `TODO.md` ou numa correção própria, e não esperar a esteira apontar.
- O segundo caso de `acesso-suspenso` não usa mais nenhum dado de B além de `escolaNome`, que já é conferido. Está certo, nada a mudar.

## test-engineer · 1ª rodada · APROVADO · 2026-10-19 12:57:00 · `tasks/correcoes/2026-10-19-acesso-suspenso-passa-do-prazo.md`

VEREDITO: APROVADO

Não rodei nenhum teste. A correção só mexe em e2e, outros revisores trabalham na mesma árvore, e as 96 execuções verdes do documento mais a checagem de duração do portão da tarefa já cobrem o que eu veria. Li o `git diff`, os dois specs inteiros e as funções `entrarPelaApi` e `carregarSemRedeLenta`.

Cenários exigidos:
- Caminho feliz: a professora suspensa vê a tela "Acesso suspenso" ao recarregar.
- Borda: o segundo F5 cai na entrada, porque o 403 apagou o cookie.
- Borda: a mesma conta com vínculo em duas escolas, suspensa numa só.
- Permissão: a escola suspensa não é oferecida no seletor nem na entrada.
- Isolamento: entrar pelo e-mail leva direto à escola B, sem nada da escola A na página.
- Os quatro estados da tela Turmas (carregando, erro com nova tentativa, vazio, lista), nos dois projetos.
- O tempo de cada caso abaixo da metade do prazo, que é o que o portão confere.

Cobertos:
- `e2e/acesso-suspenso.spec.ts:165`: a sessão abre pela API com a escola A escolhida (`entrarPelaApi` recebe `emA.usuarioId` e faz a escolha da escola). As recargas continuam na rede lenta do perfil. Seguem lá a tela, o texto, o `href="/entrar"`, a largura, o axe, o nome ausente e o segundo F5 sem a tela. O caso falharia em três situações: a renovação não responde 403, o 403 não apaga o cookie, ou a sessão não está em A.
- `e2e/acesso-suspenso.spec.ts:196`: a suspensão vai para o banco antes, e a entrada é pela tela. Se a entrada não tirasse a escola suspensa, a conta cairia em `/escolher-escola`, e o `esperarNovaConversa` em B mais o `not.toHaveURL` da linha 206 ficariam vermelhos. A conta ainda tem as duas escolas (`criarUsuarioEmOutraEscola` continua nos dois casos).
- `e2e/escola-e-vinculos.spec.ts:434`: carregando, erro 503 com "Tentar de novo" e a casca de pé, vazio com o convite, foco por teclado, largura e axe.
- `e2e/escola-e-vinculos.spec.ts:476`: carregando com a leitura segurada, depois a turma alocada, com largura e axe.
- Sobre a asserção que muda de forma (regra 40): não se perde cobertura. O `page.reload()` do caso antigo jogava fora o cache do TanStack Query, então a "busca seguinte" já era uma carga do zero, igual à primeira busca do caso novo. Nenhuma regra perde teste.
- Sobre o vermelho que não se reproduz de forma determinística: é aceitável. Nenhuma cláusula de produção mudou, então não há mutação a declarar. Os casos tocados passam a ser conferidos pelo portão contra metade do prazo (`tools/ci/duracao-do-e2e.ts`), e as medições do documento (3,3 a 8,7 s) ficam bem abaixo dos 15 s.
- `carregarSemRedeLenta` tira a rede lenta só da primeira carga e a devolve num `finally`. Não esconde regra nenhuma, porque o tempo de download não é o que os casos provam. Não há `.skip`, teste comentado, asserção que sempre passa nem chamada de IA.

Bloqueantes: nenhum.

Recomendações:
1. `tasks/correcoes/2026-10-19-acesso-suspenso-passa-do-prazo.md:25`: a frase "a transição vazio → lista por recarga deixou de ser coberta" diz mais do que aconteceu. A recarga já descartava o cache, então o caso antigo também provava só a lista numa carga nova. Vale reescrever como "nada deixou de ser coberto", para o `/validar` não ler isso como perda de cobertura.
2. O mesmo documento, linha 11, diz "Fora desta correção: nada", mas a linha 27 deixa de fora `acesso-suspenso:78` (18,4 s), `escola-e-vinculos:212` (22,4 s) e `:272` (18,9 s). Mover os três para a seção "Fora desta correção".
3. Esses três casos estão na mesma faixa que estourou na esteira (18 a 22 s contra os 30 s). Fica para o `/retro` uma correção preventiva com o mesmo padrão (entrada pela API e primeira carga sem a rede lenta), em vez de esperar a esteira apontar.
4. No caso 165 de `acesso-suspenso`, `tituloDeFerramentas` não mostra sozinho que a sessão está em A. Hoje isso fica garantido indiretamente pela tela de suspensão. Uma asserção curta com o nome da escola A antes do `agendarEliminacaoNoBanco` deixaria o ponto de partida explícito, se a casca mostrar o nome em Ferramentas.
