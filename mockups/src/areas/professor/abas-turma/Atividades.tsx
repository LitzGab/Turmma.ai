import { useMemo, useState, type ReactNode, type Ref } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, type LucideIcon } from 'lucide-react'
import {
  Aviso, Avatar, BarraProgresso, Botao, Cartao, Carimbo, EstadoVazio, LadrilhoIcone, Linha, NumeroGrande, Segmentado, Selo, materiaDe, type Familia,
} from '@/components/duo'
import { Icone } from '@/components/duo/icones'
import { Onca } from '@/components/duo/onca'
import { ChipFonte } from '@/components/turmma/ia'
import { PainelLado } from '@/components/turmma/painel-lado'
import { useParametro } from '@/components/turmma/tela'
import { AvatarT, tabelaT, tipo as tipoT } from '@/components/turmma/teachy'
import { useAlunosDaTurma } from '@/dados/acesso'
import { alunosDa, type Aluno } from '@/dados/alunos'
import { notasDoLote, useLotes, type Lote } from '@/dados/avaliacoes'
import { BIBLIOTECA } from '@/dados/biblioteca'
import { agora, criarFatia } from '@/dados/demo/nucleo'
import { useEnvios, useEstadoEnvios, type Envio } from '@/dados/envios'
import { useTurmasDoProfessor } from '@/dados/turmas-professora'
import { resumoDa } from '@/dados/turmas-resumo'
import { atividadesDa, diaDaSemana, materialDa, type AtividadeTurma, type TipoAtividade } from '@/dados/turma-atividades'
import { cn } from '@/lib/utils'

/* A ABA "ATIVIDADES" DA TURMA — 12ª rodada (04/10/2026), no sistema Turmma × Duolingo (plano de polimento, 5.2).

   UMA lista, num cartão, a mais nova primeiro. Cada linha: o ladrilho do tipo (prova, lista ou atividade) na cor da
   matéria, o título, o selo do estado (PARA APROVAR · ABERTA ATÉ QUINTA · AGENDADA · CORRIGIDA; o rascunho também é PARA APROVAR) e "19 de 32".
   O estado é VIVO: vem do dado da turma (dados/turma-atividades) mais o que aconteceu na demonstração:
   · a prova aprovada e enviada pelo documento entra como "Aberta" (ou "Agendada", na próxima aula) — dados/envios;
   · as entregas dos alunos contam ("1 de 32"), e com notas para aprovar a linha fica "Para aprovar";
   · aprovadas as notas (aqui, no Início ou na página do lote), ela vira "Corrigida" quando todos entregaram (ou o
     professor encerrou); antes disso segue "Aberta", com o carimbo das notas aprovadas — dados/avaliacoes (useLotes).
   NOVA ATIVIDADE (primário) abre a conversa nova, já com a turma. O filtro só aparece com mais de 8 linhas.
   A linha abre ao lado (?atividade=): os números grandes (ENTREGARAM · ACERTO · ABAIXO DE 6), os erros que se
   repetiram com a página, quem ainda não começou e as ações: APROVAR AS NOTAS (oficial, com lote esperando),
   ENCERRAR AGORA (aberta; D77), ABRIR O DOCUMENTO e, na discursiva do 1ºC, CORRIGIR AS DISCURSIVAS.
   SAÍRAM o recado fixado, as linhas "Material", o Nova ▾ com Recado e Material, o Mural e os Recursos: o material vai
   pelo "Aprovar e enviar" do documento, e a escola já tem o seu canal de recado.

   As peças exportadas logo abaixo (SubAbas, BuscaAluno, CaixaTabela, AlunoT, LinhaVazia, FraseDoPe, RotuloCartao)
   ficam até a P4 apagar o Ranking, que ainda as importa. */

/* ── Peças comuns ────────────────────────────────────────────────────────────────────────────────────────── */

export type OpcaoFiltro<T extends string> = { id: T; nome: string; n?: number }

/** As subabas sublinhadas: o filtro da aba. À direita, na mesma linha, cabe a busca de aluno. */
export function SubAbas<T extends string>({ rotulo, valor, aoMudar, opcoes, children }: {
  rotulo: string; valor: T; aoMudar: (v: T) => void; opcoes: OpcaoFiltro<T>[]; children?: ReactNode
}) {
  return (
    <div className="mb-6 flex min-h-10 flex-wrap items-end justify-between gap-x-6 border-b border-linha">
      <div role="group" aria-label={rotulo} className="-mb-px flex min-w-0 max-w-full gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {opcoes.map((o) => {
          const ativo = o.id === valor
          return (
            <button key={o.id} type="button" aria-pressed={ativo} onClick={() => aoMudar(o.id)}
              className={cn('inline-flex h-10 shrink-0 items-center gap-1.5 border-b-2 px-1 text-[14px] leading-6 transition-colors duration-150',
                ativo ? 'border-caramelo font-teachy font-bold text-tinta' : 'border-transparent text-apoio hover:text-tinta')}>
              {o.nome}
              {o.n !== undefined && <span className={cn('rounded-[4px] px-1.5 font-teachy-corpo text-[11px] font-normal leading-4', ativo ? 'bg-realce text-tinta' : 'bg-realce-suave text-sutil')}>{o.n}</span>}
            </button>
          )
        })}
      </div>
      {children && <div className="flex h-10 items-center gap-2 max-sm:w-full">{children}</div>}
    </div>
  )
}

