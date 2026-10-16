import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowUp, Check, ChevronDown, Lock, SquarePen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Balao } from './balao'
import { Botao, BotaoIcone } from './botao'
import { CLASSE_CAMPO } from './campo'
import { Cartao } from './cartao'
import { Linha } from './linha'
import { Opcao } from './opcao'
import { Selo, SeloIA } from './selo'
import { Toque } from './toque'
import { AvatarIA } from './onca'
import { BarraEmpilhada, BarraPacote, BarrasPequenas, LinhaCurta, MapaDeCalor, TabelaCurta } from './graficos'
import { baixarCsv, CartaoArquivo, PreviaRelatorio, type DocumentoRelatorio } from './relatorio'
import { BarraConversa, ColunaConversa, ConversaVazia } from './pagina'
import { AvisoIA, BoasVindas, BotaoAnexar, MensagemUsuario, PensandoIA, ProvedorGeracao, RespostaIA, Sugestoes, useAnexos, useGeracao } from './chat'
import { InputBar } from '@/components/ui/input-bar'
import type { Familia } from './familia'

/* A CONVERSA COM DADOS (13ª rodada, 04/10/2026; plano de painéis e introdução, seção 1.4.1): o Analista em conversa.
   A peça não tem número nem texto do Turmma: tudo vem do ROTEIRO (dados/analista-escola.ts, dados/analista-rede.ts,
   ou o mini Analista da introdução). Uma coluna de altura cheia:
   · cabeçalho de 48 px: a onça de anel anil, "Analista", o selo IA e o cadeado do recorte ("Nome só com motivo",
     "Só agregado");
   · o corpo rola por dentro (role=log): a linha inicial (o resumo de segunda), a abertura em balão, as perguntas
     sugeridas em cartões, e as mensagens. Toda resposta tem a MESMA forma: a frase com o número em negrito, um visual
     pequeno, a hipótese (selo anil), "De onde veio" sempre aberto, até 3 botões de seguir, FIXAR NO RELATÓRIO, o
     arquivo, o motivo (lista fechada) e o selo da auditoria. Recusa e "não sei" vêm sem a fonte;
   · "pensando": a onça com os três pontos por 700 ms, e a resposta aparece inteira (sem letra por letra);
   · a caixa: o campo de 2 px e o enviar laranja. Depois da primeira pergunta, até 3 sugestões ainda não feitas viram
     toques acima da caixa.
   `compacto` (a introdução): sem cabeçalho, sem abertura e sem caixa.

   14ª rodada (05/10/2026; plano ux-composicao, 4.4): `layout="tela"`, o Analista em tela inteira, como um assistente de
   IA. Sem cabeçalho próprio: a barra de 56 px (BarraConversa) com "Analista", IA, o selo do recorte e NOVA CONVERSA;
   a coluna de 768. Vazio a 1/3 (ConversaVazia): a onça anil de 88, a abertura, a linha inicial, a caixa e 4 pílulas
   numa linha. Resposta em 4 partes fixas: a frase; o artefato num cartão de borda 2; "De onde veio" numa linha que
   abre as etapas; as ações FIXAR NO RELATÓRIO · BAIXAR CSV · até 2 próximas. Depois da primeira resposta, 3 pílulas
   acima da caixa. `?pergunta=<texto>` (dos cartões do Painel) é enviada ao abrir e sai do endereço.
   Os modos de antes (coluna e compacto) continuam iguais. */

export type VisualDados =
  | { tipo: 'numeros'; itens: { valor: string; rotulo: string }[] }
  | { tipo: 'barras'; itens: { rotulo: string; valor: number | null; texto?: string }[]; max?: number; familia?: Familia; orientacao?: 'linhas' | 'colunas' }
  | { tipo: 'linha'; series: { nome: string; pontos: { rotulo: string; valor: number }[] }[]; unidade?: string }
  | { tipo: 'tabela'; colunas: string[]; linhas: (string | number | null)[][] }
  | { tipo: 'pacote'; usado: number; projecao?: number }
  | { tipo: 'empilhada'; partes: { rotulo: string; valor: number; familia: Familia }[] }
  | { tipo: 'nomes'; titulo: string; linhas: { nome: string; valor: string }[] }
  /** 14ª rodada: duas dimensões (série × disciplina); null = "menos de 5" */
  | { tipo: 'calor'; linhas: string[]; colunas: string[]; valores: (number | null)[][] }

