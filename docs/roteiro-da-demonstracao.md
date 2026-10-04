# Roteiro da demonstração do Turmma (MVP de apresentação, A0 a A5)

> Para qualquer pessoa da equipe apresentar, com o sistema rodando na própria máquina. Tudo que aparece na tela é
> **dado inventado** (D71): nenhuma escola, pessoa ou material de verdade. A escola **não vem pronta**: ela nasce no
> painel da operação e é montada pela coordenação na tela, como numa escola de verdade.
>
> O mesmo roteiro roda sozinho, de ponta a ponta, em `e2e/roteiro-da-demonstracao.spec.ts`. Se ele está verde, o
> caminho abaixo funciona com o adaptador falso.

## 0. Antes de tudo

### 0.1 O que você precisa na máquina

- Docker com Compose e Node 22. Na pasta do repositório: `npm ci` uma vez.
- **Quatro perfis de navegador** (no Chrome: "Adicionar perfil"), um por pessoa: **Operação**, **Coordenação**,
  **Professora**, **Aluno**. Janela anônima não serve para separar pessoas: todas as anônimas dividem os mesmos cookies.
  Para os dois alunos de apoio (passo 4), mais dois perfis, **Aluno 2** e **Aluno 3**, ou o Firefox.
- Um gerador de código de segundo fator no computador. O jeito mais simples, na pasta do repositório:

  ```bash
  node -e "import('otpauth').then(({TOTP,Secret})=>console.log(new TOTP({secret:Secret.fromBase32(process.argv[1])}).generate()))" <SEGREDO>
  ```

  O `<SEGREDO>` é o texto que a tela "Configurar o segundo fator" mostra. **Depois de ativar, o código de entrada tem
  de ser o seguinte**: espere o código mudar (até 30 s) antes de entrar.

### 0.2 Subir o sistema (5 min na primeira vez, 1 min depois)

```bash
docker compose up -d --build --wait
```

A web fica em **http://127.0.0.1:58080**. Por padrão a IA é o **adaptador falso**: não depende de modelo, responde
sempre igual e nada sai da máquina. Para usar o modelo local, veja a seção 9.

### 0.3 O operador (uma vez por máquina, 3 min)

```bash
OPERADOR=<seu-apelido> npm run -s ops:operador -- criar --apelido <seu-apelido> --nome "Operadora Demo" --email operadora@demo.invalid --saida /tmp/convite-operador
```

O comando mostra só ids. No perfil **Operação**, abra `http://127.0.0.1:58080/operacao/convite#<token>` (o token está
em `/tmp/convite-operador`), defina a senha, configure o segundo fator com o gerador do 0.1, e **apague o arquivo**.

### 0.4 Os dados sintéticos da demonstração

Use estes, escritos assim. Todo e-mail termina em `.invalid`, que não existe: ninguém recebe mensagem, e os convites
são copiados da tela.

| O quê | Valor |
|---|---|
| Rede | Rede Fictícia de Demonstração |
| Escola | Colégio Fictício Lago Azul, endereço `lago-azul-demo` |
| Ano letivo | 2026, de 02/02/2026 a 11/12/2026 |
| Série | 2º ano do Ensino Médio |
| Turmas | 2ºA e 2ºB |
| Disciplinas | Química e Física |
| Coordenadora | Rita Demo, `rita@demo.invalid` |
| Professora de Química do 2ºA (a que apresenta) | Helena Demo, `helena@demo.invalid` |
| Segunda professora de Química, no 2ºB | Marta Demo, `marta@demo.invalid` |
| Professor de Física do 2ºA | Davi Demo, `davi@demo.invalid` |
| Alunos do 2ºA (lista de nomes) | Ana Demo `D26-001`, Bruno Demo `D26-002`, Carla Demo `D26-003` |
| Senhas | qualquer frase com 12 caracteres ou mais, a mesma para todos, anotada à parte |
| Material | `tools/demonstracao/quimica-2-cap-7-estequiometria.pdf` (6 páginas, texto nosso, autoria da escola) |

Por que duas professoras de Química: o Analista e a governança só mostram número de uma série com **dois ou mais
professores** no recorte (D45). Com uma só, o número seria o resultado dela, e a tela não mostra.

### 0.5 A ordem que evita tela vazia