/** A busca de aluno, no desenho da busca da Teachy: fundo cinza claro, canto 8 e a lupa à direita. */
export function BuscaAluno({ valor, aoMudar }: { valor: string; aoMudar: (v: string) => void }) {
  return (
    <label className="relative block w-full sm:w-56">
      <input value={valor} onChange={(e) => aoMudar(e.target.value)} placeholder="Buscar aluno" aria-label="Buscar aluno"
        className="h-8 w-full rounded-[8px] border border-linha bg-realce-suave pl-3 pr-8 text-[13px] leading-5 text-tinta outline-none transition-colors duration-150 placeholder:text-inativo focus-visible:border-borda-campo focus-visible:bg-superficie" />
      <Search aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-inativo" strokeWidth={1.75} />
    </label>
  )
}

/** A caixa da tabela: canto 8 e fio de 1 px. Se a tabela for mais larga que a caixa (celular), rola de lado aqui dentro. */
export function CaixaTabela({ rotulo, minimo, fixa = true, className, rolagem, children }: {
  rotulo: string; minimo?: string; fixa?: boolean; className?: string; /** a área que rola de lado, para quem precisa levá-la até uma coluna */ rolagem?: Ref<HTMLDivElement>; children: ReactNode
}) {
  return (
    <div className={cn(tabelaT.caixa, className)}>
      <div ref={rolagem} className="overflow-x-auto overscroll-x-contain">
        <table aria-label={rotulo} className={cn(tabelaT.tabela, fixa && 'table-fixed', minimo)}>{children}</table>
      </div>
    </div>
  )
}

/** Aluno = número de chamada + círculo com a inicial + nome. Não tem foto no sistema. */
export function AlunoT({ aluno, className }: { aluno: Aluno; className?: string }) {
  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <span className="w-[18px] shrink-0 text-right text-[12px] leading-4 text-inativo">{aluno.numero}</span>
      <AvatarT nome={aluno.nome} className="max-sm:hidden" />
      <span className="truncate text-[14px] leading-6 text-tinta">{aluno.nome}</span>
    </span>
  )
}

/** Quando o filtro ou a busca não acham nada: uma linha, dentro da tabela. */
export function LinhaVazia({ colunas, children }: { colunas: number; children: ReactNode }) {
  return <tr className="border-t border-linha"><td colSpan={colunas} className="px-4 py-10 text-center text-[14px] leading-6 text-inativo">{children}</td></tr>
}

/** A frase pequena embaixo da tabela: uma regra do produto, dita uma vez. */
export function FraseDoPe({ children }: { children: ReactNode }) {
  return <p className={cn(tipoT.apoio, 'mt-3')}>{children}</p>
}

/** O cabeçalho de um cartão da Teachy: ícone de 16 px em laranja + rótulo Inter 14/500 e, embaixo, uma linha miúda cinza. */
export function RotuloCartao({ icone: Icone, titulo, apoio, lado }: { icone: LucideIcon; titulo: string; apoio?: string; lado?: ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-[14px] font-medium leading-5 text-tinta"><Icone aria-hidden className="size-4 shrink-0 text-caramelo" strokeWidth={2} /><span className="truncate">{titulo}</span></p>
        {lado}
      </div>
      {apoio && <p className="mt-0.5 text-[11px] leading-4 text-inativo">{apoio}</p>}
    </div>
  )
}

/* ── A aba ───────────────────────────────────────────────────────────────────────────────────────────────── */

type Estado = 'aprovar' | 'aberta' | 'agendada' | 'corrigida' | 'rascunho' | 'corrigir' | 'encerrada'

