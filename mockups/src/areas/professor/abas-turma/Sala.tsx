import { useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Info, MousePointerClick, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChipFonte } from '@/components/turmma/ia'
import { Trilho } from '@/components/turmma/painel'
import { NotaMockup } from '@/components/turmma/tela'
import { alunosDa, dificuldades, type Aluno } from '@/dados/alunos'
import { HABILIDADES, turmaDe } from '@/dados/escola'
import { cn } from '@/lib/utils'

/* A SALA DE CARTEIRAS — a sala de aula que o Gabriel pediu em 19/09/2026 e aprovou. Já foi a tela inteira de "Minhas
   turmas" e depois uma aba da turma aberta. Na OITAVA RODADA (20/09/2026, "ctrl c e ctrl v da Teachy") a turma aberta
   ganhou as nove abas da Teachy, e a sala passou a morar DENTRO da aba "Alunos", na subaba "Sala" (abas-turma/Alunos.tsx).
   Por dentro ela está igual em tudo que ele já aprovou. O que mudou foi só a moldura: a aba agora é um bloco de altura
   natural num documento que rola, então a sala deixou de esticar com `flex-1` e vive num QUADRO DE 600 px de altura
   (a partir de 1280 px de janela; abaixo disso ela empilha na altura natural e quem rola é o documento).

   A ideia continua a mesma: para o professor não importa só a média da turma, importa cada aluno. A sala tem
   exatamente uma carteira por aluno, em ordem de chamada. Em cima dela o professor troca a LENTE (notas, faltas,
   dificuldades, entregas) e filtra: a sala "acende" quem responde à pergunta. Clicar numa carteira abre a ficha.
   Contraste de propósito: a sala é um palco preto, a carteira em atenção é o laranja da pinta, a boa é branca.
   Tudo que aparece é TRABALHO do aluno (nota, entrega, acerto por habilidade, presença). Dificuldade é de conteúdo,
   nunca de atenção ou comportamento (D57, D66). Com nome, só para o professor da turma (D34).

   `?aluno=<id>` já abre a ficha de um aluno: é por onde a Visão Geral ("Detalhes" de quem precisa de atenção) e a
   tabela da aba Alunos mandam o aluno para cá. Dentro dos 600 px as fileiras dividem a altura que sobra; se não
   couberem (turma de 34, janela estreita), a área das carteiras rola por dentro do palco. */

type Lente = 'notas' | 'faltas' | 'dificuldades' | 'entregas'
type Tom = 'atencao' | 'medio' | 'alto' | 'vazio'
type Leitura = { valor: string; tom: Tom; passa: boolean; fala: string }

const LENTES: { id: Lente; nome: string; quadro: string; apoio: string; legenda: [Tom, string][] }[] = [
  { id: 'notas', nome: 'Notas', quadro: 'Notas em', apoio: 'Média das atividades que você corrigiu e aprovou neste bimestre', legenda: [['atencao', 'abaixo de 6'], ['medio', 'de 6 a 8'], ['alto', '8 ou mais']] },
  { id: 'faltas', nome: 'Faltas', quadro: 'Faltas em', apoio: 'Faltas nas suas aulas, de 16 dadas no bimestre', legenda: [['atencao', '4 ou mais'], ['medio', '2 ou 3'], ['alto', 'até 1']] },
  { id: 'dificuldades', nome: 'Dificuldades', quadro: 'Dificuldades em', apoio: 'Habilidades da BNCC com menos de 50% de acerto. Escolha uma para ver quem travou nela', legenda: [['atencao', 'abaixo de 50%'], ['medio', 'de 50 a 75%'], ['alto', '75% ou mais']] },
  { id: 'entregas', nome: 'Entregas', quadro: 'Entregas em', apoio: 'Quanto cada um concluiu do que você atribuiu', legenda: [['atencao', '3 ou menos'], ['medio', '4 de 5'], ['alto', 'tudo entregue']] },
]