A turma, o diagnóstico do aluno, a memória do Tutor e o Analista só mostram **correção aprovada**. Por isso a ordem é
fixa: primeira atividade aplicada, respondida, encerrada e **aprovada** antes de abrir a turma, o diagnóstico e o
Analista; e o Tutor entra numa **segunda** atividade, depois da primeira aprovada, para ele lembrar do que o aluno errou.

### 0.6 Versão curta e versão completa

| | Versão completa (~40 min) | Versão curta (~20 min) |
|---|---|---|
| Parte A, a escola montada (seções 1 e 2) | ao vivo | feita antes, na véspera; na reunião só se mostra o resultado |
| Passos 1 a 6 (seções 3 a 8) | ao vivo | ao vivo |

Na versão curta, faça antes as seções 1 e 2 inteiras. Não aplique nenhuma atividade antes da reunião.

---

## 1. A escola nasce no painel da operação (Operação, 3 min)

1. No perfil **Operação**, entre em `http://127.0.0.1:58080/operacao/entrar` com e-mail, senha e o código.
2. **Nova rede** → Nome da rede: `Rede Fictícia de Demonstração` → **Criar rede**.
3. **Nova escola** → a rede já vem escolhida → Nome: `Colégio Fictício Lago Azul`, Endereço: `lago-azul-demo` →
   **Revisar** → **Criar escola**.
4. Na linha da escola, **Convidar a coordenação** → Nome `Rita Demo`, e-mail `rita@demo.invalid` → **Revisar** →
   **Gerar convite** → **Copiar link** → **Fechar**.

**Aparece:** a escola com "Convite enviado, ainda não aberto". O link aparece uma vez só.

**Diga:** "Não existe cadastro público: quem cria a escola somos nós, e a escola recebe um convite de uso único, que
vale 72 horas. O painel da operação não mostra dado de aluno nem de professor, só uso e custo por escola."

## 2. A coordenação monta a escola (Coordenação, 10 min)

1. No perfil **Coordenação**, cole o link do convite → **Aceitar o convite** → senha → **Definir a senha e continuar**.
2. **Configurar o segundo fator**: copie o segredo, gere o código (0.1), **Ativar o segundo fator** → **Ir para a
   entrada** → e-mail e senha → espere o código mudar → código → **Entrar**.
   **Aparece:** a Governança, vazia ("A IA ainda não gerou nada nesta escola"). **Diga:** "A coordenação sempre entra
   com segundo fator: é quem vê a escola inteira."
3. **Estrutura** → **Criar o ano letivo** (2026, 02/02/2026 a 11/12/2026) → **Criar ano letivo** → **Abrir o ano
   letivo 2026**.
4. **Nova série** → `2º ano do Ensino Médio` → **Criar série**. **Nova disciplina** → `Química`; de novo → `Física`.
   **Nova turma** → `2ºA`; de novo → `2ºB`.
5. Em **Turmas de 2026**, **Lista de nomes da turma 2ºA** → em "Lista colada", cole:

   ```
   nome;matrícula
   Ana Demo;D26-001
   Bruno Demo;D26-002
   Carla Demo;D26-003
   ```

   **Ver a prévia** ("3 nomes entram") → **Gravar lista**. **Diga:** "A escola sobe só nome e matrícula. Aluno não tem
   e-mail, CPF, foto nem data de nascimento no sistema."
6. **Professores** → **Cadastrar professor** → Helena Demo, `helena@demo.invalid` → **Revisar** → **Cadastrar e gerar o
   link** → copie o link (cole num bloco de notas, com o nome) → **Fechar**. Repita para Marta Demo e Davi Demo.
7. **Estrutura** → **Alocação**: Helena → 2ºA → Química → **Alocar**; Marta → 2ºB → Química; Davi → 2ºA → Física.
   **Aparece:** "Esperando o professor confirmar". **Diga:** "O vínculo é definido pela escola; o professor só confirma.
   Ninguém se declara professor de uma turma."
8. Os três professores aceitam (no perfil **Professora**, um de cada vez; Marta e Davi podem ser feitos na véspera em
   qualquer perfil livre): abrir o link → **Aceitar o convite** → senha → **Definir a senha e continuar** → entrar com
   e-mail e senha → **Turmas** → em "Confirme suas turmas", **Confirmar**. Termine com a **Helena** entrada no perfil
   Professora.
