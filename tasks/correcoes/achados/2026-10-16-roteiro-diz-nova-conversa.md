# Achados das revisões — `tasks/correcoes/2026-10-16-roteiro-diz-nova-conversa.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-16 07:44:45 · `tasks/correcoes/2026-10-16-roteiro-diz-nova-conversa.md`

VEREDITO: APROVADO

Cenários exigidos: a correção muda só um texto de apoio (`docs/roteiro-da-demonstracao.md:166`, "Nova conversa" passa a "Início"). Não muda regra de negócio, dado de escola, permissão nem nada que rode duas vezes ao mesmo tempo. Por isso não cabe exigir caminho feliz com asserção, casos de borda do domínio, teste de permissão, de isolamento ou de concorrência. O único cenário que vale é este: o passo 4 do roteiro manda clicar num item que existe na navegação do professor, com o mesmo nome que o e2e usa.

Cobertos:
- O rótulo novo bate com o código. O item se chama 'Início' em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/areas/navegacao.ts:63`, no endereço `ROTAS.novaConversa`.
- O e2e do roteiro já usa esse nome, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/roteiro-da-demonstracao.spec.ts:356` (`irPelaNavegacao(professora, 'Início', hasTouch)`). É ele que garante que o caminho existe na tela.
- O diff só troca essa palavra. O resto do passo continua igual: a frase exata, **Enviar** e o que aparece.
- O documento explica por que não há teste que reproduz: comparar o texto do documento com o rótulo seria teste de cópia, e a regra 40 não pede isso. A evidência que ele dá no lugar, o `grep`, é suficiente aqui.
- O diff não declara mutações e não acrescenta cláusula nova. Não há `.skip` nem mock.

Bloqueantes: nenhum.

Recomendações:
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/correcoes/2026-10-16-roteiro-diz-nova-conversa.md:21-22`, o documento diz que a linha 166 é a **única** ocorrência de "Nova conversa" em `docs/`. Não é. O nome também aparece em:
  - `docs/interface.md:53`, no desenho ASCII da lateral do professor
  - `docs/interface.md:72`, `:1519` e `:1544`
  - `docs/mvp-rapido.md:174`, `:177` e `:229`
  - `docs/pendencias-dos-mockups.md:198` e `:228`
  - `docs/decisoes.md:878`

  Nenhuma dessas é instrução para quem apresenta: são registro histórico, decisão ou nota de que a X1 troca o rótulo. Então a correção está certa. Convém só trocar a frase para "a única instrução ao apresentador em `docs/`" e mencionar essas ocorrências, para o `/validar` não tropeçar nela.
- Fica o registro para o `/retro`: o desenho em `docs/interface.md:53` ainda mostra "✎ Nova conversa" na lateral. A linha 72 explica a troca, mas quem só olhar o desenho vai ler o nome antigo. Vale uma tarefa própria que atualize o desenho, quando a X3 recompuser a tela.
