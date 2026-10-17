# Achados das revisões — `tasks/prd-telas-da-coordenacao/13_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-17 02:45:59 · `tasks/prd-telas-da-coordenacao/13_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum novo. A tarefa só mexe no frontend. Não muda migration, DTO, rota da API, consulta nem contrato em `packages/shared`. As três telas mostram o que as consultas já entregavam: a retenção por categoria de dado, as empresas que recebem dados com a vigência, e os incidentes com campos escritos pela operação, sem dado de titular. Os incidentes só dizem quantas pessoas foram alcançadas e quais categorias de dado.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok. As rotas (`/v1/privacidade/retencao`, `/suboperadores`, `/incidentes`, `/incidentes/:id/confirmar`) não mudaram. Os testes de isolamento continuam no e2e sem perder asserção:
- Empresa de outra escola não aparece (`e2e/privacidade.spec.ts`, com `deOutraEscola`, `DPA-E2E` e `equipe-de-teste`).
- A troca de escola e as duas coordenadoras ficam em `incidentes.spec.ts`. O diff só acrescenta.
- `cartaoDa` passou de `article` para `region` com nome, mas continua filtrando pela marca, e por isso pega a mesma coisa.

Nas fotos:
- Nenhuma tela mostra nome, matrícula ou conteúdo de aluno.
- As únicas pessoas nomeadas são a própria coordenadora sintética, na barra lateral, e a escola sintética.
- Os incidentes mostram categoria de dado e contagem estimada ("120 pessoas (estimativa)"), por exemplo em `coordenacao--coordenacao-privacidade-incidentes--computador.png` e em `...--Ver-depois--celular-2.png`, produzidos por `apps/web/src/areas/coordenacao/privacidade/DetalhesDoIncidente.tsx:14-23`.
- A escola vazia mostra só o estado vazio (`vazia--coordenacao--coordenacao-privacidade-incidentes--computador.png`).

Logs: limpos. O diff não acrescenta `console`, `localStorage` nem `sessionStorage`. A variável `--faixa-de-incidente` gravada na raiz (`AvisoDeIncidente.tsx:345`) guarda só a altura em pixels e sai com a faixa (`:351`).

Auditoria: presente. Nenhuma ação nova a exige. A confirmação de recebimento do incidente continua no mesmo caminho de antes (`confirmar-o-incidente.ts`, sem alteração).

Envio externo: nenhum.

Seed/fixture: sintético.
- `Privacidade.test.tsx` usa "Empresa X", ids UUID fixos e textos como "Circunstância N".
- O e2e usa `criarEquipeComSenha`, `marca()` com UUID e `textoLongo`.
- A vitrine mostra "Colégio sintético" e "Coordenadora sintética".

Bloqueantes: nenhum.

Recomendações:
- O apoio do `h2` dos incidentes (`Privacidade.tsx:552`) trocou "O que a Turmma registrou, só sobre a sua escola" por "só os da sua". A frase antiga deixava mais claro quem registra, e isso importa para a coordenação entender o papel de operador. Fica a cargo do texto, sem bloquear.

Pergunta de fechamento: esta tarefa não muda o que o sistema guarda sobre o aluno nem para onde isso vai. A tela de empresas continua respondendo, por escola, quem recebe cada categoria de dado, onde processa e em que período, inclusive as empresas que já pararam de receber. A resposta continua igual à de antes da tarefa.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/privacidade/Incidentes.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/privacidade/Retencao.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/privacidade/EmpresasQueRecebemDados.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/componentes/Cartao.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/privacidade.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/incidentes.spec.ts

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-17 02:46:04 · `tasks/prd-telas-da-coordenacao/13_task.md`

VEREDITO: APROVADO

Tela vista: sim. Li 31 fotos, com escola cheia e vazia, no computador (1366 px) e no celular (360 px), nas três telas (prazos, empresas, incidentes). Entre elas estão as fotos com o diálogo do aviso aberto e as com a faixa, depois de "Ver depois". Não fotografei mais nada. Não rodei os testes, e li o diff de `apps/` e de `e2e/` e as listas de testes.