type LinhaAtv = {
  id: string
  titulo: string
  tipo: TipoAtividade
  /** dd/mm, para ordenar e para "Aberta até quinta" */
  data: string
  /** o prazo já passou e ainda aceita entrega (o selo fica neutro, como o "AINDA DÁ" do aluno; D59) */
  vencida?: boolean
  ordem: number
  estado: Estado
  selo: string
  /** o selo no celular, numa palavra ou duas */
  seloCurto: string
  /** a coluna Prazo: "até quinta, 24/09", "abre terça 7h30", "aplicada 18/09" */
  prazo: string
  entregas: { feitas: number; total: number } | null
  base?: AtividadeTurma
  envio?: Envio
  lote?: Lote
  docId?: string
  /** o documento ainda espera a aprovação do professor (não chegou à turma) */
  docEspera?: boolean
  /** a ação própria da linha: corrigir as discursivas, continuar o rascunho */
  acao?: { rotulo: string; para: string }
  /** os números de uma correção que não está em `aluno.notas` (as objetivas do 1ºC) */
  numeros?: Correcao
  /** quem a atividade ainda espera (a entrega que falta) */
  faltam?: string[]
}

type Correcao = { acerto: number; abaixo: number; erros: { texto: string; alunos: number; pagina: number }[]; aprovadaEm: string }

/** "17/09" já passou? (o hoje da demonstração vem do relógio: 21/09) */
function jaPassou(data: string): boolean {
  const [d, m] = data.split('/').map(Number)
  const [hd, hm] = agora().dia.split('/').map(Number)
  return !!d && !!m && (m < hm || (m === hm && d < hd))
}

const FAMILIA_DO_SELO: Record<Estado, Familia | 'neutro'> = {
  aprovar: 'amarelo', corrigir: 'amarelo', aberta: 'azul', agendada: 'anil', corrigida: 'verde', rascunho: 'amarelo', encerrada: 'neutro',
}

/* As atividades que o professor encerrou antes do prazo (D77: "cancelar" vira "encerrar agora"). */
const fatiaEncerradas = criarFatia<string[]>('atividades-encerradas', [])

/* As objetivas do 1ºC: o Assistente corrigiu pelo gabarito e a professora aprovou (a objetiva nunca fica "para
   corrigir": quem corrige é o Assistente, e a professora só aprova). Só a discursiva do Lavoisier é dela, com a rubrica. */
const OBJETIVAS_1C: Record<string, Correcao> = {
  numero: { acerto: 58, abaixo: 9, aprovadaEm: '17/09', erros: [
    { texto: 'Trocou número de massa por número atômico', alunos: 11, pagina: 48 },
    { texto: 'Esqueceu de somar os nêutrons', alunos: 7, pagina: 48 },
  ] },
  modelos: { acerto: 72, abaixo: 4, aprovadaEm: '10/09', erros: [
    { texto: 'Trocou o modelo de Thomson pelo de Rutherford', alunos: 6, pagina: 44 },
  ] },
  'prova-modelos': { acerto: 66, abaixo: 7, aprovadaEm: '27/08', erros: [
    { texto: 'Pôs os elétrons dentro do núcleo no modelo de Rutherford', alunos: 8, pagina: 46 },
    { texto: 'Confundiu Dalton com Thomson', alunos: 5, pagina: 44 },
  ] },
}

/** O que espera a CORREÇÃO da professora (não é da fila: é trabalho dela, com a rubrica). Entra no "esperando" da
    turma em Turmas e no Hoje, para o número bater com o que a aba Atividades mostra. */
export type CorrecaoPendente = { id: string; titulo: string; detalhe: string; para: string }
const CORRECOES: Record<string, CorrecaoPendente[]> = {
  '1c': [{ id: '1c-rascunho', titulo: 'Corrigir as discursivas', detalhe: 'Discursiva sobre Lavoisier · 32 entregas', para: '/professor/ferramentas/redacao?turma=1c&atividade=lavoisier' }],
}
export const correcoesDa = (turmaId: string): CorrecaoPendente[] => CORRECOES[turmaId] ?? []

const ordemDe = (data: string) => Number(data.slice(3)) * 100 + Number(data.slice(0, 2))
const tipoDoEnvio = (t: string): TipoAtividade => (t === 'prova' || t === 'lista' ? t : 'atividade')
const docPorTitulo = (turmaId: string, titulo: string) => BIBLIOTECA.find((b) => b.turmaId === turmaId && b.titulo === titulo && !b.versaoDe)?.id

