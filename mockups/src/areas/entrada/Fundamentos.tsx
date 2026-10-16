import { useMemo, useRef, useState } from 'react'
import type React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Download, Gauge, Plus, RotateCw, Send } from 'lucide-react'
import {
  Abas, Avatar, Aviso, Balao, BarraProgresso, Botao, BotaoIcone, Busca, CampoSenha, CampoTexto, Carimbo, Cartao, Comemoracao,
  Contador, Dialogo, DialogoConfirmar, EstadoVazio, Faixa, FaixaResultado, FAMILIAS, GrupoToques, Interruptor, LadrilhoAcao,
  LadrilhoIcone, Linha, LISTA_FAMILIAS, MATERIAS, MenuMais, NumeroGrande, Opcao, Passos, Ponto, Recolhivel, Segmentado, Selo,
  SeloIA, SeloNovo, SeloTurma, Tabela, TelaFoco, TIPO_FILA, type VarianteBotao,
  BarraPacote, BarrasPequenas, BarraEmpilhada, baixarPdf, CartaoNumero, casar, ChatDados, PontosSituacao, TabelaCurta,
  type DocumentoRelatorio, type RespostaDados, type RoteiroDados,
} from '@/components/duo'
import {
  ACERTO_POR_SERIE, ENTREGAS_ATRASADAS, HABILIDADES_2EM, MES, PACOTE, PERIODO, ESCOLA, inteiro, reais,
} from '@/dados/numeros-escola'
import { Icone, type IconeId } from '@/components/duo/icones'
import { Onca } from '@/components/duo/onca'
import { Marca } from '@/components/marca/Pinta'
import { LinhaFila } from '@/components/turmma/fila'
import { itemDaFila, type ItemFila, type TipoItem } from '@/dados/fila'
import { cn } from '@/lib/utils'
import {
  BarraConversa, CabecalhoPagina, CartaoPainel, ConversaVazia, GradePainel, Secao as SecaoPagina,
  CabecalhoDocumento, CabecalhoFolha, BlocoQuestao, CartaoDocumento, CartoesResumo, Folha, LinhaDoTempo, BlocoFixo, MapaMental,
  MesaDocumento, SeloEstadoDocumento, Sumario, TabelaRubrica, TabelaSequencia, GradeSlides, SlideAberto, FaixaResultados,
  CartaoKPI, GraficoSemanas, MapaDeCalor, TabelaBarras, Tendencia, useFamilias,
} from '@/components/duo'
import { Sino } from '@/components/turmma/sino'
import { aparencia, useAparencia, useTema, type Aparencia } from '@/dados/tema'
import { testarConsulta } from '@/dados/consulta'

/* A PRANCHA DO SISTEMA (11ª rodada, 04/10/2026): Turmma × Duolingo, para ver em vez de ler.
   Especificação: ~/Code/Turmma/pesquisa/duolingo/sistema-turmma-duolingo.md (seções 2 e 3). As peças moram em
   src/components/duo; a onça e os ícones ilustrados, em duo/onca e duo/icones (bancada em /fundamentos/onca). */

/** Os mesmos neutros no escuro (os tons do Duolingo; plano ux-composicao, 2.2). */
const NEUTROS_ESCURO: Record<string, string> = {
  fundo: '#131F24', 'fundo-suave': '#202F36', borda: '#37464F', 'borda-forte': '#52656D', apagado: '#52656D',
  sutil: '#8FA3AD', apoio: '#DCE6EC', grafite: '#F1F7FB', tinta: '#F1F7FB',
}
const NEUTROS: [string, string][] = [
  ['fundo', '#FFFFFF'], ['fundo-suave', '#F7F7F7'], ['borda', '#E5E5E5'], ['borda-forte', '#D7D7D7'], ['apagado', '#AFAFAF'],
  ['sutil', '#5D5D5D'], ['apoio', '#424242'], ['grafite', '#333333'], ['tinta', '#0D0D0D'],
]

const TONS = ['face', 'degrau', 'claro', 'borda', 'texto'] as const

const NOME_TIPO: Record<TipoItem, string> = {
  atencao: 'Atenção', notas: 'Notas', sinal: 'Sinal do Tutor', pedidos: 'Pedidos', 'pedidos-nome': 'Pedidos (escola)',
  material: 'Prova adaptada', turma: 'Turma', aviso: 'Aviso de aluno', contestacao: 'Contestação', alerta: 'Alerta',
  'material-falhou': 'Material falhou', convite: 'Convite', dossie: 'Dossiê',
  revisao: 'Revisão pedida', risco: 'Encaminhamento', titular: 'Pedido sobre dados',
}

const TIPOGRAFIA: [string, string, string][] = [
  ['t-titulo', '24/30 · 700', 'Notas da prova de estequiometria'],
  ['t-secao', '20/26 · 700', 'Esperando você'],
  ['t-balao', '20/26 · 500', 'Oi! Qual é a sua dúvida?'],
  ['t-cartao', '17/22 · 700', 'Pedidos para entrar'],
  ['t-corpo', '17/25 · 500', 'Revisão de estequiometria'],
  ['t-apoio', '15/20 · 500', 'Hoje, 8h55'],
  ['t-rotulo', '15/18 · 700 · caixa alta', 'Aprovar as notas'],
  ['t-selo', '13/16 · 700 · caixa alta', 'Para aprovar'],
  ['t-numero', '28/32 · 700', '412'],
  ['t-numero-g', '36/40 · 700', '6,4'],
]

const VARIANTES: [VarianteBotao, string][] = [
  ['primario', 'Gerar prova'], ['oficial', 'Aprovar notas'], ['secundario', 'Começar aula'], ['perigo', 'Recusar'], ['fantasma', 'Ver tudo'],
  ['perigoCheio', 'Revogar'],
]

/* As peças da 12ª rodada, para a prancha. */
const LINHAS_TABELA = [
  { id: 'a', nome: 'Ana Beatriz', situacao: 'Em dia', media: '7,5' },
  { id: 'b', nome: 'Bruno Tavares', situacao: 'Atenção: entregas', media: '6,1' },
  { id: 'c', nome: 'Caio Mendes', situacao: 'Ainda não entrou', media: '—' },
]