Estados: ok. Carregando e erro conferi só pelo código e pelos testes de componente, que cobrem os dois nas três telas, incluindo "Tentar de novo".
- **Vazio:** convida e diz o próximo passo. "Nenhum incidente afetou esta escola. Se a Turmma registrar um incidente…, o aviso aparece aqui e ao entrar" e "Nenhuma empresa recebe dado desta escola" estão nas fotos vazias.
- **Com dado:** a escola cheia mostra a tabela no computador, os cartões no celular e a seção das empresas passadas.
- **Só passadas:** coberto por teste de componente.

Acessibilidade: ok pelo código e pelos testes; não rodei o e2e nem o axe.
- **Seletor:** é um grupo de rádio com uma parada só no Tab e setas que trocam a tela e o endereço. O e2e cobre isso com axe.
- **Títulos:** h2 da tela, depois h3 das seções e dos cartões, sem pular nível.
- **Cartão do incidente:** vira região nomeada, e o foco vai ao título dele depois de confirmar (`refDoTitulo`, `tabIndex=-1`). O teste de `Cartao` prova que, sem a ref, o título não ganha `tabindex`.
- **Falha:** o `role="alert"` fica só no cartão que falhou.
- **Contraste:** na leitura das fotos, os selos e a faixa estão legíveis.

Chromebook fraco: ok. As listas são curtas, então não pedem virtualização. A faixa usa um `ResizeObserver` leve e a variável CSS sai com a faixa. Não há imagem nem upload.

Celular: ok nas fotos de 360 px. Não há rolagem horizontal nem texto cortado. A tabela vira cartões legíveis e o seletor cabe, com "Prazos de guarda" quebrando em duas linhas dentro do alvo. O e2e novo mede os alvos do seletor (44 px abaixo de 768 px, 36 px acima) e os seis botões "Confirmo que recebi" com a mesma altura de 44 px ou mais. Nada depende de hover. A barra de baixo cortando o meio das fotos compridas é efeito da captura da página inteira com a barra fixa; a foto do celular com a escola vazia, que cabe numa tela, mostra a barra no lugar certo.

Ação oficial protegida: sim. "Confirmo que recebi" é botão `oficial` dentro do cartão com todos os campos do aviso à vista: o que aconteceu, os dados alcançados, as pessoas, o risco e as datas. Ao lado dele vem o texto que diz o que confirmar faz e o que não faz ("não comunica a ANPD nem os titulares"). O botão desliga enquanto qualquer confirmação está em andamento, o que impede o clique duplo.

Bloqueantes: nenhum.

Recomendações:
- **Gênero de "Turmma":** o texto do vazio das empresas diz "Quando o Turmma contratar" (foto `vazia--coordenacao--coordenacao-privacidade-suboperadores--computador.png`), e o resto da tela diz "a Turmma" (por exemplo "Se a Turmma registrar"). Uniformizar na próxima tarefa que tocar os `textos-*.ts`, que esta tarefa não podia mudar.
- **Alinhamento no celular:** nos cartões dos prazos, o valor ora fica ao lado do rótulo, ora desce para a linha de baixo. É coerente com a largura do texto, mas "Quando começa a contar" e "Prazo", com valores longos, ficam menos escaneáveis. Dá para fixar sempre embaixo quando o valor passa de uma palavra.
- **Seletor no computador:** o alvo é de 36 px. Passa na regra 50, item 2a, porque não é a ação principal, mas 40 px ajudaria o professor com o mouse no touchpad do Chromebook.
- **Foto da faixa:** no computador, com a faixa ativa, o miolo rola dentro de 768 px e a página não rola. Isso bate com a divergência declarada na tarefa e com o teste `AvisoDeIncidente.test.tsx` da variável `--faixa-de-incidente`. O e2e cobre o caso a 1366 px; só não consegui confirmar na foto que a página não rola.

Arquivos principais, todos sob `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/`:
- `apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx`
- `apps/web/src/areas/coordenacao/privacidade/Incidentes.tsx`
- `apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx`
- `apps/web/src/componentes/Cartao.tsx`

## revisor-geral · 1ª rodada · APROVADO · 2026-10-17 02:46:50 · `tasks/prd-telas-da-coordenacao/13_task.md`

