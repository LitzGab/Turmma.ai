# Pipeline de ingestão

A base de conhecimento da escola é de onde **tudo** que a IA gera nasce: prova, atividade,
dúvida, plano de aula, adaptação. Se a ingestão for ruim, o produto inteiro é ruim.

## Princípio

**Um pipeline único, duas entradas.** O scraper e o upload manual desembocam no mesmo
caminho. Assim, se uma fonte mudar de layout ou sair do ar, a escola sobe o PDF e continua
funcionando no mesmo dia.

```
Fonte (scraper por adaptador | upload PDF/apostila)
  → extração de texto e estrutura
  → limpeza e normalização
  → chunking com contexto de capítulo
  → classificação: série, disciplina, capítulo, habilidade BNCC
  → indexação vetorial + busca por metadado
  → rastreabilidade até a página de origem
```

## Requisitos

1. **Rastreabilidade.** Toda questão, resposta e material gerado aponta a página de origem.
   O professor precisa poder conferir. É isso que separa nossa saída de um chat genérico.
2. **Versionamento.** Material muda de edição. A versão usada em uma prova precisa ficar
   registrada.
3. **Reprocessamento.** Quando a fonte atualiza, reindexa sem perder o histórico.
4. **Isolamento.** Conteúdo ingerido pertence ao tenant da escola. Nunca cruza para outra
   escola, nunca vira banco nosso. Ver `docs/regulacao.md` seção 4.
4a. **Licença antes de processar** (D5 revista). A fonte declara a titularidade do material
    (escola, professor, licenciado, domínio público, ENEM). Material licenciado exige o
    documento de licença registrado. Sem autorização da escola e, quando couber, sem
    licença do dono do conteúdo, o pipeline recusa o arquivo antes da extração, com
    mensagem que diz o que falta. O upload não é atalho para apostila de terceiro.
5. **Adaptador por fonte.** Cada sistema de ensino é um adaptador isolado, com teste
   próprio. Quebrou um, os outros seguem. **O upload é a primeira implementação da porta
   de fonte** (D22). Adaptador de scraper só entra quando existir uma escola real com a
   fonte definida, a autorização escrita registrada e licença ou parceria com o dono do
   conteúdo, porque ainda não sabemos quais sistemas as escolas-alvo usam.
6. **Fila.** Ingestão nunca roda em request. Escola sobe 300 PDFs e a interface continua viva.
7. **Estado visível.** O coordenador vê o que foi ingerido, o que falhou e o que está
   pendente. Ingestão silenciosa que falha é pior que ingestão que não existe.

## Qualidade

Extração de PDF erra: coluna dupla, fórmula, tabela, imagem com texto. Defina um conjunto
fixo de amostras e meça a taxa de acerto da extração e da classificação BNCC. Se a taxa
cair abaixo do limite, a tarefa falha — como em qualquer outro teste.

## Banco público separado

As provas oficiais do ENEM, publicadas pelo INEP, entram como **banco público**, sem dono,
disponível a todas as escolas (D21). Isso não se mistura com o material proprietário de
nenhuma escola. Vestibulares ficam de fora até a licença de cada um ser verificada pelo
`domain-researcher`.

O banco público passa pelo mesmo pipeline, com a fonte marcada como pública, e é o que
alimenta o simulado ENEM do F7. Desde 20/08/2026 o Google oferece simulado ENEM grátis no
Gemini, então o banco público vale mais como fonte de questão com origem citada para prova e
atividade do que como simulado isolado.
