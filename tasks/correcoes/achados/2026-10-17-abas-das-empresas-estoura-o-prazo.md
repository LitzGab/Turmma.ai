# Achados das revisões — `tasks/correcoes/2026-10-17-abas-das-empresas-estoura-o-prazo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-17 01:26:17 · `tasks/correcoes/2026-10-17-abas-das-empresas-estoura-o-prazo.md`

VEREDITO: APROVADO

Tela vista: sim (4 fotos lidas: `/coordenacao/privacidade/suboperadores`, no computador e no celular, escola cheia e vazia). As duas escolas mostram a mesma tela: a aba Empresas vazia. A "cheia" é a vitrine, que não cadastrou nenhuma empresa. Esta tarefa não altera tela.

Estados: ok. A correção não mexe em código de produto, só no prazo de um teste. O estado vazio aparece nas fotos e convida: "Quando o Turmma contratar uma empresa que receba dado da escola, ela aparece aqui, com o que faz e o que recebe." Carregando e erro não aparecem na vitrine, e esta tarefa não os altera.

Acessibilidade: sem mudança. Nas fotos, as abas têm foco e estado selecionado visíveis, e o texto está em português e legível.

Chromebook fraco: a correção resolve justamente o relógio do teste sob o perfil de CPU ×4 e Fast 3G. `e2e/privacidade.spec.ts:296-297` ganhou `test.setTimeout(90_000)`, com comentário, igual aos outros dois testes do arquivo que carregam a página mais de uma vez. O diff confere com o que a correção descreve: nenhuma asserção mudou.

Celular: nas fotos de 360 px não há rolagem horizontal nem texto cortado. O título "Colégio s…" é truncado com reticências no cabeçalho, e isso vem da casca, não desta tarefa. "Prazos de guarda" quebra em duas linhas dentro da aba sem esconder a ação. O alvo de toque das abas parece ter pelo menos 24 px, e a barra inferior tem alvos maiores. O teste continua rodando no projeto `celular`.

Ação oficial protegida: não se aplica. A tela é só de leitura e a tarefa não cria ação oficial.

Bloqueantes: nenhum.

Recomendações:
- O prazo de 90 s dá folga, mas pode esconder uma lentidão real da tela no celular. A correção registra uma execução em que 2 casos do `chromebook` caíram aos 90 s, sem causa lida e sem repetir em 22 execuções seguintes. Se isso reaparecer na esteira, abra um `/corrigir` para investigar a causa. Não basta subir o prazo de novo.
- Seria útil guardar a duração medida (25,8 s e 28,8 s na suíte inteira) como referência para detectar regressão de carga.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/privacidade.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/correcoes/2026-10-17-abas-das-empresas-estoura-o-prazo.md`

## test-engineer · 1ª rodada · APROVADO · 2026-10-17 01:26:25 · `tasks/correcoes/2026-10-17-abas-das-empresas-estoura-o-prazo.md`

VEREDITO: APROVADO

Cenários exigidos: esta é uma correção de prazo num e2e que já existia. O cenário é o próprio caso `as duas abas se alternam pelo clique ou toque, e o endereço guarda a aba`, nos projetos `chromebook` e `celular`. Ele cobre:
- caminho feliz: a aba das empresas abre e mostra a empresa da escola;
- borda: depois de recarregar a página, o endereço e a aba marcada continuam os mesmos e a lista volta;
- borda: ao ir para "Prazos de guarda", a empresa some da tela e não vaza para a outra aba;
- permissão e isolamento: o caso vizinho da linha 251 já cobre a empresa da outra escola e a de operação. Esta correção não mexe nele.

Cobertos:
- O diff só acrescenta `test.setTimeout(90_000)` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/privacidade.spec.ts:296-297`, com o comentário da razão. Nenhuma asserção muda: as das linhas 302 a 313 continuam com os prazos de antes (`PRAZO_DA_ENTRADA_MS` onde há carga de página, 5 s padrão no resto).
- O teste continua ficando vermelho se a regra cair: se a aba não for guardada no endereço, se não ficar marcada depois de recarregar, ou se a empresa aparecer na retenção.
- O valor de 90 s é o mesmo dos dois casos do arquivo que também carregam a página mais de uma vez (linhas 145 e 318).
- Não há cláusula nova de código, então "Mutações: nenhuma" está certo.
- Não há `.skip`, teste comentado, mock novo nem chamada a provedor de IA.
- Não há operação concorrente envolvida.

Bloqueantes: nenhum.

Recomendações:
1. O documento registra uma execução em que 2 casos do `chromebook` caíram aos 90 s, sem o erro lido (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/correcoes/2026-10-17-abas-das-empresas-estoura-o-prazo.md:42-43`). O `chromebook` é o perfil mais leve. Bater no teto de 90 s ali parece mais uma espera presa (um passo de `irPelaCoordenacao` ou do login) do que lentidão. Não bloqueia: não se repetiu em 22 execuções e o documento diz isso. Mas se a esteira mostrar de novo, a correção seguinte precisa ler o trace da falha antes de mexer em prazo.
2. Este é o terceiro `test.setTimeout(90_000)` no mesmo arquivo pelo mesmo motivo (várias cargas no perfil `celular`). Vale considerar um prazo por `describe`, ou uma constante nomeada como `PRAZO_DE_DUAS_CARGAS_MS`, para não repetir o número solto e o comentário.

Não rodei o teste: a mudança só alonga o prazo total, e o portão da tarefa e a esteira cobrem a repetição. Também não abri as fotos da vitrine, porque o diff não muda a tela; elas ficam com o `frontend-reviewer`.