9. A Helena gera o acesso dos alunos: **Turmas** → **Abrir a turma 2ºA** → aba **Alunos** → **Gerar acesso** → **Gerar
   acesso**. **Aparece:** o código da turma, para projetar na lousa. Feche.
10. No perfil **Aluno**: `http://127.0.0.1:58080/e/lago-azul-demo/turma` → digite o código → **Abrir a turma** →
    escolha **Ana Demo** → matrícula `D26-001` → crie a senha → **Enviar pedido**. Faça o mesmo com Bruno e Carla nos
    perfis Aluno 2 e Aluno 3.
11. A Helena, na aba **Alunos**, recarrega: em **Pedidos de nome**, marca os três → **Aprovar 3 pedidos** → confirma.
    **Diga:** "O aluno não se cadastra sozinho: ele reivindica o próprio nome na lista da escola, e quem dá a aula
    confere e aprova."
12. Cada aluno entra em `http://127.0.0.1:58080/e/lago-azul-demo` com matrícula e senha e cai em **Atividades**, vazia.

---

## 3. Passo 1: o material da escola, com licença (Coordenação, 2 min)

1. **Material** → arraste o PDF de demonstração → Título `Química 2, capítulo 7: Estequiometria` → Disciplina
   `Química` → De quem é: `Material próprio da escola` → Licença: **`Não tenho a licença, ou não sei`** → marque a
   declaração → **Enviar material**.
   **Aparece:** "Envio recusado", em borda tracejada. **Diga:** "Sem licença, o arquivo não sai do computador: o
   sistema recusa antes de ler, e a tentativa fica na auditoria. Apostila de terceiro sem licença não entra por caminho
   nenhum."
2. Escolha o arquivo de novo, a mesma informação, e Licença: **`Autoria da escola ou de professor dela`** → declaração
   → **Enviar material**.
   **Aparece:** em alguns segundos, "Pronto · 6 páginas". **Diga:** "A IA só trabalha com o que a escola subiu e pode
   usar. Tudo que ela gerar vai citar a página daqui."

## 4. Passo 2: a professora e o Assistente de ensino (Professora, 6 min)

1. Perfil **Professora** → **Nova conversa** → na caixa, digite exatamente:
   **`monta uma atividade de estequiometria com 5 questões`** → **Enviar**.
   **Aparece:** o Assistente pergunta "Quer que eu abra a ferramenta de atividade objetiva com 5 questões…", com duas
   opções do mesmo tamanho. **Diga:** "O chat pergunta antes de abrir a ferramenta (D18). A professora decide."
2. **Usar a ferramenta Atividade objetiva** → no cartão, Tema `Estequiometria` (a turma `2ºA · Química` já vem
   escolhida) → **Gerar atividade**.
   **Aparece:** cinco questões, cada uma com o chip **"Fonte: Química 2, capítulo 7: Estequiometria, p. N"**. Clique
   num chip: abre o trecho da página. **Diga:** "Toda questão cita a página do material da escola. É o que deixa a
   professora conferir em segundos." Com o adaptador falso, as questões são de definição, tiradas das frases do
   material ("O que é…?"); com o modelo local, a redação é outra e varia a cada geração.
3. **Abrir o artefato** → **Exportar em PDF**. **Aparece:** o download de `atividade-estequiometria.pdf`.
4. **Pedir versão adaptada** → marque **Fonte ampliada** e **Tempo adicional** → **Gerar versão adaptada**.
   **Aparece:** a versão adaptada "Esperando você". **Diga:** "Ela escolhe o **tipo** de adaptação. Não existe campo
   para escrever sobre o aluno, nem diagnóstico: só o que fazer na prova."
5. **Ver e decidir em Seu time** → no cartão, **Aprovar** → confirme.
   **Aparece:** "Aprovada por Helena Demo · dd/mm, hhhmm". **Diga:** "Nada que a IA produz chega ao aluno sem uma
   pessoa aprovar, e a aprovação fica registrada com nome e hora."

