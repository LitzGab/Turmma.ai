import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Botao, BotaoIcone, EstadoVazio, LadrilhoIcone, Linha, MenuMais, Selo, familia as estiloFamilia, materiaDe } from '@/components/duo'
import { Icone } from '@/components/duo/icones'
import { Onca } from '@/components/duo/onca'
import { PainelLado } from '@/components/turmma/painel-lado'
import { useParametro } from '@/components/turmma/tela'
import { useAgora } from '@/dados/demo/nucleo'
import { ESCOLAS } from '@/dados/escola'
import { definirEscolaAtiva, useEscolaAtiva } from '@/dados/escola-ativa'
import { useEnvios } from '@/dados/envios'
import { DURACAO_AULA, horaDosMinutos, minutosDaHora, useSemana, type AulaDaSemana, type DiaDaSemana } from '@/dados/grade'
import { useProfessorAtual } from '@/dados/sessao'
import { cn } from '@/lib/utils'

/* A SEMANA (dentro de Turmas, /professor/turmas?ver=semana) — 14ª rodada (05/10/2026; plano ux-composicao 1.3 e 5.2).

   Uma GRADE DE HORÁRIO, como a da escola: de 7h30 a 12h (de manhã) ou de 13h30 a 17h30 (à tarde, na outra escola).
   · Cinco colunas iguais, de segunda a sexta; cada aula fica na altura da hora em que começa e tem a altura da
     duração (50 min), então as aulas da mesma hora ficam alinhadas na horizontal. As linhas da esquerda marcam o
     começo de cada aula da escola e o intervalo.
   · Hoje aceso (o cabeçalho do dia em azul, a coluna em fundo suave e a linha do agora); a aula de agora com a borda
     azul e o selo AGORA.
   · Clicar abre a aula ao lado: o que vou dar, o material ligado e PREPARAR (a conversa nova, com a turma e o tema);
     a aula de agora traz COMEÇAR AULA.
   · No cabeçalho da página: o seletor da escola (quem dá aula em duas; o seletor do app inteiro, regra 10). Na linha
     das abas: ‹ "21 a 25 de setembro" › e HOJE (?semana=-1|1; só uma semana para cada lado).
   · A prova enviada "na próxima aula" põe o selo AVALIAÇÃO na aula em que abre (dados/envios.ts); a aula em branco,
     o selo FALTA PREENCHER (neutro: lembra, não cobra; D59).
   · No celular: os cinco dias em botões e a grade de um dia só.
   Ninguém cria nem arrasta aula: a grade vem da escola (regra 60, item 8). Uma fonte só: `useSemana` (dados/grade.ts). */

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const SEGUNDA = new Date(2026, 8, 21)
const dois = (n: number) => String(n).padStart(2, '0')

/** "21 a 25 de setembro"; atravessando o mês, "28 de setembro a 2 de outubro". Curto: "21 a 25/09". */
function rotuloDaSemana(deslocamento: number, curto = false) {
  const ini = new Date(SEGUNDA.getFullYear(), SEGUNDA.getMonth(), SEGUNDA.getDate() + deslocamento * 7)
  const fim = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + 4)
  if (curto) return `${ini.getDate()}/${dois(ini.getMonth() + 1)} a ${fim.getDate()}/${dois(fim.getMonth() + 1)}`
  return ini.getMonth() === fim.getMonth()
    ? `${ini.getDate()} a ${fim.getDate()} de ${MESES[fim.getMonth()]}`
    : `${ini.getDate()} de ${MESES[ini.getMonth()]} a ${fim.getDate()} de ${MESES[fim.getMonth()]}`
}

/* A semana passada (14 a 18 de setembro), como a professora preencheu: o que deu em cada aula e a prova de mol do
   2ºB, na sexta. "dia hora turma" → conteúdo, no formato da grade. */
const PASSADA: Record<string, string> = {
  '0 7h30 1c': 'Número atômico e de massa', '0 8h20 2a': 'Mol e massa molar', '0 10h30 2b': 'Exercícios de massa molar', '0 14h10 9a': 'Feira de ciências: 2ª etapa',
  '1 7h30 2b': 'Revisão para a prova de mol', '1 9h10 1c': 'Isótopos', '1 10h30 2a': 'Exercícios de mol',
  '2 8h20 2a': 'Lista de mol', '2 14h10 9a': 'Reações do dia a dia', '2 15h00 9a': 'Atividade de reações',
  '3 7h30 1c': 'Camadas do modelo de Bohr', '3 10h30 2b': 'Correção de exercícios de mol',
  '4 7h30 2a': 'Proporção nas reações', '4 9h10 2b': 'Prova de mol e massa molar', '4 10h30 1c': 'Modelo de Bohr: exercícios',
}
const AVALIACAO_PASSADA: Record<string, string> = { '4 9h10 2b': 'Prova de mol e massa molar' }

