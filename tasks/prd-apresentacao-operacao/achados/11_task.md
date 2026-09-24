# Achados das revisões — `tasks/prd-apresentacao-operacao/11_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-24 07:06:04 · `tasks/prd-apresentacao-operacao/11_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- E1, o caminho feliz: convite, senha nova, configurar (QR, chave em texto, `otpauth://`, códigos com "Copiar" anunciado), primeiro código e casca, em `chromebook` e `celular`, com axe
- Convite usado, vencido, revogado e inexistente mostram a mesma tela, sem nome nem e-mail de quem foi convidado. É o caso de permissão: quem tem um link que não vale não passa
- O token sai da barra antes da primeira chamada (regra 20, item 8)
- Recarregar o configurar não mostra os códigos de novo, e o navegador pergunta antes de sair
- "Configure de novo" leva à entrada com a mensagem, e o QR novo funciona
- Desafio vencido ou ausente leva à entrada, sem erro cru
- Nada sensível em `localStorage`, `sessionStorage` ou URL
- Teclado do começo ao fim, com foco visível e o "Copiado" anunciado
- Concorrência: clique repetido no aceite, e duas abas configurando
- Isolamento entre escolas: não se aplica, porque o operador não tem tenant e a tarefa não lê dado de escola

**Cobertos:**
- `e2e/operacao-convite.spec.ts:95-187` (E1): a consulta fica segurada, e o teste lê a barra no momento em que a chamada sai. Confere também o `no-store` da resposta, o `href` com o `otpauth`, e a área de transferência depois de "Copiar" a chave e "Copiar" os códigos. No fim, confere que segredo e códigos não ficam no corpo da página, no armazenamento nem em URL de pedido algum
- `:189-208`: os quatro convites inválidos, com o texto das quatro telas comparado letra por letra (`Set` de tamanho 1)
- `:210-232`: o aceite fica segurado e o teste tenta de três jeitos (toque ou clique, `dispatchEvent` e Enter). Sai um aceite só
- `:234-253`: recarregar dispara o `beforeunload` e depois não mostra segredo, códigos nem o campo deles
- `:255-273`: a API recusa o desafio com 401, e a tela vai à entrada com o texto próprio, sem o texto da API
- `:275-298`: duas abas de verdade no mesmo contexto. A primeira recebe o 409, volta à entrada, e o QR novo abre a sessão. A sequência é a certa aqui: o servidor já é provado pelo C18, e o que se prova é que a tela não fica presa
- `:300-333`: o fluxo inteiro por teclado
- `apps/web/src/operacao/api/convite-e-mfa.test.ts`: o desafio passa de uma etapa à outra. O 503 e o 429 deixam o desafio, o 401 o gasta, o 409 gasta o `mfa` e a sessão não abre. O desafio de uma entrada anterior na mesma aba sai antes do aceite
- Não há `.skip`, teste comentado nem provedor de IA. As únicas respostas simuladas são o 401 e a consulta segurada, e nenhuma delas esconde a regra testada

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Quatro convites inválidos (`e2e/operacao-convite.spec.ts:193-198`).** Do segundo convite em diante, o `page.goto` muda só o `#`. As asserções das linhas 195 e 196 podem passar ainda em cima do aviso do convite anterior. O teste não passa por engano: o `Set` da linha 207 e a URL da linha 197 pegam uma tela diferente. Mas ele depende da ordem dos eventos e pode falhar à toa no Chromebook lento. A correção é registrar `page.waitForResponse` da consulta antes de cada `goto` e esperá-lo antes das asserções.
2. **Código recusado ao configurar (`ConfigurarMfa.tsx:25-31`, `:136-139`).** Não há teste da volta à entrada com `TEXTO_DA_CONFIGURACAO_RECUSADA` nem da variante com a conta segurada. Caberia um e2e com um código errado.
3. **Log do navegador (subtarefa 11.5).** A subtarefa fala em log do navegador, e nenhum teste confere o console. No E1, vale juntar `page.on('console')` e conferir que nenhuma linha traz o token, a senha, o segredo ou os códigos.
4. **Desafio `mfa` ao sair da tela (`ConfigurarMfa.tsx:93-99`).** Sair do configurar sem ativar deve apagar o desafio `mfa`, e nenhum teste prova isso. Por exemplo: navegar para `/operacao/mfa` depois de sair e ver que a tela pede para entrar de novo.
5. **Senha limpa na falha do aceite (`Convite.tsx:102`).** Não há teste de que o campo volta vazio depois de um 503 no aceite.
6. **"Tentar de novo" com 503 e 429.** O caminho existe no `configurar` e no `consultar`, e só o módulo tem teste de unidade. Falta um e2e em que a resposta simulada falha uma vez e o "Tentar de novo" leva à tela com dado.
7. **Operador desativado.** O texto em `textos.ts` lista cinco casos (o quinto é o operador desativado) e o e2e cobre quatro. A fixture poderia ganhar esse estado.
8. **`hashchange`.** Outro link colado na mesma aba só é coberto de passagem, pelo teste dos inválidos. Falta um teste direto: a senha digitada some quando chega um token novo.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-convite.spec.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/api/convite-e-mfa.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Convite.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/ConfigurarMfa.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/api/convite.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/api/mfa.ts
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/operacao.ts

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-24 07:06:57 · `tasks/prd-apresentacao-operacao/11_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** nenhum campo novo. A tarefa só mexe na web. Os dados que passam pelas telas são do operador Turmma (o token do convite, a senha nova, o segredo do segundo fator e os códigos de recuperação), e nenhum é dado de aluno. Esses dados já estão no mapa de dados, em `docs/lgpd.md:76-78`.

**Fora da tabela de dados do docs/lgpd.md:** nada.

**Autorização por objeto:** ok.
- Não há rota de objeto nova. A web só chama `convite/consultar`, `convite/aceitar` e `mfa/configurar`, que vieram das tarefas 6.0 e 7.0.
- O token vai no corpo, nunca na URL (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/api/convite.ts:20-22`).
- A consulta devolve só `{ valido: true }` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/convite.ts:18`), sem o apelido, o nome ou o e-mail de quem foi convidado.
- Convite usado, vencido, revogado e inexistente mostram a mesma tela. O link sem token e o `%` quebrado também. O e2e prova isso comparando as telas letra por letra (`/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-convite.spec.ts:189-208`).

**Logs:** limpos. Não há `console.*` e nada vai para `localStorage` ou `sessionStorage` em `apps/web/src/operacao`. O e2e confere que o armazenamento do navegador fica vazio e que nenhum endereço de requisição leva o token ou o segredo (`operacao-convite.spec.ts:83-92` e `:183-186`).

**Auditoria:** presente. Configurar o segundo fator já é auditado na API (7.0, `auditoria_operacao`), e esta tarefa não cria ação que exija auditoria nova.

**Envio externo:** nenhum. O QR é gerado no próprio navegador, com `qrcode-generator` desenhando em SVG (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/CodigoQr.tsx`), sem serviço de terceiro. Não há chamada de IA.

