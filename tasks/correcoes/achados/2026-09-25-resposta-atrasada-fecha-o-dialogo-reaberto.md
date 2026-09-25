# Achados das revisões — `tasks/correcoes/2026-09-25-resposta-atrasada-fecha-o-dialogo-reaberto.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-25 05:39:10 · `tasks/correcoes/2026-09-25-resposta-atrasada-fecha-o-dialogo-reaberto.md`

VEREDITO: APROVADO

Cenários exigidos:
- Caminho feliz: a resposta do pedido fecha a própria abertura quando ela continua aberta.
- Caso de borda 1: o operador cancela com o `POST` no ar, reabre o Nova escola e digita outro nome. A resposta atrasada não pode fechar o diálogo reaberto nem apagar o que foi digitado nele.
- Caso de borda 2: o mesmo defeito no Nova rede.
- Caso de borda 3 (já existia na 6.0): o operador cancela e abre o diálogo do outro tipo, e a resposta atrasada não o fecha.
- Caso de borda 4: com nada aberto, a resposta atrasada não abre nada.
- Concorrência: resposta atrasada disputando com uma nova abertura, com a resposta presa de verdade pelo `page.route` e solta no meio. Sequência real, não simulada.
- Permissão e isolamento: não se aplicam. A mudança é só de estado de tela, sem endpoint, repository nem dado novo.

Cobertos:
- **Nova escola reaberto:** `e2e/operacao-escolas.spec.ts:501-532`. O teste confere o anúncio da primeira abertura, o diálogo reaberto ainda com o título "Nova escola", o nome digitado mantido e uma escola só com o endereço da primeira.
- **Nova rede reaberto:** `e2e/operacao-escolas.spec.ts:534-561`, com as mesmas asserções.
- **Troca de tipo:** `e2e/operacao-escolas.spec.ts:468-499`, já existia.
- **Caminho feliz na tela:** `e2e/operacao-escolas.spec.ts:323-325`, onde o diálogo fecha depois de "Rede X criada".
- **Regra pura:** `apps/web/src/operacao/dialogo-aberto.test.ts`, 4 testes. Rodei e os 4 passam.
- **O teste falharia sem a regra?** Sim, nos dois níveis.
  - No código antigo, a guarda fechava por tipo (`aberto === 'escola' ? undefined : aberto`), então o diálogo reaberto fecha e a asserção do título em `:529` e `:559` falha. Isso bate com a evidência de vermelho do documento, inclusive no passo intermediário, com a correção só no Nova escola e o Nova rede ainda vermelho.
  - No teste de unidade, se `fecharSeAindaAberta` comparar o tipo em vez do número, o primeiro caso quebra (`toBe(segunda)` recebe `undefined`).
- **O teste não passa por acaso:** o anúncio e o `fecharSeAinda` saem na mesma chamada síncrona do `aoCriar`, depois do `await invalidateQueries`. Quando o anúncio aparece, o fechamento indevido já teria acontecido.
- **Sem atalhos:** não há `.skip`, `.only`, `fixme`, mock de código nosso nem chamada a provedor de IA. O `page.route` só segura a resposta e depois a deixa seguir (`fallback`) para o servidor real, e as contagens são lidas no banco.
- **Troca do Vitest de componente pelo e2e:** a justificativa se sustenta. O `apps/web` não tem ambiente de DOM, e a ligação do hook à tela só é provável com o Playwright.

Bloqueantes: nenhum.

Recomendações:
1. Nenhum teste prova o `key={aberta.numero}` em `Escolas.tsx`. Pela interface ele é inalcançável hoje, porque "Cancelar" desmonta o diálogo antes de a reabertura montar outro. Se ficar como defesa, vale uma linha no documento dizendo isso. Quando a 7.0 reaproveitar o hook nos diálogos do convite, confirmar se passa a existir abrir sobre abrir do mesmo tipo e, se passar, testar.
2. O teste "clique duplo e resposta perdida" já junta seis cenários encadeados, entre `e2e/operacao-escolas.spec.ts:377` e `:561`. Separar os trechos de "reabrir o mesmo diálogo" num `test` próprio deixaria a falha mais fácil de localizar e evitaria que um vermelho no meio esconda os de baixo.
3. O trecho do Nova rede termina com o diálogo reaberto ainda aberto (`:561`). O do Nova escola faz "Cancelar" antes do `unroute`. Fechar também ali, por simetria, evita estado solto se alguém acrescentar um trecho depois.
4. O contador que o `useDialogoDaTela` mantém num `useRef` só é provado pelo e2e. O teste de unidade cobre `proximaAbertura` com o número passado à mão. Isso é aceitável sem ambiente de DOM, mas vale registrar para o `/retro` se a 7.0 trouxer mais estado de tela nesse formato.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-25-resposta-atrasada-fecha-o-dialogo-reaberto.md
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/dialogo-aberto.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/dialogo-aberto.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Escolas.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-escolas.spec.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/6_task.md

