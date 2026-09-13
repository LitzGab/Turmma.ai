# Negócio — mercado, preço, concorrência e venda

> Este documento guarda o contexto comercial que orienta prioridade de produto. **Não é
> leitura obrigatória para implementar uma tarefa.** É leitura obrigatória para escrever PRD
> de funcionalidade que mexe com preço, consumo de IA, governança ou demonstração, e para
> `/descobrir` quando a decisão tem custo.
>
> Fonte: o mapa do projeto, a call de 12/09/2026 entre Gabriel e Joaquim, o benchmark de
> concorrentes e as decisões até 13/09/2026. Os números de mercado são do levantamento
> feito nessa data e não foram reconferidos desde então.

---

## 1. De onde veio a ideia

Empresas que vendem **agentes por função**, que agem como funcionários digitais (vendas,
atendimento, marketing, RH, operações), validaram o modelo: um sistema com vários agentes,
cada um executando uma função. Na call o exemplo foi uma startup de Florianópolis com cerca
de R$ 50 milhões captados.

A nossa versão é o mesmo modelo aplicado a um nicho: **um time de agentes para a escola**.
Na descrição do Joaquim na call: "como se o professor tivesse um estagiário produtivo".

Os três essenciais definidos na call:

1. Conexão com o material de estudo que a escola já usa
2. Gerar valor para professor, aluno, família e coordenação
3. Gerar segurança para pais e professores: IA restrita ao assunto escolar, professor no
   comando

## 2. Os problemas que resolvemos

1. Uso indevido de IA pelo aluno: cola, "pegar a resposta sem pensar"
2. Falta de controle do professor sobre o uso de IA pelo aluno
3. Falta de governança da escola sobre a qualidade do ensino
4. Tempo do professor consumido por planejamento, montagem e correção
5. Família sem visibilidade do que acontece na escola

## 3. Quem compra, quem usa, quem paga

| Papel | Usa | Paga | O que ganha |
|---|---|---|---|
| Coordenação / direção | sim | decide a compra | governança de quem usa IA, como e com que resultado; alertas |
| Professor | sim | não | tempo |
| Aluno | sim | não | tutor que ensina, restrito ao conteúdo escolar |
| Família | fase posterior | sim, via mensalidade (particular) | nota, entrega, alerta |
| Prefeitura / rede | não diretamente | sim, por contrato | governança de rede e IA supervisionada |

A regra de ouro da call: **professor e aluno precisam gostar e usar; família e direção
precisam confiar; quem paga é a família (particular) ou a prefeitura (pública).**

Uma observação da call que vale para a venda: em escola particular, compra desse porte
costuma passar por apresentação em assembleia de pais. Se a família não se interessar, não
tem venda. É por isso que o portal da família, mesmo em fase posterior, tem o motor de
eventos construído agora (D11).

## 4. Preço (tese, cobrança ainda em aberto)

**Escola particular: cerca de R$ 30 por aluno por mês**, repassado à família na
mensalidade. É cerca de 3% de uma mensalidade de R$ 1.000, abaixo do reajuste médio de 9,8%
previsto para 2026. Uma escola com Ensino Médio completo fica em torno de R$ 10 mil por mês.

O argumento para a assembleia, como saiu na call: "R$ 30 a mais é o que o seu filho gasta
num dia de cantina. Com isso ele tem um tutor que só fala do conteúdo da escola, em vez de
usar ferramentas que tiram o foco dele."

**Prefeitura / rede:** contrato com uso ilimitado, faixa hipotética de R$ 5 a R$ 10 por
aluno por mês.

**Créditos:** a call levantou crédito para uso avulso e contrato ilimitado para escola e
rede. Como isso vira sistema está em aberto (ver `CLAUDE.md`). Até decidir, o sistema mede
consumo e não cobra (D14).

**Referência histórica da call:** R$ 250 por professor + R$ 100 por aluno. Descartada em
favor do preço por aluno.