/** A lista viva da turma: o dado da turma, os envios e os lotes da demonstração. */
function useLinhas(turmaId: string, nova: boolean, total: number): LinhaAtv[] {
  const envios = useEnvios(turmaId)
  const docs = useEstadoEnvios().docs
  const lotes = useLotes(turmaId)
  const encerradas = fatiaEncerradas.useValor()
  return useMemo(() => {
    const loteDe = (id: string) => lotes.find((l) => l.id === id)
    const doEnvio = (e: Envio | undefined, id: string) => {
      if (!e) return null
      const lote = loteDe(`lote-${e.docId}`)
      const feitas = lote?.entregas.length ?? 0
      // o denominador é a turma toda, como nas outras linhas ("1 de 32"); quem ainda não entrou recebe quando entrar
      const para = e.para === 'turma' ? total : e.para.length
      // aprovar as notas de quem já entregou não fecha a atividade: ela só vira "Corrigida" quando todos entregaram
      // (ou quando o professor encerra; o prazo da demonstração, quinta, ainda não passou)
      const todos = feitas >= para || encerradas.includes(id)
      const estado: Estado = lote && lote.estado === 'espera' && feitas > 0 ? 'aprovar'
        : lote?.estado === 'aprovado' && todos ? 'corrigida'
        : e.quando === 'proxima' ? 'agendada' : 'aberta'
      return { estado, lote, entregas: { feitas, total: para } }
    }
    const linhas: LinhaAtv[] = []
    const usados = new Set<string>()

    for (const a of nova ? [] : atividadesDa(turmaId)) {
      const curtoId = a.id.slice(turmaId.length + 1)
      const docId = curtoId === 'prova-estequiometria' ? 'prova-estequiometria' : docPorTitulo(turmaId, a.nome)
      const envio = envios.find((e) => e.docId === docId && e.versao === 'original')
      const linha: LinhaAtv = { id: a.id, titulo: a.nome, tipo: a.tipo, data: a.data, ordem: ordemDe(a.data), estado: 'rascunho', selo: '', seloCurto: '', prazo: '', entregas: a.entregas, base: a, docId }
      if (envio) {
        usados.add(envio.docId)
        const v = doEnvio(envio, a.id)!
        Object.assign(linha, { envio, estado: v.estado, lote: v.lote, entregas: v.entregas, ordem: 10_000 + envio.em.ordem, data: envio.em.dia })
      } else if (curtoId === 'prova-estequiometria') {
        const espera = docs['prova-estequiometria']?.original?.estado !== 'recusado'
        Object.assign(linha, { estado: espera ? 'aprovar' : 'rascunho', docEspera: espera, ordem: 9_999 })
      } else if (a.estado === 'esperando') {
        const lote = turmaId === '2b' ? loteDe('prova-2b') : undefined
        Object.assign(linha, { lote, estado: lote?.estado === 'aprovado' ? 'corrigida' : 'aprovar', entregas: lote ? { feitas: notasDoLote(lote), total } : a.entregas })
      } else if (curtoId === 'rascunho' && turmaId === '1c') {
        // a discursiva sobre Lavoisier: aplicada em 04/09, e a correção é da professora (com a rubrica)
        const pendente = correcoesDa('1c')[0]
        const faltam = alunosDa('1c').slice().sort((x, y) => x.entregas.feitas - y.entregas.feitas).slice(0, 2).map((x) => x.nome)
        Object.assign(linha, { estado: 'corrigir', entregas: { feitas: total - 2, total }, faltam, acao: { rotulo: pendente.titulo, para: pendente.para } })
      } else if (turmaId === '1c' && OBJETIVAS_1C[curtoId]) {
        Object.assign(linha, { estado: 'corrigida', numeros: OBJETIVAS_1C[curtoId], faltam: a.quem.map((x) => x.nome) })
      } else {
        const mapa: Record<AtividadeTurma['estado'], Estado> = { esperando: 'aprovar', aprovada: 'corrigida', corrigir: 'corrigir', aberta: 'aberta', agendada: 'agendada', rascunho: 'rascunho' }
        linha.estado = mapa[a.estado]
        if (a.estado === 'rascunho') linha.acao = { rotulo: 'Continuar', para: `/professor/conversa/nova?ferramenta=atividade&turma=${turmaId}` }
      }
      linhas.push(linha)
    }

    // o que foi enviado na demonstração e não estava na lista (outro documento aprovado e enviado a esta turma)
    for (const e of envios.filter((x) => x.versao === 'original' && !usados.has(x.docId))) {
      usados.add(e.docId)
      const v = doEnvio(e, `envio-${e.docId}`)!
      linhas.push({ id: `envio-${e.docId}`, titulo: e.titulo, tipo: tipoDoEnvio(e.tipo), data: e.em.dia, ordem: 10_000 + e.em.ordem, estado: v.estado, selo: '', seloCurto: '', prazo: '', entregas: v.entregas, envio: e, lote: v.lote, docId: e.docId })
    }

    for (const l of linhas) {
      if (encerradas.includes(l.id) && (l.estado === 'aberta' || l.estado === 'agendada')) l.estado = l.lote?.estado === 'aprovado' ? 'corrigida' : 'encerrada'
      // o envio da demonstração: a prova abre na aula; a lista e a atividade ficam até quinta (como o aluno vê)
      l.vencida = l.estado === 'aberta' && !l.envio && jaPassou(l.data)
      const quando = l.envio ? (l.envio.tipo === 'prova' ? 'na aula' : 'quinta') : `${diaDaSemana(l.data)}, ${l.data}`
      l.prazo = l.vencida ? `venceu ${l.data}`
        : l.estado === 'aberta' ? (l.envio?.tipo === 'prova' ? 'aberta agora, na aula' : `até ${quando}`)
        : l.estado === 'agendada' ? (l.envio?.abre ? `abre ${l.envio.abre.selo.toLowerCase()}` : `abre ${l.data}`)
        : l.estado === 'rascunho' || l.docEspera ? 'ainda não enviada'
        : `aplicada ${l.data}`
      l.selo = l.vencida ? 'Ainda aceita'
        : l.estado === 'aprovar' ? (l.docEspera ? 'Para aprovar' : 'Notas para aprovar')
        : { aberta: 'Aberta', agendada: 'Agendada', corrigida: 'Corrigida', rascunho: 'Para aprovar', corrigir: 'Para corrigir', encerrada: 'Encerrada' }[l.estado]
      l.seloCurto = l.estado === 'aprovar' && !l.docEspera ? 'Notas' : l.selo
    }
    return linhas.sort((x, y) => y.ordem - x.ordem)
  }, [turmaId, nova, total, envios, docs, lotes, encerradas])
}