function PecasNovas() {
  const [aba, setAba] = useState('turmas')
  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [busca, setBusca] = useState('')
  const [ligado, setLigado] = useState(true)
  const [toque, setToque] = useState<string | string[]>('7')
  const [turmas, setTurmas] = useState<string | string[]>(['3a'])
  const [passo, setPasso] = useState(1)
  const [dialogo, setDialogo] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const [ativa, setAtiva] = useState<string | null>('b')
  return (
    <>
      <div className="grid grid-cols-1 gap-x-8 lg:grid-cols-2">
        <Secao titulo="Abas">
          <Abas rotulo="Escola" valor={aba} aoMudar={setAba} abas={[{ id: 'turmas', rotulo: 'Turmas' }, { id: 'professores', rotulo: 'Professores' }, { id: 'material', rotulo: 'Material' }]} />
        </Secao>
        <Secao titulo="Passos">
          <Passos passos={['Rubrica', 'Lote anônimo', 'Corrigir']} atual={passo} aoIr={setPasso} />
          <Botao variante="secundario" tamanho="p" className="mt-3" onClick={() => setPasso((p) => (p >= 3 ? 0 : p + 1))}>Próximo passo</Botao>
        </Secao>
      </div>
      <div className="grid grid-cols-1 gap-x-8 lg:grid-cols-2">
        <Secao titulo="Campos">
          <div className="grid grid-cols-1 gap-4">
            <CampoTexto rotulo="Matrícula" valor={nome} aoMudar={setNome} placeholder="2026-0801" dica="Está na carteirinha. Não sabe? Peça ao professor." />
            <CampoSenha valor={senha} aoMudar={setSenha} erro={senha && senha.length < 8 ? 'Use 8 letras ou números.' : undefined} />
            <Busca valor={busca} aoMudar={setBusca} rotulo="Buscar aluno" />
          </div>
        </Secao>
        <Secao titulo="Toques, interruptor e menu">
          <div className="grid grid-cols-1 gap-4">
            <GrupoToques rotulo="Validade" valor={toque} aoMudar={setToque} opcoes={[{ id: '1', rotulo: '1 dia' }, { id: '7', rotulo: '7 dias' }, { id: '30', rotulo: '30 dias' }]} />
            <GrupoToques rotulo="Turmas" multiplo valor={turmas} aoMudar={setTurmas} opcoes={[{ id: '3a', rotulo: '3ºA' }, { id: '3b', rotulo: '3ºB' }, { id: '2c', rotulo: '2ºC' }]} />
            <div className="flex items-center gap-3">
              <Interruptor ligado={ligado} aoMudar={setLigado} rotulo="Recebe risco à vida" />
              <span className="t-cartao">Recebe risco à vida</span>
              <span className="ml-auto"><MenuMais itens={[{ rotulo: 'Exportar lista', aoEscolher: () => undefined }, { rotulo: 'Revogar', perigo: true, aoEscolher: () => undefined }]} /></span>
            </div>
          </div>
        </Secao>
      </div>
      <Secao titulo="Aviso">
        <div className="grid gap-3 md:grid-cols-2">
          <Aviso tom="info">Nenhuma prova esperando você.</Aviso>
          <Aviso tom="atencao" titulo="Sem ninguém aqui, o Tutor fica desligado." />
          <Aviso tom="erro">Sem licença, o material não é enviado.</Aviso>
          <Aviso tom="certo" titulo="A professora olhou: manteve a nota.">“A resposta certa é 72 g.”</Aviso>
        </div>
      </Secao>
      <div className="grid grid-cols-1 gap-x-8 lg:grid-cols-2">
        <Secao titulo="Pessoa e registro">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <Avatar nome="Lucas Pereira" /><Avatar nome="Alice Monteiro" /><Avatar nome="Olívia Ramos" tamanho={32} />
            <SeloNovo /><SeloNovo tamanho="p" />
          </div>
          <Carimbo por="Camila Souza" quando="21/09, 10h44" extra="chegou ao 2ºB agora" className="mt-3" />
        </Secao>
        <Secao titulo="Diálogos">
          <div className="flex flex-wrap gap-3">
            <Botao variante="secundario" onClick={() => setDialogo(true)}>Abrir diálogo</Botao>
            <Botao variante="perigo" onClick={() => setConfirmar(true)}>Revogar acesso</Botao>
          </div>
          <Dialogo aberto={dialogo} aoMudar={setDialogo} titulo="Convidar professor"
            rodape={<Botao onClick={() => setDialogo(false)}>Gerar convite</Botao>}>
            <p className="t-corpo text-apoio">O link aparece uma vez.</p>
          </Dialogo>
          <DialogoConfirmar aberto={confirmar} aoMudar={setConfirmar} titulo="Revogar o acesso do 2ºB?"
            frase="O código deixa de valer na hora." confirmar={{ rotulo: 'Revogar', variante: 'perigoCheio', aoConfirmar: () => undefined }} />
        </Secao>
      </div>
      <Secao titulo="Tabela">
        <Tabela rotulo="Alunos" linhas={LINHAS_TABELA} chave={(l) => l.id} ativa={ativa} aoAbrir={(l) => setAtiva(l.id)}
          colunas={[
            { titulo: 'Nome', celula: (l) => <span className="flex items-center gap-3"><Avatar nome={l.nome} tamanho={32} />{l.nome}</span> },
            { titulo: 'Situação', celula: (l) => l.situacao },
            { titulo: 'Média', classe: 'w-24 text-right', celula: (l) => <span className="tabular-nums">{l.media}</span> },
          ]} />
      </Secao>
      <div className="grid grid-cols-1 gap-x-8 lg:grid-cols-2">
        <Secao titulo="Recolhível">
          <Recolhivel titulo="As outras 25" apoio="iguais ao gabarito, de A a Z">
            <p className="t-apoio">Ana Beatriz · Bruno Tavares · …</p>
          </Recolhivel>
        </Secao>
        <Secao titulo="Tela de foco">
          <div className="overflow-hidden rounded-[16px] border-2 border-borda">
            <TelaFoco className="h-[260px]" topo={{ voltar: () => undefined, sair: true, titulo: 'Prova de estequiometria' }}
              progresso={{ valor: 3, max: 10 }} rodape={<div className="flex justify-end"><Botao tamanho="m">Próxima</Botao></div>}>
              <p className="t-corpo p-5">Questão 3 de 10</p>
            </TelaFoco>
          </div>
        </Secao>
      </div>
    </>
  )
}

/* ── 13ª rodada: as peças do Analista e do relatório, com os números da fonte única ─────────────────────── */

const pctN = (n: number) => `${n}%`

const RESPOSTA_HABILIDADES: RespostaDados = {
  id: 'f-habilidades',
  frase: <>As duas habilidades com menos acerto são <b>reagente limitante ({pctN(HABILIDADES_2EM.itens[0].acerto)})</b> e <b>cálculo com mol ({pctN(HABILIDADES_2EM.itens[1].acerto)})</b>.</>,
  visual: { tipo: 'barras', familia: 'turquesa', itens: HABILIDADES_2EM.itens.map((h) => ({ rotulo: h.nome, valor: h.acerto, texto: pctN(h.acerto) })) },
  fonte: `Correções aprovadas pelos professores · ${PERIODO.curto} · 2º ano EM, ${HABILIDADES_2EM.turmas} turmas, ${HABILIDADES_2EM.alunos} alunos`,
  fixavel: true,
}
const RECUSA_PROFESSOR: RespostaDados = {
  id: 'f-recusa', tom: 'recusa',
  frase: 'Eu não comparo professores nem meço o uso de cada um. O Turmma ajuda o professor; não avalia o professor. Posso mostrar por série.',
  seguir: [{ rotulo: 'Onde o 2º ano mais erra', pergunta: 'Onde o 2º ano mais erra em Química?' }],
}

