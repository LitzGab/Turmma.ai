import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Check, ChevronLeft, ChevronRight, ClipboardList, Clock3, PenLine, X, type LucideIcon } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Botao, CampoTexto, Dialogo, LadrilhoIcone, Opcao, Ponto, Selo, materiaDe } from '@/components/duo'
import { Icone } from '@/components/duo/icones'
import type { TarefaViva } from '@/dados/avaliacoes'
import type { TipoTarefa } from '@/dados/tarefas-aluno'
import { cn } from '@/lib/utils'

/* Peças só da área do aluno. 12ª rodada (04/10/2026; plano de polimento, 5.1): a tarefa, a prova e as Tarefas
   passam às peças Duolingo (`@/components/duo`). Corpo nunca abaixo de 15 px, nada que premie ficar (D59).
   · LadrilhoMateria e SeloEstado: a linha de tarefa (ícone e cor da MATÉRIA; o estado num selo com glifo).
   · Alternativas: as opções em `Opcao` (radio de verdade); revisada, vira leitura com a certa e a marcada.
   · NavQuestoes: os números em círculos (atual, feita, vazia; no resultado, certa e errada com `Ponto`).
   · IssoEstaErrado: o diálogo único de contestação (D60). As props antigas continuam; as novas (`questoes`,
     `questaoInicial`) acrescentam o "Em qual questão?" da nota. */