**Âncoras do benchmark:**

- Ferramentas de professor saem por R$ 1 a R$ 7 por aluno por mês quando normalizadas para
  a escola
- Sistemas de ensino levam R$ 50 a R$ 135 por aluno por mês, mas incluem material e são
  pagos pela família
- **R$ 30 fica na faixa vazia entre os dois**
- Teto psicológico para "IA do professor": R$ 39,90 por mês (Teachy)

**Custo de IA:** modelo caro só para tarefa complexa (apresentação, HTML bonito, análise);
modelo barato para planejar, montar e corrigir. O tutor do aluno gasta muito mais que a
geração de prova. A planilha de custo por aluno é o que valida ou derruba os R$ 30, e ela é
alimentada pela estimativa que o `llm-integrator` cobra em cada Tech Spec.

## 5. Mercado em números

Censo Escolar 2025 e outras fontes, conforme o levantamento de 13/09/2026:

- 46,0 milhões de matrículas na educação básica, 178,8 mil escolas, 2,41 milhões de
  docentes, 94,5% das escolas com internet
- Rede privada: 9,25 milhões de alunos em 41,7 mil escolas. Ensino Médio privado: 1,03 milhão
- Redes municipais: 23,1 milhões de alunos em 5.570 municípios
- **Mercado privado a R$ 30 por aluno por mês: R$ 3,3 bilhões por ano.** Municipal a
  R$ 5–10: R$ 1,4 a 2,8 bilhões por ano
- 79% dos professores e 84% dos alunos já usaram IA (Fundação Itaú, 2025). Professores
  brasileiros lideram a OCDE em uso de IA (56% contra 36%, TALIS 2024). Só 19% dos alunos
  receberam orientação
- Só 22% das escolas têm guia de uso de IA (Cetic, TIC Educação 2025)
- Edtech Brasil: US$ 6,0 bilhões (2025) para US$ 15,6 bilhões (2034); K-12 é 42%. Só 4,2%
  das edtechs vendem para governo

## 6. Concorrência

Benchmark completo, com 17 dossiês e radar de 16 emergentes:
https://educa-ia-benchmark.vercel.app

**O que o mercado mostra:**

- **Ninguém vende agente autônomo.** Toda IA é assistente sob comando, acoplada a material
  didático (Somos/Plurall, Arco, Geekie), banco de questões (Estuda, Super Professor) ou
  agenda (Layers)
- **A família é o stakeholder ausente.** Só o Khanmigo tem portal do responsável de verdade,
  e só nos EUA
- **WhatsApp não é canal pedagógico** de nenhum player
- **Consolidação em grupos de material:** Arco comprou Eduqo, Geekie, ClassApp e isaac;
  Cogna comprou Redação Nota 1000; FTD comprou Estuda.com. Neutralidade vira argumento
- **Governança de IA:** todos citam, só a Profy tem fluxo de aprovação humana, e ninguém
  entrega painel de governança de IA para a coordenação
- **Teachy é o concorrente a acompanhar:** R$ 48 milhões captados, 43 anúncios ativos,
  único que fala com professor e diretor ao mesmo tempo, comprou a Nero.AI para
  personalização
- **Internacionais não vêm:** nenhum vende em real nem tem canal no Brasil. Gemini grátis no
  Classroom e Khanmigo grátis para professor tornam "gerar plano de aula" commodity

**O que aprender de cada um:**

| Player | Lição |
|---|---|
| Teachy | velocidade de produto; cargo no título do anúncio |
| Profy | aprovação humana pela coordenação do que a IA gerou |
| SchoolAI | "Mission Control": professor vendo o aluno usar IA ao vivo, alertas roteados |
| Khanmigo | tutor socrático que não dá resposta; portal do responsável com histórico |
| Letrus | estudo controlado de impacto abre secretaria; preço público em pregão (R$ 85–130/aluno/ano) |
| Estuda.com | prova adaptada por IA como caso de venda; inclusão é o tema mais anunciado |
| Layers | neutralidade e integração fazem dela a camada onde os outros plugam |

