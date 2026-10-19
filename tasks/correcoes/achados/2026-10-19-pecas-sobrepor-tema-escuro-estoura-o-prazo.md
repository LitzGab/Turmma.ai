# Achados das revisões — `tasks/correcoes/2026-10-19-pecas-sobrepor-tema-escuro-estoura-o-prazo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-19 08:11:48 · `tasks/correcoes/2026-10-19-pecas-sobrepor-tema-escuro-estoura-o-prazo.md`

VEREDITO: APROVADO

Tela vista: sim, 5 fotos lidas: galeria no computador e no celular, "Aprovar 32 correções" no computador, o painel 2ºB no celular, e a lista de vazia. Só vi o topo de cada foto. As demais fatias da galeria (cheia, vazia e depois dos cliques) não foram lidas. A tarefa não muda `apps/web`, então as fotos mostram a tela como estava e o diff não as afeta. A galeria é uma página de peças fora da navegação, e as fotos não mostram os diálogos abertos.

Estados: ok. A correção só reparte um caso de e2e e não toca estado de tela.

Acessibilidade: ok. O diff mantém as mesmas asserções, inclusive o axe completo, o véu por tema, a borda de 2 px com degrau, o canto de 16 px, a cor do botão que confirma e o Esc. Agora elas rodam uma peça por caso, nos dois temas. Conferi o corpo do caso em `e2e/pecas-sobrepor.spec.ts:565-616` e nada foi removido. `aberto.alvo` virou função de `page`, como a tabela `ABERTOS` precisava, e o resto do corpo está igual.

Chromebook fraco: ok. Cada caso abre uma peça só e a correção declara 3,8 a 4,9 s por caso, contra 12,4 s antes e 15 s de limite do portão. A causa do estouro, 31,7 s no runner da esteira, está descrita no arquivo da correção. Não conferi essas medições, e o estouro depende da carga do runner.

Celular: ok. Os dois projetos, `chromebook` e `celular`, rodam os 16 casos, 4 peças por 2 temas por 2 projetos. As fotos de 360 px não mostram rolagem horizontal, texto cortado nem alvo pequeno nos botões da galeria.

Ação oficial protegida: sim. O caso "a confirmação oficial" continua provando que o botão oficial de "Aprovar 32 correções" não tem a cor de perigo. O caso "a confirmação de perigo" continua provando que o perigo cheio usa o `vermelho` do tema. Nada de produto mudou.

Bloqueantes: nenhum.

Recomendações:
- A correção diz que não há como reproduzir o estouro de forma determinística. A evidência é a duração medida antes e depois, e o `/validar` deve confirmar o próximo ciclo da esteira.
- Os nomes dos casos mudaram, de "o diálogo, a confirmação e o painel…" para "o diálogo, no tema …" e semelhantes. Não achei referência ao nome antigo, mas vale a esteira confirmar que nenhum filtro externo dependia dele.

## test-engineer · 1ª rodada · APROVADO · 2026-10-19 08:11:59 · `tasks/correcoes/2026-10-19-pecas-sobrepor-tema-escuro-estoura-o-prazo.md`

VEREDITO: APROVADO

Cenários exigidos: a correção não muda nenhuma regra de produto. Ela só reparte um caso de e2e que estourava o prazo de 30 s. Por isso os cenários exigidos são três: as asserções do caso antigo continuam todas, nos dois temas e nos dois projetos (`chromebook` e `celular`); cada caso novo cabe com folga dentro da metade do prazo; e uma peça que quebra reprova o caso dela, com o nome no título. Isolamento, permissão e concorrência não se aplicam, porque a correção não toca dado de escola, endpoint nem operação repetível.