VEREDITO: APROVADO

Escopo: respeitado. As subtarefas 13.1 a 13.6 estão todas feitas. As mudanças fora dos arquivos previstos são `Cartao.tsx`, `AvisoDeIncidente.tsx` e `miolo-que-rola.ts`. Cada uma está registrada como divergência e serve para esta tela cumprir o RF23 e manter o foco no cartão confirmado. Nenhuma entra em trabalho da 10.0, da 11.0 ou da 12.0.

Aderência à Tech Spec: ok. As quatro divergências (`refDoTitulo` no `Cartao`; o cartão do incidente como região no lugar do `article`, com a frase de apoio no `h2`; a variável `--faixa-de-incidente`; as seções internas em `h3`) estão na tabela da tarefa e na `techspec.md`, §2 e §9 ("Altura" e "Como ficou na 13.0"). O PRD não tem `cenarios.md`.

Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo).

Bloqueantes: nenhum.

O que vi nas fotos:
- As três telas abrem com o seletor "Prazos de guarda / Empresas / Incidentes" e o título por extenso que a aba tinha.
- Com o aviso dispensado, a faixa fica acima da moldura e a página não rola a 1366 px; quem rola é o miolo.
- Nas fotos da escola vazia, as empresas e os incidentes mostram os vazios de hoje, e o prazo legal continua à vista nos incidentes.
- O diálogo do aviso é o mesmo de antes.

Recomendações:
1. `apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx:12`: `VAO_DA_FAIXA_PX = 24` copia o `gap-6` do `main` da casca. Se alguém mudar esse vão, a conta erra sem nenhum aviso. O comentário diz de onde vem o número, mas nada amarra os dois. Vale tirar o vão do próprio layout (por exemplo, medir a distância até o próximo irmão) ou deixar o valor numa constante da casca que os dois usem.
2. `apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx:28`: "só os da sua" soa truncado. Algo como "Os incidentes de segurança que afetaram a sua escola, e só eles" lê melhor. O texto antigo ("O que a Turmma registrou, só sobre a sua escola") era mais claro.
3. `apps/web/src/areas/coordenacao/privacidade/Retencao.tsx:24` e `EmpresasQueRecebemDados.tsx:23`: os comentários de documentação ainda dizem "A aba ...". Desde a 3.0 são telas do seletor.
4. Na foto `vazia--coordenacao--coordenacao-privacidade-suboperadores--computador.png`, o `h2` "Empresas que recebem dados" e o `h3` "Empresas que recebem dado da escola hoje" ficam quase iguais em texto e em peso, um logo abaixo do outro, e o título do vazio sai maior que os dois. Isso é de hierarquia visual e cabe ao `frontend-reviewer`; aponto só porque a repetição de nomes vem da divergência dos títulos (`Privacidade.tsx:27` e `EmpresasQueRecebemDados.tsx:107`).

## test-engineer · 1ª rodada · REPROVADO · 2026-10-17 02:47:00 · `tasks/prd-telas-da-coordenacao/13_task.md`

VEREDITO: REPROVADO

Cenários exigidos:
- Caminho feliz: as três telas no seletor, cada uma com o título por extenso, os prazos, as empresas vigentes e passadas, e os avisos em `Cartao` com a confirmação.
- Bordas:
  - os quatro estados de cada tela, mais o caso "só passadas"
  - endereço que não existe cai em Pedidos
  - texto com quebra de linha (`pre-line`)
  - seis avisos longos passando da janela
  - a faixa do aviso adiado que muda de altura
  - a faixa saindo da tela
- Permissão: segunda pessoa na mesma aba; empresas de outra escola.
- Isolamento: troca de escola sem mostrar a retenção da anterior; empresas só da escola dela.
- Concorrência: clique duplo manda uma confirmação só; duas coordenadoras, e vale a primeira confirmação; com um pedido no ar, os outros botões ficam desligados.