/** Só uma semana para cada lado: a passada (com o que foi dado) e a próxima (por preencher). */
const LIMITE = 1

/** Outra semana: a mesma grade, nas datas dela, sem o agora. A passada traz o que foi dado; a próxima, em branco. */
function deslocar(dias: DiaDaSemana[], deslocamento: number): DiaDaSemana[] {
  if (deslocamento === 0) return dias
  return dias.map((d) => {
    const data = new Date(SEGUNDA.getFullYear(), SEGUNDA.getMonth(), SEGUNDA.getDate() + deslocamento * 7 + d.indice)
    const dm = `${dois(data.getDate())}/${dois(data.getMonth() + 1)}`
    return {
      ...d, data: dm, hoje: false,
      aulas: d.aulas.map((a) => {
        const chave = `${d.indice} ${a.hora} ${a.turmaId}`
        const passada = deslocamento < 0
        return { ...a, id: `${a.id}+${deslocamento}`, data: dm, agora: false, material: null,
          conteudo: passada ? PASSADA[chave] ?? null : null, avaliacao: passada ? AVALIACAO_PASSADA[chave] ?? null : null }
      }),
    }
  })
}

/** A semana escolhida (?semana=-1 | 1), presa ao endereço para o cabeçalho e a grade lerem a mesma. */
function useDeslocamento() {
  const [valor, setValor] = useParametro('semana')
  const n = Math.max(-LIMITE, Math.min(LIMITE, Number(valor) || 0))
  return [n, (d: number) => setValor(d === 0 ? null : String(Math.max(-LIMITE, Math.min(LIMITE, d))))] as const
}

/* ── O turno: o pedaço do dia que a grade mostra ─────────────────────────────────────────────────────────── */

type Turno = { nome: 'manhã' | 'tarde'; inicio: number; fim: number }
const MANHA: Turno = { nome: 'manhã', inicio: 7 * 60 + 30, fim: 12 * 60 }
const TARDE: Turno = { nome: 'tarde', inicio: 13 * 60 + 30, fim: 17 * 60 + 30 }
const turnoDaEscola = (escolaId: string): Turno => (ESCOLAS.find((e) => e.id === escolaId)?.turno === 'Tarde' ? TARDE : MANHA)

/** As marcas da esquerda: o começo de cada aula da escola, o fim da última e o intervalo (vão de 20 min ou mais). */
function marcasDo(dias: DiaDaSemana[], turno: Turno) {
  const inicios = [...new Set(dias.flatMap((d) => d.aulas.map((a) => minutosDaHora(a.hora))))].sort((a, b) => a - b)
  const marcas = new Set<number>(inicios)
  const intervalos: { de: number; ate: number }[] = []
  inicios.forEach((m, i) => {
    const fim = m + DURACAO_AULA
    const prox = inicios[i + 1]
    if (prox === undefined) { if (fim <= turno.fim) marcas.add(fim); return }
    if (prox - fim >= 20) { intervalos.push({ de: fim, ate: prox }); marcas.add(fim) }
  })
  if (!inicios.length) for (let m = Math.ceil(turno.inicio / 60) * 60; m <= turno.fim; m += 60) marcas.add(m)
  return { marcas: [...marcas].filter((m) => m >= turno.inicio && m <= turno.fim).sort((a, b) => a - b), intervalos }
}

/* ── No cabeçalho: a escola e a semana ───────────────────────────────────────────────────────────────────── */