**Seed/fixture:** sintético. `criarOperadorConvidado` usa apelido e nome inventados, e-mail em `@turmma.invalid` e token aleatório. O banco guarda só o SHA-256 do token, e cada operador criado é apagado no fim do teste (`/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/operacao.ts:242-264`).

**Regra 20, item 8 (convite):**
- O token sai da barra com `replaceState` antes da primeira chamada, e o e2e prova isso segurando a consulta (`spec.ts:104-117`).
- Uso único, expiração e revogação são aplicados no servidor e exercitados nos três estados de teste.
- A senha sai da memória tanto no sucesso quanto na falha (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Convite.tsx:99-102`).
- O segredo e os códigos ficam só no estado do componente. O desafio `mfa` é apagado quando a tela sai (`ConfigurarMfa.tsx:93-99`), e a resposta vem com `no-store`, o que o e2e confere.

**Pergunta de fechamento:** a tarefa não toca dado de aluno e não muda o que o sistema guarda ou envia sobre um aluno. Ela não piora a resposta à secretaria.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `Convite.tsx:67-69`: quando um novo `#` sem token válido chega pelo `hashchange`, a tela mantém o token anterior e a senha já digitada. Seria mais limpo limpar os dois e mostrar a tela de convite inválido, que é o que a própria divergência registrada na tarefa promete ("a senha digitada sai da memória").
2. `operacao-convite.spec.ts:170`: a primeira chamada de `nadaSensivelNoNavegador` (no configurar) não inclui `SENHA_NOVA` na lista. Incluir cobriria a senha também no meio do fluxo, e não só no fim.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-09-24 07:07:08 · `tasks/prd-apresentacao-operacao/11_task.md`

VEREDITO: AJUSTES NECESSÁRIOS

Estados: ok. O convite tem o carregando ("Conferindo o convite…"), o erro com "Tentar de novo", o convite que não vale, que diz o que fazer, e o formulário. O configurar tem o carregando, o erro que deixa tentar de novo, a tela sem desafio com "Ir para a entrada" e a tela com os dados.

Acessibilidade: boa. Todo campo tem rótulo e dica ligada a ele. O "Copiado" é anunciado numa região viva, os alertas usam `role="alert"`, e o QR tem nome acessível com a chave em texto selecionável ao lado. O e2e percorre o fluxo pelo teclado conferindo o foco visível a cada Tab, e roda o axe em cada tela.

Chromebook fraco: sem problema. O QR é um único `<path>` de SVG, sem canvas e sem imagem. Segredo e códigos não passam pelo cache de consultas. O `StrictMode` não dispara um segundo `configurar`. O e2e dá prazo para CPU ×4 com Fast 3G. Não há lista nem upload nesta tarefa.

Celular: ok. O e2e mede a largura excedente, e os botões principais têm pelo menos 44 px. O link `otpauth://` configura no próprio aparelho. A chave em texto e o "Copiar" deixam o fluxo inteiro possível sem celular. Nada depende de hover.

Ação oficial protegida: não se aplica, porque a tarefa não tem nota nem decisão sobre aluno. Os dois envios têm trava contra clique duplo, e o e2e prova um único aceite.

Bloqueantes:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Convite.tsx:67-73` (com o efeito das linhas 79-90). Quando o `hashchange` traz o **mesmo** token, a tela fica presa e o token volta a aparecer na barra. Exemplo: a pessoa cola de novo o mesmo link na aba, depois que a tela já tirou o `#` da barra. Aí `definirToken(novo)` não muda o estado, e o efeito de `[token, tentativa]` não roda outra vez. Resultado: `definirEtapa({ nome: 'consultando' })` deixa a tela em "Conferindo o convite…" para sempre, sem saída. E `apagarFragmentoDaBarra()` não é chamado, então o token fica na barra e no histórico, contra a regra 20, item 8, que o próprio 11.1 promete.
  - O `hashchange` com fragmento inválido (`%` quebrado, token longo demais) também deixa o `#` na barra (linha 69, `if (novo === undefined) return`). Isso contradiz a divergência registrada de que o link quebrado mostra a mesma mensagem do convite que não vale.
  - **Correção exigida:**
    - No tratador, chamar sempre `apagarFragmentoDaBarra()`.
    - Com `novo === undefined`, mostrar a etapa `invalido`.
    - Com token válido, forçar a nova consulta sem depender de o token ter mudado, por exemplo com `definirTentativa((t) => t + 1)` junto de `definirToken(novo)`.
    - Acrescentar ao `e2e/operacao-convite.spec.ts` um caso que abre o mesmo link duas vezes na mesma aba. Ele deve conferir que a tela chega ao formulário e que o token não fica na barra. Outro caso deve colar um fragmento quebrado depois de um link válido e conferir a mensagem do convite inválido com a barra limpa.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Convite.tsx`: a tela do convite inválido não tem ação nenhuma. Um link "Já tenho senha? Entrar" ajudaria quem abriu de novo um convite já usado, que é o caso mais comum dos cinco. O link não revela qual dos casos aconteceu.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/ConfigurarMfa.tsx:121`: o `Link` "Ir para a entrada" repete à mão as classes do `Botao`. Vale ter uma variante de link no componente, para o foco visível e o alvo de toque não divergirem no futuro.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/ConfigurarMfa.tsx`: "Ativar e entrar" fica habilitado com o campo vazio. O `required` segura o envio, mas uma dica de formato ao digitar menos de seis dígitos reduziria as idas à API que gastam o desafio.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-24 07:07:10 · `tasks/prd-apresentacao-operacao/11_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As divergências ("configure de novo" e código recusado voltam à entrada; códigos de recuperação aparecem junto do QR; `hashchange` na tela do convite) estão registradas no `11_task.md` e resumidas na seção 9 da Tech Spec. Batem com o contrato da 7.0, em que a API gasta o desafio antes de conferir.
Portão local: carimbo válido (typecheck, lint, test, e2e)

Bloqueantes:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Convite.tsx:134-145` (junto de `:147-158`). **O que está errado:** quando o mesmo link é aberto de novo na mesma aba, a tela trava e o token fica na barra.
  - Na primeira carga, o `replaceState` já tirou o `#` da barra. Se a pessoa cola ou clica de novo o mesmo link, o navegador dispara `hashchange` e cria uma entrada nova no histórico com o token.
  - O ouvinte chama `definirEtapa({ nome: 'consultando' })` e `definirToken(novo)` com o mesmo valor. O React não muda o estado, e o efeito com dependências `[token, tentativa]` não roda de novo.
  - Com isso, `apagarFragmentoDaBarra()` não é chamado e a consulta não sai. A tela fica em "Conferindo o convite…" para sempre, com o token na barra e no histórico. Isso fere a regra 20, item 8, e o item 11.1 da tarefa ("tira da barra antes de qualquer chamada").
  - O e2e dos quatro convites inválidos não pega o caso, porque usa quatro tokens diferentes.

  **Correção exigida:**
  1. No ouvinte do `hashchange`, forçar o recomeço mesmo com o token igual. Por exemplo, incrementar `tentativa` com `definirTentativa((t) => t + 1)` junto de `definirToken`, ou chamar `apagarFragmentoDaBarra()` direto no ouvinte e disparar a consulta.
  2. Acrescentar ao `e2e/operacao-convite.spec.ts` o caso do mesmo link aberto duas vezes na aba. O teste deve verificar que a barra não contém o token e que o formulário da senha (ou a mensagem de convite inválido) aparece.

Recomendações:
- `Convite.tsx:136-137`: um `hashchange` com fragmento que não serve de token (vazio, `%` quebrado, longo demais) hoje é ignorado, e o fragmento continua na barra. Chamar `apagarFragmentoDaBarra()` antes do `return` deixaria o comportamento igual ao da primeira carga, que mostra a mensagem de convite inválido.
- `ConfigurarMfa.tsx:119-124`: o `Link` "Ir para a entrada" repete à mão as classes do `Botao`. Se já existe variante de link com cara de botão (a tela do código da 10.0 tem o mesmo caso), vale usar a mesma, para não criar um segundo jeito.
- `ConfigurarMfa.tsx:51`: `useState(() => …)` só para congelar um valor lido na montagem funciona, mas `useRef` ou um `useMemo` com dependências vazias diz a intenção com mais clareza.

## test-engineer · 2ª rodada · APROVADO · 2026-09-24 07:30:47 · `tasks/prd-apresentacao-operacao/11_task.md`

VEREDITO: APROVADO

**Cenários exigidos (desta rodada, pela correção que frontend-reviewer e revisor-geral pediram):**
1. O mesmo link aberto de novo na aba recomeça a tela, mesmo com o token igual. A tela não pode ficar presa em "Conferindo o convite…".
2. O fragmento sai sempre da barra, também quando o `hashchange` traz fragmento inválido.
3. Um fragmento que não é token mostra a tela do convite que não vale.
4. Um e2e com o mesmo link aberto duas vezes e um fragmento quebrado depois de um link válido.

**Cobertos:** os quatro, no teste de `e2e/operacao-convite.spec.ts:210-238`. Testei cada asserção removendo a regra que ela prova.
- **Recomeço com token igual** (`Convite.tsx:79-80`, o `definirTentativa` funcional). Sem ele, o efeito de `[token, tentativa]` não roda de novo e a tela fica em `consultando`. Aí caem três asserções: a de 2 consultas (`:223`), a do campo visível (`:225`) e a de nenhum "Conferindo" (`:226`). O teste também ficou vermelho nos dois projetos contra a web antiga, o que confirma isso.
- **Senha limpa** (`:72`). O campo é controlado pelo estado `senha`. Sem `definirSenha('')`, o formulário volta com a senha antiga e cai `toHaveValue('')` (`:224`).
- **Fragmento inválido vai para `invalido`** (`:75-77`). Sem isso, a etapa fica em `criar-senha`, o alerta não aparece e o campo continua lá (`:232-233`).
- **Barra limpa com fragmento inválido** (`:71`). O efeito da consulta não roda com token `undefined` depois de `undefined`. Sem essa chamada, o `#%E0%A4%A` fica na barra e cai `toMatch(/\/operacao\/convite$/)` (`:234`).
- **Nada consultado com fragmento quebrado**: coberto por `expect(consultas).toHaveLength(2)` (`:235`).
- **Token fora da barra em cada consulta**: coberto em `:228`, com a URL da barra registrada no momento do pedido.
- **Mudança no E1**: a primeira `nadaSensivelNoNavegador` passou a incluir `SENHA_NOVA` (`:170`). Está correta.
- **Link "Entrar na operação" na tela do convite inválido**: afirmado em `:236`, com axe em `:237`.

Nenhum `.skip`, nenhum mock escondendo a regra: o teste usa o convite real e a API real.

**Bloqueantes:** nenhum.

**Recomendações** (para o `/validar` e o `/retro`):
- O `apagarFragmentoDaBarra()` no ouvinte (`Convite.tsx:71`) não é provado isoladamente com token válido, porque o efeito da consulta (`:87`) também apaga o fragmento antes de consultar. Na prática a barra fica limpa do mesmo jeito. Só no caminho do token inválido essa chamada é a única proteção, e esse caminho está coberto.
- Não há e2e para um `hashchange` com **outro** token válido no meio da tela. O caminho de código é o mesmo, mas o teste deixaria explícito que a consulta sai com o token novo.
- Um `hashchange` enquanto o aceite está em andamento (`aceitando` verdadeiro) não tem teste. O `navegar` para o configurar ainda acontece depois que o token da tela mudou. É um caso raro e não vaza nada, mas vale registrar.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Convite.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-convite.spec.ts`

## revisor-geral · 2ª rodada · APROVADO · 2026-09-24 07:31:15 · `tasks/prd-apresentacao-operacao/11_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, test, e2e sobre o código atual)
Bloqueantes: nenhum