Cobertos:
- **Unidade, `Privacidade.test.tsx`.** Cobre os títulos `h2` e `h3`, o seletor e o endereço, os estados das três telas (o "só passadas" incluído), o cartão com todos os campos e o selo com a família certa, o foco no título depois de confirmar, os botões desligados com um pedido no ar, um único POST e a falha só no cartão que falhou.
- **Unidade, `Superficies.test.tsx`.** A ref e o `tabIndex=-1` do `Cartao`.
- **Unidade, `AvisoDeIncidente.test.tsx`.** A variável `--faixa-de-incidente`: aparece com a faixa e sai com ela.
- **e2e.** O seletor pelas setas numa só parada de Tab. A página que não rola, que agora também confere a largura, então a asserção `larguraExcedente` antiga não se perdeu. Seis avisos com botões de mesma altura, de 44 px ou mais. Os botões do diálogo com a mesma altura (D59) já estavam em `incidentes.spec.ts:164`. Os casos de isolamento, de segunda pessoa e das duas coordenadoras continuam no e2e.
- **Rodada.** Os três arquivos de unidade estão verdes, 36 testes.
- **Mutações.** Os 23 blocos batem com o diff e cada um chega à cláusula dele. Nenhum fica vermelho pelo motivo errado: a frase "Aqui a coordenação confirma…" não colide com `TEXTO_DO_QUE_CONFIRMAR_FAZ`.

Bloqueantes:

1. **`O_MIOLO_SEM_ABAS_QUE_ROLA` sem bloco e sem teste** (`apps/web/src/areas/coordenacao/miolo-que-rola.ts:25`).
   - O diff faz esse miolo descontar `var(--faixa-de-incidente,0px)`. Quem usa a constante é a Analista (`Analista.tsx:84`).
   - Nenhum teste abre a Analista com a faixa adiada: só `e2e/incidentes.spec.ts` passa por "Ver depois", e ele fica na moldura Registros, que usa `O_MIOLO_QUE_ROLA`.
   - Se a cláusula for desfeita, nada fica vermelho.
   - **Correção:** um e2e no projeto `chromebook` que adia o aviso, abre a Analista e chama `paginaNaoRola`, mais o bloco de mutação dele. A outra saída é tirar a cláusula da tarefa e declarar isso nas divergências.

2. **`observador.observe(elemento)` sem bloco e sem teste que falhe** (`apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx:57`).
   - O teste "a faixa acompanha a altura dela" (`AvisoDeIncidente.test.tsx:75-98`) guarda o callback do construtor e o chama direto.
   - Se o `observe` for apagado, a faixa deixa de ser observada no navegador e o teste continua verde.
   - **Correção:** o falso grava os elementos passados a `observe`, o teste confere que a faixa está entre eles, e entra o bloco de mutação dessa linha.

3. **`observador.disconnect()` sem bloco e sem teste** (`apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx:59`).
   - Sem o `disconnect`, uma medição que ainda chega depois de a faixa sair grava de novo `24px` na raiz, já que `offsetHeight` do elemento destacado é 0. O miolo ficaria mais curto em toda tela da coordenação até a próxima carga da página.
   - Nenhum teste falha se a linha sair.
   - **Correção:** depois de "Ver o aviso", o teste chama o callback guardado e confere que a variável continua `''` (ou que o falso registrou o `disconnect`), mais o bloco de mutação.

4. **Chamada inicial `medir()` sem bloco** (`apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx:55`).
   - O teste existe: o primeiro caso de `AvisoDeIncidente.test.tsx` espera `24px`, e o falso nunca chama o callback.
   - Falta só declarar o bloco de mutação (tirar a linha) apontando para esse teste.

Recomendações:
- O nome de `Privacidade.test.tsx:113` promete "o dos prazos e o das empresas não [levam a frase de apoio]", mas não há asserção sobre isso. Ou se acrescenta a asserção, ou se encurta o nome.
- "Os sem confirmação primeiro" (subtarefa 13.4): o teste de unidade prova só que a ordem da API é mantida. Vale citar, na tabela de testes, o e2e "dois incidentes" como o que prova a ordem de verdade.
- O comentário "D59" no e2e dos seis avisos (`e2e/incidentes.spec.ts`, novo teste) trata dos botões de confirmar, que são todos iguais. A D59 fala de recusar contra aceitar, e isso o teste da linha 164 já cobre. Melhor trocar o comentário para "alvo de toque da ação principal (regra 50, 2a)".

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/miolo-que-rola.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Analista.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/incidentes.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/prd-telas-da-coordenacao/13_task.md