const ROTEIRO_EXEMPLO: RoteiroDados = {
  abertura: 'Oi, Helena. Leio os números da escola e monto relatórios.',
  placeholder: 'Pergunte sobre os números da escola',
  selo: { rotulo: 'Nome só com motivo', titulo: 'Dado com nome só abre com motivo, e fica registrado na auditoria.' },
  sugestoes: [
    { rotulo: 'Onde o 2º ano mais erra em Química?', pergunta: 'Onde o 2º ano mais erra em Química?' },
    { rotulo: 'Qual professor usa menos o Turmma?', pergunta: 'Qual professor usa menos o Turmma?' },
  ],
  responder: (pergunta) => casar<RespostaDados>(pergunta, [
    [/professor/, RECUSA_PROFESSOR],
    [/erra|habilidade|quimica/, RESPOSTA_HABILIDADES],
  ]) ?? { id: 'f-nao-sei', tom: 'nao-sei', frase: 'Isso eu ainda não sei responder.' },
}

/** Um PDF de exemplo: acentos, travessão, uma tabela e uma quebra de página. */
function docExemplo(): DocumentoRelatorio {
  const linhasLongas = Array.from({ length: 40 }, (_, i) => [`Linha ${i + 1} — ação`, `${60 + (i % 9)}%`, i % 3 === 0 ? 'menos de 5' : String(5 + i)])
  return {
    titulo: `Relatório de exemplo · ${ESCOLA.nome}`,
    subtitulo: `${PERIODO.curto} · Química, reações, “aspas” e reticências…`,
    aviso: 'Sem nomes de alunos. Sem comparação entre professores.',
    secoes: [
      { titulo: 'Uso', blocos: [
        { tipo: 'numeros', itens: [
          { valor: inteiro(MES.gerou), rotulo: 'materiais da IA' }, { valor: inteiro(MES.aprovadas), rotulo: 'aprovados' },
          { valor: `${PACOTE.usado}%`, rotulo: 'do pacote' }, { valor: reais(PACOTE.porAluno), rotulo: 'por aluno' },
        ] },
        { tipo: 'paragrafo', texto: 'Ação, atenção, coração, música, árvore, pôr, você, crianças: os acentos do português precisam sair certos no PDF, com Helvetica e a codificação WinAnsi. Esta frase é longa de propósito, para quebrar a linha dentro da margem de 56 pontos.' },
      ] },
      { titulo: 'Acerto por série', blocos: [
        { tipo: 'tabela', colunas: ['Série', 'Acerto', 'Turmas'], linhas: ACERTO_POR_SERIE.map((x) => [x.serie, x.acerto === null ? 'fica de fora' : `${x.acerto}%`, String(x.turmas)]) },
        { tipo: 'nota', texto: 'O 3º ano EM fica de fora: tem um professor só.' },
      ] },
      { titulo: 'Uma tabela longa (quebra de página)', blocos: [{ tipo: 'tabela', colunas: ['Item', 'Valor', 'Grupo'], linhas: linhasLongas }] },
    ],
    rodape: 'Dados do Turmma. Não substituem Saeb nem Ideb. Grupo com menos de 5 pessoas aparece como "menos de 5".',
  }
}

function Pecas13() {
  return (
    <>
      <h2 className="t-titulo mt-16 text-tinta">Peças da 13ª rodada</h2>
      <div className="grid grid-cols-1 gap-x-8 lg:grid-cols-2">
        <Secao titulo="Conversa com dados">
          <div className="h-[560px] overflow-hidden rounded-[16px] border-2 border-borda">
            <ChatDados roteiro={ROTEIRO_EXEMPLO} />
          </div>
        </Secao>
        <Secao titulo="Gráficos">
          <div className="grid gap-4 sm:grid-cols-2">
            <CartaoNumero icone={<Gauge />} familia="turquesa" rotulo="Pacote de IA" valor={`${PACOTE.usado}%`}
              contexto={`${reais(PACOTE.porAluno)} por aluno · fecha perto de ${PACOTE.projecao}%`} perguntar={() => undefined}>
              <BarraPacote usado={PACOTE.usado} projecao={PACOTE.projecao} rotulo="Pacote de IA do mês" />
            </CartaoNumero>
            <CartaoNumero icone={<Gauge />} familia="azul" rotulo="Acerto nas objetivas" valor="64%" contexto="agosto: 65%" perguntar={() => undefined}>
              <BarrasPequenas orientacao="colunas" rotulo="Acerto por série" itens={ACERTO_POR_SERIE.map((x) => ({ rotulo: x.curto, valor: x.acerto }))} />
            </CartaoNumero>
          </div>
          <div className="mt-4 grid gap-4 rounded-[16px] border-2 border-borda p-4">
            <TabelaCurta rotulo="Entregas atrasadas" colunas={['Turma', 'Com 3 ou mais faltando']}
              linhas={ENTREGAS_ATRASADAS.map((e) => [e.turma, e.n < 5 ? null : e.n])} />
            <BarraEmpilhada rotulo="Materiais da IA" partes={[
              { rotulo: 'aprovados', valor: MES.aprovadas, familia: 'verde' }, { rotulo: 'esperando', valor: MES.esperam, familia: 'amarelo' },
            ]} />
            <PontosSituacao situacoes={['em-uso', 'montando', 'convite', 'em-uso', 'em-uso', 'em-uso']} />
            <BarraPacote usado={84} projecao={95} rotulo="Pacote passando de 80%" />
          </div>
        </Secao>
      </div>
      <Secao titulo="Relatório em PDF">
        <Botao variante="secundario" icone={<Download strokeWidth={2.5} />} onClick={() => baixarPdf(docExemplo(), 'relatorio-exemplo.pdf')}>Baixar o PDF de exemplo</Botao>
      </Secao>
    </>
  )
}

function Secao({ titulo, children, className }: { titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('mt-12 min-w-0', className)}>
      <h2 className="t-secao mb-4 text-tinta">{titulo}</h2>
      {children}
    </section>
  )
}

/** Réplica parada do item da lateral (o de verdade mora na Casca e depende da lateral). */
function AmostraItem({ id, rotulo, ativo, n }: { id: IconeId; rotulo: string; ativo?: boolean; n?: number }) {
  return (
    <div className={cn('flex h-[52px] w-[232px] items-center gap-4 rounded-[12px] border-2 px-2 py-1',
      ativo ? 'border-azul-borda bg-azul-claro text-azul-texto' : 'border-transparent text-sutil')}>
      <span className="grid size-9 place-items-center"><Icone id={id} tamanho={32} /></span>
      <span className="t-rotulo flex-1">{rotulo}</span>
      {n !== undefined && <Contador n={n} />}
    </div>
  )
}

