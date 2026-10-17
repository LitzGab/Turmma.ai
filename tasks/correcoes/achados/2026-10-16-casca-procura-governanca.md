# Achados das revisões — `tasks/correcoes/2026-10-16-casca-procura-governanca.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-16 23:38:31 · `tasks/correcoes/2026-10-16-casca-procura-governanca.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum
Recomendações:
- O documento da correção cita uma hipótese sobre `e2e/acesso-suspenso.spec.ts:169`: o teto de 30 s seria curto para duas entradas de página. Essa hipótese não tem tarefa nem anotação que a acompanhe. Se o caso cair de novo na esteira, a correção já está escrita lá (`test.slow()`). Vale registrar isso no `TODO.md` ou no estado do andar, para não depender de alguém reler este documento.

O que conferi:
- **A troca está certa.** A primeira entrada da coordenação em `apps/web/src/areas/navegacao.ts:54` é `Painel`. O teste compara o tamanho do botão "Sair" com o do primeiro link de "Seções" (`conferirOSair`, em `e2e/casca.spec.ts`), e esse link agora é o Painel.
- **Não ficou outra referência ao antigo primeiro link.** O nome `'Governança'` não aparece mais em `e2e/casca.spec.ts`.
- **O diff é só essa linha.** Nenhum código de tela mudou, e o documento explica a causa: a tarefa 3.0 trocou os lugares da coordenação e não atualizou este teste.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/casca.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/correcoes/2026-10-16-casca-procura-governanca.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/navegacao.ts

## test-engineer · 1ª rodada · APROVADO · 2026-10-16 23:38:55 · `tasks/correcoes/2026-10-16-casca-procura-governanca.md`

VEREDITO: APROVADO

**Cenários exigidos:** esta correção não traz regra nova. Ela conserta um dado do teste. O cenário que vale é o W12 da coordenação. O teste precisa achar o primeiro lugar da navegação "Seções" e comparar com ele a altura e a largura do "Sair", com a lateral aberta e recolhida, a 1366 e a 900 px, em janela baixa, na gaveta, e com o Tab indo do "Abrir a lateral" para o primeiro lugar. Professor e aluno não mudam.

**Cobertos:**
- O `git diff` tem uma linha só, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/casca.spec.ts:624`: `primeiro: 'Governança'` virou `primeiro: 'Painel'`. Nenhum código de tela mudou.
- O valor novo bate com o código. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/navegacao.ts:54`, Painel é o primeiro item da coordenação, e o rótulo é único entre os quatro (Painel, Analista, Escola, Registros). Com `exact: true`, o localizador não pega dois links.
- O vermelho antigo era pelo motivo errado: o link "Governança" não existe mais, e o `boundingBox()` ficava esperando até estourar os 120 s, sem chegar à asserção. Com "Painel", o cenário volta a chegar às asserções de altura e largura (`casca.spec.ts:664-667`) e de foco no trilho (`:702-704`).
- O teste falharia se a regra fosse removida. Se o "Sair" deixar de ter o tamanho do vizinho, `toBe(vizinho?.height)` falha. Se Painel deixar de ser o primeiro lugar, o `toBeFocused()` depois do Tab (`:703`) falha.
- Não sobrou nenhuma referência a "Governança" em `casca.spec.ts`. Não há `.skip`, mock nem chamada de IA no diff.
- A falta da seção "Mutações" não bloqueia: a correção não acrescenta cláusula de produção.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `e2e/casca.spec.ts:621-625`: quando a navegação é reordenada, a tabela `PAPEIS_DA_CASCA` só falha por estouro de 120 s, sem dizer o motivo. Foi o que escondeu a quebra da 3.0. Duas saídas:
   - asserir logo depois de `entrarNaCasca` que o primeiro link de "Seções" tem o nome `primeiro`, para falhar em segundos e com mensagem clara;
   - ou ler `primeiro` da própria `navegacao.ts`, para não manter o rótulo em dois lugares.
2. `e2e/acesso-suspenso.spec.ts:169` ("duas abas") está fora deste diff, mas fica o alerta. A hipótese do próprio documento é de duas entradas de página mais três esperas de até 20 s (`PRAZO_DA_ENTRADA_MS`, linhas 182, 188 e 195), sob o teto de 30 s. Se isso se confirmar, o teste só passa com a máquina folgada. Isso pede correção própria agora, com `test.slow()` ou um teto que caiba nas esperas declaradas, em vez de esperar a segunda ocorrência na esteira.

## test-engineer · 2ª rodada · APROVADO · 2026-10-16 23:45:09 · `tasks/correcoes/2026-10-16-casca-procura-governanca.md`

VEREDITO: APROVADO

**Cenários exigidos:** esta correção mexe só no teste e não muda nenhuma regra do produto. Ela precisa provar duas coisas:
- se a navegação da coordenação (ou de qualquer papel) mudar de ordem, `conferirOSair` falha logo e diz o motivo, em vez de estourar os 120 s do `boundingBox()`;
- o item do `TODO.md` sobre `e2e/acesso-suspenso.spec.ts:169` aponta para a seção do documento que explica o caso.

Isolamento, permissão e concorrência não se aplicam: nada aqui toca dado de escola nem caminho de servidor.

**Cobertos:**
- **A asserção nova** está em `e2e/casca.spec.ts:665`. O teste roda os três papéis da tabela, então a asserção vale para professor, aluno e coordenação.
- **A mutação do documento chega à cláusula nova.** Ela troca `primeiro: 'Painel'` por `'Governança'` em `e2e/casca.spec.ts:624`, e o texto confere com o arquivo. O caso W12 da coordenação (linha 676) só usa `primeiro` a partir da chamada `conferirOSair` da linha 687. As linhas 682 a 685 não dependem dele. Por isso o vermelho cai na linha 665, com a mensagem `o primeiro lugar de "Seções" não é o da tabela PAPEIS_DA_CASCA`, que é o motivo certo.
  - Sem a linha nova, a mesma mutação provavelmente não falharia no `boundingBox()`: o link "Governança" existe e deve ter o mesmo tamanho de "Painel". A quebra só apareceria na linha 706 (`toBeFocused`), e a linha nova fecha justamente essa lacuna.
- **A asserção confere o resultado.** Ela exige o nome acessível do primeiro link, não só que o código rode.
- **As recomendações da 1ª rodada:**
  - A primeira saída do item 1 foi aplicada.
  - Recusar a segunda saída (ler `primeiro` de `navegacao.ts`) tem motivo bom: o e2e ficaria preso ao módulo da web, e a primeira saída já faz o teste falhar rápido e com motivo.
  - O item de `acesso-suspenso.spec.ts:169` ficou fora do escopo, com destino no `TODO.md` e a correção já descrita (`test.slow()`). Não reproduziu em 10 execuções, e eu não mandei rodar sob carga.
- Não há `.skip`, teste comentado, mock nem chamada de IA no diff.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova. A recomendação da 1ª rodada sobre o teto de 30 s de `e2e/acesso-suspenso.spec.ts:169` continua registrada em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/TODO.md` (linha 1314), para o `/retro`. Se o caso voltar a cair na esteira, ele vira correção própria.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/casca.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/correcoes/2026-10-16-casca-procura-governanca.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/TODO.md`