Outra frase que funciona: "monta uma atividade sobre estequiometria com 5 questões". **Não use** "critérios para avaliar redação antes de aplicar": hoje o Assistente recusa essa frase
por engano, como se fosse pedido de correção de redação. Para mostrar a recusa de propósito: "corrige a redação do meu
aluno e sugere uma nota" (a resposta explica que a IA não corrige redação nem discursiva, D55).

## 5. Passo 3: a atividade na turma e o aluno respondendo (Professora e alunos, 6 min)

1. Professora → **Ferramentas** → abra a **Atividade — Estequiometria** (a original, não a adaptada) → **Aplicar à
   turma** → **É avaliativa** → **Aplicar à turma**.
   **Aparece:** "Aberta para a turma · avaliativa · 0 de 3 alunos enviaram".
2. Perfil **Aluno** (Ana) → **Atividades** → a atividade aparece com "Avaliação: o Tutor fica pausado até quem dá a aula
   encerrar". **Diga:** "Na avaliação o Tutor pausa sozinho, no servidor."
3. Ana abre a atividade e responde **uma questão por vez**, com "Resposta salva" a cada escolha. Erre de propósito
   uma ou duas questões (é o que o Tutor vai lembrar no passo 6). **Enviar a atividade** → confirme.
   **Aparece:** "Quem dá a aula ainda vai revisar a correção." **Diga:** "O aluno não vê resultado antes de a
   professora aprovar."
4. Bruno (Aluno 2) responde e envia. Carla (Aluno 3) só abre a atividade e não responde: ela vai virar destaque.

## 6. Passo 4: a correção, aprovada com a validação registrada (Professora, 5 min)

1. Professora, no artefato → **Encerrar a atividade** → confirme. **Aparece:** "Revisar a correção".
2. **Revisar a correção**. **Aparece:** o resumo ("3 alunos responderam · 3 na turma hoje"), o acerto por habilidade e
   os **destaques** fechados (Carla, "Em branco"). O botão **Aprovar 3 correções** está desligado, com o contador.
3. **Abrir** cada destaque. O botão liga só depois do último. **Aprovar 3 correções** → confirme.
   **Aparece:** "Validação registrada por Helena Demo · …". **Diga:** "A IA corrige a objetiva, mas a professora não
   aprova só clicando: o sistema registra o que mostrou, o que ela abriu e quem confirmou (D56). E não é nota: é
   diagnóstico por habilidade (D46)."
4. **Turmas** → **Abrir a turma 2ºA** → **Visão Geral**: o acerto por habilidade e os alunos em ordem de nome.
   **Diga:** "Só entra correção aprovada. Não há ranking nem cor de alerta; o número está no texto."
5. Perfil **Aluno** (Ana) → recarregue a atividade. **Aparece:** "Seu resultado": "Você acertou N de 5 questões",
   por habilidade, e "Correção aprovada por Helena Demo". Sem nota, sem percentual, sem colega.

## 7. Passo 5: o Tutor numa segunda atividade, e o sinal para a professora (6 min)

1. Professora → **Ferramentas** → **Atividade objetiva** → Tema `Reagente limitante`, Questões `2` → **Gerar
   atividade** → **Abrir o artefato** → **Aplicar à turma** → **É prática** → **Aplicar à turma**.
2. Ana → **Atividades** → abre **Atividade — Reagente limitante** → na questão 1, **Pedir ajuda ao Tutor nesta
   questão**. **Aparece:** a faixa "Quem dá a aula acompanha como você usa o Tutor." e "Hoje: 0 de 60 perguntas".
3. Ana digita: **`me dá a resposta`**.
   **Aparece:** "Essa eu não respondo por você…", a lembrança "Nas atividades anteriores você errou … de “…”, então
   vamos devagar nesse ponto.", a página do material e uma pergunta de volta. **Diga:** "O Tutor não entrega a
   resposta, conduz por perguntas, cita a página e lembra do **trabalho** do aluno, nunca da pessoa."
4. Se quiser: **`é a B, né?`** (não confirma nem descarta) e **`você é uma pessoa?`** (diz que é uma inteligência
   artificial, D58).
5. Professora → **Seu time** → **Tutor**. **Aparece:** em "Sinais da turma", "Pediu a resposta pronta na questão 1 de
   “Atividade — Reagente limitante”", com o nome da Ana, e o uso do dia. **Diga:** "A professora vê **que** a aluna
   pediu a resposta pronta, não **o que** ela escreveu. Supervisão, não vigilância: sem conversa, sem tempo de tela,
   sem emoção."