type FiltroId = 'todas' | 'aprovar' | 'abertas' | 'corrigidas'
const FILTROS: { id: FiltroId; rotulo: string; estados?: Estado[] }[] = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'aprovar', rotulo: 'Para aprovar', estados: ['aprovar', 'corrigir', 'rascunho'] },
  { id: 'abertas', rotulo: 'Abertas', estados: ['aberta', 'agendada'] },
  { id: 'corrigidas', rotulo: 'Corrigidas', estados: ['corrigida', 'encerrada'] },
]

export function AtividadesTurma({ turmaId }: { turmaId: string }) {
  const t = useTurmasDoProfessor().find((x) => x.id === turmaId)
  const nomes = useAlunosDaTurma(turmaId)
  if (!t) return null
  const total = t.nova ? nomes.length : t.alunos
  return <Atividades key={turmaId} turmaId={turmaId} nova={!!t.nova} total={total} disciplina={t.disciplina} />
}

function Atividades({ turmaId, nova, total, disciplina }: { turmaId: string; nova: boolean; total: number; disciplina: string }) {
  const [aberta, setAberta] = useParametro('atividade')
  const [filtro, setFiltro] = useState<FiltroId>('todas')
  const navegar = useNavigate()
  const linhas = useLinhas(turmaId, nova, total)
  const familia = materiaDe(disciplina)?.familia ?? 'azul'
  const regra = FILTROS.find((f) => f.id === filtro)!
  const visiveis = linhas.filter((l) => !regra.estados || regra.estados.includes(l.estado))
  const linha = linhas.find((l) => l.id === aberta)

  // a linha abre o que ela é: as notas para aprovar, a correção, o documento ou as notas da turma; sem página
  // própria, o detalhe ao lado. A coluna Entregas sempre abre o detalhe (quem entregou, acerto, erros).
  const abrir = (l: LinhaAtv) => {
    const destino = destinoDa(l, turmaId)
    if (destino) navegar(destino)
    else setAberta(l.id)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {linhas.length > 8 && (
        <div className="min-w-0 max-w-full shrink-0 overflow-x-auto [scrollbar-width:none]">
          <Segmentado opcoes={FILTROS} valor={filtro} aoMudar={(id) => setFiltro(id as FiltroId)} rotulo="Filtrar as atividades" />
        </div>
      )}

      {linhas.length === 0 ? (
        <div className="grid min-h-[280px] flex-1 grid-rows-[1fr_auto_2fr]">
          <span aria-hidden />
          <EstadoVazio ilustracao={<Onca pose="dormindo" tamanho={96} />} titulo="Nenhuma atividade ainda" />
          <span aria-hidden />
        </div>
      ) : (
        <div className="flex min-h-0 flex-col overflow-hidden rounded-[16px] border-2 border-borda bg-white">
          {/* computador: a tabela, com o cabeçalho preso */}
          <div className="hidden min-h-0 overflow-y-auto overscroll-contain md:block">
            <table aria-label="Atividades da turma" className="w-full table-fixed border-collapse text-left">
              <colgroup><col /><col className="w-[12%]" /><col className="w-[17%]" /><col className="w-[17%]" /><col className="w-[208px]" /></colgroup>
              <thead className="sticky top-0 z-[1] bg-white shadow-[inset_0_-2px_0_var(--color-borda)]">
                <tr>
                  {['Atividade', 'Tipo', 'Prazo', 'Entregas'].map((c) => <th key={c} scope="col" className="t-selo h-11 px-4 align-middle text-sutil">{c}</th>)}
                  <th scope="col" className="t-selo h-11 px-4 text-right align-middle text-sutil">Estado</th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((l) => (
                  <tr key={l.id} tabIndex={0} onClick={() => abrir(l)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(l) } }}
                    aria-selected={aberta === l.id}
                    className={cn('h-16 cursor-pointer border-t-2 border-borda text-[15px] font-medium text-tinta transition-colors duration-150 first:border-t-0 hover:bg-fundo-suave focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-azul-texto',
                      aberta === l.id && 'bg-azul-claro hover:bg-azul-claro')}>
                    <td className="px-4 py-2">
                      <span className="flex min-w-0 items-center gap-3">
                        <LadrilhoTipo tipo={l.tipo} familia={familia} />
                        <span className="t-cartao min-w-0 truncate" title={l.titulo}>{l.titulo}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2 text-apoio">{NOME_TIPO[l.tipo]}</td>
                    <td className="truncate px-4 py-2 text-apoio">{l.prazo}</td>
                    <td className="px-4 py-2">
                      {l.entregas && l.estado !== 'rascunho' && !l.docEspera ? (
                        <button type="button" onClick={(e) => { e.stopPropagation(); setAberta(l.id) }} aria-label={`${l.entregas.feitas} de ${l.entregas.total} entregaram: ver quem`}
                          className="-mx-2 flex w-[calc(100%+16px)] min-w-0 items-center gap-2.5 rounded-[10px] px-2 py-1.5 transition-colors duration-150 hover:bg-white">
                          <span className="w-12 shrink-0 font-bold tabular-nums">{l.entregas.feitas}/{l.entregas.total}</span>
                          <BarraProgresso valor={l.entregas.feitas} max={Math.max(1, l.entregas.total)} familia={familia} altura={12} className="min-w-0 flex-1" />
                        </button>
                      ) : <span className="text-sutil">—</span>}
                    </td>
                    <td className="px-4 py-2 text-right"><Selo familia={l.vencida ? 'neutro' : FAMILIA_DO_SELO[l.estado]} tamanho="p">{l.selo}</Selo></td>
                  </tr>
                ))}
                {visiveis.length === 0 && <tr><td colSpan={5} className="t-apoio h-16 px-4">Nada com este filtro.</td></tr>}
              </tbody>
            </table>
          </div>

          {/* celular: uma linha de 64 px por atividade */}
          <ul aria-label="Atividades da turma" className="min-h-0 overflow-y-auto overscroll-contain md:hidden">
            {visiveis.map((l) => (
              <li key={l.id} className="border-t-2 border-borda first:border-t-0">
                <button type="button" onClick={() => abrir(l)} className="flex min-h-16 w-full min-w-0 items-center gap-3 px-4 py-2 text-left hover:bg-fundo-suave">
                  <LadrilhoTipo tipo={l.tipo} familia={familia} tamanho={32} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="t-cartao truncate text-tinta">{l.titulo}</span>
                    <span className="t-apoio truncate">{[NOME_TIPO[l.tipo], l.entregas && l.estado !== 'rascunho' && !l.docEspera ? `${l.entregas.feitas}/${l.entregas.total}` : null].filter(Boolean).join(' · ')}</span>
                  </span>
                  <Selo familia={l.vencida ? 'neutro' : FAMILIA_DO_SELO[l.estado]} tamanho="p">{l.seloCurto}</Selo>
                </button>
              </li>
            ))}
            {visiveis.length === 0 && <li className="t-apoio px-4 py-5">Nada com este filtro.</li>}
          </ul>
        </div>
      )}

      <PainelLado aberto={!!linha} aoFechar={() => setAberta(null)} titulo={linha?.titulo ?? ''} descricao="A atividade: entregas, acerto e o que fazer."
        rodape={linha && temRodape(linha) ? <Rodape l={linha} turmaId={turmaId} /> : undefined}>
        {linha && <Detalhe l={linha} turmaId={turmaId} familia={familia} />}
      </PainelLado>
    </div>
  )
}