export type RespostaDados = {
  id: string
  frase: React.ReactNode
  visual?: VisualDados
  hipotese?: string
  /** "De onde veio: …" (obrigatória fora de recusa e "não sei") */
  fonte?: string
  /** até 3 */
  seguir?: { rotulo: string; pergunta: string }[]
  fixavel?: boolean
  arquivo?: { titulo: string; apoio: string; aoBaixar: () => void; doc: () => DocumentoRelatorio }
  motivo?: { opcoes: string[]; confirmar: string; aoEscolher: (motivo: string) => RespostaDados }
  /** o selo REGISTRADO NA AUDITORIA */
  auditoria?: { quando: string; motivo: string }
  tom?: 'normal' | 'recusa' | 'nao-sei'
  /** 14ª rodada: a tabela para BAIXAR CSV */
  csv?: { nome: string; linhas: (string | number)[][] }
  /** o detalhe de "De onde veio": o que foi filtrado, agrupado, o que ficou de fora */
  etapas?: string[]
}

export type RoteiroDados = {
  abertura: string
  /** 4 a 6. A marcada `fixa` (ou, sem marca, a última: em geral o relatório) fica sempre entre os toques. */
  sugestoes: { rotulo: string; pergunta: string; fixa?: boolean }[]
  responder: (pergunta: string, ctx: { anterior?: string }) => RespostaDados
  placeholder: string
  /** "Nome só com motivo" | "Só agregado" */
  selo: { rotulo: string; titulo: string }
  /** "Resumo de segunda · 21/09, 7h10" */
  linhaInicial?: { rotulo: string; pergunta: string }
}

/** Tira o acento: "Química" → "Quimica". */
export const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

/** O valor da primeira regra que casa com o texto (sem acento e em minúsculas). */
export function casar<T>(texto: string, regras: [RegExp, T][]): T | undefined {
  const t = semAcento(texto).toLowerCase()
  for (const [re, v] of regras) if (re.test(t)) return v
  return undefined
}

type Mensagem =
  | { id: string; tipo: 'pergunta'; texto: string }
  | { id: string; tipo: 'resposta'; r: RespostaDados; motivoDispensado?: boolean }

const PENSANDO_MS = 700

/* A conversa que sobrevive à troca de página (`memoria`): quem vai a Registros pelo menu e volta ao Início encontra a
   conversa onde parou. Fica na memória da aba (as respostas têm funções: baixar, ver antes), e recomeça ao recarregar. */
type Memoria = { mensagens: Mensagem[]; feitas: string[]; fixadasLocal: string[]; ultima?: string; contador: number }
const MEMORIAS = new Map<string, Memoria>()