## 8. Passo 6: a governança da coordenação (Coordenação, 6 min)

1. Perfil **Coordenação** → **Governança** (recarregue). **Aparece:** Gerado por IA **4**, Aprovado por gente **2**,
   Esperando o professor **0**, Rejeitado **0**; a tabela "O que a IA gerou e quem aprovou" com a correção e a
   adaptação, por série; o consumo do mês por função, em tokens. **Diga:** "A coordenação vê o que a IA fez e que uma
   pessoa decidiu, em agregado. Não há coluna nem filtro por professor: ninguém é ranqueado pelo uso da ferramenta."
2. **Agentes** → os três agentes (Assistente de ensino, Tutor, Analista de desempenho escolar), cada função com o que
   faz sozinha e o que espera aprovação. Em **Adaptação**, **Suspender a função Adaptação** → Motivo → **Suspender
   Adaptação**. **Aparece:** "Suspensa nesta escola desde…". **Diga:** "A escola desliga uma função sem desligar o
   resto, e o servidor passa a recusar. O que já foi produzido continua podendo ser decidido pela professora." Depois,
   **Retomar a função Adaptação**.
3. **Analista** → **Gerar resumo**. **Aparece:** em "2º ano do Ensino Médio · Química", "2 professores no recorte", o
   acerto por habilidade e, se alguma ficar abaixo de 60%, o alerta como **hipótese a conferir**. **Diga:** "Química
   tem número porque tem duas professoras. Com uma só, o número seria dela, e o sistema não mostra."
4. **Abrir dado nominal de uma turma**. **Aparece:** o aviso "Esta abertura fica na auditoria da escola". Escolha
   `2ºA · 2º ano do Ensino Médio` e a finalidade → **Abrir dado nominal**. **Aparece:** os professores da turma (Helena,
   Química; Davi, Física) e "Esta abertura foi registrada na auditoria da escola." **Diga:** "Dado nominal só com
   finalidade e registro. Professor é medido em espelho, nunca vigiado."

---

## 9. O modelo local (ensaio final)

Por padrão a demonstração usa o adaptador falso. Para o Qwen: **quem carrega o modelo é o Joaquim**, no
`llama-server` da máquina, que escuta só em `127.0.0.1:8080`. Nada muda nele. A API roda em contêiner, e de dentro do
contêiner `127.0.0.1` é o próprio contêiner: por isso o repasse abaixo, ligado só à interface do Docker.

1. Conferir que o modelo está carregado: `curl -s http://127.0.0.1:8080/v1/models` mostra `qwen3.6-35b-a3b`.
2. Repasse, num terminal que fica aberto durante a demonstração (escuta só em `172.17.0.1`, a interface do Docker,
   não na rede):

   ```bash
   socat TCP-LISTEN:18080,bind=172.17.0.1,reuseaddr,fork TCP:127.0.0.1:8080
   ```

3. O `infra/compose.yml` passa as variáveis de IA à API, mas **não** mapeia `host.docker.internal`. Crie, **fora do
   repositório**, o arquivo `/tmp/turmma-modelo-local.yml`:

   ```yaml
   services:
     api-1:
       extra_hosts: ["host.docker.internal:host-gateway"]
     api-2:
       extra_hosts: ["host.docker.internal:host-gateway"]
   ```

4. Recriar só as duas APIs com o modelo (a variável do terminal vence a do `.env.example`):

   ```bash
   IA_ADAPTADOR=openai_compat \
   LLM_BASE_URL=http://host.docker.internal:18080/v1 \
   LLM_MODELO=qwen3.6-35b-a3b \
   LLM_PROCESSAMENTO_LOCAL=true \
   LLM_TIMEOUT_MS=120000 IA_EXECUCAO_TIMEOUT_MS=300000 \
   docker compose -f compose.yaml -f /tmp/turmma-modelo-local.yml up -d --wait api-1 api-2
   ```

   `LLM_PROCESSAMENTO_LOCAL=true` só é aceito com endereço local (`host.docker.internal` é): o registro de consumo
   grava que nada saiu da máquina. Os prazos maiores são porque o modelo local leva dezenas de segundos numa atividade
   de cinco questões; o da execução precisa ser maior que o da chamada.