## revisor-geral · 2ª rodada · APROVADO · 2026-10-17 10:25:01 · `tasks/prd-telas-da-coordenacao/13_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok

Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")

Bloqueantes: nenhum

Nesta rodada conferi três coisas:

- **Recomendações da 1ª rodada.** O texto do apoio dos incidentes foi trocado em `Privacidade.tsx:28`, e as duas mutações que copiam esse texto em `13_task.md` foram atualizadas junto. A foto `vazia--coordenacao--coordenacao-privacidade-incidentes--celular.png` mostra o texto novo. Os dois comentários que diziam "A aba" foram corrigidos em `Retencao.tsx:25` e `EmpresasQueRecebemDados.tsx:23`. As quatro recomendações adiadas estão no `TODO.md` e na tabela "Recomendações sem aplicar", e a recusada também está lá, com o motivo.
- **Teste de unidade da faixa.** O teste em `AvisoDeIncidente.test.tsx` agora prova três coisas: que a faixa é observada, que ela é medida de novo quando muda de altura e que deixa de ser medida quando sai. Isso bate com `AvisoDeIncidente.tsx:24-29`. As três mutações novas que apontam para essas linhas estão declaradas.
- **E2e novo da Analista.** O e2e em `e2e/incidentes.spec.ts` testa a conta da faixa em `O_MIOLO_SEM_ABAS_QUE_ROLA`, que esta tarefa alterou. Não invade outra tarefa, e a mutação dele está declarada.

Recomendações:
- `e2e/incidentes.spec.ts:621-626`: a condição `if (largura >= 768)` aparece duas vezes seguidas. Basta um bloco só, com o `setViewportSize` e a asserção do `scrollHeight` juntos.
- `e2e/incidentes.spec.ts:607`: o teste ganhou mais um `test.setTimeout(60_000)` local. Isso repete o padrão que o `TODO.md` já marca para limpar em `privacidade.spec.ts`. Ele pode entrar na mesma passada de limpeza, que levaria o prazo para o `describe` ou para uma constante com nome.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-17 10:25:26 · `tasks/prd-telas-da-coordenacao/13_task.md`

VEREDITO: APROVADO
Tela vista: sim (25 fotos lidas, cheia e vazia; as fotos "Ver depois" de Retenção e Empresas existem na pasta, mas não as li, porque o diff não toca nelas)
Estados: ok. Carregando e erro não aparecem na vitrine; vêm do código e do e2e da rodada 1, que o diff não tocou. O vazio das Empresas e o dos Incidentes convidam: dizem quando e onde as coisas aparecem. Retenção não tem vazio por desenho, porque toda escola tem todas as categorias.
Acessibilidade: ok. O diálogo é `alertdialog` e o foco volta para a faixa. O miolo que rola recebe `tabindex=0`. O e2e confere o alvo dos seis botões (44 px ou mais) e as violações graves do axe. O observador de altura da faixa agora tem teste de `observe` e de `disconnect`.
Chromebook fraco: sem mudança desde a rodada 1. A tela usa tabela no computador e cartões no celular, e o diff não acrescenta peso.
Celular: nas fotos de 360 px não há rolagem horizontal nem texto cortado. O seletor das três telas cabe, os cartões empilham e a ação principal "Confirmo que recebi" aparece grande. A barra de baixo aparece no meio das fotos compridas, mas isso é efeito da colagem dos pedaços, não defeito da tela. O e2e novo cobre a Analista, que não tem abas, com o aviso adiado, em janela baixa de 600 px: prova que a faixa não soma altura ao miolo e que a página não rola.
Ação oficial protegida: sim. O diálogo mostra o incidente inteiro (o que aconteceu, dados alcançados, pessoas, risco, datas) antes do "Confirmo que recebi". Também diz que confirmar não comunica a ANPD nem os titulares. "Ver depois" deixa uma faixa fixa e não esconde o aviso.
Bloqueantes: nenhum. O diff desde a rodada 1 é só o texto de apoio dos incidentes, dois comentários, testes, e2e, TODO.md e o documento da tarefa. O texto novo, "O que a Turmma registrou sobre incidentes…" em `Privacidade.tsx:28`, está em português claro e sem termo técnico. A ordem de correção da rodada anterior era "nenhuma", e o destino das recomendações dela está no TODO.md.
Recomendações:
- Em 1366×768, o diálogo do aviso ocupa a altura toda e os botões "Confirmo que recebi" e "Ver depois" ficam abaixo da dobra, dentro da rolagem do próprio diálogo (as fotos `coordenacao--coordenacao-privacidade-*--computador.png` cortam no parágrafo do prazo legal). Funciona, mas a ação principal fica fora da vista. Vale um rodapé fixo no `Dialogo` (`apps/web/src/componentes/Dialogo.tsx:105-111`, que já tem a propriedade `rodape`) ou uma disposição mais compacta dos campos. Pode ir para o `/validar`.
- O "Turmma" no masculino ("Quando o Turmma contratar…", vazio das Empresas) e o seletor de 36 px já estão no TODO.md.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-17 10:25:28 · `tasks/prd-telas-da-coordenacao/13_task.md`

