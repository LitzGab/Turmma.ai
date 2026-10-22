# Achados das revisões — `tasks/prd-reengenharia/6_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-22 12:44:45 · `tasks/prd-reengenharia/6_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nem migration. `suspensao_de_funcao` só mudou de arquivo, e o filtro por `escolaId` continua vindo de `exigirEscolaDoContexto()`.

Queries verificadas:
- `SuspensoesDaEscolaRepository.vigentes` saiu de `time.service.ts` para `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/assistente/suspensoes-da-escola.repository.ts` sem mudança. O escopo continua vindo do contexto, não de parâmetro.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/escopo-dos-repositories.ts` varre os 72 `*.repository.ts`.
- Todo construtor de repository recebe o banco com tipo que o analisador reconhece (`Banco`, `TransacaoBanco` ou `ExecutorDeAuditoria`), inclusive os de várias linhas: `orcamento`, `supervisao` e `tutor`. Nenhum repository usa banco importado no topo do módulo, e nenhuma classe `*Repository` fica fora de um `*.repository.ts`.
- A lista de exceções `REPOSITORIES_SEM_ESCOPO` tem 22 arquivos, com motivo por método. Ela registra dívida que já existia, com a tarefa que tira cada entrada (7.0, 8.0 e 47.0). Não abre exceção nova.
- Conferi dois motivos no código e os dois batem:
  - `titulares.homonimo` repassa o banco a `haHomonimoDoTitular`, que lê `exigirEscolaDoContexto()` (`packages/nucleo/src/titular/homonimo.ts:16`).
  - `compartilhamento.datasDeReferencia` só faz conta de datas, sem ler tabela (`compartilhamento.repository.ts:58-62`).

Teste de isolamento: presente e efetivo. Rodei `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/repositories-com-escopo.test.ts` e passaram os 51 casos.
- O "remova e quebra" funciona. Tirar `exigirEscolaDoContexto()` de `AlunosAtivosRepository.contar` ou de `SuspensoesDaEscolaRepository.vigentes` deixa o teste da varredura real vermelho, e as duas mutações estão declaradas.
- Devolver a classe a `time.service.ts` também reprova.
- A lista é comparada inteira com `toEqual`: ela não cresce sem mudar o teste.
- O teste também prova que a varredura não passa vazia: acha os repositories conhecidos, e todo arquivo varrido tem ao menos um método que toca o banco.

Bloqueantes: nenhum

Recomendações:
- O analisador só olha arquivos `*.repository.ts` ou que declaram `class *Repository`. Uma função de outro arquivo que receba `Banco` e faça consulta, no estilo de `homonimo.ts`, fica fora da trava. Vale registrar esse limite no cabeçalho do analisador, ao lado do limite que já está escrito lá.
- A prova (a) não distingue o escopo de escola do escopo de ano letivo: um método com `exigirEscolaDoContexto()` e sem `anoLetivoId`, numa tabela que varia por período, passa. O limite já está declarado ("a prova (a) não vê o `where`"). Os testes de isolamento de cada módulo continuam sendo a defesa disso.
- As entradas de `ia/consumo`, `ia/orcamento` e `ia/suspensao` recebem a escola por argumento, o que a regra 10, item 3, proíbe. A entrada na lista está correta como dívida declarada, mas a 8.0 precisa de fato tirá-las. A trava já força isso: método que passa a provar o escopo e continua na lista reprova.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-22 12:44:46 · `tasks/prd-reengenharia/6_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. As quatro divergências estão registradas na tarefa e escritas também em `onda-1a.md` §2, T6, que é o documento da onda pela forma R34 da `techspec.md`: o motivo estático, a função exportada como ponto de entrada, repassar o banco conta como tocar, e a lista com 22 arquivos. Esta spec não tem `cenarios.md`.

Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")

Bloqueantes: nenhum

Recomendações:
1. `tools/guardas/escopo-dos-repositories.ts:326-341`: só conta como pública a função que traz `export` na própria declaração. Se a função for declarada sem `export` e exportada depois, com `export { f }` ou `export default f`, a guarda não a vê. Hoje nenhum `*.repository.ts` faz isso (conferi), mas é uma porta de fuga da trava. Vale tratar e criar uma fixture para o caso.
2. `tools/guardas/repositories-com-escopo.test.ts:161`: o número 30 está escrito à mão. Melhor usar `TAMANHO_MINIMO_JUSTIFICATIVA_SEM_ESCOPO`, como o analisador já faz.
3. `tasks/prd-reengenharia/onda-1a.md`: o parágrafo novo diz "Além dos 18 acima", mas o texto que ficou logo antes ainda diz "Dos 17 outros", e a conta 9 + 3 + 6 dá 18. A seção 1 fala em "71 repositories" e o T6 em "Os 25 de hoje". Convém acertar os números.
4. `onda-1a.md`, parágrafo da 9.0: ainda diz "Hoje só `time.service.ts` viola". Depois da 6.3 o `suspensaoDeFuncao` passou para `suspensoes-da-escola.repository.ts`, e a frase ficou velha. A correção cabe à 9.0, quando ela for feita.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/escopo-dos-repositories.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/repositories-com-escopo.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/__fixtures__/repositories/
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/assistente/suspensoes-da-escola.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/assistente/time.service.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/onda-1a.md