5. Conferir: `docker compose logs api-1 | tail` sem erro de configuração, e uma conversa de teste na professora antes
   da reunião. Alternativa sem o arquivo do passo 3: `LLM_BASE_URL=http://172.17.0.1:18080/v1` (IP privado, também
   aceito como local).

**Voltar ao adaptador falso** (a qualquer momento, inclusive no meio da reunião, uns 20 s):

```bash
docker compose up -d --wait api-1 api-2
```

Sem as variáveis, a API volta ao `.env.example`, que é o falso. A escola, as pessoas e o que já foi gerado continuam.

## 10. Se der errado

| O que acontece | O que fazer |
|---|---|
| A geração passa de 20 s | A tela avisa que está demorando, sozinha. Com o modelo local é normal até um minuto: fale da página citada enquanto espera. Passou de dois minutos, volte ao falso (seção 9) e gere de novo |
| O modelo não responde, ou a tela diz que a IA está indisponível | Volte ao adaptador falso (seção 9) e clique em **Tentar de novo**. Diga: "a IA tem reserva declarada: quando o modelo não responde, o sistema avisa, nunca dá erro cru" |
| Uma tela mostra erro com **Tentar de novo** | Clique uma vez. Persistindo: recarregue a página (a sessão volta sozinha) |
| O código do segundo fator não entra | Era o mesmo código da ativação: espere o próximo (até 30 s) |
| O convite diz que não vale | Já foi usado ou venceu: no painel da operação, **Refazer o convite** (coordenação) ou, na coordenação, refazer o do professor |
| A turma ou o Analista aparecem vazios | Falta correção aprovada (seção 0.5). Para o Analista, falta também a segunda professora de Química confirmar a turma |
| "Esta função da IA está suspensa" | Ficou suspensa do passo 6: **Agentes** → **Retomar** |
| O sistema inteiro travou | `docker compose up -d --wait`. Os dados ficam no volume; nada se perde |

## 11. O que não mostrar, e o que responder

Nada disto existe nesta fatia. Não abra, não prometa data.

| Se perguntarem por… | Responda |
|---|---|
| Busca na web | "Vem depois, ligada pelo professor e, para o aluno, só em fontes aprovadas pela escola (D68)." |
| Calendário e grade horária | "Vêm da estrutura que a escola importa; entram numa fase seguinte." |
| Família, WhatsApp, portal do responsável | "O motor de eventos já existe; a tela da família vem depois do piloto." |
| Nota oficial, boletim | "Hoje é diagnóstico formativo por habilidade. A nota oficial vem depois, e sempre com o professor lançando (D46)." |
| Correção de redação ou discursiva | "A IA não corrige, não avalia e não sugere nota em redação e discursiva. É regra nossa e da diretriz do CNE (D55). Ela ajuda com rubrica e organização da correção, que é do professor." |
| Exportar em PPTX ou planilha | "Hoje sai em PDF; os outros formatos estão previstos (D67)." |
| O que o Tutor sabe do aluno (tela de memória) | "O Tutor lembra do trabalho, por habilidade, nunca de texto sobre a pessoa. A tela em que o aluno vê e contesta isso vem na próxima rodada (D66)." |
| Ligar ou desligar o Tutor por turma, Tutor fora da sala | "É configuração da escola por turma, desligada por padrão fora da sala (D19); nesta versão o Tutor fica ligado para quem tem turma." |
| Ranking de alunos ou de professores | "Não existe e não vai existir: medir não é vigiar (D45, D64)." |
| Saber se o aluno usa outra IA, tempo de tela | "Não medimos navegação nem tempo ocioso (D69, D70). Bloquear outros sites é configuração da rede da escola." |
| Login pela conta Google ou Microsoft da escola | "Funciona, guardando só o identificador da conta; nesta demonstração usamos matrícula e senha." |

## 12. Depois da demonstração

Os dados ficam no volume do Docker. Para começar do zero, com cuidado: `docker compose down -v` apaga **tudo** do
ambiente local (escolas, pessoas, operador). Na próxima vez, repita a partir do 0.2.
