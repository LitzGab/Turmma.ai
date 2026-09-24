# Achados das revisões — `tasks/correcoes/2026-09-24-cookie-alterado-igual-ao-valido.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-24 15:00:13 · `tasks/correcoes/2026-09-24-cookie-alterado-igual-ao-valido.md`

VEREDITO: APROVADO

A correção se sustenta. O novo teste de unidade falha com a expressão antiga, passa com a nova e prova exatamente o defeito da esteira.

**Cenários exigidos (correção de teste intermitente, sem código de produção):**
- Reproduzir de forma determinística o valor que falhou na esteira (final `…uAq`).
- Reproduzir o outro formato do mesmo defeito (penúltimo `B` com último `A`).
- Mostrar que o resultado é sempre diferente do valor recebido, para qualquer par final do alfabeto base64url.
- Garantir que a troca continua no penúltimo caractere, para que o servidor seja de fato testado contra um cookie adulterado.
- Não enfraquecer o teste de integração.

Permissão, isolamento, concorrência e IA não se aplicam: é só código de teste.

**Cobertos, e conferi por conta própria:**
- **Vermelho antes, verde depois.** Apliquei as duas expressões aos sete valores de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/texto-adulterado.test.ts`:
  - Expressão antiga: `xyzuAq` e `xyzuBA` saem iguais ao valor recebido, que são os dois formatos do defeito.
  - Expressão nova: nenhum sai igual.
  - Testei também a nova em todos os 64 × 64 pares finais possíveis, e nenhum sai igual.
  - `npx vitest run --project unidade` com esse arquivo dá 7 de 7 verdes. Ele entra no projeto `unidade`, porque `**/*.test.ts` sem `.int` está incluído no `vitest.config.ts`.
- **O teste falharia sem a regra.** As asserções são sobre o resultado: diferente do valor, mesmo comprimento, prefixo e último caractere preservados, e caractere novo dentro do alfabeto base64url. Voltar à expressão antiga deixa o teste vermelho.
- **O penúltimo caractere é mesmo a escolha certa.** Em `apps/api/src/sessao/externa/cookie-oidc.ts:73`, o cookie é um bloco base64url único com IV, tag e texto cifrado. O penúltimo caractere carrega sempre 6 bits de dado, então trocá-lo muda pelo menos um byte, e a autenticação AES-GCM recusa o cookie. Com isso, o teste de integração continua provando a recusa pelo servidor.
- **A asserção nova no teste de integração é adequada.** `expect(alterado).not.toBe(valor)` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sessao-externa.int.test.ts:435` não mascara nada. Ela vem antes das chamadas ao servidor, e se a adulteração voltar a falhar, o erro aponta para o teste e não para o servidor. As asserções da regra de verdade continuam lá: `location` com falha do provedor, nenhuma sessão e nenhuma `conta_externa`.
- **Sem `.skip`, sem teste comentado, sem mock que esconda a regra.** O cookie da integração continua sendo o que o `iniciar` emite de verdade.
- **O documento da correção** (`/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-24-cookie-alterado-igual-ao-valido.md`) acerta a causa e a probabilidade (perto de 1 em 64). Ele também explica por que a reprodução é uma função pura e não um cookie forjado.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `apps/api/test/texto-adulterado.test.ts`: acrescentar um caso que percorra os 64 × 64 pares finais do alfabeto base64url. É barato, roda em milissegundos, e cobre todos os casos em vez de sete amostras.
2. `apps/api/test/convite.int.test.ts:438` tem um defeito parecido, fora do escopo desta correção. `const forjado = \`${bilhete.slice(0, -4)}AAAA\`` sai igual ao bilhete válido quando ele já termina em `AAAA`, o que é raríssimo (cerca de 1 em 16 milhões). O ponto mais sério é outro: pelo que se vê logo abaixo (linha 445), o bilhete válido nas mãos da dona do e-mail também dá `'pronta'` e não ativa A. Então essa asserção provavelmente não distingue um bilhete forjado de um válido. Vale registrar para o `/retro` ou abrir uma correção própria.
3. As duas falhas de integração em `apps/worker/test/reexecucao.int.test.ts` e `apps/despachante/test/metricas-espera.int.test.ts` (ids v4 aleatórios desde o commit 829ab8d) não têm relação com esta correção. Mas seguram a esteira e a próxima tarefa (regra 40), então a correção própria delas deveria vir logo em seguida.