Cobertos:
- **Asserções.** O corpo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/pecas-sobrepor.spec.ts:567-614` é o mesmo de antes, linha a linha. Continuam o véu do tema, o fundo `superficie` e a borda de 2 px: no painel, de um lado só conforme a largura da janela; nas outras peças, anel e degrau, com canto de 16 px. Continuam também o `perigo` cheio igual ao `vermelho` do tema, o oficial diferente do `vermelho`, o axe sem violação grave, e o Esc com `toHaveCount(0)`. Nenhuma asserção saiu nem ficou mais fraca.
- **Títulos.** `ABERTOS` (linhas 26-31) troca o `Locator` montado dentro do caso por uma fábrica `alvo(page)`, o que está correto porque cada caso tem a sua `page`. O `--list` coleta 16 casos (4 peças × 2 temas × 2 projetos), todos com título único e o nome da peça na linha.
- **Referências antigas.** Nenhum arquivo cita o título antigo (`git grep` vazio). Nenhum filtro ou documento ficou apontando para um caso que não existe mais.
- **Mutações.** A correção não traz cláusula nova de produto: o diff só mexe no teste. A ausência da seção "Mutações" é coerente com isso.
- **Proibidos.** Não há `.skip`, teste comentado, mock nem provedor de IA.
- **Prazo.** O documento diz que mediu de 3,8 a 4,9 s por caso, contra 15 s de limite do portão. Não rodei o e2e: a medição é do Implementador, e o portão da tarefa confere a duração dos casos tocados.

Bloqueantes: nenhum

Recomendações:
- O caso do painel tem um título enganoso. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/pecas-sobrepor.spec.ts:567`, o título diz "borda de 2 px com degrau" para todas as peças, mas o painel é testado sem degrau (linhas 590-594). O caso antigo agrupava as quatro peças e o título genérico passava. Agora que cada peça tem caso próprio, vale um sufixo por peça em `ABERTOS`, por exemplo "borda de 2 px de um lado só" no painel.
- O documento de correção, em "Teste que reproduz", admite que não há vermelho determinístico. Como o estouro depende da carga do runner, a duração como evidência é aceitável. Vale o `/retro` registrar o padrão: um caso que varre o axe várias vezes deve nascer repartido, para não esperar a esteira acusar.

## test-engineer · 2ª rodada · APROVADO · 2026-10-19 08:29:56 · `tasks/correcoes/2026-10-19-pecas-sobrepor-tema-escuro-estoura-o-prazo.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 1ª rodada. A correção é de prazo e não mexe em regra. Cada peça sobreposta (o diálogo, a confirmação oficial, a confirmação de perigo e o painel), em cada tema, precisa continuar conferindo o véu do tema, o fundo da superfície e a borda: anel de 2 px com degrau de 4 px e canto de 16 px nas três primeiras, e borda de 2 px de um lado só no painel (à esquerda a partir de 768 px, em cima abaixo disso). Também ficam a cor do botão que confirma, o axe sem violação grave e o fechamento pelo Esc. Tudo isso nos projetos `chromebook` e `celular`.

Cobertos: todos. Esta rodada só mudou o título dos casos. Cada peça agora tem um texto de borda próprio, e o título acompanha o que o caso confere:
- O painel diz "borda de 2 px de um lado só, sem degrau", que é o que o ramo `painel-lado` confere em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/pecas-sobrepor.spec.ts:590-594`.
- As três outras peças dizem "borda de 2 px com degrau", que é o que as linhas 596-600 conferem.
- A recomendação da 1ª rodada foi aplicada como pedi.
- Os 8 títulos continuam diferentes entre si (4 peças × 2 temas), então o Playwright não vai acusar título repetido.
- O corpo do caso e as asserções estão iguais aos da rodada aprovada.
- Não há `.skip`, nem mock, nem asserção retirada.

Bloqueantes: nenhum.

Recomendações:
- Continua valendo a da 1ª rodada, já encaminhada ao `/retro`: caso de e2e que roda o axe várias vezes deve nascer repartido, um caso por peça.
- O sinal de que a correção resolveu é o próximo push da esteira. O caso estourou só lá (31,7 s contra 30 s), e na máquina não dá para provar o estouro de forma determinística.