const virgula = (n: number) => n.toFixed(1).replace('.', ',')
const CURTOS = Object.fromEntries(alunosDa('2b')[0].habilidades.map((h) => [h.codigo, h.curto]))

const FILTROS: Record<Lente, { id: string; nome: string }[]> = {
  notas: [{ id: 'todos', nome: 'Todos' }, { id: 'baixo', nome: 'Abaixo de 6' }, { id: 'meio', nome: 'De 6 a 8' }, { id: 'alto', nome: '8 ou mais' }, { id: 'naofez', nome: 'Deixou de fazer alguma' }],
  faltas: [{ id: 'todos', nome: 'Todos' }, { id: 'tres', nome: '3 faltas ou mais' }, { id: 'zero', nome: 'Nenhuma falta' }],
  dificuldades: [{ id: 'todos', nome: 'Todas' }, ...HABILIDADES.map((h) => ({ id: h.codigo, nome: CURTOS[h.codigo] }))],
  entregas: [{ id: 'todos', nome: 'Todos' }, { id: 'falta', nome: 'Com entrega faltando' }, { id: 'emdia', nome: 'Tudo entregue' }],
}

/** O que a carteira mostra, de que cor, e se o aluno responde ao filtro. */
function ler(a: Aluno, lente: Lente, filtro: string): Leitura {
  if (lente === 'notas') {
    const m = a.media
    if (m === null) return { valor: '—', tom: 'vazio', passa: filtro === 'todos', fala: 'sem nota ainda' }
    const tom: Tom = m < 6 ? 'atencao' : m < 8 ? 'medio' : 'alto'
    const passa = filtro === 'todos' || (filtro === 'baixo' && m < 6) || (filtro === 'meio' && m >= 6 && m < 8) || (filtro === 'alto' && m >= 8) || (filtro === 'naofez' && a.notas.some((n) => n.valor === null))
    return { valor: virgula(m), tom, passa, fala: `média ${virgula(m)}` }
  }
  if (lente === 'faltas') {
    const tom: Tom = a.faltas >= 4 ? 'atencao' : a.faltas >= 2 ? 'medio' : 'alto'
    const passa = filtro === 'todos' || (filtro === 'tres' && a.faltas >= 3) || (filtro === 'zero' && a.faltas === 0)
    return { valor: String(a.faltas), tom, passa, fala: `${a.faltas} faltas` }
  }
  if (lente === 'entregas') {
    const f = a.entregas.feitas
    const tom: Tom = f <= 3 ? 'atencao' : f === 4 ? 'medio' : 'alto'
    const passa = filtro === 'todos' || (filtro === 'falta' && f < a.entregas.total) || (filtro === 'emdia' && f === a.entregas.total)
    return { valor: `${f}/${a.entregas.total}`, tom, passa, fala: `${f} de ${a.entregas.total} entregas` }
  }
  if (a.media === null) return { valor: '—', tom: 'vazio', passa: filtro === 'todos', fala: 'sem diagnóstico ainda' }
  if (filtro !== 'todos') {
    const h = a.habilidades.find((x) => x.codigo === filtro)!
    const tom: Tom = h.acerto < 50 ? 'atencao' : h.acerto < 75 ? 'medio' : 'alto'
    return { valor: `${h.acerto}%`, tom, passa: h.acerto < 50, fala: `${h.acerto}% de acerto em ${h.curto}` }
  }
  const n = dificuldades(a).length
  return { valor: n === 0 ? '0' : `${n} hab.`, tom: n >= 2 ? 'atencao' : n === 1 ? 'medio' : 'alto', passa: true, fala: `${n} habilidades abaixo de 50%` }
}

const TOM_CARTEIRA: Record<Tom, string> = {
  atencao: 'bg-caramelo text-tinta', medio: 'bg-[#262626] text-white', alto: 'bg-white text-tinta',
  vazio: 'bg-transparent text-white/60 ring-1 ring-inset ring-white/15',
}
const TOM_ROSTO: Record<Tom, string> = { atencao: 'bg-tinta text-caramelo', medio: 'bg-[#3D3D3D] text-white', alto: 'bg-tinta text-white', vazio: 'bg-[#262626] text-white/60' }
const TOM_LEGENDA: Record<Tom, string> = { atencao: 'bg-caramelo', medio: 'bg-[#3D3D3D] ring-1 ring-inset ring-white/20', alto: 'bg-white', vazio: '' }