## test-engineer · 1ª rodada · APROVADO · 2026-10-22 12:44:53 · `tasks/prd-reengenharia/6_task.md`

VEREDITO: APROVADO

**Cenários exigidos (tarefa 6.0, a trava de tenant por AST):**
- **Caminho feliz:** todo método público real dos repositories tem uma das três provas. A primeira é chamar a função de escopo que vem do contexto, a segunda é `@SemEscopo` com motivo, a terceira é estar na lista fechada. Também conta achar o repository conhecido, `AlunosAtivosRepository.contar`.
- **Casos de borda deste domínio:**
  - SQL cru pela transação
  - o banco recebido por parâmetro, ou como executor de auditoria
  - função exportada do módulo
  - a prova só em comentário ou em texto
  - cópia local da função de escopo, e import com alias
  - ajudante do mesmo arquivo e de outro arquivo, inclusive com ciclo entre ajudantes
  - `escolaId` vindo por parâmetro
  - propriedade de seta pública, acessor get e set, sobrecarga, classe ou função sem nome
  - motivo com 29 e com 30 caracteres, e motivo que não é texto estático
  - `XRepository` morando num `.service.ts`
  - arquivo que não compila
- **Permissão (quem não pode, não consegue):** método público sem prova reprova. A exceção da lista vale por método, não para o arquivo todo, e só no arquivo da entrada. O `@SemEscopo` escrito no próprio arquivo, em vez de importado, não vale.
- **Isolamento:** a segunda linha da tabela de testes é o "remova e quebra" da regra 10.5. O bloco que tira a chamada de escopo de `AlunosAtivosRepository.contar` cobre isso, e o que troca o escopo em `suspensoes-da-escola.repository.ts:16` também.
- **Concorrência e IA:** não se aplicam. É análise estática, sem banco, sem fila e sem provedor.