## frontend-reviewer · 1ª rodada · APROVADO · 2026-09-25 05:40:14 · `tasks/correcoes/2026-09-25-resposta-atrasada-fecha-o-dialogo-reaberto.md`

VEREDITO: APROVADO

A correção faz o que a tarefa pede: a resposta atrasada agora fecha só a abertura que fez o pedido. Não mudou nada na tela além disso.

**Estados:** ok. Carregando, vazio, erro e com dado continuam como estavam. O vazio ainda oferece "Nova rede", agora por `dialogo.abrir('rede')`. `NovaRede` e `NovaEscola` não foram alterados.

**Acessibilidade:**
- **Foco:** continua certo. O `DialogoDaOperacao` devolve o foco a quem abriu. A `key={aberta.numero}` faz a reabertura montar do zero, com foco no primeiro campo, sem herdar o foco nem o texto da abertura cancelada. Quando a resposta atrasada chega, o diálogo reaberto não desmonta mais, então o foco fica onde o operador estava digitando. Antes, a tela fechava por baixo dele e o foco pulava para o botão que abriu o diálogo.
- **Teclado e "Cancelar":** Esc e "Cancelar" continuam chamando `dialogo.fechar`, que fecha sem condição. Só o diálogo montado oferece esses caminhos, então isso está certo.
- **Anúncio:** continua saindo no `role="status"` de `Escolas.tsx:167`, porque a escola ou a rede foi mesmo criada. Há um ponto nas recomendações.

**Chromebook fraco:** nada de custo novo. É um `useState`, um `useRef` e três `useCallback` estáveis. Não entra dependência nem render extra.

**Celular:** o e2e novo usa `acionar(page, ..., hasTouch)` e cobre Nova escola e Nova rede. Não há hover nem atalho, e o layout não mudou.

**Ação oficial protegida:** não se aplica. É uma correção de criação no painel da operação e não envolve nota. A revisão do endereço no Nova escola continua igual.

**O que conferi:**
- `apps/web/src/operacao/dialogo-aberto.ts`: `fecharSeAindaAberta` compara o número da abertura, não o tipo.
- `apps/web/src/operacao/paginas/Escolas.tsx:214-238`: cada `aoCriar` fecha só a abertura do render em que o pedido saiu. Como o diálogo tem `key` própria, as opções da mutação desmontada ficam presas a essa abertura.
- `NovaEscola.tsx:70-80`: o `onError` não chama `aoFechar`. Nenhuma resposta atrasada chega ao `fechar`, que é incondicional.
- Rodei `apps/web/src/operacao/dialogo-aberto.test.ts`: 4 de 4 verdes. O e2e em `e2e/operacao-escolas.spec.ts:498-561` faz o caminho real: cancelar com o POST segurado, reabrir, digitar e só então soltar. Ele confere que o reaberto continua aberto com o texto digitado e que existe um registro só, nos dois diálogos.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **O anúncio atrasado sai enquanto um diálogo está aberto, e aí o leitor de tela não o lê.** O `role="status"` de `Escolas.tsx:167` fica fora do `<dialog>` modal, e o navegador deixa inerte tudo o que está fora dele. O "Escola X criada." de um pedido cancelado aparece atrás do diálogo reaberto e não é lido. Quem usa leitor de tela pode não saber que a escola cancelada existe e repetir o pedido. No Nova escola o endereço repetido segura o duplicado; no Nova rede nada segura, então pode nascer uma segunda rede com o mesmo nome.
   - O limite já existia na troca de tipo, aceita na 6.0. A correção o estende ao mesmo tipo, porque antes o diálogo fechava e o anúncio ficava alcançável.
   - Sugestão: o mesmo caminho do `AvisoNoDialogo`, com o anúncio passado por contexto e desenhado dentro do `DialogoDaOperacao` aberto.
   - Vale fazer antes da 7.0, que reaproveita o hook nos diálogos do convite. Refazer ou revogar um convite atrás de um diálogo aberto é informação mais séria do que "escola criada".
2. **`e2e/operacao-escolas.spec.ts:560`:** o trecho do Nova rede termina com o diálogo aberto, ao contrário do trecho do Nova escola, que cancela. Não quebra nada hoje, porque é o fim do teste, mas um "Cancelar" antes do `unroute` deixa os dois trechos simétricos para quem copiar o padrão na 7.0.