export function Fundamentos() {
  const [botoes, setBotoes] = useState(true)
  const [cartao, setCartao] = useState('b')
  const [progresso, setProgresso] = useState(2)
  const [festa, setFesta] = useState(0)
  const [opcao, setOpcao] = useState('quimica')
  const [visao, setVisao] = useState('lista')
  const familiasDoTema = useFamilias()
  const tema = useTema()
  const fila = ['notas-2b', 'atencao-2b', 'aviso-0031'].map((id) => itemDaFila(id)).filter(Boolean) as ItemFila[]

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-6 md:px-8 md:pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Botao asChild variante="fantasma" tamanho="m" icone={<ArrowLeft strokeWidth={2.5} />} className="-ml-3.5">
          <Link to="/">Mapa das telas</Link>
        </Botao>
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <SeletorTema />
          <Botao asChild variante="secundario" tamanho="m" icone={<ArrowRight strokeWidth={2.5} />}>
            <Link to="/fundamentos/onca">A onça</Link>
          </Botao>
        </div>
      </div>
      <header className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Onca pose="acenando" tamanho={96} rotulo="A onça da Turmma acenando" />
        <div className="min-w-0">
          <Marca className="text-[28px]" />
          <h1 className="t-titulo mt-1 text-tinta">Sistema de design</h1>
        </div>
      </header>

      {/* ── COR ─────────────────────────────────────────────────────────────────────────────────── */}
      <Secao titulo="Cor">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {LISTA_FAMILIAS.map((f) => {
            const t = { ...FAMILIAS[f], ...familiasDoTema[f] }
            return (
              <div key={f} className="overflow-hidden rounded-[16px] border-2 border-borda bg-white">
                <div className="flex h-16 items-end p-3 text-sobre-cor" style={{ background: t.face }}>
                  <span className="t-cartao">{f}</span>
                </div>
                <div className="grid grid-cols-4 border-b-2 border-borda">
                  {(['degrau', 'claro', 'borda', 'texto'] as const).map((k) => <span key={k} className="h-6" style={{ background: t[k] }} title={`${k} ${t[k]}`} />)}
                </div>
                <dl className="grid gap-0.5 p-3 text-[14px] font-medium leading-5 text-apoio">
                  {TONS.map((k) => (
                    <div key={k} className="flex justify-between gap-2"><dt>{k}</dt><dd className="tabular-nums text-tinta">{t[k]}</dd></div>
                  ))}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <Selo tamanho="p" title="tinta sobre a face">{t.contraste.tintaFace.toFixed(1).replace('.', ',')}</Selo>
                    <Selo tamanho="p" familia={f} title="texto sobre o claro">{t.contraste.textoClaro.toFixed(1).replace('.', ',')}</Selo>
                  </div>
                </dl>
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {NEUTROS.map(([n, claro]) => (
            <div key={n} className="flex items-center gap-2 rounded-[12px] border-2 border-borda bg-white py-1.5 pl-1.5 pr-3">
              <span className="size-7 rounded-[8px] border-2 border-borda" style={{ background: `var(--color-${n})` }} />
              <span className="text-[14px] font-bold text-tinta">{n}</span>
              <span className="text-[14px] font-medium tabular-nums text-sutil">{tema === 'escuro' ? NEUTROS_ESCURO[n] : claro}</span>
            </div>
          ))}
        </div>
      </Secao>

      {/* ── MATÉRIAS E TIPOS ───────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-x-8 lg:grid-cols-2">
        <Secao titulo="Matérias">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MATERIAS.map((m) => (
              <div key={m.id} className="flex items-center gap-2.5 rounded-[12px] border-2 border-borda bg-white p-2">
                <LadrilhoIcone familia={m.familia} tamanho={40} icone={<Icone id={m.icone} familia={m.familia} />} />
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-bold leading-5 text-tinta">{m.nome}</span>
                  <span className="block text-[14px] font-medium leading-5 text-sutil">{m.familia}</span>
                </span>
              </div>
            ))}
          </div>
        </Secao>
        <Secao titulo="Tipos da fila">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(Object.keys(TIPO_FILA) as TipoItem[]).map((k) => (
              <div key={k} className="flex items-center gap-2.5 rounded-[12px] border-2 border-borda bg-white p-2">
                <LadrilhoIcone familia={TIPO_FILA[k].familia} tamanho={40} icone={<Icone id={TIPO_FILA[k].icone} familia={TIPO_FILA[k].familia} />} />
                <span className="min-w-0 truncate text-[15px] font-bold leading-5 text-tinta">{NOME_TIPO[k]}</span>
              </div>
            ))}
          </div>
        </Secao>
      </div>

      {/* ── TIPOGRAFIA E FORMA ─────────────────────────────────────────────────────────────────── */}
      <div className="grid gap-x-8 lg:grid-cols-[1.4fr_1fr]">
        <Secao titulo="Tipografia">
          <div className="rounded-[16px] border-2 border-borda bg-white">
            {TIPOGRAFIA.map(([classe, medida, exemplo]) => (
              <div key={classe} className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 border-t-2 border-borda px-4 py-2.5 first:border-t-0">
                <span className="w-[150px] shrink-0 text-[14px] font-bold text-sutil">{classe} <span className="font-medium">{medida}</span></span>
                <span className={cn(classe, 'min-w-0 text-tinta')}>{exemplo}</span>
              </div>
            ))}
          </div>
        </Secao>
        <Secao titulo="Forma">
          <div className="grid grid-cols-2 gap-3">
            {[['8', 'selo', 'rounded-[8px]'], ['12', 'botão, opção', 'rounded-[12px]'], ['16', 'cartão, faixa', 'rounded-[16px]'], ['20', 'folha de baixo', 'rounded-[20px]']].map(([px, uso, c]) => (
              <div key={px} className={cn('grid h-24 content-end border-2 border-borda bg-white p-3', c)}>
                <p className="t-cartao text-tinta">{px} px</p><p className="t-apoio">{uso}</p>
              </div>
            ))}
            <div className="col-span-2 flex items-center gap-4 rounded-[16px] border-2 border-borda bg-fundo-suave p-4">
              <Cartao como="button" classeCaixa="w-auto" className="px-5 py-3"><span className="t-cartao">Aperte</span></Cartao>
              <span className="t-apoio">borda de 2 px · degrau de 4 px · nenhuma sombra borrada</span>
            </div>
          </div>
        </Secao>
      </div>

      {/* ── BOTÕES ─────────────────────────────────────────────────────────────────────────────── */}
      <Secao titulo="Botões">
        <div className="mb-3">
          <Segmentado rotulo="Estado dos botões" valor={botoes ? 'normal' : 'desligado'} aoMudar={(v) => setBotoes(v === 'normal')}
            opcoes={[{ id: 'normal', rotulo: 'Normal' }, { id: 'desligado', rotulo: 'Desligado' }]} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {VARIANTES.map(([v, texto]) => (
            <div key={v} className="flex flex-col items-start gap-3 rounded-[16px] border-2 border-borda bg-white p-4">
              <Selo>{v}</Selo>
              <Botao variante={v} tamanho="g" largura="cheia" disabled={!botoes}>{texto}</Botao>
              <Botao variante={v} tamanho="m" disabled={!botoes} icone={<Plus strokeWidth={2.5} />}>{texto}</Botao>
              <Botao variante={v} tamanho="p" disabled={!botoes}>{texto}</Botao>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <BotaoIcone variante="primario" tamanho={40} rotulo="Enviar" disabled={!botoes}><Send strokeWidth={2.5} /></BotaoIcone>
          <BotaoIcone variante="primario" tamanho={48} rotulo="Enviar" disabled={!botoes}><Send strokeWidth={2.5} /></BotaoIcone>
          <BotaoIcone variante="secundario" tamanho={48} rotulo="Repetir" disabled={!botoes}><RotateCw strokeWidth={2.5} /></BotaoIcone>
          <BotaoIcone rotulo="Novo" disabled={!botoes}><Plus strokeWidth={2.5} /></BotaoIcone>
        </div>
      </Secao>

      {/* ── CARTÕES, LINHA E LADRILHOS ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-x-8 lg:grid-cols-2">
        <Secao titulo="Cartões">
          <div className="grid gap-3 sm:grid-cols-3">
            <Cartao><p className="t-cartao">De leitura</p><p className="t-apoio mt-1">sem degrau</p></Cartao>
            {(['a', 'b'] as const).map((id) => (
              <Cartao key={id} como="button" selecionado={cartao === id} onClick={() => setCartao(id)}>
                <p className="t-cartao">{id === 'a' ? 'Clicável' : 'Selecionado'}</p><p className="t-apoio mt-1">aperte</p>
              </Cartao>
            ))}
          </div>
        </Secao>
        <Secao titulo="Linha">
          <div className="overflow-hidden rounded-[16px] border-2 border-borda bg-white">
            <Linha onClick={() => undefined} chevron titulo="Prova de estequiometria"
              inicio={<LadrilhoIcone familia="turquesa" tamanho={44} icone={<Icone id="quimica" familia="turquesa" />} />}
              abaixo={<><SeloTurma turma="2ºB" materia="Química" tamanho="p" /> até quinta</>} />
            <Linha onClick={() => undefined} chevron titulo="Leitura do capítulo 4"
              inicio={<LadrilhoIcone familia="amarelo" tamanho={44} icone={<Icone id="historia" familia="amarelo" />} />}
              abaixo={<><SeloTurma turma="2ºB" materia="História" tamanho="p" /> até sexta</>}
              fim={<Ponto estado="esperando" />} />
          </div>
        </Secao>
      </div>

      <Secao titulo="Ladrilhos">
        <div className="flex flex-wrap items-end gap-3">
          {([32, 40, 44, 56] as const).map((t) => <LadrilhoIcone key={t} familia="roxo" tamanho={t} icone={<Icone id="atencao" familia="roxo" />} />)}
          <span className="mx-2 h-12 w-[2px] bg-borda" />
          <LadrilhoAcao icone={<Icone id="prova" />} rotulo="Prova" onClick={() => undefined} />
          <LadrilhoAcao icone={<Icone id="leitura" familia="verde" />} rotulo="Plano de aula" onClick={() => undefined} />
          <LadrilhoAcao icone={<Icone id="lista" familia="roxo" />} rotulo="Atividade" onClick={() => undefined} />
          <LadrilhoAcao icone={<Icone id="adaptada" />} rotulo="Adaptar" onClick={() => undefined} />
          <LadrilhoAcao icone={<Icone id="mais" />} rotulo="Mais" onClick={() => undefined} />
        </div>
      </Secao>

      {/* ── SELOS, BARRA, NÚMERO ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-x-8 lg:grid-cols-2">
        <Secao titulo="Selos, contador e ponto">
          <div className="flex flex-wrap items-center gap-2">
            <Selo familia="amarelo">Para aprovar</Selo>
            <Selo familia="verde">Aprovado</Selo>
            <Selo familia="vermelho">Até 23/09</Selo>
            <Selo>Rascunho</Selo>
            <SeloIA />
            <SeloTurma turma="2ºB" materia="Química" />
            <SeloTurma turma="9ºA" materia="Ciências" />
            <Selo familia="azul" tamanho="p">Pequeno</Selo>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Contador n={8} tamanho="p" /><Contador n={8} /><Contador n={30} tamanho="g" />
            <Contador n={3} familia="verde" /><Contador n={5} familia="anil" />
            <span className="mx-2 h-6 w-[2px] bg-borda" />
            <Ponto estado="feito" /><Ponto estado="esperando" /><Ponto estado="perdeu" /><Ponto estado="vazio" /><Ponto estado="rascunho" />
          </div>
        </Secao>
        <Secao titulo="Barra de progresso">
          <div className="flex items-center gap-4">
            <BarraProgresso valor={progresso} max={8} rotulo="Questões feitas" />
            <span className="t-cartao shrink-0 tabular-nums text-tinta">{progresso} de 8</span>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <BarraProgresso valor={progresso} max={8} familia="verde" altura={12} rotulo="Questões feitas" />
            <Botao variante="secundario" tamanho="p" onClick={() => setProgresso((p) => (p >= 8 ? 0 : p + 1))}>Mais uma</Botao>
          </div>
        </Secao>
      </div>

      <Secao titulo="Número grande">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <NumeroGrande icone={<Icone id="alunos" />} familia="verde" valor="412" rotulo="Alunos" />
          <NumeroGrande icone={<Icone id="aprovado" />} familia="verde" valor="98%" rotulo="Aprovado por gente" variacao={{ valor: '+2', bom: true }} />
          <NumeroGrande icone={<Icone id="acerto" />} familia="vermelho" valor="6,4" rotulo="Acerto médio" variacao={{ valor: '-0,8', bom: false }} />
          <NumeroGrande icone={<Icone id="pacote" />} familia="turquesa" valor={`${PACOTE.usado}%`} rotulo="Pacote do mês" grande />
        </div>
      </Secao>

      {/* ── A ONÇA NAS PEÇAS ───────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-x-8 lg:grid-cols-2">
        <Secao titulo="Balão">
          <div className="flex items-center gap-4">
            <Onca pose="acenando" tamanho={104} />
            <Balao>Oi! Qual é a sua dúvida?</Balao>
          </div>
        </Secao>
        <Secao titulo="Faixa">
          <Faixa familia="turquesa" rotulo="Agora · 10h30" titulo="2ºB · Química" linha="Revisão de estequiometria"
            acao={<Botao variante="secundario" tamanho="m">Começar aula</Botao>}
            icone={<Icone id="quimica" tamanho={48} familia="turquesa" />} />
        </Secao>
      </div>

      <div className="grid gap-x-8 sm:grid-cols-2">
        <Secao titulo="Estado vazio">
          <Cartao className="grid place-items-center">
            <EstadoVazio ilustracao={<Onca pose="dormindo" tamanho={112} />} titulo="Tudo em dia" />
          </Cartao>
        </Secao>
        <Secao titulo="Comemoração">
          <Cartao className="grid place-items-center">
            <Comemoracao key={festa} ilustracao={<Onca pose="comemorando" tamanho={112} />} titulo="Entregue!"
              acao={<Botao variante="secundario" tamanho="m" icone={<RotateCw strokeWidth={2.5} />} onClick={() => setFesta((f) => f + 1)}>Repetir</Botao>} />
          </Cartao>
        </Secao>
      </div>

      <Secao titulo="Faixa de resultado">
        <div className="grid gap-3 overflow-hidden">
          <FaixaResultado tipo="certo" titulo="Aprovado" acao={<Botao variante="secundario" tamanho="m">Continuar</Botao>}>26 notas foram para o 2ºB</FaixaResultado>
          <FaixaResultado tipo="erro" titulo="Recusado">Volta para o Assistente refazer</FaixaResultado>
          <FaixaResultado tipo="info" titulo="Visto" />
        </div>
      </Secao>

      {/* ── ESCOLHA ────────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-x-8 lg:grid-cols-2">
        <Secao titulo="Opção">
          <div className="grid gap-3">
            {MATERIAS.filter((m) => ['quimica', 'matematica', 'historia'].includes(m.id)).map((m) => (
              <Opcao key={m.id} nome="materia-amostra" valor={m.id} marcado={opcao === m.id} aoMudar={() => setOpcao(m.id)}
                icone={<Icone id={m.icone} tamanho={40} familia={m.familia} />}>{m.nome}</Opcao>
            ))}
          </div>
        </Secao>
        <Secao titulo="Segmentado">
          <Segmentado rotulo="Jeito de ver" valor={visao} aoMudar={setVisao} opcoes={[
            { id: 'lista', rotulo: 'Lista' }, { id: 'semana', rotulo: 'Semana' }, { id: 'mes', rotulo: 'Mês' },
          ]} />
        </Secao>
      </div>

      {/* ── NAVEGAÇÃO E FILA ───────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-x-8 lg:grid-cols-2">
        <Secao titulo="Navegação">
          <div className="flex flex-col gap-2">
            <AmostraItem id="inicio" rotulo="Início" ativo n={8} />
            <AmostraItem id="turmas" rotulo="Turmas" />
          </div>
          <div className="mt-4 grid max-w-[375px] grid-cols-4 rounded-[16px] border-2 border-borda bg-white">
            {([['inicio', 'Início', true], ['tarefas', 'Tarefas', false], ['eu', 'Eu', false], ['avisar', 'Avisar', false]] as const).map(([id, r, a]) => (
              <div key={id} className="flex h-[68px] flex-col items-center justify-center gap-1">
                <span className={cn('grid h-9 w-12 place-items-center rounded-[12px] border-2', a ? 'border-azul-borda bg-azul-claro' : 'border-transparent')}>
                  <Icone id={id} tamanho={28} />
                </span>
                <span className={cn('text-[12px] font-bold uppercase leading-none tracking-[.04em]', a ? 'text-azul-texto' : 'text-sutil')}>{r}</span>
              </div>
            ))}
          </div>
        </Secao>
        <Secao titulo="Esperando você">
          <ul className="flex flex-col gap-[10px]">
            {fila.map((i) => <LinhaFila key={i.id} item={i} aoAbrir={() => undefined} />)}
          </ul>
        </Secao>
      </div>

      {/* ── 12ª RODADA: AS PEÇAS QUE FALTAVAM ──────────────────────────────────────────────────── */}
      <PecasNovas />

      {/* ── 13ª RODADA: A CONVERSA COM DADOS, OS GRÁFICOS E O RELATÓRIO ──────────────────────────── */}
      <Pecas13 />

      {/* ── 14ª RODADA: PÁGINA, SINO, DOCUMENTO, PAINEL, ANALISTA EM TELA E O MOTOR ─────────────────── */}
      <Pecas14 />
    </main>
  )
}

/* ── 14ª rodada (05/10/2026; plano ux-composicao) ──────────────────────────────────────────────────────── */

/** Sistema · Claro · Escuro, a mesma escolha de Configurações › Geral › Aparência. */
function SeletorTema() {
  const a = useAparencia()
  return (
    <Segmentado rotulo="Aparência" valor={a} aoMudar={(v) => aparencia.mudar(v as Aparencia)}
      opcoes={[{ id: 'sistema', rotulo: 'Sistema' }, { id: 'claro', rotulo: 'Claro' }, { id: 'escuro', rotulo: 'Escuro' }]} />
  )
}

/** Uma moldura do tamanho de um pedaço de tela, para a peça que ocupa a janela caber na prancha. */
function Moldura({ altura = 360, children, className }: { altura?: number; children: React.ReactNode; className?: string }) {
  return (
    <div style={{ height: altura }} className={cn('relative overflow-hidden rounded-[16px] border-2 border-borda bg-fundo [&_[data-pagina]]:!h-full', className)}>
      {children}
    </div>
  )
}

const QUESTOES_EXEMPLO = [
  { enunciado: 'Na queima completa de 24 g de carbono, todo o carbono vira CO₂.', pergunta: 'Qual a massa de CO₂ formada?', dados: 'Dados: C = 12; O = 16',
    alternativas: ['44 g', '66 g', '88 g', '24 g'], certa: 2, resolucao: '24 g de C são 2 mol; 2 mol de CO₂ × 44 g = 88 g.', meta: ['Objetiva', 'EM13CNT301', 'p. 142', 'fácil'] },
  { enunciado: 'Uma receita usa 2 mol de H₂ para cada 1 mol de O₂.', pergunta: 'Com 4 mol de H₂ e 3 mol de O₂, qual é o reagente limitante?',
    alternativas: ['O hidrogênio, porque acaba antes do oxigênio', 'O oxigênio, porque sobra no fim da reação', 'Os dois acabam juntos', 'Não dá para saber sem a massa'], certa: 0,
    resolucao: '4 mol de H₂ pedem só 2 mol de O₂: sobra 1 mol de O₂, e o H₂ acaba antes.', meta: ['Objetiva', 'EM13CNT301', 'p. 150', 'média'] },
]

const SLIDES_EXEMPLO = [
  { n: 1, titulo: 'Rendimento de reação', topicos: ['2ºB · Química'], notas: 'Abra perguntando quem já fez um bolo que não cresceu.' },
  { n: 2, titulo: 'O que a equação promete', topicos: ['A conta dá o máximo', 'Na prática sai menos', 'Rendimento = real ÷ teórico'], notas: 'Escreva a fórmula na lousa.' },
  { n: 3, titulo: 'O que sai do balão', topicos: ['Perdas na transferência', 'Reações paralelas', 'Reagente impuro'], notas: 'Peça um exemplo de cada.' },
]

function Pecas14() {
  const [aba, setAba] = useState('questoes')
  const [gabarito, setGabarito] = useState(false)
  const [kpi, setKpi] = useState('acerto')
  const [slide, setSlide] = useState<number | null>(null)
  const mesa = useRef<HTMLDivElement>(null)
  const tema = useTema()
  const testes = useMemo(() => (import.meta.env.DEV ? testarConsulta() : []), [])
  const semanas = ['27/07', '03/08', '10/08', '17/08', '24/08', '31/08', '07/09', '14/09']
  return (
    <>
      <h2 className="t-titulo mt-16 text-tinta">Peças da 14ª rodada <span className="t-apoio">· tema agora: {tema}</span></h2>

      <Secao titulo="Página: cabeçalho, abas e o canto do sino">
        <Moldura altura={200}>
          <div data-sino="" className="casca px-8 pt-6">
            <CabecalhoPagina titulo="Turmas" complemento="Colégio Aurora · 3 turmas" voltar={{ para: '/fundamentos', rotulo: 'Fundamentos' }}
              acoes={<Botao variante="secundario" tamanho="m">Nova turma</Botao>}
              menu={[{ rotulo: 'Arquivar', aoEscolher: () => undefined }]}
              abas={{ abas: [{ id: 'turmas', rotulo: 'Turmas', n: 3 }, { id: 'semana', rotulo: 'Semana' }], valor: 'turmas', aoMudar: () => undefined, fim: <Busca rotulo="Buscar" valor="" aoMudar={() => undefined} /> }} />
            <div className="absolute right-4 top-3"><Sino papel="professor" /></div>
          </div>
        </Moldura>
      </Secao>

      <div className="grid grid-cols-1 gap-x-8 lg:grid-cols-2">
        <Secao titulo="Barra da conversa e conversa vazia">
          <Moldura altura={340}>
            <ConversaVazia
              barra={<BarraConversa titulo="Prova de estequiometria" selo={<Selo familia="turquesa">Química</Selo>} />}
              topo={<div className="flex items-center gap-4"><Onca pose="acenando" tamanho={56} rotulo="" /><Balao>O que vamos preparar?</Balao></div>}
              caixa={<div className="h-14 rounded-[16px] border-2 border-borda bg-campo px-4 py-3 text-sutil">Peça uma prova, uma atividade…</div>} />
          </Moldura>
        </Secao>
        <Secao titulo="Seção e grade de painel">
          <SecaoPagina titulo="Para fazer" n={3} apoio="até sexta" acao={<Botao variante="fantasma" tamanho="p">Ver todas</Botao>}>
            <GradePainel>
              <CartaoPainel titulo="Turmas" perguntar={() => undefined} className="col-span-12 sm:col-span-6"><p className="t-apoio">Um bloco de 6 colunas.</p></CartaoPainel>
              <CartaoPainel titulo="Onde mais erram" perguntar={() => undefined} className="col-span-12 sm:col-span-6"><p className="t-apoio">O PERGUNTAR fica no canto.</p></CartaoPainel>
            </GradePainel>
          </SecaoPagina>
        </Secao>
      </div>

      <Secao titulo="Gráficos do painel">
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <CartaoKPI icone={<Icone id="turmas" tamanho={24} />} familia="azul" rotulo="Alunos que usaram" valor="588" apoio="96% dos 612" tendencia={[90, 91, 93, 92, 94, 95, 96, 96]}
              info="Entraram e conversaram com o Tutor pelo menos uma vez no mês." ativo={kpi === 'uso'} aoEscolher={() => setKpi('uso')} perguntar={() => undefined} />
            <CartaoKPI icone={<Icone id="tarefas" tamanho={24} />} familia="verde" rotulo="Acerto nas objetivas" valor="64%" apoio="agosto: 65%" tendencia={[66, 65, 65, 64, 63, 64, 64, 64]}
              ativo={kpi === 'acerto'} aoEscolher={() => setKpi('acerto')} perguntar={() => undefined} />
            <CartaoKPI icone={<Icone id="criados" tamanho={24} />} familia="amarelo" rotulo="Entregas em dia" valor="87%" apoio="11 com 3+ faltando" tendencia={[84, 86, 85, 88, 87, 86, 87, 87]}
              ativo={kpi === 'entregas'} aoEscolher={() => setKpi('entregas')} />
            <div className="flex items-center gap-3 rounded-[16px] border-2 border-borda p-4"><Tendencia pontos={[3, 5, 4, 6, 7, 6, 8, 9]} familia="roxo" rotulo="Tendência" /><span className="t-apoio">Tendência, 64 × 24</span></div>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-[16px] border-2 border-borda p-4">
              <GraficoSemanas rotulo="Acerto por semana, setembro e agosto" altura={200} familia="verde" series={[
                { nome: 'Setembro', pontos: semanas.map((r, i) => ({ rotulo: r, valor: i < 5 ? null : 62 + i })) },
                { nome: 'Agosto', tracejada: true, pontos: semanas.map((r, i) => ({ rotulo: r, valor: 60 + (i % 3) * 2 })) },
              ]} />
            </div>
            <div className="rounded-[16px] border-2 border-borda p-4">
              <MapaDeCalor rotulo="Série × disciplina" acesa={{ linha: '2em' }} aoEscolher={() => undefined}
                linhas={[{ id: '8', nome: '8º' }, { id: '9', nome: '9º' }, { id: '1em', nome: '1º EM' }, { id: '2em', nome: '2º EM' }]}
                colunas={[{ id: 'mat', nome: 'MAT' }, { id: 'por', nome: 'POR' }, { id: 'cie', nome: 'CIÊ' }, { id: 'qui', nome: 'QUÍ' }]}
                valor={(l, c) => (c === 'cie' && l.includes('em') ? 'fora' : c === 'qui' && !l.includes('em') ? 'fora' : l === '1em' && c === 'por' ? 'poucos' : 52 + ((l.length * 7 + c.length * 5) % 30))} />
            </div>
          </div>
          <TabelaBarras rotulo="Turmas" aoAbrir={() => undefined}
            colunas={[{ id: 't', nome: 'Turma' }, { id: 'a', nome: 'Alunos', alinhar: 'fim' }, { id: 'u', nome: 'Usaram' }, { id: 'c', nome: 'Acerto' }]}
            linhas={[['6ºA', 33, 97, 72], ['6ºB', 31, 94, 70], ['7ºA', 32, 96, 69]].map(([t, a, u, c]) => ({
              id: String(t), celulas: [t, a, `${u}%`, `${c}%`], barras: [{ coluna: 2, valor: Number(u), familia: 'azul' }, { coluna: 3, valor: Number(c), familia: 'verde' }],
            }))} />
        </div>
      </Secao>

      <Secao titulo="Documento: cabeçalho, mesa, folha e questão">
        <Moldura altura={640}>
          <div className="flex h-full flex-col">
            <div className="px-8 pt-6">
              <CabecalhoDocumento voltar={{ para: '/fundamentos', rotulo: 'Conversa' }} icone={<Icone id="tarefas" tamanho={40} />} tipo="Prova"
                titulo="Prova de estequiometria" selo={<SeloEstadoDocumento estado="espera" />} estado="Só você vê. Chega ao 2ºB quando você aprovar."
                metadados={['2ºB', 'Química', '10 questões', '50 min', 'Química 2, cap. 7']}
                acoes={<><Botao variante="secundario" tamanho="m">Imprimir</Botao><Botao variante="oficial" tamanho="m">Aprovar e enviar ao 2ºB</Botao></>}
                abas={{ abas: [{ id: 'questoes', rotulo: 'Questões', n: 2 }, { id: 'adaptada', rotulo: 'Adaptada', n: 3 }], valor: aba, aoMudar: setAba,
                  fim: <span className="flex items-center gap-2 t-rotulo text-[14px] text-apoio">Gabarito <Interruptor rotulo="Gabarito" ligado={gabarito} aoMudar={setGabarito} /></span> }} />
            </div>
            <MesaDocumento ref={mesa} sumario={<Sumario titulo="Questões" grade rolagem={mesa} itens={QUESTOES_EXEMPLO.map((_, i) => ({ id: `fq-${i + 1}`, rotulo: String(i + 1) }))} />}>
              <Folha>
                <CabecalhoFolha escola="Colégio Aurora" disciplina="Química" turma="2ºB" valor="10,0" instrucoes={['Duas questões objetivas, 5,0 pontos cada.']} />
                {QUESTOES_EXEMPLO.map((q, i) => <BlocoQuestao key={i} n={i + 1} id={`fq-${i + 1}`} {...q} gabarito={gabarito} />)}
              </Folha>
            </MesaDocumento>
          </div>
        </Moldura>
      </Secao>

      <div className="grid grid-cols-1 gap-x-8 lg:grid-cols-2">
        <Secao titulo="Plano: resumo e linha do tempo">
          <div className="grid grid-cols-1 gap-4">
            <CartoesResumo cartoes={[{ titulo: 'Objetivos', itens: ['Achar o reagente limitante', 'Calcular o excesso'] }, { titulo: 'Habilidades BNCC', itens: ['EM13CNT301 · Construir e interpretar'] }]} />
            <LinhaDoTempo aulas={[{ id: 'a1', titulo: 'Aula 1 · terça, 22/09', duracao: '50 min', momentos: [
              { minutos: '10 min', nome: 'Abertura: a receita de bolo', texto: 'Com 6 ovos e 1 kg de farinha, quantos bolos saem?' },
              { minutos: '25 min', nome: 'Prática em dupla', texto: 'Quatro problemas com reagente em excesso.', pagina: 151, pratique: true },
              { minutos: '15 min', nome: 'Fechamento', pagina: 153 },
            ] }]} />
            <BlocoFixo rotulo="Para casa">Exercícios 4 a 9 do capítulo · p. 153</BlocoFixo>
          </div>
        </Secao>
        <Secao titulo="Estados e cartão na conversa">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-wrap gap-3">
              <SeloEstadoDocumento estado="espera" />
              <SeloEstadoDocumento estado="aprovado" por="Camila" quando="19/09" />
              <SeloEstadoDocumento estado="recusado" />
              <SeloEstadoDocumento estado="so-voce" />
            </div>
            <CartaoDocumento icone={<Icone id="tarefas" tamanho={40} />} tipo="Prova · 2ºB · Química" titulo="Prova de estequiometria"
              linha="10 questões · 50 min · Química 2, cap. 7" selo={<SeloEstadoDocumento estado="espera" />} para="/fundamentos" aoEditar={() => undefined} />
            <FaixaResultados itens={[{ rotulo: 'Receberam', valor: '32' }, { rotulo: 'Responderam', valor: '26', apoio: 'faltam 6' }, { rotulo: 'Acerto médio', valor: '61%', apoio: 'das objetivas' }]} />
          </div>
        </Secao>
      </div>

      <Secao titulo="Sequência, rubrica, slides e mapa mental">
        <div className="grid grid-cols-1 gap-6">
          <TabelaSequencia colunas={[{ nome: 'Data', largura: '72px' }, { nome: 'Dia', largura: '56px' }, { nome: 'Conteúdo' }, { nome: 'Pág.', largura: '56px' }]}
            grupos={[{ titulo: 'Semana 1 · 22 a 25/09', linhas: [{ celulas: ['22/09', 'ter', 'Reagente limitante', '150'] }, { celulas: ['24/09', 'qui', 'Prova do capítulo 7', '—'], selo: <Selo familia="amarelo">Prova</Selo> }] }]} />
          <TabelaRubrica enunciado="A palha de aço queimada fica mais pesada; o papel queimado, mais leve. Explique pela lei de Lavoisier."
            niveis={[{ nome: 'Completo', pontos: '2,5' }, { nome: 'Parcial', pontos: '1,5' }, { nome: 'Insuficiente', pontos: '0,5' }]}
            criterios={[{ nome: 'Enuncia a lei', descricoes: ['Em sistema fechado, a massa se conserva', 'Cita a conservação sem o sistema fechado', 'Não enuncia'] }]}
            total={['10,0', '6,0', '2,0']} nota="Quem corrige e escreve a devolutiva é a professora." />
          <GradeSlides slides={SLIDES_EXEMPLO} aoAbrir={setSlide} />
          {slide !== null && <SlideAberto slides={SLIDES_EXEMPLO} atual={slide} aoMudar={setSlide} aoFechar={() => setSlide(null)} />}
          <MapaMental centro="Estequiometria" ramos={[
            { nome: 'Mol', folhas: ['6,02 × 10²³', 'massa molar'] }, { nome: 'Balanceamento', folhas: ['coeficientes'] },
            { nome: 'Reagente limitante', folhas: ['excesso'] }, { nome: 'Rendimento', folhas: ['real ÷ teórico'] }, { nome: 'Pureza', folhas: ['%'] },
          ]} />
        </div>
      </Secao>

      <Secao titulo="O Analista em tela inteira">
        <Moldura altura={520}>
          <ChatDados layout="tela" roteiro={ROTEIRO_EXEMPLO} titulo="Analista" />
        </Moldura>
      </Secao>

      {testes.length > 0 && (
        <Secao titulo="O motor de consulta (as perguntas da 4.5)">
          <ul className="grid gap-2">
            {testes.map((t) => (
              <li key={t.pergunta} className="grid gap-1 rounded-[12px] border-2 border-borda px-4 py-3 md:grid-cols-[24px_1fr_1fr]">
                <span className={cn('t-selo', t.ok ? 'text-verde-texto' : 'text-vermelho-texto')}>{t.ok ? '✓' : '×'}</span>
                <span className="text-[15px] font-bold text-tinta">{t.pergunta} <span className="t-apoio">· {t.onde}</span></span>
                <span className="text-[15px] font-medium text-apoio">{t.frase}</span>
              </li>
            ))}
          </ul>
        </Secao>
      )}
    </>
  )
}