/** O miolo da carteira: um desenho pequeno que muda com a lente. Usa a cor do texto da carteira, forte ou fraca,
    para funcionar no tampo laranja, no cinza e no branco. */
function Miolo({ a, lente }: { a: Aluno; lente: Lente }) {
  const forte = 'bg-current', fraco = 'bg-current opacity-25'
  if (lente === 'notas') return (
    <span aria-hidden className="flex h-3.5 items-end justify-center gap-[3px]">
      {a.notas.map((n, i) => n.valor === null
        ? <span key={i} className={cn('h-[2px] w-[5px] rounded-full', fraco)} />
        : <span key={i} className={cn('w-[5px] rounded-[1.5px]', n.valor < 6 ? fraco : forte)} style={{ height: `${Math.max(3, (n.valor / 10) * 14)}px` }} />)}
    </span>
  )
  if (lente === 'faltas') return (
    <span aria-hidden className="flex h-3.5 flex-wrap content-center justify-center gap-[2px] px-1">
      {Array.from({ length: a.aulasDadas }, (_, i) => <span key={i} className={cn('size-[3px] rounded-full', i < a.faltas ? forte : fraco)} />)}
    </span>
  )
  if (lente === 'entregas') return (
    <span aria-hidden className="flex h-3.5 items-center justify-center gap-[2px]">
      {Array.from({ length: a.entregas.total }, (_, i) => <span key={i} className={cn('h-[4px] w-2.5 rounded-full', i < a.entregas.feitas ? forte : fraco)} />)}
    </span>
  )
  return (
    <span aria-hidden className="flex h-3.5 items-center justify-center gap-[2px]">
      {a.habilidades.map((h) => <span key={h.codigo} className={cn('w-2.5 rounded-full', h.acerto < 50 ? cn('h-[7px]', forte) : cn('h-[4px]', fraco))} />)}
    </span>
  )
}

/** Uma carteira: o aluno "sentado" (as iniciais, em cima) e o tampo, que muda de cor conforme a lente.
    Ela ocupa a altura da fileira: a sala enche a janela, e o espaço que sobra vira informação, não vazio.
    O nome e o valor NÃO encolhem (com `truncate` o nome encolhia e perdia a perna do p, do g e do q). Quando a
    fileira fica baixa (turma de 34 em cinco fileiras, janela estreita) a carteira vem `compacta`: rosto menor,
    sem o desenho do miolo — o nome, o valor e a cor continuam inteiros. */