const NOME_TIPO: Record<TipoAtividade, string> = { prova: 'Prova', lista: 'Lista', atividade: 'Atividade' }

/** Para onde a linha leva: as notas esperando aprovação, a correção da discursiva, o documento ou as notas da turma.
    null = não tem página própria (abre o detalhe ao lado). */
function destinoDa(l: LinhaAtv, turmaId: string): string | null {
  if (l.lote && l.lote.estado === 'espera' && notasDoLote(l.lote) > 0) return `/professor/aprovar/${l.lote.id}`
  if (l.estado === 'corrigir' && l.acao) return l.acao.para
  if (l.docId) return `/professor/criados/${l.docId}`
  if (l.estado === 'corrigida' && l.base?.indiceNota != null) return `/professor/turmas/${turmaId}?aba=alunos&ver=notas`
  if (l.estado === 'rascunho' && l.acao) return l.acao.para
  return null
}

function LadrilhoTipo({ tipo, familia, tamanho = 40 }: { tipo: TipoAtividade; familia: Familia; tamanho?: 32 | 40 }) {
  // os três tipos no mesmo desenho, todos na cor da matéria (a atividade usa a prancheta das tarefas)
  const icone = <Icone id={tipo === 'atividade' ? 'tarefas' : tipo} familia={familia} />
  return <LadrilhoIcone familia={familia} tamanho={tamanho} icone={icone} rotulo={NOME_TIPO[tipo]} />
}