/** A moldura de tela do aluno: igual à `Tela`, mas a linha de apoio tem 16 px. */
export function TelaAluno({ titulo, descricao, acoes, largura = 'media', objeto = false, children }: {
  titulo: ReactNode; descricao?: ReactNode; acoes?: ReactNode; largura?: 'conversa' | 'media'; objeto?: boolean; children: ReactNode
}) {
  // Mesmo padrão de espaço de turmma/tela: aba sem título; só tela de objeto (uma prova, uma lista) mostra o nome.
  return (
    <div className={cn('mx-auto w-full px-4 pb-8 pt-4 md:px-6 md:pt-5', largura === 'conversa' ? 'max-w-[760px]' : 'max-w-[1040px]')}>
      {objeto ? (
        <header className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5">
          <div className="min-w-0">
            <h1 className="titulo-tela text-tinta">{titulo}</h1>
            {descricao && <p className="mt-1 max-w-[72ch] text-[15px] text-apoio">{descricao}</p>}
          </div>
          {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
        </header>
      ) : (
        <>
          <h1 className="sr-only">{titulo}</h1>
          {acoes && <div className="mb-4 flex flex-wrap items-center gap-2">{acoes}</div>}
        </>
      )}
      {children}
    </div>
  )
}

/** Barra calma: rótulo e número em texto de 16 px, preenchimento neutro. Não fica vermelha, não pisca. */
export function BarraCalma({ rotulo, detalhe, valor, maximo = 100, texto, className }: {
  rotulo: ReactNode; detalhe?: ReactNode; valor: number; maximo?: number; texto?: string; className?: string
}) {
  const pct = Math.round((valor / maximo) * 100)
  return (
    <div className={cn('grid gap-2', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="min-w-0 text-base text-tinta"><span className="font-medium">{rotulo}</span>{detalhe && <span className="text-sutil"> · {detalhe}</span>}</p>
        <p className="shrink-0 text-base font-semibold tabular-nums text-tinta">{texto ?? `${pct}%`}</p>
      </div>
      <Progress value={pct} aria-label={typeof rotulo === 'string' ? rotulo : undefined} className="h-2 rounded-full bg-ia-cx [&>div]:bg-sutil [&>div]:transition-none" />
    </div>
  )
}

/** Tela que EXPLICA, com ícone e uma frase. Tutor travado ou desligado não parece erro (D19). */
export function Explica({ icone: Icone, titulo, children, acao, className }: { icone: LucideIcon; titulo: string; children?: ReactNode; acao?: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto grid w-full max-w-[560px] justify-items-center gap-4 px-4 py-6 text-center', className)}>
      <span className="grid size-12 place-items-center rounded-full bg-realce-suave text-tinta"><Icone className="size-6" strokeWidth={1.75} /></span>
      <p className="text-[20px] font-medium leading-snug text-tinta">{titulo}</p>
      {children && <div className="grid gap-2 text-base leading-relaxed text-apoio">{children}</div>}
      {acao && <div className="flex flex-wrap justify-center gap-2">{acao}</div>}
    </div>
  )
}

/* ── A tarefa em linha ─────────────────────────────────────────────────────────────────────────────────── */

/** O ladrilho da matéria: o ícone e a cor da MATÉRIA (Química turquesa, História amarela…). Com `tipo`, o ícone do
    tipo (prova, lista, leitura) pintado na cor da matéria. */
export function LadrilhoMateria({ materia, tipo, tamanho = 44, className }: {
  materia: string; tipo?: TipoTarefa; tamanho?: 32 | 40 | 44 | 56; className?: string
}) {
  const m = materiaDe(materia)
  const f = m?.familia ?? 'azul'
  return (
    <LadrilhoIcone familia={f} tamanho={tamanho} className={className}
      icone={<Icone id={tipo ?? m?.icone ?? 'lista'} familia={f} />} />
  )
}

/** O selo do estado da tarefa: neutro (prazo), amarelo com relógio (a professora está vendo), verde com visto
    (corrigida, lida). */
export function SeloEstado({ t, tamanho }: { t: Pick<TarefaViva, 'selo' | 'seloFamilia'>; tamanho?: 'm' | 'p' }) {
  const glifo = t.seloFamilia === 'amarelo' ? <Clock3 strokeWidth={3} /> : t.seloFamilia === 'verde' ? <Check strokeWidth={3.5} /> : undefined
  return <Selo familia={t.seloFamilia} tamanho={tamanho} icone={glifo}>{t.selo}</Selo>
}

/** O selo da matéria, só leitura, na cor dela. */
export function SeloMateria({ materia }: { materia: string }) {
  return <Selo familia={materiaDe(materia)?.familia ?? 'neutro'} className="normal-case tracking-normal">{materia}</Selo>
}

/** Para onde a linha leva: a prova ainda por fazer abre em tela de foco; o resto, na tarefa. */
export const paraTarefaViva = (t: Pick<TarefaViva, 'id' | 'tipo' | 'estadoVivo'>) =>
  (t.tipo === 'prova' && t.estadoVivo !== 'entregue' && t.estadoVivo !== 'corrigida' ? `/aluno/prova/${t.id}` : `/aluno/tarefas/${t.id}`)

/* ── A questão ─────────────────────────────────────────────────────────────────────────────────────────── */

/** "Salvo": aparece a cada resposta, em texto com ícone. Nunca só cor. */
export function RespostaSalva({ salvo, texto = 'Salvo' }: { salvo: boolean; texto?: ReactNode }) {
  return (
    <p className={cn('inline-flex min-h-6 items-center gap-1.5 text-[15px] font-bold', salvo ? 'text-verde-texto' : 'invisible')} role="status" aria-hidden={!salvo || undefined}>
      <Check className="size-4 shrink-0" strokeWidth={3.5} /> {texto}
    </p>
  )
}

export type Questao = { enunciado: string; alternativas: string[] }

const LETRA = 'ABCDE'

/** A letra num quadradinho, à esquerda da alternativa. */
const Letra = ({ l, tom }: { l: string; tom?: 'certa' | 'errada' | 'marcada' }) => (
  <span className={cn('grid size-8 place-items-center rounded-[8px] border-2 text-[15px] font-bold',
    tom === 'certa' ? 'border-verde-borda bg-white text-verde-texto' : tom === 'errada' ? 'border-vermelho-borda bg-white text-vermelho-texto'
      : tom === 'marcada' ? 'border-azul-borda bg-white text-azul-texto' : 'border-borda text-apoio')}>{l}</span>
)

/** As alternativas de uma questão objetiva, em `Opcao` (radio de verdade; as setas andam no grupo).
    Com `certa`, vira a leitura de uma tarefa corrigida: a certa em verde ("Certa") e a marcada errada em vermelho
    ("Sua resposta"), em texto e glifo. Com `travada`, só mostra a marcada (entregue, esperando a professora). */
export function Alternativas({ questao, valor, aoEscolher, nome, certa, travada = false }: {
  questao: Questao; valor?: string; aoEscolher: (v: string) => void; nome: string; certa?: string; travada?: boolean
}) {
  if (certa !== undefined || travada) {
    return (
      <ul aria-label="Alternativas" className="grid gap-2">
        {questao.alternativas.map((alt, i) => {
          const l = LETRA[i]
          const marcada = valor === l
          const eCerta = certa !== undefined && l === certa
          const eErrada = certa !== undefined && marcada && l !== certa
          const tom = eCerta ? 'certa' : eErrada ? 'errada' : marcada ? 'marcada' : undefined
          return (
            <li key={l} className={cn('flex min-h-14 items-center gap-3 rounded-[12px] border-2 px-3 py-2',
              eCerta ? 'border-verde-borda bg-verde-claro' : eErrada ? 'border-vermelho-borda bg-vermelho-claro' : marcada ? 'border-azul-borda bg-azul-claro' : 'border-borda bg-white')}>
              <Letra l={l} tom={tom} />
              <span className="t-cartao min-w-0 flex-1 text-tinta">{alt}</span>
              {eCerta && <Selo familia="verde" icone={<Check strokeWidth={3.5} />}>{marcada ? 'Sua resposta' : 'Certa'}</Selo>}
              {eErrada && <Selo familia="vermelho" icone={<X strokeWidth={3.5} />}>Sua resposta</Selo>}
              {!eCerta && !eErrada && marcada && <Selo familia="azul">Sua resposta</Selo>}
            </li>
          )
        })}
      </ul>
    )
  }
  return (
    <div role="radiogroup" aria-label="Alternativas" className="grid gap-2">
      {questao.alternativas.map((alt, i) => {
        const l = LETRA[i]
        return (
          <Opcao key={l} nome={nome} valor={l} marcado={valor === l} aoMudar={() => aoEscolher(l)}
            icone={<Letra l={l} tom={valor === l ? 'marcada' : undefined} />} className="[&_.face]:min-h-14">
            {alt}
          </Opcao>
        )
      })}
    </div>
  )
}

export type MarcaQuestao = 'feita' | 'certa' | 'errada'

/** O mapa de questões: os números em círculos. O atual em azul cheio (texto sobre-cor), o feito em azul claro, o vazio
    no fundo. No resultado, o certo e o errado levam o `Ponto` com glifo (nunca só cor). `tamanho` 28 é o do cabeçalho
    da tarefa (14ª rodada); 36/40 é o da prova. */
export function MapaQuestoes({ total, atual, aoIr, marcas = {}, pequeno = false, className }: {
  total: number; atual: number; aoIr: (i: number) => void; marcas?: Record<number, MarcaQuestao | undefined>; pequeno?: boolean; className?: string
}) {
  return (
    <ol aria-label="Mapa de questões" className={cn('flex flex-wrap items-center', pequeno ? 'gap-1' : total > 8 ? 'gap-1' : 'gap-1.5', className)}>
      {Array.from({ length: total }, (_, i) => {
        const m = marcas[i]
        const eAtual = i === atual
        return (
          <li key={i} className="relative">
            <button type="button" onClick={() => aoIr(i)} aria-current={eAtual ? 'step' : undefined}
              aria-label={`Questão ${i + 1}${m === 'certa' ? ', certa' : m === 'errada' ? ', errada' : m === 'feita' ? ', respondida' : ''}`}
              className={cn('relative grid place-items-center rounded-full border-2 font-bold tabular-nums transition-colors duration-150',
                pequeno ? 'size-7 text-[13px] before:absolute before:-inset-1.5'
                  : cn('before:absolute before:inset-x-0 before:-inset-y-1.5 md:before:hidden', total > 8 ? 'size-7 text-[14px] md:size-9 md:text-[15px]' : 'size-8 text-[15px] md:size-10'),
                eAtual ? 'border-azul bg-azul text-sobre-cor'
                  : m === 'feita' ? 'border-azul-borda bg-azul-claro text-azul-texto'
                    : m === 'certa' ? 'border-verde-borda bg-verde-claro text-verde-texto'
                      : m === 'errada' ? 'border-vermelho-borda bg-vermelho-claro text-vermelho-texto'
                        : 'border-borda bg-white text-apoio hover:bg-fundo-suave')}>
              {i + 1}
            </button>
            {(m === 'certa' || m === 'errada') && (
              <Ponto estado={m === 'certa' ? 'feito' : 'perdeu'} className={cn('pointer-events-none absolute -right-1 -top-1 ring-2 ring-white', pequeno ? 'size-3.5 [&_svg]:size-2' : 'size-4 [&_svg]:size-2.5')} />
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** ANTERIOR e PRÓXIMA (na última, o encaixe `fim` toma o lugar de PRÓXIMA). */
export function AnteriorProxima({ total, atual, aoIr, fim, className }: {
  total: number; atual: number; aoIr: (i: number) => void; fim?: ReactNode; className?: string
}) {
  const ultima = atual === total - 1
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Botao variante="secundario" tamanho="m" disabled={atual === 0} onClick={() => aoIr(atual - 1)} icone={<ChevronLeft strokeWidth={2.5} />}
        aria-label="Anterior" className="max-sm:[&>.face]:px-3"><span className="max-sm:hidden">Anterior</span></Botao>
      {ultima && fim ? fim : (
        <Botao variante="secundario" tamanho="m" disabled={ultima} onClick={() => aoIr(atual + 1)}>
          Próxima <ChevronRight strokeWidth={2.5} />
        </Botao>
      )}
    </div>
  )
}

/** A linha das questões da prova: ‹ ANTERIOR · 1 2 (3) … · PRÓXIMA ›. No celular, o mapa vai numa linha de cima. */
export function NavQuestoes({ total, atual, aoIr, marcas = {}, fim }: {
  total: number; atual: number; aoIr: (i: number) => void; marcas?: Record<number, MarcaQuestao | undefined>; fim?: ReactNode
}) {
  const ultima = atual === total - 1
  // com mais de 8 questões, ‹ e › ficam só com a seta no computador, para a linha caber ao lado dos números
  const soSeta = total > 8
  return (
    <nav aria-label="Questões" className="flex flex-wrap items-center justify-between gap-x-3 gap-y-3">
      <MapaQuestoes total={total} atual={atual} aoIr={aoIr} marcas={marcas} className="order-first w-full justify-center md:order-none md:w-auto" />
      <Botao variante="secundario" tamanho="m" className="md:order-first" disabled={atual === 0} onClick={() => aoIr(atual - 1)}
        aria-label={soSeta ? 'Anterior' : undefined} icone={<ChevronLeft strokeWidth={2.5} />}>{soSeta ? <span className="md:hidden">Anterior</span> : 'Anterior'}</Botao>
      {ultima && fim ? fim : (
        <Botao variante="secundario" tamanho="m" disabled={ultima} onClick={() => aoIr(atual + 1)} aria-label={soSeta ? 'Próxima' : undefined}>
          {soSeta ? <span className="md:hidden">Próxima</span> : 'Próxima'} <ChevronRight strokeWidth={2.5} />
        </Botao>
      )}
    </nav>
  )
}

/* ── Compatibilidade (não usadas pelas telas da 12ª rodada) ────────────────────────────────────────────── */

/** O ícone de cada tipo de tarefa (glifo de traço). */
export const ICONE_TAREFA: Record<TipoTarefa, LucideIcon> = { prova: ClipboardList, lista: PenLine, leitura: BookOpen }

/** Uma tarefa em linha (a linha inteira é o link). */
export function LinhaTarefa({ para, icone: Icone, titulo, meta, fim, className }: {
  para: string; icone: LucideIcon; titulo: string; meta: ReactNode; fim?: ReactNode; className?: string
}) {
  return (
    <Link to={para} className={cn('group flex min-h-16 items-center gap-3 rounded-[12px] px-3 py-2 transition-colors duration-150 hover:bg-fundo-suave', className)}>
      <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-fundo-suave text-tinta"><Icone className="size-5" strokeWidth={2} /></span>
      <span className="min-w-0 flex-1">
        <span className="t-cartao block truncate text-tinta">{titulo}</span>
        <span className="t-apoio block truncate">{meta}</span>
      </span>
      {fim}
      <ChevronRight className="size-5 shrink-0 text-apagado" strokeWidth={2.5} aria-hidden />
    </Link>
  )
}

/* ── "Isso está errado?" ───────────────────────────────────────────────────────────────────────────────── */

/** Os motivos da memória do Tutor (o padrão antigo). */
export const MOTIVOS_ERRADO = ['A correção está errada', 'Isso não aconteceu assim', 'Não quero que o Tutor use isso']
/** Os motivos da NOTA (auditoria A48 e Q-4). */
export const MOTIVOS_NOTA = ['A correção está errada', 'A questão tem problema', 'Outra coisa']

/** "Isso está errado?": o fluxo ÚNICO de contestação do aluno (D60), na nota e na memória do Tutor. Motivos fechados
    em `Opcao` e um texto opcional. Quem olha é a professora, não um programa.
    Com `questoes` (o total), aparece "Em qual questão?", já com `questaoInicial` escolhida; a questão (índice) vai
    como terceiro argumento de `aoEnviar`. */
export function IssoEstaErrado({ aberto, aoMudar, oQue, aoEnviar, motivos = MOTIVOS_ERRADO, questoes, questaoInicial = 0, quemOlha = 'a sua professora' }: {
  /** quem vai olhar (a memória vai a quem dá a matéria na turma, ou à coordenação) */
  quemOlha?: string
  aberto: boolean
  aoMudar: (aberto: boolean) => void
  oQue?: ReactNode
  aoEnviar: (motivo: string, texto: string, questao?: number) => void
  motivos?: string[]
  /** o total de questões: liga o "Em qual questão?" */
  questoes?: number
  /** a questão (índice) que já vem escolhida */
  questaoInicial?: number
}) {
  const [motivo, setMotivo] = useState('')
  const [texto, setTexto] = useState('')
  const [questao, setQuestao] = useState<number | null>(null)
  const q = questao ?? questaoInicial
  const mudar = (v: boolean) => { if (!v) { setMotivo(''); setTexto(''); setQuestao(null) } aoMudar(v) }
  return (
    <Dialogo aberto={aberto} aoMudar={mudar} titulo="Isso está errado?" largura={480} descricao={`Escolha o motivo. Quem olha é ${quemOlha}.`}
      rodape={(
        <div className="grid w-full grid-cols-2 gap-3">
          <Botao variante="secundario" largura="cheia" onClick={() => mudar(false)}>Voltar</Botao>
          <Botao variante="primario" largura="cheia" disabled={!motivo}
            onClick={() => { aoEnviar(motivo, texto, questoes ? q : undefined); mudar(false) }}>Enviar</Botao>
        </div>
      )}>
      <div className="grid gap-4">
        {oQue && <p className="t-apoio">{oQue}</p>}
        {questoes !== undefined && questoes > 0 && (
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-[15px] font-bold text-tinta">Em qual questão?</legend>
            <div className={cn(questoes > 8 ? 'grid w-fit grid-cols-5 gap-1 sm:flex sm:flex-wrap' : 'flex flex-wrap gap-1.5')}>
              {Array.from({ length: questoes }, (_, i) => (
                <button key={i} type="button" aria-pressed={q === i} onClick={() => setQuestao(i)}
                  className={cn('grid place-items-center', questoes > 8 ? 'size-9' : 'size-10', 'rounded-full border-2 text-[15px] font-bold tabular-nums transition-colors duration-150',
                    q === i ? 'border-azul-borda bg-azul-claro text-azul-texto' : 'border-borda bg-white text-apoio hover:bg-fundo-suave')}>
                  {i + 1}
                </button>
              ))}
            </div>
          </fieldset>
        )}
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-[15px] font-bold text-tinta">O que está errado?</legend>
          {motivos.map((m) => (
            <Opcao key={m} nome="motivo-errado" valor={m} marcado={motivo === m} aoMudar={() => setMotivo(m)} className="[&_.face]:min-h-14">{m}</Opcao>
          ))}
        </fieldset>
        <CampoTexto rotulo="Quer explicar? Não precisa." valor={texto} aoMudar={setTexto} linhas={2} />
      </div>
    </Dialogo>
  )
}