/** O seletor da escola (só para quem dá aula em duas): "Colégio Aurora · manhã ▾". Troca a escola do app inteiro. */
export function EscolaDaSemana() {
  const prof = useProfessorAtual()
  const escola = useEscolaAtiva()
  const minhas = ESCOLAS.filter((e) => prof.escolas.includes(e.id))
  if (minhas.length < 2) return null
  const gatilho = (
    <button type="button" aria-label={`Escola: ${escola.nome}. Trocar`}
      className="inline-flex h-10 max-w-full items-center gap-2 rounded-[12px] border-2 border-borda bg-white pl-3 pr-2 text-[15px] font-bold text-tinta transition-colors duration-150 hover:bg-fundo-suave data-[state=open]:bg-fundo-suave">
      <span className="truncate">{escola.curto}</span>
      <span className="font-medium text-sutil max-sm:hidden">· {turnoDaEscola(escola.id).nome}</span>
      <ChevronDown aria-hidden className="size-4 shrink-0 text-sutil" strokeWidth={2.5} />
    </button>
  )
  return (
    <MenuMais alinhar="end" gatilho={gatilho}
      itens={minhas.map((e) => ({
        rotulo: `${e.nome} · ${turnoDaEscola(e.id).nome}`,
        icone: e.id === escola.id ? <Check strokeWidth={3} /> : <span className="size-[18px]" />,
        aoEscolher: () => { if (e.id !== escola.id) definirEscolaAtiva(e.id) },
      }))} />
  )
}

/** ‹ "21 a 25 de setembro" › e HOJE, na ponta direita da linha das abas. */
export function NavegarSemana() {
  const [desl, setDesl] = useDeslocamento()
  return (
    <div className="flex items-center gap-1">
      {desl !== 0 && <Botao variante="fantasma" tamanho="p" onClick={() => setDesl(0)} className="max-sm:hidden">Hoje</Botao>}
      <BotaoIcone rotulo="Semana anterior" disabled={desl <= -LIMITE} onClick={() => setDesl(desl - 1)}><ChevronLeft strokeWidth={2.5} /></BotaoIcone>
      <span className="min-w-0 whitespace-nowrap text-center text-[15px] font-bold tabular-nums text-tinta sm:min-w-[188px]" aria-live="polite">
        <span className="max-sm:hidden">{rotuloDaSemana(desl)}</span><span className="px-1 text-[13px] sm:hidden">{rotuloDaSemana(desl, true)}</span>
      </span>
      <BotaoIcone rotulo="Próxima semana" disabled={desl >= LIMITE} onClick={() => setDesl(desl + 1)}><ChevronRight strokeWidth={2.5} /></BotaoIcone>
    </div>
  )
}

/* ── A grade ─────────────────────────────────────────────────────────────────────────────────────────────── */

export function SemanaDoProfessor() {
  const prof = useProfessorAtual()
  const escola = useEscolaAtiva()
  const [deslocamento] = useDeslocamento()
  const [aberta, setAberta] = useParametro('aula')
  const base = useSemana(prof.id, escola.id)
  const envios = useEnvios()
  const { ordem } = useAgora()
  const [diaCelular, setDiaCelular] = useState(0)

  // a prova enviada "na próxima aula" abre numa aula desta semana: ela ganha o selo AVALIAÇÃO
  const semana = useMemo(() => {
    const marcadas = base.map((d) => ({
      ...d,
      aulas: d.aulas.map((a) => {
        const prova = envios.find((e) => e.quando === 'proxima' && e.turmaId === a.turmaId && e.abre?.rotulo === `${a.nomeDia}, ${a.hora}`)
        return prova ? { ...a, avaliacao: prova.titulo } : a
      }),
    }))
    return deslocar(marcadas, deslocamento)
  }, [base, envios, deslocamento])

  const turno = turnoDaEscola(escola.id)
  const { marcas, intervalos } = useMemo(() => marcasDo(semana, turno), [semana, turno])
  const temAula = semana.some((d) => d.aulas.length > 0)
  const aula = semana.flatMap((d) => d.aulas).find((a) => a.id === aberta)
  const futura = deslocamento >= 0
  // o minuto de agora (o relógio da demonstração), para a linha do agora na coluna de hoje
  const agoraMin = 10 * 60 + 42 + ordem

  if (!temAula) {
    return (
      <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto_2fr]">
        <span aria-hidden />
        <EstadoVazio ilustracao={<Onca pose="dormindo" tamanho={96} />} titulo="Sem aulas nesta semana" />
        <span aria-hidden />
      </div>
    )
  }

  const grade = (dias: DiaDaSemana[]) => (
    <Grade dias={dias} turno={turno} marcas={marcas} intervalos={intervalos} futura={futura}
      agoraMin={deslocamento === 0 ? agoraMin : null} aoAbrir={(a) => setAberta(a.id)} />
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* computador: as cinco colunas */}
      <div className="hidden min-h-0 flex-1 flex-col md:flex">{grade(semana)}</div>

      {/* celular: os dias em botões e a grade de um dia */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 md:hidden">
        <div role="group" aria-label="Dia da semana" className="grid shrink-0 grid-cols-5 gap-1.5">
          {semana.map((d) => {
            const ativo = d.indice === diaCelular
            return (
              <button key={d.indice} type="button" aria-pressed={ativo} onClick={() => setDiaCelular(d.indice)}
                className={cn('flex h-14 flex-col items-center justify-center rounded-[12px] border-2 transition-colors duration-150',
                  ativo ? 'border-azul-borda bg-azul-claro text-azul-texto' : 'border-borda bg-white text-apoio hover:bg-fundo-suave')}>
                <span className="t-selo">{d.curto}</span>
                <span className={cn('text-[15px] font-bold tabular-nums', d.hoje && !ativo && 'text-azul-texto')}>{d.data.slice(0, 2)}</span>
              </button>
            )
          })}
        </div>
        <div className="flex min-h-[420px] flex-1 flex-col">{grade(semana.filter((d) => d.indice === diaCelular))}</div>
      </div>

      <PainelLado aberto={!!aula} aoFechar={() => setAberta(null)} titulo={aula ? `${aula.turma} · ${aula.materia}` : ''}
        descricao="A aula: o que vou dar e o material ligado."
        rodape={aula && (aula.agora ? (
          <Botao asChild variante="primario" tamanho="m"><Link to={`/professor/turmas/${aula.turmaId}/aula`}>Começar aula</Link></Botao>
        ) : futura ? (
          <Botao asChild variante="primario" tamanho="m">
            <Link to={`/professor/conversa/nova?turma=${aula.turmaId}${aula.conteudo ? `&pedido=${encodeURIComponent(aula.conteudo)}` : ''}`}>Preparar</Link>
          </Botao>
        ) : undefined)}>
        {aula && <DetalheAula a={aula} passada={!futura} />}
      </PainelLado>
    </div>
  )
}

