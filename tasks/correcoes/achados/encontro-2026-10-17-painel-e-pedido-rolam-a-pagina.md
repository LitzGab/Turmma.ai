# Achados das revisões — `tasks/correcoes/encontro-2026-10-17-painel-e-pedido-rolam-a-pagina.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-17 18:44:17 · `tasks/correcoes/encontro-2026-10-17-painel-e-pedido-rolam-a-pagina.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum
Recomendações:
- `tasks/correcoes/encontro-2026-10-17-painel-e-pedido-rolam-a-pagina.md:5`: o comentário diz que o merge leva 8 arquivos fora de `tasks/` ("7 testes e o TODO.md"). São 9: falta o `docs/interface.md`, que o próprio Sintoma, na linha 9, cita. A contagem só serve para justificar o limite do passo 5 de `corrigir`, então não muda a decisão. Vale corrigir o número.

O que conferi:

- **Marcadores de conflito.** Não há `<<<<<<<`, `=======` nem `>>>>>>>` no `TODO.md` nem em nenhum outro arquivo do índice. O `git diff --cached --check` saiu limpo.
- **As seis linhas do `TODO.md`.** O resultado contra a base comum (`b022543`) tem exatamente seis linhas acrescentadas. Primeiro vêm as quatro da linha 1 (c2e3398), depois as duas da spec (8642275), com o texto igual ao de cada ponta. Nada se perdeu e nada ficou em dobro.
- **O que veio da spec.** O índice difere do MERGE_HEAD (8642275, o commit que o documento cita) só pelo que a linha 1 trouxe desde a base, mais o próprio documento da correção. O resto veio da spec: os sete testes, o `docs/interface.md`, os dois arquivos da correção `vazio-durante-a-leitura`, o `indice.md` e o `estado.md`.
- **`estado.md`.** A linha 1 não o alterou desde a base, então ficar com a versão da spec está certo.
- **`Painel.test.tsx`.** As duas pontas o alteraram. O que o git juntou soma as asserções do vazio, vindas da spec, ao `matchMedia` e ao caso do miolo, vindos da linha 1, sem import repetido e sem bloco em dobro.
- **O documento bate com a árvore.** A causa, a resolução e o commit de fechamento estão descritos como aconteceram.

## test-engineer · 1ª rodada · APROVADO · 2026-10-17 18:45:04 · `tasks/correcoes/encontro-2026-10-17-painel-e-pedido-rolam-a-pagina.md`

VEREDITO: APROVADO

**Cenários exigidos:** Este encontro só junta o que as duas pontas já tinham, sem comportamento novo, então cabe conferir quatro pontos:
1. O `TODO.md` está sem marcador e com as seis linhas, sem texto alterado.
2. O `Painel.test.tsx` juntado tem os casos das duas pontas, sem perder nem duplicar nenhum.
3. As asserções da spec ainda valem sobre o `Painel.tsx` alterado pela linha 1.
4. Os arquivos que o git juntou sozinho (`indice.md`, `estado.md`, `docs/interface.md`) não têm marcador nem linha repetida.

**Cobertos:**
- **Os quatro pontos:** foram conferidos contra os dois pais, `git diff --cached HEAD` e `git diff --cached MERGE_HEAD`, com a base comum `b022543`.
- **`TODO.md`:** perto da linha 1425, ficam as quatro linhas da linha 1 e depois as duas da spec, com o texto igual ao de cada ponta. A busca por `<<<<<<<`, `=======` e `>>>>>>>` não acha nada em `TODO.md`, `indice.md`, `Painel.test.tsx`, `estado.md` e `docs/interface.md`.
- **`Painel.test.tsx`, contra a linha 1:** a árvore só acrescenta as 7 linhas da spec. São as asserções sobre o vazio e sobre a linha "Consumo do mês" no carregando e no erro, com o `findByRole('alert')` antes de conferir.
- **`Painel.test.tsx`, contra a spec:** a árvore só acrescenta o que a linha 1 trouxe: o `beforeEach` no import, o `janelaDe`, o `beforeEach(() => janelaDe(1366))` e o caso "a partir de 768 px o Painel é o miolo que rola…". Os dois acréscimos são disjuntos e somam exatamente as duas pontas, sem caso perdido nem duplicado.
- **O resto do diff:** é idêntico ao que a spec mudou desde a base (`git diff --stat b022543 MERGE_HEAD`, 13 arquivos e as mesmas contagens), mais o documento do encontro.
- **`npx vitest run` do `Painel.test.tsx` e do `Pedidos.test.tsx`:** os dois arquivos passaram, 56 de 56. As asserções da spec agora rodam com a largura de 1366 px da linha 1 e passam.
- **As quatro mutações do Painel da correção `vazio-durante-a-leitura`:** os trechos que elas trocam continuam no `Painel.tsx` juntado, nas linhas 149, 150 e 152. A linha 1 não mexeu no ramo do consumo, então elas ainda se aplicam.
- **`indice.md`:** recebe as 4 linhas da `vazio-durante-a-leitura` depois das da linha 1, sem repetir nenhuma.
- **`estado.md`:** fica com a versão da spec, sem marcador.
- **"Não há teste que reproduza":** vale. É conflito de texto numa lista de pendências, e o documento não precisa de mutações porque não traz cláusula nova.

**Bloqueantes:** nenhum

**Recomendações:**
- **A prova do documento é insuficiente como está escrita.** Em `tasks/correcoes/encontro-2026-10-17-painel-e-pedido-rolam-a-pagina.md:25-26`, "`Painel.test.tsx` verde isolado" mostra que o arquivo roda, não que nenhum caso se perdeu: um caso apagado no merge também deixaria o arquivo verde. Vale citar a conferência que prova de fato: o diff da árvore contra cada pai traz só o acréscimo da outra ponta.
- **Registrar as quatro mutações do Painel no documento.** A frase seria esta: as quatro mutações do Painel da `vazio-durante-a-leitura` ainda acham o trecho que trocam no `Painel.tsx` da linha 1 (`apps/web/src/areas/coordenacao/Painel.tsx:149-152`). Elas não foram rodadas de novo sobre o código juntado, porque o portão deste documento não declara mutação e eu não posso alterar arquivo. A chance de dar diferente é baixa, mas fica registrado.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/correcoes/encontro-2026-10-17-painel-e-pedido-rolam-a-pagina.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/TODO.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Painel.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Painel.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/correcoes/2026-10-17-vazio-durante-a-leitura.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/correcoes/achados/indice.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/prd-telas-da-coordenacao/estado.md`