**Consequência para o produto:** plano de aula e prova não diferenciam, porque já são
commodity. O que diferencia é o que está em `docs/visao-produto.md` seção 3: agente que
executa e avisa, loop fechado até a família, e governança de IA pronta para o CNE.

## 7. Posicionamento e mídia

- Termos sem anunciante B2B hoje: **"agentes de IA"**, **"WhatsApp"**, **"plano de aula
  com IA"**, **"correção de prova com IA para escola"**
- Promessas dominantes dos concorrentes: tempo do professor, inclusão/PEI, dado para o
  gestor, matrícula 2027
- Táticas replicáveis: cargo no título ("PARA COORDENADORES"), isca ("guia de uso de IA da
  sua escola"), webinar com data, ondas de 20–30 variações de criativo no mesmo dia
- **Setembro é o pico de compra para o ano seguinte**
- Conformidade com o CNE vira material de venda: as escolas têm doze meses para se adequar
  e quase nenhuma sabe como

## 8. Como a venda acontece

Educação é mercado de **relacionamento e política**, não de prospecção fria. O plano da
call: visitas semanais a prefeituras e escolas, apresentação em reunião de coordenação e em
assembleia de pais, escolas técnicas.

- Existem contatos possíveis (SENAI, prefeitura de Joinville). **Nenhum é certo e nenhuma
  decisão de produto é tomada com base neles**
- O argumento "sistema feito por alunos do SENAI" foi levantado para a apresentação no SENAI
- Investimento é considerado viável a partir de uma primeira venda, por relacionamentos do
  Gabriel. Isso não muda prioridade de produto
- **O que convence é o fluxo completo funcionando** (D1). Por isso a demonstração (F15) tem
  seed sintético de uma escola inteira e o feed de agentes nunca aparece vazio

O que a coordenação precisa ver na primeira semana para renovar está em D24.

## 9. Frentes de definição

| # | Definição | Responsável | Estado em 13/09/2026 |
|---|---|---|---|
| 1 | Posicionamento de marca e landing page | Gabriel | em andamento |
| 2 | Mapa do sistema e telas | Joaquim | `docs/interface.md` |
| 3 | Fluxos-chave detalhados | Joaquim + Gabriel | `docs/fluxos.md` |
| 4 | Lista de agentes e nível de autonomia | juntos | nomes decididos (D17), lista em aberto |
| 5 | Stack e arquitetura | Joaquim | ratificada (D16) |
| 6 | Modelo de dados e orçamento de IA por aluno | Joaquim | `docs/modelo-de-dados.md`; orçamento em aberto |
| 7 | Nome, INPI e domínio | juntos | em aberto |
| 8 | WhatsApp e portal da família | juntos | fase posterior |

## 10. Referências

- Repositório: https://github.com/LitzGab/Educa.ia
- Benchmark de concorrentes: https://educa-ia-benchmark.vercel.app
- Diretrizes do CNE sobre IA (cobertura Porvir): https://porvir.org/cne-diretrizes-inteligencia-artificial-escola-universidade/
- Referencial do MEC sobre IA na educação básica: https://www.gov.br/mec/pt-br/escolas-conectadas/arquivos/ia-basica.pdf
- Censo Escolar 2025 (INEP): https://download.inep.gov.br/publicacoes/institucionais/estatisticas_e_indicadores/notas_estatisticas_censo_escolar_da_educacao_basica_2025.pdf
- Fundação Itaú, adoção de IA: https://www.fundacaoitau.org.br/noticias/educacao/84-dos-alunos-e-79-dos-professores-ja-utilizaram-ferramentas-de-ia-diz-estudo
- Cetic, TIC Educação 2025: https://cetic.br/media/pdf/analises/20260804094932_pt_br_tic_educacao_2025_coletiva_de_imprensa.pdf