/* ── O detalhe ao lado ───────────────────────────────────────────────────────────────────────────────────── */


function Detalhe({ l, turmaId, familia }: { l: LinhaAtv; turmaId: string; familia: Familia }) {
  const alunos = alunosDa(turmaId)
  const nomes = useAlunosDaTurma(turmaId)
  const material = materialDa(turmaId)
  const a = l.base
  const i = a?.indiceNota ?? null

  // os números: das notas da turma (a atividade já corrigida), da correção aprovada fora do boletim (o 1ºC) ou das
  // entregas da demonstração (o lote novo)
  let acerto: number | null = null
  let abaixo: number | null = null
  if (l.numeros) {
    acerto = l.numeros.acerto
    abaixo = l.numeros.abaixo
  } else if (i !== null && a) {
    const notas = alunos.map((x) => x.notas[i].valor).filter((v): v is number => v !== null)
    acerto = a.acerto
    abaixo = notas.filter((v) => v < 6).length
  } else if (l.lote && l.lote.entregas.length) {
    const e = l.lote.entregas
    acerto = Math.round((e.reduce((s, x) => s + x.acertos / x.total, 0) / e.length) * 100)
    abaixo = e.filter((x) => (x.acertos / x.total) * 10 < 6).length
  }
  const r = resumoDa(turmaId)
  const erros = l.numeros ? l.numeros.erros : i !== null && a && r.origemDosErros.includes(a.data) ? r.erros.slice(0, 3) : []

  // quem falta: na aberta da turma, os de sempre; na enviada agora, quem entrou e ainda não entregou; na corrigida, quem
  // não entregou. Na enviada, quem ainda não entrou na turma fica numa linha à parte (não recebe a tarefa).
  const entregues = new Set(l.lote?.entregas.map((x) => x.nome) ?? [])
  const aberta = l.estado === 'aberta' || l.estado === 'agendada'
  const candidatos: string[] = l.faltam
    ?? (aberta
      ? (l.envio ? nomes.filter((n) => n.situacao === 'na-turma' && !entregues.has(n.nome)).map((n) => n.nome) : (a?.quem ?? []).map((x) => x.nome))
      : l.estado === 'corrigida' && a ? a.quem.map((x) => x.nome) : [])
  // quem ainda não entrou na turma (só no envio à turma toda): conta no "de 32" e recebe a tarefa quando entrar
  const foraDaTurma = l.envio && l.envio.para === 'turma' ? nomes.filter((n) => n.situacao !== 'na-turma').length : 0
  // a lista só aparece quando bate com o número de cima (o "30 de 32" e os 2 que faltam)
  const faltam = !l.entregas || candidatos.length + foraDaTurma === l.entregas.total - l.entregas.feitas ? candidatos : []
  const tituloFaltam = aberta ? (l.envio ? 'Ainda não entregaram' : 'Ainda não começaram') : 'Não entregaram'

  return (
    <div className="grid min-w-0 gap-6 text-tinta">
      {l.docEspera && <Aviso tom="atencao" titulo="Só você vê">Chega à turma quando você aprovar.</Aviso>}
      {l.envio && <Carimbo por={l.envio.por} quando={l.envio.em.rotulo} />}
      {l.lote?.estado === 'aprovado' && l.lote.por && <Carimbo verbo="Notas aprovadas por" por={l.lote.por} quando={l.lote.quando} />}
      {l.numeros && <p className="t-apoio">Corrigida pelo Assistente e aprovada por você em {l.numeros.aprovadaEm}.</p>}

      {l.entregas && l.estado !== 'rascunho' && (
        <div className="grid min-w-0 grid-cols-[repeat(3,minmax(0,1fr))] gap-2.5 max-sm:gap-2 max-sm:[&>div]:p-3 max-sm:[&>div>p:last-child]:text-[11px] max-sm:[&>div>p:last-child]:tracking-[0.02em]">
          <NumeroGrande familia={familia} icone={<Icone id="alunos" />} rotulo="Entregaram"
            valor={<>{l.entregas.feitas}<span className="text-[15px] text-sutil"> de {l.entregas.total}</span></>} />
          <NumeroGrande familia="verde" icone={<Icone id="acerto" />} rotulo="Acerto" valor={acerto === null ? '—' : `${acerto}%`} />
          <NumeroGrande familia="amarelo" icone={<Icone id="notas" />} rotulo="Abaixo de 6" valor={abaixo ?? '—'} />
        </div>
      )}
      {foraDaTurma > 0 && <p className="t-apoio -mt-3">Outros {foraDaTurma} ainda não entraram na turma e recebem quando entrarem.</p>}
      {l.estado === 'corrigir' && <p className="t-apoio -mt-3">A discursiva é você quem corrige, com a rubrica. O acerto aparece depois.</p>}

      {erros.length > 0 && (
        <section className="min-w-0">
          <h3 className="t-selo mb-1 text-sutil">Erros que se repetiram</h3>
          <ul>
            {erros.map((e) => (
              <li key={e.texto} className="flex min-w-0 items-center gap-3 border-t-2 border-borda py-2.5 first:border-t-0">
                <span className="min-w-0 flex-1 text-[15px] font-medium leading-snug">{e.texto}</span>
                <span className="t-apoio shrink-0 tabular-nums">{e.alunos}</span>
                <ChipFonte pagina={e.pagina} material={material.titulo} capitulo={material.capitulo} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {faltam.length > 0 && (
        <section className="min-w-0">
          <h3 className="t-selo mb-2 text-sutil">{tituloFaltam} · {faltam.length}</h3>
          <ul className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-x-3 gap-y-2">
            {faltam.slice(0, 12).map((n) => (
              <li key={n} className="flex min-w-0 items-center gap-2">
                <Avatar nome={n} tamanho={24} />
                <span className="truncate text-[15px] font-medium">{n}</span>
              </li>
            ))}
          </ul>
          {faltam.length > 12 && <p className="t-apoio mt-2">e mais {faltam.length - 12}</p>}
        </section>
      )}

      {l.estado === 'rascunho' && <p className="t-apoio">Só você vê. Chega à turma quando você aprovar.</p>}
    </div>
  )
}

/** O rodapé só aparece quando há o que fazer: sem ação, sem a linha divisória vazia. */
function temRodape(l: LinhaAtv) {
  return !!(l.docId || l.estado === 'aberta' || l.acao || (l.lote && l.lote.estado === 'espera' && notasDoLote(l.lote) > 0)
    || (l.estado === 'corrigida' && l.base?.indiceNota != null))
}

function Rodape({ l, turmaId }: { l: LinhaAtv; turmaId: string }) {
  const encerrar = () => fatiaEncerradas.mudar((x) => (x.includes(l.id) ? x : [...x, l.id]))
  const loteEspera = l.lote && l.lote.estado === 'espera' && notasDoLote(l.lote) > 0
  const documento = l.docId ? `/professor/criados/${l.docId}` : null
  // a corrigida com nota no boletim leva às notas da turma, na aba Alunos
  const verNotas = l.estado === 'corrigida' && l.base?.indiceNota != null
  return (
    <>
      {documento && (
        <Botao asChild variante={l.docEspera ? 'oficial' : 'fantasma'} tamanho="m" className={cn(!l.docEspera && 'mr-auto')}>
          <Link to={documento}>Abrir o documento</Link>
        </Botao>
      )}
      {verNotas && <Botao asChild variante="secundario" tamanho="m"><Link to={`/professor/turmas/${turmaId}?aba=alunos&ver=notas`}>Ver as notas</Link></Botao>}
      {l.estado === 'aberta' && <Botao variante="secundario" tamanho="m" onClick={encerrar}>Encerrar agora</Botao>}
      {l.acao && <Botao asChild variante={l.estado === 'rascunho' ? 'secundario' : 'oficial'} tamanho="m"><Link to={l.acao.para}>{l.acao.rotulo}</Link></Botao>}
      {loteEspera && <Botao asChild variante="oficial" tamanho="m"><Link to={`/professor/aprovar/${l.lote!.id}`}>Aprovar as notas</Link></Botao>}
    </>
  )
}