VEREDITO: APROVADO

Esta é a 2ª rodada. Auditei só o que mudou desde a 1ª (de `d3d1b1b` a `cffe167`): o texto do apoio dos incidentes, dois comentários de código, um teste de unidade, um caso novo de e2e, o `TODO.md` e o documento da tarefa. Também olhei as fotos.

**Campos pessoais tocados:** nenhum. Nenhuma migration, DTO, rota, repository ou contrato de `packages/shared` mudou.

**Fora da tabela de dados do docs/lgpd.md:** nada.

**Autorização por objeto:** ok. Nenhuma rota nova. A frase de apoio diz "só dela", e isso é verdade porque o escopo continua no servidor, como já estava aprovado na 1ª rodada. A tela só repete o que a API já garante.

**Logs:** limpos. Nenhum `console` ou `logger` em `apps/web/src/areas/coordenacao/privacidade/`.

**Auditoria:** presente. A confirmação do incidente registra quem confirmou e quando, sem mudança nesta rodada. A foto `coordenacao--coordenacao-privacidade-incidentes--Ver-depois--celular-1.png` mostra a frase "Ficam registrados quem confirmou e quando".

**Envio externo:** nenhum.

**Seed/fixture:** sintético. O caso novo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/incidentes.spec.ts:140-161` usa `criarEquipeComSenha`, `criarIncidenteNoBanco` e `marca()`, que gera `Marca <uuid>` (linha 36). As fotos mostram só "Colégio sintético da vitrine", "Coordenadora sintética <hex>", "Hospedagem da vitrine" e "Provedor de IA da vitrine".

**Fotos:** nenhuma das 17 mostra nome de aluno, matrícula, nota, resposta ou conteúdo de conversa. O aviso de incidente mostra a categoria do dado alcançado ("Conversa do aluno com o Tutor"), não o conteúdo, e a contagem de pessoas como estimativa agregada ("120 pessoas"). É o que a escola controladora precisa para comunicar à ANPD. O texto novo de apoio (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx:28`) está correto do ponto de vista da LGPD: diz que quem registra é a Turmma e que o registro é só da escola. A frase sobre o prazo legal continua deixando claro que comunicar é dever da escola.

**Correções exigidas na rodada anterior:** nenhuma. A recomendação, devolver ao apoio dos incidentes a frase que diz quem registra, foi aplicada, e a foto `vazia--coordenacao--coordenacao-privacidade-incidentes--computador.png` confirma.

**Pergunta de fechamento:** esta tarefa não muda o que o sistema guarda sobre um aluno nem para onde envia. A tela das empresas continua respondendo para onde o dado da escola vai, com as empresas vigentes e as passadas.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma de privacidade. As quatro que o documento mandou para o `TODO.md` são de visual ou de código e não tocam dado pessoal.

## test-engineer · 2ª rodada · APROVADO · 2026-10-17 10:25:37 · `tasks/prd-telas-da-coordenacao/13_task.md`