function Carteira({ a, l, lente, ativo, discreto, compacta, aoClicar, style }: { a: Aluno; l: Leitura; lente: Lente; ativo: boolean; discreto: boolean; compacta: boolean; aoClicar: () => void; style: React.CSSProperties }) {
  const tom: Tom = discreto ? 'medio' : l.tom
  return (
    <button type="button" style={style} onClick={aoClicar} aria-pressed={ativo} aria-label={`${a.nome}, número ${a.numero}: ${l.fala}`}
      className={cn('group relative flex min-h-0 min-w-0 flex-col text-center outline-none transition-opacity duration-[260ms] ease-entrada', compacta ? 'pt-3' : 'pt-3.5', !l.passa && !ativo && 'opacity-[.22] hover:opacity-60')}>
      <span className={cn('absolute left-1/2 top-0 z-10 grid -translate-x-1/2 place-items-center rounded-full font-semibold ring-[3px] ring-[#0D0D0D] transition-colors duration-150', compacta ? 'size-6 text-[9.5px]' : 'size-7 text-[10.5px]', TOM_ROSTO[tom])}>{a.iniciais}</span>
      <span className={cn('relative flex min-h-0 flex-1 flex-col justify-center gap-px rounded-[14px] px-1.5 pb-1 transition-[background-color,box-shadow,transform] duration-150 group-hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-white', compacta ? 'pt-[15px]' : 'pt-[17px]', TOM_CARTEIRA[tom],
        ativo && 'ring-2 ring-white ring-offset-2 ring-offset-[#0D0D0D]')}>
        <span className="absolute left-2 top-1.5 text-[9.5px] font-medium leading-none opacity-45">{a.numero}</span>
        <span className="block shrink-0 truncate text-[12px] font-medium leading-tight">{a.primeiro}</span>
        <span className={cn('block shrink-0 text-[17px] font-semibold leading-[1.15] tracking-[-0.015em]', !compacta && 'xl:text-[19px]')}>{discreto ? '•••' : l.valor}</span>
        {!discreto && !compacta && l.tom !== 'vazio' && <span className="mt-0.5 hidden shrink-0 xl:block"><Miolo a={a} lente={lente} /></span>}
      </span>
      {/* a cadeira */}
      <span aria-hidden className="mx-auto mt-[3px] block h-[3px] w-6 shrink-0 rounded-full bg-white/10" />
    </button>
  )
}