As duas correções da 1ª rodada foram feitas:
1. O ouvinte do `hashchange` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Convite.tsx` (linhas 68 a 84) agora:
   - apaga o fragmento da barra;
   - limpa a senha e a falha;
   - com token válido, soma um a `tentativa`, o que força a consulta de novo mesmo com o token igual (o efeito das linhas 86 a 97 depende de `[token, tentativa]`);
   - com fragmento inválido, vai direto à tela do convite que não vale, sem consulta.
2. O caso novo em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-convite.spec.ts` (linhas 210 a 238) confere:
   - duas consultas, sem token na barra em nenhuma delas;
   - a senha vazia, o formulário visível e nada preso em "Conferindo";
   - depois, com fragmento quebrado, a mensagem de convite inválido, a barra limpa, nenhuma consulta nova, o link "Entrar na operação" e a checagem de acessibilidade (axe) sem violação grave.

   O teste quebraria se o `definirTentativa` do ouvinte fosse retirado.

A anotação da divergência em `11_task.md:98` descreve o que o código faz agora, e bate com a `techspec.md:223`.

Recomendações:
- Na página, a correção fica só no caminho de erro e no aceite. Os dois caminhos de chamada (`hashchange` e o "Tentar de novo") repetem `definirEtapa({ nome: 'consultando' })` com o incremento de `tentativa`. Uma função pequena, como `recomecarConsulta()`, evitaria que os dois se afastem numa mudança futura.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-09-24 07:31:34 · `tasks/prd-apresentacao-operacao/11_task.md`