export function ChatDados({ roteiro, fixadas, aoFixar, pergunta, aoResponder, compacto, memoria, className, layout = 'coluna', vazio, titulo = 'Analista', acoes, contexto }: {
  roteiro: RoteiroDados
  /** 'tela': o Analista em tela inteira (coluna de 768, vazio a 1/3, pílulas) */
  layout?: 'coluna' | 'tela'
  /** a conversa vazia: a saudação (o h1) e a fala curta embaixo (sem ela, a abertura do roteiro) */
  vazio?: { fala: string; titulo?: string }
  /** no layout tela: o seletor de contexto dentro da caixa (a rede) */
  contexto?: React.ReactNode
  /** no layout tela: o nome na barra */
  titulo?: string
  /** no layout tela: a ação da barra ao lado de NOVA CONVERSA (RELATÓRIO DO MÊS) */
  acoes?: React.ReactNode
  /** a chave da conversa que continua ao voltar à página (a da coordenação, a da rede) */
  memoria?: string
  fixadas?: string[]
  aoFixar?: (id: string) => void
  /** o PERGUNTAR de um cartão: quando a chave muda, o texto vai como pergunta */
  pergunta?: { texto: string; chave: number } | null
  /** a introdução sabe que já respondeu */
  aoResponder?: (r: RespostaDados) => void
  /** sem cabeçalho e sem caixa: só sugestões e respostas */
  compacto?: boolean
  className?: string
}) {
  const guardada = memoria ? MEMORIAS.get(memoria) : undefined
  const [mensagens, setMensagens] = React.useState<Mensagem[]>(() => guardada?.mensagens ?? [])
  const [pensando, setPensando] = React.useState(false)
  const [texto, setTexto] = React.useState('')
  const [feitas, setFeitas] = React.useState<string[]>(() => guardada?.feitas ?? [])
  const [fixadasLocal, setFixadasLocal] = React.useState<string[]>(() => guardada?.fixadasLocal ?? [])
  const [previa, setPrevia] = React.useState<{ doc: DocumentoRelatorio; baixar: () => void; id?: string } | null>(null)
  // as respostas cujo arquivo já foi baixado (pelo cartão ou pela prévia): o cartão diz "Baixado" nos dois casos
  const [baixados, setBaixados] = React.useState<string[]>([])
  const celular = useIsMobile()
  const fixas = fixadas ?? fixadasLocal
  const contador = React.useRef(guardada?.contador ?? 0)
  const timer = React.useRef<number | undefined>(undefined)
  const fim = React.useRef<HTMLDivElement>(null)
  const ultimaResposta = React.useRef<string | undefined>(guardada?.ultima)
  React.useEffect(() => {
    if (memoria) MEMORIAS.set(memoria, { mensagens, feitas, fixadasLocal, ultima: ultimaResposta.current, contador: contador.current })
  }, [memoria, mensagens, feitas, fixadasLocal])
  const pensandoRef = React.useRef(false)
  // a última versão das funções do pai, sem refazer o envio a cada render
  const pai = React.useRef({ roteiro, aoResponder })
  React.useEffect(() => { pai.current = { roteiro, aoResponder } })

  const novoId = () => `m${++contador.current}`
  // as respostas desta visita chegam palavra a palavra; as que voltam da memória, inteiras
  const [novas, setNovas] = React.useState<string[]>([])
  const { escrevendo, parar, valor: geracao } = useGeracao()
  const { anexos, anexar, tirar, limpar } = useAnexos()

  const enviar = React.useCallback((t: string) => {
    const limpo = t.trim()
    if (!limpo || pensandoRef.current) return
    pensandoRef.current = true
    setMensagens((m) => [...m, { id: novoId(), tipo: 'pergunta', texto: limpo }])
    setFeitas((f) => (f.includes(limpo) ? f : [...f, limpo]))
    setPensando(true)
    agendar(limpo)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* a resposta pendente: se a tela desmonta e volta a montar enquanto pensa (o StrictMode do desenvolvimento faz
     isso logo ao abrir, com o ?pergunta=), o timer é cancelado na limpeza e reagendado na volta, sem perder a pergunta */
  const pendente = React.useRef<string | null>(null)
  function agendar(limpo: string) {
    pendente.current = limpo
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      pendente.current = null
      const r = pai.current.roteiro.responder(limpo, { anterior: ultimaResposta.current })
      ultimaResposta.current = r.id
      const idMsg = novoId()
      setNovas((n) => [...n, idMsg])
      setMensagens((m) => [...m, { id: idMsg, tipo: 'resposta', r }])
      setPensando(false)
      pensandoRef.current = false
      pai.current.aoResponder?.(r)
    }, PENSANDO_MS)
  }

  React.useEffect(() => {
    if (pendente.current) agendar(pendente.current)
    return () => window.clearTimeout(timer.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // o PERGUNTAR de um cartão
  const chaveFeita = React.useRef<number | null>(null)
  React.useEffect(() => {
    if (!pergunta || pergunta.chave === chaveFeita.current) return
    chaveFeita.current = pergunta.chave
    enviar(pergunta.texto)
  }, [pergunta, enviar])

  // rola a cada mensagem: enquanto pensa, até o fim; quando a resposta chega, até o começo da última pergunta,
  // para a pergunta e o começo da frase ficarem à vista (a resposta longa não chega já rolada até o fim)
  const corpo = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    // na tela inteira quem rola é a ColunaConversa (segue o texto chegando; ↓ para voltar ao fim)
    if (layout === 'tela') return
    if (mensagens.length === 0 && !pensando) return
    const ultima = mensagens[mensagens.length - 1]
    if (!pensando && ultima?.tipo === 'resposta') {
      const perguntas = corpo.current?.querySelectorAll<HTMLElement>('[data-pergunta]')
      const alvo = perguntas?.[perguntas.length - 1]
      if (alvo) { alvo.scrollIntoView({ block: 'start' }); return }
    }
    fim.current?.scrollIntoView({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mensagens.length, pensando])

  // NOVA CONVERSA: limpa as mensagens e as perguntas feitas (as fixadas continuam)
  const recomecar = () => {
    window.clearTimeout(timer.current)
    pendente.current = null
    pensandoRef.current = false
    setPensando(false)
    setMensagens([])
    setFeitas([])
    ultimaResposta.current = undefined
  }

  // ?pergunta=<texto> (o PERGUNTAR do Painel): no layout tela, envia ao abrir e sai do endereço
  const [params, setParams] = useSearchParams()
  const doEndereco = layout === 'tela' ? params.get('pergunta') : null
  React.useEffect(() => {
    if (!doEndereco) return
    setParams((a) => { const p = new URLSearchParams(a); p.delete('pergunta'); return p }, { replace: true })
    enviar(doEndereco)
  }, [doEndereco, enviar, setParams])

  const fixar = (id: string) => {
    if (aoFixar) aoFixar(id)
    if (!fixadas) setFixadasLocal((f) => (f.includes(id) ? f : [...f, id]))
  }
  const escolherMotivo = (msgId: string, r: RespostaDados, motivo: string) => {
    const nova = r.motivo!.aoEscolher(motivo)
    ultimaResposta.current = nova.id
    setMensagens((m) => m.map((x) => (x.id === msgId ? { ...x, r: nova } as Mensagem : x)))
    pai.current.aoResponder?.(nova)
  }
  const dispensarMotivo = (msgId: string) => {
    setMensagens((m) => m.map((x) => (x.id === msgId && x.tipo === 'resposta' ? { ...x, motivoDispensado: true } : x)))
  }

  const comecou = mensagens.length > 0 || pensando
  const baixarDaPrevia = () => {
    previa?.baixar()
    const id = previa?.id
    if (id) setBaixados((b) => (b.includes(id) ? b : [...b, id]))
    setPrevia(null)
  }
  const fixa = roteiro.sugestoes.find((s) => s.fixa) ?? roteiro.sugestoes[roteiro.sugestoes.length - 1]
  const naoFeitas = roteiro.sugestoes.filter((s) => !feitas.includes(s.pergunta))
  const fixaFica = !!fixa && naoFeitas.includes(fixa)
  // numa linha só, que rola de lado: a fixa (em geral o relatório) vem primeiro, para nunca ficar fora da vista
  const restantes = [
    ...(fixaFica ? [fixa] : []),
    ...naoFeitas.filter((s) => s !== fixa).slice(0, fixaFica ? 2 : 3),
  ]
  /* com o pedido de motivo à vista (dado com nome), as sugestões saem: a conversa ganha a altura e as opções não
     descem para baixo da dobra no celular */
  const ultimaMsg = mensagens[mensagens.length - 1]
  const esperaMotivo = !!ultimaMsg && ultimaMsg.tipo === 'resposta' && !!ultimaMsg.r.motivo && !ultimaMsg.motivoDispensado
  const toques = comecou && restantes.length > 0 && !esperaMotivo && (
    /* numa linha no computador; no celular quebra em até 2 linhas (a 3ª fica de fora), sem cortar palavra no meio */
    <div role="group" aria-label="Outras perguntas" className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] max-md:max-h-[92px] max-md:flex-wrap max-md:overflow-hidden max-md:pb-0">
      {restantes.map((s) => (
        <Toque key={s.pergunta} selecionado={false} aoMudar={() => enviar(s.pergunta)} disabled={pensando} className="max-w-[300px] shrink-0 max-md:min-w-0 max-md:max-w-full max-md:[&>.face]:min-w-0 max-md:[&>.face]:max-w-full">
          <span className="truncate">{s.rotulo}</span>
        </Toque>
      ))}
    </div>
  )

  if (layout === 'tela') {
    const enviarTexto = (t: string) => { if (!t.trim() || pensando || escrevendo) return; limpar(); enviar(t) }
    /* PARAR: enquanto pensa, desiste da pergunta; enquanto escreve, congela o texto onde está */
    const pararTudo = () => {
      if (pensandoRef.current) {
        window.clearTimeout(timer.current)
        pendente.current = null
        pensandoRef.current = false
        setPensando(false)
      }
      parar()
    }
    /* EDITAR uma pergunta: a conversa volta até ali e a pergunta corrigida vai de novo */
    const editar = (msgId: string, novo: string) => {
      if (pensandoRef.current || escrevendo) return
      setMensagens((m) => m.slice(0, m.findIndex((x) => x.id === msgId)))
      enviar(novo)
    }
    const caixa = (
      <InputBar placeholder={celular ? 'Pergunte ao Analista' : roteiro.placeholder} autoFocus={!comecou}
        status={pensando || escrevendo ? 'streaming' : 'ready'} onStop={pararTudo} onSend={(m) => enviarTexto(m.content)}
        attachedFiles={anexos.map((x) => ({ id: x.id, filename: x.nome, size: x.tamanho }))} onRemoveFile={tirar}
        leftActions={<BotaoAnexar rotulo="Anexar uma planilha" aceita=".csv,.xlsx,.pdf" aoEscolher={anexar} />}
        rightActions={contexto} />
    )
    const aviso = <AvisoIA>O {titulo} é uma IA e pode errar · {roteiro.selo.rotulo}</AvisoIA>
    const barra = (
      <BarraConversa
        inicio={<AvatarIA agente="analista" tamanho={32} />}
        titulo={titulo}
        selo={<span className="flex items-center gap-2"><SeloIA tamanho="p" />
          <Selo tamanho="p" icone={<Lock strokeWidth={2.5} />} title={roteiro.selo.titulo} className="max-sm:hidden">{roteiro.selo.rotulo}</Selo></span>}
        acoes={<>
          {comecou && <BotaoIcone rotulo="Nova análise" onClick={recomecar} className="text-tinta"><SquarePen strokeWidth={2.5} /></BotaoIcone>}
          {acoes}
        </>} />
    )
    const pilulas = (lista: { rotulo: string; pergunta: string }[], rotulo: string) => (
      <Sugestoes itens={lista} rotulo={rotulo} disabled={pensando || escrevendo} aoEscolher={(x) => enviar(x.pergunta)} />
    )
    const previaEl = <PreviaRelatorio doc={previa?.doc ?? null} aoFechar={() => setPrevia(null)} aoBaixar={baixarDaPrevia} />

    /* no celular as pílulas cabem em 2 linhas: a fixa (em geral o relatório) vem primeiro, para nunca ficar de fora */
    const prontas = roteiro.sugestoes.slice(0, 4)
    const prontasVazio = celular ? [...prontas.filter((x) => x.fixa), ...prontas.filter((x) => !x.fixa)] : prontas
    if (!comecou) {
      return (
        <>
          <ConversaVazia barra={barra}
            topo={<BoasVindas agente="analista" titulo={vazio?.titulo ?? titulo} subtitulo={vazio?.fala ?? roteiro.abertura} />}
            caixa={caixa}
            baixo={(
              <div className="grid justify-items-center gap-4">
                {pilulas(prontasVazio, 'Perguntas prontas')}
                {/* o Resumo de segunda: um cartão discreto, numa linha */}
                {roteiro.linhaInicial && (
                  <button type="button" onClick={() => enviar(roteiro.linhaInicial!.pergunta)}
                    className="flex h-10 max-w-full items-center gap-2 rounded-[12px] px-2.5 text-[15px] font-bold text-apoio transition-colors duration-150 hover:bg-fundo-suave hover:text-tinta">
                    <AvatarIA agente="analista" tamanho={24} />
                    <span className="truncate">{roteiro.linhaInicial.rotulo}</span>
                    <ChevronDown aria-hidden className="size-4 shrink-0 -rotate-90 text-sutil" strokeWidth={2.5} />
                  </button>
                )}
                {aviso}
              </div>
            )} />
          {previaEl}
        </>
      )
    }
    const proximas = restantes.slice(0, 3)
    const ultimaResp = [...mensagens].reverse().find((m) => m.tipo === 'resposta')
    return (
      <ProvedorGeracao valor={geracao}>
        <ColunaConversa barra={barra} fim={mensagens.filter((m) => m.tipo === 'pergunta').length}
          acimaDaCaixa={!esperaMotivo && proximas.length > 0 && !pensando && !escrevendo
            ? <Sugestoes itens={proximas} rotulo="Outras perguntas" aoEscolher={(x) => enviar(x.pergunta)} className="md:flex-nowrap md:justify-start md:overflow-x-auto md:pb-1 [scrollbar-width:none]" />
            : undefined}
          caixa={<div className="grid gap-2">{caixa}{aviso}</div>}>
          <div ref={corpo} role="log" aria-live="polite" aria-label="Conversa com o Analista" className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6">
            {mensagens.map((m) => m.tipo === 'pergunta'
              ? <MensagemUsuario key={m.id} data-pergunta="" className="scroll-mt-4" texto={m.texto} aoEditar={(novo) => editar(m.id, novo)} />
              : (
                <RespostaIA key={m.id} agente="analista" fluxo={novas.includes(m.id)} acoes={{}} ultima={m === ultimaResp && !pensando}
                  cabecalho={(
                    <div className="flex items-center gap-2">
                      <AvatarIA agente="analista" tamanho={24} />
                      <span className="text-[15px] font-bold leading-5 text-tinta">{titulo}</span>
                      <SeloIA tamanho="p" />
                    </div>
                  )}
                  depois={(
                    <Resposta tela soResto r={m.r} fixada={fixas.includes(m.r.id)} pensando={pensando} motivoDispensado={!!m.motivoDispensado}
                      aoSeguir={enviar} aoFixar={() => fixar(m.r.id)}
                      aoVer={(arquivo) => setPrevia({ doc: arquivo.doc(), baixar: arquivo.aoBaixar, id: m.id })}
                      baixado={baixados.includes(m.id)}
                      aoMotivo={(motivo) => escolherMotivo(m.id, m.r, motivo)} aoDispensar={() => dispensarMotivo(m.id)} />
                  )}>
                  <div className="leading-[1.6] [&_b]:font-bold [&_strong]:font-bold">{m.r.frase}</div>
                </RespostaIA>
              ))}
            {pensando && <PensandoIA agente="analista" />}
            <div ref={fim} aria-hidden className="h-px" />
          </div>
        </ColunaConversa>
        {previaEl}
      </ProvedorGeracao>
    )
  }

  return (
    <div className={cn('@container flex min-h-0 flex-col bg-white', !compacto && 'h-full', className)}>
      {!compacto && (
        <header className="flex h-12 shrink-0 items-center gap-2 overflow-hidden border-b-2 border-borda px-4">
          <AvatarIA agente="analista" tamanho={32} />
          <span className="t-cartao text-tinta">Analista</span>
          <SeloIA tamanho="p" />
          <Selo tamanho="p" icone={<Lock strokeWidth={2.5} />} title={roteiro.selo.titulo} className="ml-auto min-w-0 shrink"><span className="min-w-0 truncate py-px leading-[1.3]">{roteiro.selo.rotulo}</span></Selo>
        </header>
      )}

      <div ref={corpo} role="log" aria-live="polite" aria-label="Conversa com o Analista"
        className={cn('grid min-h-0 content-start gap-4', compacto ? 'py-1' : 'flex-1 overflow-y-auto px-4 py-4')}>
        {roteiro.linhaInicial && (
          <div className="overflow-hidden rounded-[16px] border-2 border-borda">
            <Linha titulo={roteiro.linhaInicial.rotulo} chevron onClick={() => enviar(roteiro.linhaInicial!.pergunta)}
              inicio={<AvatarIA agente="analista" tamanho={32} />} className="min-h-14" />
          </div>
        )}
        {!compacto && (
          <div className="flex items-start gap-2.5">
            <AvatarIA agente="analista" tamanho={40} />
            <Balao lado="esquerda" className="mt-1 text-[17px] leading-[24px]">{roteiro.abertura}</Balao>
          </div>
        )}
        {!comecou && (
          <div className="grid grid-cols-1 gap-2 @min-[360px]:grid-cols-2">
            {roteiro.sugestoes.map((s) => (
              <Cartao key={s.pergunta} como="button" semRespiro onClick={() => enviar(s.pergunta)}
                className="flex min-h-[52px] items-center px-3 py-1.5">
                <span className="t-cartao line-clamp-2 text-[15px] leading-5">{s.rotulo}</span>
              </Cartao>
            ))}
          </div>
        )}

        {mensagens.map((m) => m.tipo === 'pergunta'
          ? (
            <div key={m.id} data-pergunta className="flex scroll-mt-2 justify-end">
              <p className="t-corpo max-w-[85%] rounded-[16px] bg-fundo-suave px-4 py-2.5 text-tinta">{m.texto}</p>
            </div>
          )
          : (
            <Resposta key={m.id} r={m.r} fixada={fixas.includes(m.r.id)} pensando={pensando} motivoDispensado={!!m.motivoDispensado}
              aoSeguir={enviar} aoFixar={() => fixar(m.r.id)}
              aoVer={(arquivo) => setPrevia({ doc: arquivo.doc(), baixar: arquivo.aoBaixar, id: m.id })}
                  baixado={baixados.includes(m.id)}
              aoMotivo={(motivo) => escolherMotivo(m.id, m.r, motivo)} aoDispensar={() => dispensarMotivo(m.id)} />
          ))}

        {pensando && (
          <div className="flex items-center gap-2.5" aria-label="O Analista está pensando">
            <AvatarIA agente="analista" tamanho={32} pensando />
            <span className="t-apoio">Analista</span>
          </div>
        )}
        {compacto && toques}
        <div ref={fim} aria-hidden className="h-px" />
      </div>

      {!compacto && (
        <form className="grid shrink-0 gap-2 border-t-2 border-borda px-4 py-3"
          onSubmit={(e) => { e.preventDefault(); if (!texto.trim() || pensando) return; enviar(texto); setTexto('') }}>
          {toques}
          <div className="flex items-center gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">{roteiro.placeholder}</span>
              <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={roteiro.placeholder}
                className={cn(CLASSE_CAMPO, 'h-12 text-[16px]')} />
            </label>
            <BotaoIcone type="submit" variante="primario" tamanho={40} rotulo="Enviar" disabled={!texto.trim() || pensando}>
              <ArrowUp strokeWidth={3} />
            </BotaoIcone>
          </div>
        </form>
      )}

      <PreviaRelatorio doc={previa?.doc ?? null} aoFechar={() => setPrevia(null)}
        aoBaixar={baixarDaPrevia} />
    </div>
  )
}

/* ── Uma resposta: sempre a mesma forma ─────────────────────────────────────────────────────────────────── */

/** O CSV de uma resposta: o dela, ou montado do visual (barras, tabela, calor). */
function csvDe(r: RespostaDados): { nome: string; linhas: (string | number)[][] } | undefined {
  if (r.csv) return r.csv
  const v = r.visual
  if (!v) return undefined
  const nome = `analista-${r.id}.csv`
  if (v.tipo === 'barras') return { nome, linhas: [['Grupo', 'Valor'], ...v.itens.map((i) => [i.rotulo, i.valor === null ? 'menos de 5' : i.texto ?? i.valor])] }
  if (v.tipo === 'tabela') return { nome, linhas: [v.colunas, ...v.linhas.map((l) => l.map((x) => (x === null ? 'menos de 5' : x)))] }
  if (v.tipo === 'calor') return { nome, linhas: [['', ...v.colunas], ...v.linhas.map((l, i) => [l, ...v.valores[i].map((x) => (x === null ? 'menos de 5' : x))])] }
  return undefined
}

function Resposta({ r, fixada, pensando, motivoDispensado, aoSeguir, aoFixar, aoVer, aoMotivo, aoDispensar, tela = false, baixado = false, soResto = false }: {
  tela?: boolean
  /** sem a onça e sem a frase (a RespostaIA já desenha as duas): o artefato, a fonte e os botões */
  soResto?: boolean
  baixado?: boolean
  r: RespostaDados
  fixada: boolean
  pensando: boolean
  motivoDispensado: boolean
  aoSeguir: (pergunta: string) => void
  aoFixar: () => void
  aoVer: (arquivo: NonNullable<RespostaDados['arquivo']>) => void
  aoMotivo: (motivo: string) => void
  aoDispensar: () => void
}) {
  const [motivo, setMotivo] = React.useState<string | null>(null)
  const botoesMotivo = React.useRef<HTMLDivElement>(null)
  const nome = React.useId()
  const semFonte = r.tom === 'recusa' || r.tom === 'nao-sei'
  const seguir = (r.seguir ?? []).slice(0, tela ? 2 : 3)
  const [verEtapas, setVerEtapas] = React.useState(false)
  const etapas = React.useRef<HTMLOListElement>(null)
  // aberta a lista das etapas, a conversa rola até ela (a última linha ficava sob as pílulas)
  React.useEffect(() => { if (verEtapas) etapas.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [verEtapas])
  // a resposta trocada no lugar (a dos nomes) traz o selo da auditoria à vista
  const auditoria = React.useRef<HTMLSpanElement>(null)
  React.useEffect(() => { if (r.auditoria) window.setTimeout(() => auditoria.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60) }, [r.auditoria])
  const csv = tela && !semFonte ? csvDe(r) : undefined
  return (
    <div className={cn('flex items-start gap-2.5', soResto ? 'mt-3' : 'animate-entra')}>
      {!soResto && <AvatarIA agente="analista" tamanho={32} className="mt-0.5" />}
      <div className="grid min-w-0 flex-1 gap-3">
        {!soResto && <div className={cn('t-corpo text-tinta [&_b]:font-bold [&_strong]:font-bold', tela && 'leading-[1.6]')}>{r.frase}</div>}
        {r.visual && <div className={cn('border-2 border-borda', tela ? 'min-w-0 overflow-x-auto rounded-[16px] bg-white p-4' : 'rounded-[12px] p-3')}><Visual v={r.visual} /></div>}
        {r.hipotese && (
          <p className="flex flex-wrap items-start gap-2">
            <Selo familia="anil" tamanho="p" className="mt-0.5">Hipótese</Selo>
            <span className="min-w-0 flex-1 text-[15px] font-medium leading-5 text-tinta">{r.hipotese}</span>
          </p>
        )}
        {/* o arquivo é o artefato desta resposta: vem antes de "De onde veio", como os outros (frase, artefato, fonte, ações) */}
        {r.arquivo && <CartaoArquivo titulo={r.arquivo.titulo} apoio={r.arquivo.apoio} aoBaixar={r.arquivo.aoBaixar} aoVer={() => aoVer(r.arquivo!)} baixado={baixado} />}
        {!semFonte && r.fonte && !tela && <p className="t-apoio">De onde veio: {r.fonte}</p>}
        {/* a fonte inteira, quebrando linha (o total de alunos computados não fica no corte); as etapas abrem à parte,
            só quando trazem algo além da fonte */}
        {!semFonte && r.fonte && tela && (
          <div className="min-w-0">
            <p className="t-apoio">
              De onde veio: {r.fonte}
              {!!r.etapas?.length && (
                <button type="button" aria-expanded={verEtapas} onClick={() => setVerEtapas((v) => !v)}
                  className="ml-1.5 inline-flex items-center gap-0.5 whitespace-nowrap rounded-[6px] px-1 align-baseline text-[14px] font-bold text-azul-texto transition-colors hover:bg-fundo-suave">
                  {verEtapas ? 'Esconder as etapas' : 'Ver as etapas'}
                  <ChevronDown aria-hidden className={cn('size-4 shrink-0 self-center transition-transform', verEtapas && 'rotate-180')} strokeWidth={2.5} />
                </button>
              )}
            </p>
            {verEtapas && !!r.etapas?.length && (
              <ol ref={etapas} className="mt-2 grid scroll-mb-4 gap-1 border-l-2 border-borda pl-3">
                {r.etapas.map((e) => <li key={e} className="text-[15px] font-medium leading-5 text-apoio">{e}</li>)}
              </ol>
            )}
          </div>
        )}
        {r.motivo && !motivoDispensado && (
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-[15px] font-bold leading-5 text-tinta">Por quê?</legend>
            {r.motivo.opcoes.map((o) => (
              <Opcao key={o} nome={nome} valor={o} marcado={motivo === o} aoMudar={() => { setMotivo(o); window.setTimeout(() => botoesMotivo.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 30) }}>
                <span className="text-[15px] leading-5">{o}</span>
              </Opcao>
            ))}
            {/* escolhido o motivo, o botão sobe à vista (no celular ele fica abaixo da dobra) */}
            <div ref={botoesMotivo} className="flex flex-wrap gap-2 pt-1">
              <Botao variante="oficial" tamanho="p" disabled={!motivo} onClick={() => motivo && aoMotivo(motivo)}>{r.motivo.confirmar}</Botao>
              <Botao variante="fantasma" tamanho="p" onClick={aoDispensar}>Agora não</Botao>
            </div>
          </fieldset>
        )}
        {r.motivo && motivoDispensado && <p className="t-apoio">Tudo bem. Nada foi aberto.</p>}
        {r.auditoria && (
          <span ref={auditoria} className="inline-flex w-fit max-w-full scroll-mb-4 items-start gap-1.5 rounded-[8px] bg-verde-claro px-2 py-1 text-[13px] font-bold uppercase leading-4 tracking-[.04em] text-verde-texto">
            <Check aria-hidden className="mt-px size-3.5 shrink-0" strokeWidth={3.5} />
            <span>Registrado na auditoria · {r.auditoria.quando} · <span className="normal-case tracking-normal">{r.auditoria.motivo}</span></span>
          </span>
        )}
        {!tela && (seguir.length > 0 || r.fixavel) && (
          <div className="-ml-3 flex flex-wrap items-center gap-1">
            {seguir.map((s) => (
              <Botao key={s.rotulo} variante="fantasma" tamanho="p" disabled={pensando} onClick={() => aoSeguir(s.pergunta)}>{s.rotulo}</Botao>
            ))}
            {r.fixavel && (fixada
              ? <Selo familia="azul" tamanho="p" icone={<Check strokeWidth={3} />} className="ml-3">Fixada</Selo>
              : <Botao variante="fantasma" tamanho="p" onClick={aoFixar}>Fixar no relatório</Botao>)}
          </div>
        )}
        {tela && (seguir.length > 0 || r.fixavel || csv) && (
          <div className="-ml-3 flex flex-wrap items-center gap-1">
            {r.fixavel && (fixada
              ? <Selo familia="azul" tamanho="p" icone={<Check strokeWidth={3} />} className="mx-3">Fixada</Selo>
              : <Botao variante="fantasma" tamanho="p" onClick={aoFixar}>Fixar no relatório</Botao>)}
            {csv && <Botao variante="fantasma" tamanho="p" onClick={() => baixarCsv(csv.linhas, csv.nome)}>Baixar CSV</Botao>}
            {seguir.length > 0 && (r.fixavel || csv) && <span aria-hidden className="mx-1 h-5 w-[2px] rounded-full bg-borda" />}
            {seguir.map((s) => (
              <Botao key={s.rotulo} variante="fantasma" tamanho="p" disabled={pensando} onClick={() => aoSeguir(s.pergunta)}>{s.rotulo}</Botao>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Visual({ v }: { v: VisualDados }) {
  switch (v.tipo) {
    case 'numeros':
      return (
        <dl className="grid grid-cols-3 gap-2">
          {v.itens.slice(0, 3).map((i) => (
            <div key={i.rotulo} className="min-w-0">
              <dt className="sr-only">{i.rotulo}</dt>
              <dd className="t-numero text-tinta">{i.valor}</dd>
              <dd aria-hidden className="text-[14px] font-medium leading-[18px] text-sutil">{i.rotulo}</dd>
            </div>
          ))}
        </dl>
      )
    case 'barras':
      return <BarrasPequenas itens={v.itens} max={v.max} familia={v.familia} orientacao={v.orientacao} rotulo="Gráfico da resposta" />
    case 'linha':
      return <LinhaCurta series={v.series} unidade={v.unidade} rotulo="Gráfico da resposta" />
    case 'tabela':
      return <TabelaCurta colunas={v.colunas} linhas={v.linhas} rotulo="Tabela da resposta" />
    case 'pacote':
      return <BarraPacote usado={v.usado} projecao={v.projecao} rotulo="Pacote de IA do mês" />
    case 'empilhada':
      return <BarraEmpilhada partes={v.partes} rotulo="Gráfico da resposta" />
    case 'calor':
      return (
        <MapaDeCalor rotulo="Mapa da resposta"
          linhas={v.linhas.map((l) => ({ id: l, nome: l }))} colunas={v.colunas.map((c) => ({ id: c, nome: c }))}
          valor={(l, c) => { const x = v.valores[v.linhas.indexOf(l)]?.[v.colunas.indexOf(c)]; return x === null ? 'poucos' : x === undefined ? 'fora' : x }} />
      )
    case 'nomes':
      return (
        <div>
          <p className="t-cartao mb-1 text-tinta">{v.titulo}</p>
          <ul>
            {v.linhas.map((l) => (
              <li key={l.nome} className="flex h-10 items-center justify-between gap-3 border-t-2 border-borda text-[15px] first:border-t-0">
                <span className="truncate font-bold text-tinta">{l.nome}</span>
                <span className="shrink-0 font-medium tabular-nums text-apoio">{l.valor}</span>
              </li>
            ))}
          </ul>
        </div>
      )
  }
}
