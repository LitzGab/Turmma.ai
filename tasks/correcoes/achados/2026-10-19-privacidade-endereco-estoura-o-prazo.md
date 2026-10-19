# Achados das revisões — `tasks/correcoes/2026-10-19-privacidade-endereco-estoura-o-prazo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-19 18:36:20 · `tasks/correcoes/2026-10-19-privacidade-endereco-estoura-o-prazo.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/privacidade.spec.ts:72`: `entrarPelaApiComSegundoFator` repete o que `entrarPelaApi` já faz em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/__fixtures__/segundo-fator.ts`, só que no contexto da página, que guarda o cookie. A correção `2026-10-19-acesso-suspenso-passa-do-prazo` tem a mesma causa. Se ela precisar do mesmo atalho, vale levar o ajudante para o `segundo-fator.ts` em vez de criar uma segunda cópia local.
- O código TOTP do passo seguinte (`codigoDoAutenticador(segredo, 30)`) depende de o servidor aceitar uma janela de um passo à frente. Isso já aparece em três outros specs (`painel-da-coordenacao`, `roteiro-da-demonstracao` e `sino-da-coordenacao`) e não é novo. Vale um comentário no ajudante, se ele for para o fixture, dizendo de qual tolerância do servidor ele depende.

A mudança só mexe em teste e2e: nenhum código de produção, rota, fila, migration ou chamada de modelo foi alterado. As duas asserções do caso continuam, e as mutações declaradas atingem os dois redirecionamentos que o caso prova (`rotas.tsx` e `Privacidade.tsx`). Sair da rede lenta em `carregarSemRedeLenta` vale só durante o `goto` e a asserção, e a rede do perfil volta no `finally`. A CPU ×4 continua. Nenhum provedor pago é chamado.

## test-engineer · 1ª rodada · APROVADO · 2026-10-19 18:36:57 · `tasks/correcoes/2026-10-19-privacidade-endereco-estoura-o-prazo.md`

VEREDITO: APROVADO

**Cenários exigidos.** Esta correção só torna mais rápido um teste que já existia. Não muda nenhuma regra do produto, então o que precisa ser provado é que o teste continua provando a mesma regra.
- **Caminho feliz:** `/coordenacao/privacidade` abre `/coordenacao/privacidade/pedidos`, com a aba Pedidos selecionada.
- **Borda:** um endereço com aba que não existe (`/coordenacao/privacidade/nao-existe`) cai na mesma aba.
- **Borda:** a sessão é restaurada pelo cookie de renovação, como quando a coordenadora volta a uma aba aberta, e não por uma entrada recente feita na tela.
- **Permissão e isolamento:** não se aplicam a esta correção. A aba Privacidade continua com os casos próprios desses dois pontos no mesmo arquivo, e nenhum deles mudou.

**Cobertos.**
- **As três asserções continuam iguais.** São as duas do endereço final e a do `aria-selected` da aba Pedidos (`e2e/privacidade.spec.ts:165-174`). A regex `ENDERECO_DOS_PEDIDOS` (`:17`) vai até o fim do endereço (`$`). Se a restauração da sessão falhasse, a página ficaria em `/entrar` e o teste ficaria vermelho, então a entrada pela API não faz o teste passar por engano.
- **Cada mutação chega ao trecho que muda.**
  - A primeira troca o destino de `/coordenacao/privacidade` em `rotas.tsx`. O primeiro `toHaveURL` (`:167`) falha.
  - A segunda troca o destino da aba desconhecida em `Privacidade.tsx`. O segundo `toHaveURL` (`:171`) falha.
  - O teste fica vermelho pelo motivo certo nas duas. O diff não traz regra nova sem mutação.
- **O atalho não esconde nada.**
  - `carregarSemRedeLenta` tira só a rede lenta, e só durante as duas aberturas de página. A CPU ×4 continua, e ele devolve a rede no `finally` (`e2e/__fixtures__/perfis.ts:93-102`).
  - A entrada pela API é real, não um mock: o segundo fator é configurado de verdade (`configurarSegundoFatorPelaApi`) e o código passa pelo servidor.
- **O código do passo seguinte não falha por causa do relógio.** O código vem de `codigoDoAutenticador(segredo, 30)`, e o servidor aceita um passo de diferença para cada lado (`JANELA_TOTP = 1`, `apps/api/src/sessao/segundo-fator.ts:14`). Ele é aceito mesmo que a ativação e a entrada caiam em passos diferentes, o mesmo padrão de `entrarComoCoordenacaoNaMesmaAba`.
- **A margem de tempo é real, não depende de máquina folgada.**
  - Antes: 25,8 a 28 s contra um prazo de 30 s.
  - Depois: 1,9 a 2,4 s, contra a metade do prazo que o portão cobra das linhas alteradas (15 s).
- **Itens proibidos:** nenhum `.skip`, nenhum teste comentado, nenhum `any` e nenhuma chamada a provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações.**
1. **Ajudante duplicado.** `entrarPelaApiComSegundoFator` (`e2e/privacidade.spec.ts:72-82`) repete quase tudo de `entrarPelaApi` (`e2e/__fixtures__/casca.ts:259-270`), só acrescentando o passo do segundo fator. Seria melhor levá-lo para `e2e/__fixtures__/casca.ts` ou `e2e/__fixtures__/segundo-fator.ts`, ou dar a `entrarPelaApi` um segredo opcional. A correção `2026-10-19-acesso-suspenso-passa-do-prazo` teve a mesma causa, e o próximo caso lento vai querer o mesmo ajudante.
2. **Outros casos do mesmo arquivo pagam a mesma entrada pela tela.** Fazem os dois logins e a configuração do segundo fator com CPU ×4:
   - `entrarNaPrivacidade` (`:62-63`)
   - "os estados" (`:190-191`)
   - "a troca de escola" (`:242`)
   - "a segunda pessoa na mesma aba", da retenção (`:273-274`)
   - o ajudante das empresas (`:307-308`)
   - "a segunda pessoa na mesma aba", das empresas (`:451-452`)

   Os dois de "segunda pessoa" precisam da entrada na mesma aba porque afirmam algo sobre o cache dessa aba, e devem ficar como estão. Os outros devem ser medidos na esteira antes de estourarem o prazo um a um.
3. **Fechamento do caso no celular.** Com `hasTouch` fora, nada no caso usa toque, o que está certo para o que ele afirma. Vale dizer isso numa linha do documento da correção, para o `/validar` não ler a remoção como perda de cobertura no celular.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/privacidade.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/tasks/correcoes/2026-10-19-privacidade-endereco-estoura-o-prazo.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/__fixtures__/perfis.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/__fixtures__/segundo-fator.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/__fixtures__/casca.ts`
