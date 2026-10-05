# Achados das revisões — `tasks/correcoes/2026-10-05-segunda-pessoa-cache-dos-vinculos.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-05 12:50:45 · `tasks/correcoes/2026-10-05-segunda-pessoa-cache-dos-vinculos.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Caminho feliz: a professora alocada vê a turma em "Turmas".
- Segunda pessoa na mesma aba: a coordenação entra sem recarregar e não vê o item "Turmas", o nome da professora nem o nome da turma.
- A guarda devolve "não encontrada" quando a coordenação vai a `/professor/turmas`.
- A coordenação não relê `meus-vinculos`.
- A professora e a coordenadora estão em escolas diferentes, então o teste também cobre o isolamento.
- O teste fica determinístico nos dois projetos (`chromebook` e `celular`).
- Nenhum outro spec tem a mesma corrida.

**Cobertos:** todos.

- **A causa é a real.** `Home.tsx:47` e `Turmas.tsx:63` usam a mesma consulta (`consultaMeusVinculos`, chave `['meus-vinculos']`). O cliente de consultas guarda o resultado por 30 s sem reler (`cliente-de-consultas.ts:25`). Por isso "Turmas" abre com a lista que a Nova conversa já leu e não vai ao servidor. O texto que a esteira capturou é exatamente o vazio de `Turmas.tsx:156`. A reprodução se sustenta: "Falta uma turma confirmada" só aparece com `vinculos.data !== undefined` (`Home.tsx:72`), então esperar por ele garante que a leitura voltou antes da inserção. `criarAlocacaoDoProfessor` (`sessao.ts:302`) cria um coordenador na mesma escola, mas com outra conta. A professora continua com um único acesso e o login não para na escolha de escola.
- **A correção não enfraquece o teste. Ela o fortalece.** Com a alocação gravada antes da entrada, o cache sempre tem o nome da turma (a linha 391 confirma isso). Antes, quando a corrida era perdida, o cache ficava vazio, e as asserções negativas das linhas 409 e 415 (`not.toContainText(alocacao.turmaNome)`) passariam sem provar nada se chegassem a rodar. Agora elas sempre provam que o fim da sessão limpou o cache. A contagem de leituras dos vínculos (`expect(leiturasDosVinculos).toBe(0)`), a guarda por papel e a lista de itens da coordenação não mudaram.
- **Mudar o teste e não o produto está certo aqui.** Nenhum requisito, PRD ou achado pede releitura ao abrir "Turmas". Pela D3, o fluxo real aloca antes do convite. Quem dá a releitura explícita hoje são o "Tentar de novo" do erro e o recarregar.
- **Nenhum outro spec tem a corrida.** Mapeei todo `criarAlocacaoDoProfessor` e toda alocação pela tela em outro navegador:
  - `inatividade.spec.ts` (65, 149, 297), `escola-e-vinculos.spec.ts` (134, 205, 287, 333, 363), `acesso-da-turma.spec.ts` (178, 264) e `fluxo-do-professor.ts:38` alocam antes de entrar.
  - `escola-e-vinculos.spec.ts:452` aloca depois e recarrega.
  - O W4 aloca depois e relê pelo "Tentar de novo".
  - `escola-montada.spec.ts:140` e `roteiro-da-demonstracao.spec.ts:257` alocam pela coordenação antes de a professora entrar no outro navegador.
- O typecheck do e2e (`tsc -p e2e/tsconfig.json`) e o lint de `e2e/areas.spec.ts` estão limpos.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Registrar no `TODO.md` a demora para a alocação aparecer.** Não é bug, mas tem um ponto concreto: o vazio da Nova conversa tem a ação "Ir para Turmas" (`Home.tsx:76`), que é justamente o que a professora clica depois de pedir a turma à coordenação. "Turmas" então mostra "A coordenação ainda não alocou você" por até 30 s. Se ela continuar na tela, o vazio fica até a aba perder e recuperar o foco ou a tela ser aberta de novo, porque o vazio de `Turmas.tsx:154-159` não tem botão de recarregar. Se um dia isso mudar (por exemplo, `refetchOnMount: 'always'` só na consulta de "Turmas"), o e2e que prova é este: "alocação feita com a Nova conversa aberta aparece em Turmas sem recarregar".
2. **Não deixar o W4 sem registro.** O item fechado no `TODO.md` era o único que acompanhava o W4. "10 de 10 sem mudança" não mostra causa, e `docs/mvp-rapido.md:480` ainda o declara intermitente. Vale manter uma linha aberta dizendo que a falha não se reproduziu e não tem causa conhecida, ou citar a esteira em que ele falhou, para que a próxima falha não pareça nova.
3. **Ajustar o texto da correção.** Ele chama de "comportamento declarado do cliente de consultas" o que é um padrão técnico (`staleTime`) e não uma decisão de produto. Escrito como "não é requisito hoje", fica mais preciso para o `/retro`.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-05-segunda-pessoa-cache-dos-vinculos.md
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/areas.spec.ts (linhas 380-417)
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/Home.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/professor/Turmas.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/vinculos.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/cliente-de-consultas.ts
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/casca.ts
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts
- /home/joaquimdp/Documentos/git/Educa.ia/TODO.md