VEREDITO: APROVADO

Estados: ok. As quatro etapas continuam: "Conferindo o convite…" enquanto carrega, a mensagem de convite inválido no papel do vazio (diz o que fazer e agora leva a "Entrar na operação"), o erro com "Tentar de novo", e o formulário da senha.

Acessibilidade: sem mudança desde a rodada anterior. O link novo "Entrar na operação" é texto sublinhado dentro de um parágrafo, então vale a exceção de alvo em linha. A cor `text-caramelo-texto` é o token para texto, e o teste novo roda o axe sobre essa tela nos dois projetos (`violacoesGraves` vazio).

Chromebook fraco: sem impacto. O ouvinte é único, registrado uma vez (`[]`) e removido quando a tela sai. A consulta anterior é descartada pelo `atual = false` quando o token ou a tentativa mudam.

Celular: o teste novo roda nos projetos `chromebook` e `celular`. Nada novo depende de hover.

Ação oficial protegida: não se aplica a esta tela (criar senha de operador). Apertar o botão duas vezes continua mandando um aceite só.

Conferi as duas correções exigidas na 1ª rodada.
1. Correção de `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Convite.tsx:68-84`: feita. O tratador do `hashchange` sempre chama `apagarFragmentoDaBarra()` e limpa a senha e a falha. Com `novo === undefined`, vai à etapa `invalido` e retorna. Com token válido, põe a etapa em `consultando` e faz `definirTentativa((anterior) => anterior + 1)`, o que força o efeito da consulta (linhas 86-97) a rodar mesmo com o token igual. O "Tentar de novo" (linhas 124-127) passou para a forma funcional.
2. Teste em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-convite.spec.ts:210-238`: feito. Ele abre o mesmo link duas vezes e confere: duas consultas, a senha volta vazia, o formulário aparece sem ficar preso em "Conferindo", e o token está fora da barra em cada consulta. Depois abre `#%E0%A4%A` e confere: mensagem de convite inválido, sem campo de senha, barra em `/operacao/convite`, nenhuma consulta nova, link "Entrar na operação" e axe limpo.