/** A ficha do aluno: o que o professor quer saber dele, na matéria dele. */
function Ficha({ a, turma, aoFechar }: { a: Aluno; turma: string; aoFechar: () => void }) {
  const piores = dificuldades(a, 60).slice(0, 3)
  const presenca = Math.round(((a.aulasDadas - a.faltas) / a.aulasDadas) * 100)
  const resumo: [string, string, boolean][] = [
    [a.media === null ? '—' : virgula(a.media), 'média', a.media !== null && a.media < 6],
    [String(a.faltas), a.faltas === 1 ? 'falta' : 'faltas', a.faltas >= 4],
    [`${a.entregas.feitas}/${a.entregas.total}`, 'entregas', a.entregas.feitas <= 3],
  ]
  return (
    <div className="flex max-h-full animate-entra flex-col overflow-hidden rounded-[24px] border border-linha bg-superficie">
      <header className="flex shrink-0 items-center gap-3 border-b border-linha p-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-tinta text-sm font-semibold text-white">{a.iniciais}</span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-corpo text-base font-semibold leading-snug text-tinta">{a.nome}</h2>
          <p className="text-[13px] text-sutil">nº {a.numero} da chamada · {turma}</p>
        </div>
        <button type="button" onClick={aoFechar} aria-label="Fechar a ficha" className="grid size-9 shrink-0 place-items-center rounded-full text-sutil transition-colors duration-150 hover:bg-realce-suave hover:text-tinta"><X className="size-[18px]" /></button>
      </header>

      <dl className="grid shrink-0 grid-cols-3 gap-px border-b border-linha bg-linha">
        {resumo.map(([v, r, alerta]) => (
          <div key={r} className="bg-superficie px-4 py-3">
            <dd className={cn('text-[22px] font-semibold leading-none tracking-[-0.02em]', alerta ? 'text-caramelo-texto' : 'text-tinta')}>{v}</dd>
            <dt className="mt-1.5 text-[12.5px] text-sutil">{r}</dt>
          </div>
        ))}
      </dl>

      <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-4">
        <section>
          <h3 className="rotulo mb-2">Principais dificuldades</h3>
          {a.media === null ? <p className="text-[13.5px] leading-snug text-sutil">Aparecem depois que você aprovar a primeira correção desta turma.</p>
            : piores.length === 0 ? <p className="text-[13.5px] leading-snug text-sutil">Nenhuma habilidade abaixo de 60% de acerto.</p> : (
              <ul className="grid gap-3">
                {piores.map((h) => (
                  <li key={h.codigo} className="grid gap-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="min-w-0 text-sm font-medium leading-snug text-tinta">{h.nome} <ChipFonte pagina={h.pagina} /></p>
                      <p className="shrink-0 text-sm font-semibold text-tinta">{h.acerto}%</p>
                    </div>
                    <Trilho valor={h.acerto} tom={h.acerto < 50 ? 'caramelo' : 'tinta'} marca={50} />
                    <p className="text-[12px] leading-none text-inativo">{h.codigo}</p>
                  </li>
                ))}
              </ul>
            )}
        </section>

        <section>
          <h3 className="rotulo mb-2">Notas nas suas atividades</h3>
          <ul className="divide-y divide-linha">
            {a.notas.map((n) => (
              <li key={n.atividade} className="flex items-center gap-3 py-2">
                <span className="w-10 shrink-0 text-xs text-inativo">{n.data}</span>
                <span className="min-w-0 flex-1 truncate text-[13.5px] text-apoio">{n.atividade}</span>
                {n.valor === null
                  ? <span className="rounded-full bg-pendente-cx px-2 py-0.5 text-[11.5px] font-medium text-pendente">{a.media === null ? 'sem correção' : 'não fez'}</span>
                  : <span className={cn('text-sm font-semibold', n.valor < 6 ? 'text-caramelo-texto' : 'text-tinta')}>{virgula(n.valor)}</span>}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="rotulo mb-2">Presença</h3>
          <p className="text-[13.5px] leading-snug text-apoio"><b className="font-semibold text-tinta">{presenca}%</b> de presença: {a.faltas === 0 ? 'nenhuma falta' : `${a.faltas} ${a.faltas === 1 ? 'falta' : 'faltas'}`} em {a.aulasDadas} aulas.</p>
          {a.datasFaltas.length > 0 && <p className="mt-2 flex flex-wrap gap-1">{a.datasFaltas.map((d) => <span key={d} className="rounded-full bg-realce-suave px-2 py-0.5 text-xs text-apoio">{d}</span>)}</p>}
          {a.faltas >= 4 && <p className="mt-2 rounded-linha bg-pendente-cx px-2.5 py-1.5 text-[12.5px] leading-snug text-pendente">Perto do limite: a escola exige 75% de presença.</p>}
        </section>

        <div className="flex flex-wrap gap-2">
          <Button variant="oficial" size="sm" asChild><Link to="/professor/ferramentas/atividade">Pedir atividade de reforço <ArrowRight /></Link></Button>
          <Button variant="secundario" size="sm" asChild><Link to="/professor/time/tutor">Sinais do Tutor</Link></Button>
        </div>
      </div>

      <p className="flex shrink-0 items-start gap-2 border-t border-linha bg-lateral px-4 py-2.5 text-[12.5px] leading-snug text-sutil">
        <Info className="mt-px size-3.5 shrink-0" />
        Só o trabalho do aluno: nota, entrega, acerto e presença. Com nome, só você vê; e ele pode contestar o que o sistema sabe dele.
      </p>
    </div>
  )
}

/** Sem aluno escolhido: perguntas prontas, na língua do professor. Cada uma acende a sala. */
function Perguntas({ alunos, aoPerguntar }: { alunos: Aluno[]; aoPerguntar: (l: Lente, f: string) => void }) {
  const perguntas: { texto: string; lente: Lente; filtro: string }[] = [
    { texto: 'Quem está abaixo de 6?', lente: 'notas', filtro: 'baixo' },
    { texto: 'Quem travou em reagente limitante?', lente: 'dificuldades', filtro: 'EM13CNT301' },
    { texto: 'Quem tem 3 faltas ou mais?', lente: 'faltas', filtro: 'tres' },
    { texto: 'Quem está com entrega faltando?', lente: 'entregas', filtro: 'falta' },
  ]
  return (
    <div className="overflow-hidden rounded-[24px] border border-linha bg-superficie">
      <div className="flex items-start gap-3 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-realce-suave text-tinta"><MousePointerClick className="size-5" strokeWidth={1.75} /></span>
        <div>
          <h2 className="font-corpo text-[15px] font-semibold leading-snug text-tinta">Clique numa carteira</h2>
          <p className="mt-0.5 text-[13.5px] leading-snug text-sutil">Abre a ficha do aluno: notas, faltas, entregas e as principais dificuldades dele na sua matéria.</p>
        </div>
      </div>
      <p className="rotulo border-t border-linha px-4 pb-1.5 pt-3.5">Ou pergunte à sala</p>
      <ul className="grid gap-0.5 p-1.5 pt-0">
        {perguntas.map((p) => {
          const n = alunos.filter((a) => { const l = ler(a, p.lente, p.filtro); return l.passa && l.tom !== 'vazio' }).length
          return (
            <li key={p.texto}>
              <button type="button" onClick={() => aoPerguntar(p.lente, p.filtro)} className="group flex w-full items-center gap-3 rounded-controle px-2.5 py-2.5 text-left transition-colors duration-150 hover:bg-realce-suave">
                <span className="min-w-0 flex-1 text-sm font-medium text-tinta">{p.texto}</span>
                <span className={cn('grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-semibold', n ? 'bg-pendente-cx text-pendente' : 'bg-realce-suave text-sutil')}>{n}</span>
                <ArrowRight className="size-4 shrink-0 text-inativo transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-tinta" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function SalaTurma({ turmaId }: { turmaId: string }) {
  const [params] = useSearchParams()
  const [lente, setLente] = useState<Lente>('notas')
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')
  const [discreto, setDiscreto] = useState(false)
  const [escolhido, setEscolhido] = useState<string | null>(() => { const id = params.get('aluno'); return id && alunosDa(turmaId).some((a) => a.id === id) ? id : null })
  const [colunas, setColunas] = useState(8)
  const [alturaArea, setAlturaArea] = useState(0)
  const area = useRef<HTMLDivElement | null>(null)
  const palco = useRef<HTMLDivElement | null>(null)
  const ficha = useRef<HTMLDivElement | null>(null)

  const turma = turmaDe(turmaId)
  const alunos = useMemo(() => alunosDa(turmaId), [turmaId])
  const L = LENTES.find((x) => x.id === lente)!
  const semDiagnostico = alunos.every((a) => a.media === null)

  // Quantas carteiras por fileira cabem: 8, 6 ou 4, conforme a largura real do palco (a ficha ao lado muda isso).
  // E quanto de altura a área das carteiras tem: só vale a partir de 1280 px, quando a sala enche a janela.
  useEffect(() => {
    const el = palco.current, caixa = area.current
    if (!el || !caixa) return
    const medir = () => {
      setColunas(el.clientWidth >= 640 ? 8 : el.clientWidth >= 430 ? 6 : 4)
      setAlturaArea(window.innerWidth >= 1280 ? caixa.clientHeight : 0)
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    ro.observe(caixa)
    return () => ro.disconnect()
  }, [])

  const q = busca.trim().toLowerCase()
  const leituras = alunos.map((a) => { const l = ler(a, lente, filtro); return { a, l: { ...l, passa: l.passa && (!q || a.nome.toLowerCase().includes(q)) } } })
  const acesos = leituras.filter((x) => x.l.passa && x.l.tom !== 'vazio').length
  const aluno = alunos.find((a) => a.id === escolhido) ?? null
  const filtrando = filtro !== 'todos' || q !== ''

  const trocarLente = (l: Lente, f = 'todos') => { setLente(l); setFiltro(f) }
  const escolher = (id: string) => {
    setEscolhido((atual) => (atual === id ? null : id))
    if (window.innerWidth < 1280) window.setTimeout(() => ficha.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60)
  }

  // corredores: a cada duas carteiras, um vão — como fileiras de dupla
  const fileiras = Math.ceil(alunos.length / colunas)
  // a carteira inteira (rosto, nome, valor e miolo) pede 96 px de fileira; abaixo disso ela vem compacta (72 px)
  const compacta = alturaArea > 0 && (alturaArea - (fileiras - 1) * 8) / fileiras < 96
  // turma de 34 em cinco fileiras: no quadro de 600 px a quinta ficava escondida atrás da rolagem. Então, só nesse caso
  // e só no quadro (a partir de 1280 px), saem a faixa "sua mesa" e a frase do pé, e as cinco fileiras cabem sem rolar.
  const apertada = fileiras >= 5
  // turma sem correção aprovada: nas lentes de nota o aviso entra no quadro, no lugar do apoio e da legenda
  const semNota = semDiagnostico && (lente === 'notas' || lente === 'dificuldades')
  const trilhos = Array.from({ length: colunas }, (_, c) => (c > 0 && c % 2 === 0 ? '14px minmax(0,1fr)' : 'minmax(0,1fr)')).join(' ')

  return (
    <div className="xl:h-[600px]">
      <div className="grid items-start gap-4 xl:h-full xl:min-h-0 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        {/* O PALCO: a sala. A partir de 1280 px ela enche o quadro de 600 px e as fileiras dividem o que sobra. */}
        <section aria-label={`Sala do ${turma.nome}`} className="relative flex min-h-0 flex-col overflow-hidden rounded-[24px] bg-[#0D0D0D] p-4 text-white xl:h-full"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.07) 1px, transparent 1.2px)', backgroundSize: '18px 18px' }}>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
            <div role="group" aria-label="O que ver na sala" className="flex max-w-full gap-0.5 overflow-x-auto rounded-full bg-white/10 p-1">
              {LENTES.map((x) => (
                <button key={x.id} type="button" aria-pressed={lente === x.id} onClick={() => trocarLente(x.id)}
                  className={cn('h-9 shrink-0 rounded-full px-3.5 text-[13.5px] font-medium transition-colors duration-150 sm:h-7', lente === x.id ? 'bg-white text-tinta' : 'text-white/65 hover:text-white')}>{x.nome}</button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45" />
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar aluno" aria-label="Buscar aluno pelo nome"
                  className="h-9 w-40 rounded-full border-0 bg-white/10 pl-9 pr-3 text-[13.5px] text-white outline-none placeholder:text-white/45 focus-visible:ring-2 focus-visible:ring-white/60" />
              </label>
              <button type="button" onClick={() => setDiscreto((v) => !v)} aria-pressed={discreto} title="Esconder números e cores, para quando a tela está projetada"
                className={cn('inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors duration-150', discreto ? 'bg-white text-tinta' : 'bg-white/10 text-white/65 hover:text-white')}>
                {discreto ? <EyeOff className="size-4" /> : <Eye className="size-4" />} <span className="hidden sm:inline">{discreto ? 'Escondido' : 'Esconder'}</span>
              </button>
            </div>
          </div>

          {/* O quadro: o que está sendo mostrado, quantos acenderam, a legenda e os filtros — tudo num bloco só */}
          <div className="mt-3 shrink-0 rounded-[16px] bg-[#1A1A1A] px-4 py-3 ring-1 ring-inset ring-white/10">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1.5">
              <div className="min-w-0 flex-1 basis-64">
                <p className="text-[18px] font-semibold leading-tight tracking-[-0.015em]">
                  {filtrando && !semDiagnostico ? <><span className="text-caramelo">{acesos}</span> de {alunos.length} alunos</> : <>{L.quadro} {turma.disciplina} · {turma.nome}</>}
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-white/55">
                  {semNota ? <>Nenhuma atividade corrigida no {turma.nome} ainda. Notas e dificuldades aparecem depois que você aprovar a primeira correção. Faltas e entregas já estão aqui.</>
                    : filtrando && !semDiagnostico ? <>{FILTROS[lente].find((f) => f.id === filtro)?.nome ?? 'Todos'}{q && ` · nome com “${busca.trim()}”`} · {L.nome.toLowerCase()}</> : <>{alunos.length} alunos na chamada. {L.apoio}.</>}
                </p>
              </div>
              {!semNota && (
                <ul className="flex shrink-0 flex-wrap gap-x-3.5 gap-y-1 pb-0.5 text-[12px] text-white/60">
                  {L.legenda.map(([t, nome]) => <li key={nome} className="inline-flex items-center gap-1.5"><span className={cn('size-2.5 rounded-[4px]', TOM_LEGENDA[t])} />{nome}</li>)}
                </ul>
              )}
            </div>
            <div role="group" aria-label="Filtrar a sala" className="-mx-1 mt-2.5 flex gap-1.5 overflow-x-auto px-1">
              {FILTROS[lente].map((f) => (
                <button key={f.id} type="button" aria-pressed={filtro === f.id} onClick={() => setFiltro(f.id)}
                  className={cn('h-9 shrink-0 rounded-full px-3 text-[13px] transition-colors duration-150 sm:h-7', filtro === f.id ? 'bg-caramelo font-medium text-tinta' : 'text-white/70 ring-1 ring-inset ring-white/15 hover:bg-white/10 hover:text-white')}>{f.nome}</button>
              ))}
            </div>
          </div>

          <p aria-hidden className={cn('mx-auto mt-3 grid h-6 w-28 shrink-0 place-items-center rounded-[9px] bg-white/[.07] text-[11px] text-white/45 ring-1 ring-inset ring-white/10', apertada && 'xl:hidden')}>sua mesa</p>

          {/* Se as fileiras não couberem (janela baixa ou estreita), a área rola POR DENTRO em vez de passar por cima do rodapé.
              A folga de 4 px dos lados é para o anel da carteira escolhida não ser cortado. */}
          <div ref={area} className="-mx-1 mt-3 min-h-0 px-1 [scrollbar-color:rgba(255,255,255,.25)_transparent] [scrollbar-width:thin] xl:flex xl:flex-1 xl:flex-col xl:overflow-y-auto">
            <div ref={palco} className={cn('grid gap-x-1.5 gap-y-2 xl:flex-[1_0_auto]', apertada && 'xl:gap-y-1')} style={{ gridTemplateColumns: trilhos, gridTemplateRows: `repeat(${fileiras}, minmax(${compacta ? 72 : 76}px, 1fr))` }}>
              {leituras.map(({ a, l }, i) => {
                const c = i % colunas
                return <Carteira key={a.id} a={a} l={l} lente={lente} ativo={a.id === escolhido} discreto={discreto} compacta={compacta} aoClicar={() => escolher(a.id)} style={{ gridColumn: c + Math.floor(c / 2) + 1 }} />
              })}
            </div>
          </div>
          <p className={cn('mt-2.5 shrink-0 text-center text-[12px] text-white/40', apertada && 'xl:hidden')}>Em ordem de chamada, não de lugar nem de nota. Uma carteira para cada um dos {alunos.length} alunos do {turma.nome}.</p>
        </section>

        <div ref={ficha} className="min-h-0 xl:h-full">
          {aluno ? <Ficha key={aluno.id} a={aluno} turma={`${turma.nome} · ${turma.disciplina}`} aoFechar={() => setEscolhido(null)} /> : <Perguntas alunos={alunos} aoPerguntar={trocarLente} />}
        </div>
      </div>
      <NotaMockup>
        A sala substitui o painel de médias: uma carteira por aluno da turma, em ordem de chamada, com lente (notas, faltas, dificuldades, entregas) e filtro. D34: aluno com nome só para o professor da turma.
        D57 e D66: dificuldade é de conteúdo (habilidade da BNCC), nunca de atenção ou comportamento. D46: a NOTA oficial entra no F17, lançada pelo professor; na fatia do MVP (A3) a lente mostra acerto.
        FALTAS não existe em nenhuma fase do roadmap nem no mapa de dados do docs/lgpd.md: precisa de decisão (chamada feita aqui ou importada do sistema de gestão da escola) antes de virar requisito.
        Perfil acadêmico individual é alto risco no CNE: esta tela entra com AIA (D60), explicação em linguagem comum e caminho de contestação. "Esconder" tira números e cores para quando a tela estiver projetada.
      </NotaMockup>
    </div>
  )
}