VEREDITO: APROVADO

**Cenários exigidos (desta rodada):**
1. A Analista, que é o miolo sem abas, não deixa a página rolar quando o aviso foi adiado e a faixa aparece.
2. A faixa é o elemento que o observador de tamanho acompanha.
3. Quando a faixa sai, o observador para de medir e não grava a variável de novo.
4. A primeira medição acontece logo que a faixa aparece.
5. As três recomendações da 1ª rodada: o nome do teste em `Privacidade.test.tsx`, a linha da tabela "os sem confirmação primeiro" e o comentário "D59" do e2e dos seis avisos.

**Cobertos:**
1. **Correção 1.** O e2e novo está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/incidentes.spec.ts:607-628`. Ele adia o aviso, abre a Analista, confere que a faixa continua visível e baixa a janela para 1366 × 600.
   - Antes de chamar `paginaNaoRola`, ele exige que o "Resumo do Analista" role por dentro. Isso garante que o conteúdo passa do miolo, e o teste não passa só porque a tela é curta.
   - A seção "Resumo do Analista" é a que usa `O_MIOLO_SEM_ABAS_QUE_ROLA` (`Analista.tsx:84`).
   - Com a mutação, a altura máxima do miolo é 600 − 208 = 392 px. Com a faixa, são 392 − 84 = 308 px. Pelo TODO, o conteúdo passa de 560 px a 768 de altura, então o resumo continua rolando com a mutação também.
   - Logo, o vermelho da mutação vem de `paginaNaoRola`, que é a cláusula em teste, e não da checagem do resumo. O bloco de mutação foi declarado.
2. **Correção 2.** O observador falso agora grava os elementos passados a `observe`, e o teste exige `observados` igual a `[faixa]` (`AvisoDeIncidente.test.tsx:104`). Além disso, o falso só chama o callback se algo foi observado. Sem o `observe`, o teste fica vermelho. O bloco foi declarado.
3. **Correção 3.** Depois de "Ver o aviso", o teste exige que o `disconnect` tenha sido chamado (`AvisoDeIncidente.test.tsx:113`).
   - Em seguida chama o callback guardado e exige que a variável continue vazia (`:114-115`).
   - Sem o `disconnect`, as duas asserções falham: o elemento destacado ainda tem `offsetHeight` 96, e a variável voltaria a `120px`. O bloco foi declarado.
4. **Correção 4.** O bloco "tirar `medir()`" aponta para o teste "com o diálogo aberto não há variável…". Nesse teste o observador falso nunca chama o callback, então sem a chamada inicial a variável não chega a `24px` e o teste fica vermelho. Está correto.
5. **Recomendações.** As três entraram:
   - `Privacidade.test.tsx:113` foi renomeado e não promete mais asserção sobre os prazos e as empresas.
   - A tabela de testes ganhou as linhas "os sem confirmação primeiro" e "faixa do aviso adiado" (`13_task.md:47-48`).
   - O comentário do e2e agora cita a regra 50, item 2a.

Também conferi o seguinte:
- Nenhum teste nem documento ainda espera o texto de apoio antigo dos incidentes. As duas ocorrências que sobraram são JSDoc em `api/privacidade.ts` e `Incidentes.tsx`.
- `npx vitest run` nos dois arquivos de teste: 22 de 22 verdes.
- Não há `.skip` nem provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
- `e2e/incidentes.spec.ts:621-625`: há dois `if (largura >= 768)` seguidos. Dá para juntar os dois num bloco só.
- No projeto `celular`, o e2e novo só prova que não há rolagem para o lado, porque `paginaNaoRola` encerra antes de 768 px. Está certo, já que a cláusula só vale a partir de 768 px (`md:`). Um comentário de uma linha diria a quem lê por que o celular não prova a conta da faixa.
- A folga de 12 px do miolo sem abas faz o teste depender de a faixa ter mais de 12 px, mais o vão. Hoje ela tem cerca de 84 px, então a margem é larga. Fica só registrado, para o caso de o desenho da faixa mudar junto com o item do `VAO_DA_FAIXA_PX` que já está no `TODO.md`.