/** A grade de horário: a régua de horas à esquerda (56 px) e uma coluna por dia, as aulas posicionadas pela hora. */
function Grade({ dias, turno, marcas, intervalos, futura, agoraMin, aoAbrir }: {
  dias: DiaDaSemana[]
  turno: Turno
  marcas: number[]
  intervalos: { de: number; ate: number }[]
  futura: boolean
  agoraMin: number | null
  aoAbrir: (a: AulaDaSemana) => void
}) {
  // a grade vai da primeira marca à última (o começo da primeira aula e o fim da última): sem faixa vazia embaixo
  const ini = marcas.length ? Math.min(marcas[0], turno.inicio) : turno.inicio
  const fim = marcas.length ? marcas[marcas.length - 1] : turno.fim
  const total = fim - ini
  const pos = (m: number) => `${((m - ini) / total) * 100}%`
  const alt = (min: number) => `${(min / total) * 100}%`
  const colunas = `56px repeat(${dias.length}, minmax(0, 1fr))`
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* os dias */}
      <div className="grid shrink-0 gap-x-2 pb-2 max-md:hidden" style={{ gridTemplateColumns: colunas }}>
        <span aria-hidden />
        {dias.map((d) => (
          <p key={d.indice} className={cn('flex h-9 items-center gap-2 rounded-[10px] px-3', d.hoje ? 'bg-azul-claro text-azul-texto' : 'text-sutil')}>
            <span className="t-selo">{d.curto}</span>
            <span className="text-[15px] font-bold tabular-nums">{d.data}</span>
            {d.hoje && <span className="t-selo ml-auto">Hoje</span>}
          </p>
        ))}
      </div>

      {/* as horas e as aulas */}
      <div className="relative grid min-h-0 flex-1 gap-x-2 rounded-[16px] border-2 border-borda bg-white py-3 pr-2" style={{ gridTemplateColumns: colunas }}>
        {/* a régua: as linhas atravessam a grade inteira */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 inset-y-3">
          {intervalos.map((i) => (
            <div key={i.de} className="absolute inset-x-0 flex items-center justify-center bg-fundo-suave" style={{ top: pos(i.de), height: alt(i.ate - i.de) }}>
              <span className="t-selo text-sutil">Intervalo</span>
            </div>
          ))}
          {marcas.map((m) => (
            <div key={m} className="absolute inset-x-0 flex items-center" style={{ top: pos(m) }}>
              <span className="w-14 -translate-y-1/2 pr-2 text-right text-[13px] font-bold tabular-nums leading-none text-sutil">{horaDosMinutos(m)}</span>
              <span className="h-0 flex-1 border-t-2 border-dashed border-borda" />
            </div>
          ))}
        </div>
        <span aria-hidden />
        {dias.map((d) => (
          <section key={d.indice} aria-label={`${d.nome}, ${d.data}`} className={cn('relative min-h-0 rounded-[10px]', d.hoje && 'bg-azul-claro/40')}>
            {d.aulas.map((a) => {
              const comeco = minutosDaHora(a.hora)
              return (
                <CartaoAula key={a.id} a={a} futura={futura} aoAbrir={() => aoAbrir(a)}
                  style={{ top: `calc(${pos(comeco)} + 2px)`, height: `calc(${alt(DURACAO_AULA)} - 4px)` }} />
              )
            })}
            {d.hoje && agoraMin !== null && !d.aulas.some((a) => a.agora) && agoraMin >= ini && agoraMin <= fim && (
              <span aria-hidden className="pointer-events-none absolute inset-x-0 z-[2] flex items-center" style={{ top: pos(agoraMin) }}>
                <span className="-ml-1 size-2.5 -translate-y-px rounded-full bg-azul" /><span className="h-0.5 flex-1 bg-azul" />
              </span>
            )}
            {d.aulas.length === 0 && <p className="t-apoio absolute inset-x-0 top-2 text-center">Sem aula</p>}
          </section>
        ))}
      </div>
    </div>
  )
}