Bloqueantes: nenhum

Recomendações:
- `Convite.tsx:99-116`: se um `hashchange` chegar com um aceite ainda em andamento, a resposta desse aceite (feito com o token antigo) ainda navega para o configurar ou põe a etapa em `invalido`, passando por cima da tela nova. Depende de o operador colar outro link no meio do "Salvando…", então é pouco provável. Uma guarda do tipo `atual` no `enviar`, ou ignorar o `hashchange` enquanto `aceitando`, fecharia o caso. Fica registrado para o `/validar`.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-24 07:31:34 · `tasks/prd-apresentacao-operacao/11_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. Esta rodada mexe só no que a tela do convite do operador guarda na memória do navegador (token e senha). Nenhum dado de aluno, professor ou escola é tocado.

Fora da tabela de dados do docs/lgpd.md: nenhum.

Autorização por objeto: ok. A tela é pública antes do aceite e mostra o mesmo texto para convite usado, vencido, revogado ou inexistente. O link novo "Entrar na operação" (`Convite.tsx:136-141`) aparece nos quatro casos, então não diz qual deles aconteceu. O teste que exige telas iguais letra por letra (`new Set(telas).size === 1`) continua valendo com o link, porque ele entra nas quatro.

Logs: limpos. Não há `console` nem logger em `Convite.tsx` nem em `api/convite.ts`.

Auditoria: nada muda nesta rodada. O aceite do convite é auditado no backend, que não foi alterado.

Envio externo: nenhum.

Seed/fixture: sintético. A senha é `frase-sintetica-do-operador`, o token inexistente é inventado, e os operadores de teste são criados pelo fixture e apagados no `afterEach`.

Conferência das duas recomendações da 1ª rodada:
1. **Feita.** O ouvinte do `hashchange` chama `apagarFragmentoDaBarra()` antes de qualquer outra coisa, inclusive quando o fragmento não é token (`Convite.tsx:70-71`). Com fragmento inválido, o token anterior sai do estado (`definirToken(undefined)`), a senha é limpa e nenhuma consulta nova sai. Com o mesmo token de novo, a consulta é refeita pelo contador `tentativa`, e o efeito de consulta limpa a barra outra vez antes de chamar (`:87`). A falha de antes (tela presa e token de volta na barra) está resolvida.
2. **Feita.** A primeira `nadaSensivelNoNavegador` do E1 agora também confere `SENHA_NOVA`.

O teste novo em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-convite.spec.ts` prova de verdade o que promete:
- Guarda o endereço da barra no momento de cada consulta e confere que o token não está em nenhum deles. Se `apagarFragmentoDaBarra` saísse do ouvinte ou do efeito, o teste falharia.
- Confere que a senha volta vazia depois de abrir o link de novo.
- Com o fragmento quebrado, confere a barra limpa, o texto de convite inválido e nenhuma consulta a mais.

Bloqueantes: nenhum.

Recomendações:
- Com o fragmento quebrado, o teste confere a barra só depois de a tela reagir. Isso basta, porque nesse caminho nenhuma chamada sai. Registro só para o `/validar`.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Convite.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-convite.spec.ts`