**Cobertos:**
- As 26 linhas da tabela têm teste em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/repositories-com-escopo.test.ts`, citado pelo nome. As linhas compostas foram conferidas item a item:
  - "só `identidadeDaRequisicao`; só `escopoDoJobNoContexto`" tem um método para cada uma na fixture `provas-do-contexto.repository.ts`.
  - "decorator e satisfies; erro de parse" tem dois testes separados.
- A asserção é sobre o resultado: `reprovaOndeDiz` exige exatamente as marcas `reprova:` de cada fixture, por linha e por código, e falha se a fixture perder as marcas. `passaLimpa` exige zero marcas e zero acusações.
- A lista real é conferida inteira com `toEqual`, e a leitura das pastas tem um teste numa pasta temporária.
- A seção "Mutações" cobre todo o `git diff`:
  - as cláusulas do analisador e da leitura das pastas;
  - a amarra de `alunos-ativos` e a de `suspensoes-da-escola`;
  - a volta do repository para `time.service.ts`;
  - uma entrada a mais na lista, e o motivo curto na lista.
- Não achei `.skip`, teste comentado nem mock. O arquivo isolado roda verde: 51 de 51.
- A mudança de `SuspensoesDaEscolaRepository` para o arquivo próprio não deixou nenhum import pendurado: só `time.service.ts` usa a classe.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Há dois jeitos de escapar da trava sem fixture nem limite declarado:
   - parâmetro desestruturado, como `({ banco }: { banco: Banco })`. Em `escopo-dos-repositories.ts:250`, `parametro.name.getText()` devolve `{ banco }`, e o uso de `banco` no corpo não é visto.
   - alias de tipo local, como `type Db = Banco`. Em `tipoEhOBanco`, o tipo é reconhecido pelo nome.

   Não existe hoje no código: procurei nas pastas `apps/api/src` e `packages/nucleo/src` e não achei. Sugiro uma fixture para cada um, ou declarar os dois no limite do cabeçalho do analisador.
2. Os testes `repositories-com-escopo.test.ts:198` e `:304` têm o mesmo começo de nome: "o motivo de 29 caracteres reprova, e o de 30 passa". Os blocos de mutação que citam o nome curto pegam os dois. Sugiro renomear o da lista para "a entrada da lista com motivo de 29…".
3. Em `repositories-com-escopo.test.ts:161`, o 30 está escrito à mão. Usar `TAMANHO_MINIMO_JUSTIFICATIVA_SEM_ESCOPO`, como o analisador faz, evita que os dois divirjam.
4. O `toEqual` da lista real (`:134`) não compara o `motivo`. Um motivo trocado por outro com 30 caracteres ou mais passa calado. Isso é aceitável: o motivo é evidência e não regra, e o tamanho já é conferido.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 12:52:08 · `tasks/prd-reengenharia/6_task.md`

VEREDITO: APROVADO

Cenários exigidos: na 1ª rodada, a trava de tenant por AST nos `*.repository.ts`, com as três provas (contexto, `@SemEscopo` com motivo estático, entrada na lista), a lista que só encolhe, o motivo curto e os casos de borda do analisador: alias de import, função exportada, repasse do banco, ciclo entre ajudantes e pasta com `.ts`. Nesta 2ª rodada conferi só o diff de `f1588b5` para `37a1cd1` e as quatro correções que a Mesa mandou aplicar.

Cobertos:
- **O 30 escrito à mão** foi trocado pela constante: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/repositories-com-escopo.test.ts:162` usa agora `TAMANHO_MINIMO_JUSTIFICATIVA_SEM_ESCOPO`. A prova não ficou presa à constante. O teste da lista ainda corta a partir do texto fixo `MOTIVO_DE_30` (linha 21), então baixar a constante em `sem-escopo.decorator.ts:2` deixaria vermelho o teste "a entrada da lista com motivo de 29 caracteres reprova, e a de 30 passa".
- **O nome ambíguo do teste da lista** foi trocado por "a entrada da lista com motivo de 29 caracteres reprova, e a de 30 passa", na linha 305. Os dois blocos de mutação que provam `entrada.motivo.trim().length < TAMANHO_MINIMO…` mudaram junto, nas linhas 756 e 770 de `6_task.md`. Antes, o nome curto pegava também o teste do `@SemEscopo`. As sete citações que sobraram com o nome antigo (linhas 316, 404, 592, 599, 606, 638 e 721) trazem o sufixo "; o espaço das pontas não conta". Elas apontam, como devem, para o teste do decorator, na linha 199. Nenhuma citação ficou órfã.
- **Os limites no cabeçalho do analisador** foram escritos: são os quatro em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/escopo-dos-repositories.ts:25-32`. A mudança é só de comentário, então não cria cláusula nova e não pede bloco de mutação.
- **Os números de `onda-1a.md`** fecham: 9 + 3 + 5 = 17, mais o `ia/execucao` dá 18, mais 4 dá 22, sobre 72 repositories. Batem com a tabela de desvios de `6_task.md:98`. É mudança de texto, sem efeito em teste.
- Rodei `npx vitest run tools/guardas/repositories-com-escopo.test.ts`: os 51 passam. Não há `.skip`, mock nem provedor de IA no diff, e o diff não traz operação concorrente.

Bloqueantes: nenhum.

Recomendações:
- O nome "cada entrada diz o motivo com pelo menos 30 caracteres", na linha 161, ainda diz 30 por extenso, e o corpo agora usa a constante. Se a constante mudar, o nome fica errado. Pode virar "cada entrada diz o motivo com o tamanho mínimo do `@SemEscopo`". Isso é só texto.
- As recomendações que ficaram sem aplicar na 1ª rodada continuam registradas em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/achados/6_task.md`, para o `/validar` e o `/retro`.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 12:52:18 · `tasks/prd-reengenharia/6_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

As quatro recomendações que a Mesa mandou aplicar estão feitas:
- **O 30 escrito à mão:** saiu. O teste agora usa `TAMANHO_MINIMO_JUSTIFICATIVA_SEM_ESCOPO`, importado do decorator.
- **Nome do teste da lista:** mudou. Os dois blocos de mutação em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/6_task.md` já citam o nome novo, e o carimbo vale para a árvore atual.
- **Cabeçalho do analisador:** declara os quatro limites, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/escopo-dos-repositories.ts:25-32`.
- **Números de `onda-1a.md`:** batem com a árvore. Contei:
  - 72 arquivos `*.repository.ts` fora de `__fixtures__`.
  - 22 entradas em `REPOSITORIES_SEM_ESCOPO`, nas linhas 59 a 164.
  - 11 arquivos com `@SemEscopo(` em algum método.
  - 2 nos dois grupos: `ia/execucao` e `ops/operacao-privacidade`.
  - A conta 9 + 3 + 5 = 17, mais o `ia/execucao`, dá os 18 da lista do desenho. Somando os 4 achados por método, chega aos 22.
  - Os "8 já tinham" falam do desenho e os 11 da árvore. O texto deixa claro que são medidas diferentes, então não há contradição.

Recomendações:
- **Frase do cabeçalho:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/escopo-dos-repositories.ts:25` diz que nenhum dos limites "existe hoje no código". Mas o primeiro item usa de exemplo a função de `homonimo.ts`, que existe hoje e fica fora da trava. Ela só não passa sem acusação porque o `titulares.homonimo` está na lista. Melhor trocar por algo como "hoje só a de `homonimo.ts`, coberta pela entrada de `titulares`", para o comentário não se contradizer.
- **Destinos das recomendações não aplicadas:** o prompt diz que as recomendações não aplicadas já foram para a tabela, com destino. A tabela "Recomendações sem aplicar" de `6_task.md` (linhas 885-886) ainda está vazia, e o `TODO.md` não tem a linha do `export { f }`/`export default f`. Pelo `/executar-task`, a tabela se copia quando o relatório final vier "APROVADO por todos", e a linha do `TODO.md` precisa entrar no commit da tarefa. Antes do commit, confira se as duas coisas foram feitas.