function CartaoAula({ a, futura, aoAbrir, style }: { a: AulaDaSemana; futura: boolean; aoAbrir: () => void; style: CSSProperties }) {
  const f = materiaDe(a.materia)?.familia ?? 'azul'
  return (
    <button type="button" onClick={aoAbrir} style={{ ...estiloFamilia(f), ...style }}
      aria-label={`${a.nomeDia}, ${a.hora}: ${a.turma}. ${a.conteudo ?? 'Falta preencher'}${a.agora ? '. Agora' : ''}`}
      className={cn('absolute inset-x-0 z-[1] flex flex-col items-stretch gap-0.5 overflow-hidden rounded-[12px] border-2 bg-(--claro) px-2.5 py-1.5 text-left transition-[filter] duration-150 hover:brightness-[.97]',
        a.agora ? 'border-azul shadow-[0_3px_0_0_var(--color-azul-degrau)]' : 'border-(--borda)')}>
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="shrink-0 text-[15px] font-bold leading-5 text-tinta">{a.turma}</span>
        <span className="truncate text-[13px] font-bold tabular-nums leading-5 text-sutil">{a.hora}</span>
        {a.agora && <Selo familia="azul" tamanho="p" className="ml-auto">Agora</Selo>}
        {!a.agora && a.avaliacao && <Selo familia="vermelho" tamanho="p" className="ml-auto">Avaliação</Selo>}
      </span>
      {a.conteudo
        ? <span className="line-clamp-2 text-[14px] font-medium leading-[18px] text-apoio">{a.conteudo}</span>
        : futura && <Selo tamanho="p" className="self-start">Falta preencher</Selo>}
    </button>
  )
}

function DetalheAula({ a, passada }: { a: AulaDaSemana; passada: boolean }) {
  const materia = materiaDe(a.materia)
  return (
    <div className="grid min-w-0 gap-6">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        {materia && <LadrilhoIcone familia={materia.familia} tamanho={44} icone={<Icone id={materia.icone} familia={materia.familia} />} />}
        <p className="t-cartao min-w-0 flex-1 text-tinta first-letter:uppercase">{a.nomeDia}, {a.data} · {a.hora}</p>
        {a.agora && <Selo familia="azul">Agora</Selo>}
      </div>
      <section className="min-w-0">
        <h3 className="t-selo mb-2 text-sutil">{passada ? 'O que foi dado' : 'O que vou dar'}</h3>
        {a.conteudo
          ? <p className="t-corpo break-words text-tinta">{a.conteudo}</p>
          : <p className="t-corpo text-sutil">Ainda em branco</p>}
        {a.avaliacao && <Selo familia="vermelho" className="mt-3 max-w-full">Avaliação</Selo>}
      </section>
      {a.material && (
        <section className="min-w-0">
          <h3 className="t-selo mb-2 text-sutil">Material ligado</h3>
          <div className="overflow-hidden rounded-[16px] border-2 border-borda">
            <Linha para={a.material.para} chevron titulo={a.material.nome}
              inicio={<LadrilhoIcone familia="amarelo" tamanho={40} icone={<Icone id="criados" />} />} />
          </div>
        </section>
      )}
    </div>
  )
}
