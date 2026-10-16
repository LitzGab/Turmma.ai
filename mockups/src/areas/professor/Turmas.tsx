import { useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Aviso, BarraProgresso, Botao, CabecalhoPagina, EstadoVazio, LadrilhoIcone, Pagina, Selo, materiaDe,
} from '@/components/duo'
import { Icone } from '@/components/duo/icones'
import { Onca } from '@/components/duo/onca'
import { useAbrirSino } from '@/components/turmma/sino'
import { useParametro } from '@/components/turmma/tela'
import { useEscolaAtiva } from '@/dados/escola-ativa'
import { alocacoes, useAlocacoes, type AlocacaoEstado } from '@/dados/escola-estado'
import { useFila } from '@/dados/fila'
import { useEsperandoNaTurma } from './_pecas'
import { proximaAulaDe, useSemana } from '@/dados/grade'
import { useProfessorAtual } from '@/dados/sessao'
import { useTurmasDoProfessor, type TurmaProfessora } from '@/dados/turmas-professora'
import { numerosDa } from '@/dados/turmas-resumo'
import { usoTutorDa } from '@/dados/turma-atividades'
import { EscolaDaSemana, NavegarSemana, SemanaDoProfessor } from './Calendario'

/* TURMAS (/professor/turmas) — 14ª rodada (05/10/2026; plano ux-composicao 1.3, 5.1 e 5.2).

   Página do tipo Painel (até 1200, margem de 32), com o título "Turmas" e as abas TURMAS · SEMANA (?ver=semana),
   sublinhadas. As duas abas usam a MESMA Pagina: a borda esquerda e a largura não mudam ao trocar.
   · TURMAS: a faixa "Confirme sua turma" (56 px) acima da grade, enquanto houver alocação pendente: CONFIRMAR
     (oficial) e NÃO É MINHA (secundário → ?item=<id da fila>&contestar=1: a Casca abre o painel já no formulário de
     contestação; F13). Depois, a grade de cartões (3 por linha a 1440): o ladrilho da matéria, "2ºB · Química" em
     20/700, "2º ano EM · 32 alunos", a barra de acerto na cor da matéria e, no rodapé, "5 esperando" (selo amarelo,
     que abre o sino filtrado pela turma) ou EM DIA; a turma da aula de agora leva AGORA · COMEÇAR AULA.
     O cartão é um link inteiro (o título estica sobre o cartão); os botões do rodapé ficam por cima dele.
   · SEMANA: Calendario.tsx. Na linha das abas, o seletor da escola (quem dá aula em duas) e ‹ semana ›.
   · O painel do item (?item=) é desenhado pela Casca; esta tela não desenha painel de fila.
   Professor novo (o Marcos): "Nenhuma turma ainda", a 1/3 da altura, até confirmar a 3ºA. */

const ABAS = [{ id: 'turmas', rotulo: 'Turmas' }, { id: 'semana', rotulo: 'Semana' }]

export function Turmas() {
  const [ver, setVer] = useParametro('ver')
  const semana = ver === 'semana'
  return (
    <Pagina tipo="painel" rolagem={semana ? 'nenhuma' : 'corpo'}
      cabecalho={(
        /* na Semana, a escola e ‹ semana › moram juntas na ponta direita da linha das abas: terminam na borda da grade
           (a linha do título, na altura do sino, fica só com o título) */
        <CabecalhoPagina titulo="Turmas"
          abas={{ abas: ABAS, valor: semana ? 'semana' : 'turmas', aoMudar: (id) => setVer(id === 'semana' ? 'semana' : null), fim: semana ? <><EscolaDaSemana /><NavegarSemana /></> : undefined }} />
      )}>
      {semana ? <SemanaDoProfessor /> : <ListaDeTurmas />}
    </Pagina>
  )
}

function ListaDeTurmas() {
  const escola = useEscolaAtiva()
  const prof = useProfessorAtual()
  const turmas = useTurmasDoProfessor(escola.id)
  const pendentes = useAlocacoes(prof.profId).filter((a) => a.estado === 'pendente' && escola.id === 'aurora')
  const [, setParams] = useSearchParams()
  // o que acabou de acontecer nesta tela (some ao sair): a confirmação
  const [feito, setFeito] = useState<{ turma: string; turmaId: string } | null>(null)
  const itensTurma = useFila('professor').filter((i) => i.tipo === 'turma')
  const hoje = useSemana(prof.id, escola.id)[0]?.aulas ?? []

  const contestar = (a: AlocacaoEstado) => {
    const id = itensTurma.find((i) => i.ref === a.id)?.id ?? (a.id === 'v4' ? 'turma-3a' : `turma-${a.id}`)
    setParams((p) => { const n = new URLSearchParams(p); n.set('item', id); n.set('contestar', '1'); return n }, { replace: true })
  }

  if (turmas.length === 0 && pendentes.length === 0) {
    return (
      <div className="grid min-h-[360px] flex-1 grid-rows-[1fr_auto_2fr]">
        <span aria-hidden />
        <EstadoVazio ilustracao={<Onca pose="dormindo" tamanho={96} />} titulo="Nenhuma turma ainda" />
        <span aria-hidden />
      </div>
    )
  }

  return (
    <div className="grid content-start gap-4">
      {pendentes.map((a) => (
        <ConfirmeSuaTurma key={a.id} a={a} aoContestar={() => contestar(a)}
          aoConfirmar={() => { alocacoes.confirmar(a.id); setFeito({ turma: a.turma, turmaId: a.turmaId }) }} />
      ))}
      {feito && (
        <Aviso tom="certo" titulo={`Turma ${feito.turma} confirmada`}
          acao={<Botao asChild variante="secundario" tamanho="p"><Link to={`/professor/turmas/${feito.turmaId}?aba=alunos&convidar=1`}>Gerar o acesso</Link></Botao>} />
      )}
      {turmas.length > 0 && (
        <ul aria-label={`Suas turmas no ${escola.nome}`} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* com a faixa "Confirme sua turma" na tela, o cheio é o CONFIRMAR dela: COMEÇAR AULA fica de contorno (um cheio só) */}
          {turmas.map((t) => <CartaoTurma key={t.id} t={t} agora={hoje.some((x) => x.turmaId === t.id && x.agora)} aulaCheia={pendentes.length === 0} />)}
        </ul>
      )}
    </div>
  )
}

function CartaoTurma({ t, agora, aulaCheia = true }: { t: TurmaProfessora; agora: boolean; aulaCheia?: boolean }) {
  // o mesmo número do sino filtrado pela turma (o "5 esperando" do cabeçalho da turma)
  const esperando = useEsperandoNaTurma(t.id)
  const abrirSino = useAbrirSino()
  const materia = materiaDe(t.disciplina)
  const familia = materia?.familia ?? 'azul'
  const acerto = t.nova ? null : numerosDa(t.id).desempenho
  const apoio = [t.serie, t.alunos ? `${t.alunos} alunos` : 'sem lista'].join(' · ')
  const prox = proximaAulaDe(t.id)
  const semana = useSemana(useProfessorAtual().id, t.escolaId)
  const conteudo = prox ? semana.flatMap((d) => d.aulas).find((a) => a.turmaId === t.id && a.data === prox.data && a.hora === prox.hora)?.conteudo : null
  const uso = t.nova ? null : usoTutorDa(t.id)
  return (
    <li className="group relative flex min-w-0 flex-col rounded-[16px] border-2 border-borda bg-white shadow-[0_4px_0_0_var(--color-borda)] transition-colors duration-150 hover:bg-fundo-suave">
      <div className="flex min-w-0 items-start gap-3 px-5 pt-5">
        {materia && <LadrilhoIcone familia={familia} tamanho={44} icone={<Icone id={materia.icone} familia={familia} />} />}
        <div className="min-w-0 flex-1">
          <Link to={`/professor/turmas/${t.id}`} className="block truncate text-[20px] font-bold leading-[26px] text-tinta outline-none after:absolute after:inset-0 after:rounded-[14px] focus-visible:after:outline-3 focus-visible:after:outline-azul-texto"
            aria-label={`${t.nome} · ${t.disciplina}. ${apoio}${acerto !== null ? ` · acerto ${acerto}%` : ''}`}>
            {t.nome} · {t.disciplina}
          </Link>
          <p className="t-apoio mt-0.5 truncate">{apoio}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-1.5 px-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="t-selo text-sutil">Acerto da turma</span>
          <span className="text-[15px] font-bold tabular-nums text-tinta">{acerto === null ? '—' : `${acerto}%`}</span>
        </div>
        <BarraProgresso valor={acerto ?? 0} familia={familia} altura={12} rotulo={`Acerto do ${t.nome}`} />
      </div>

      <dl className="mb-4 mt-3 grid grid-cols-[minmax(0,1fr)] px-5">
        <ParCartao rotulo="Próxima aula">{prox ? `${prox.selo} · ${conteudo ?? 'falta preencher'}` : '—'}</ParCartao>
        <ParCartao rotulo="Tutor">{uso ? `${uso.usaram} de ${uso.alunos} usaram` : '—'}</ParCartao>
      </dl>

      <div className="mt-auto flex h-14 min-w-0 items-center gap-2 border-t-2 border-borda px-5 py-2.5">
        {esperando > 0 ? (
          <button type="button" onClick={() => abrirSino(t.id)} aria-label={`${esperando} esperando você no ${t.nome}: abrir a lista`}
            className="relative z-[1] -ml-1 inline-flex h-9 items-center rounded-[10px] px-1 transition-colors duration-150 hover:bg-amarelo-claro">
            <Selo familia="amarelo">{esperando} esperando</Selo>
          </button>
        ) : t.nova && !t.alunos ? <Selo>Nova</Selo> : <Selo familia="verde">Em dia</Selo>}
        {agora && (
          <Botao asChild variante={aulaCheia ? 'primario' : 'secundario'} tamanho="p" className="relative z-[1] ml-auto shrink-0">
            <Link to={`/professor/turmas/${t.id}/aula`} aria-label="Agora · Começar aula"><span className="2xl:hidden">Começar aula</span><span className="max-2xl:hidden">Agora · Começar aula</span></Link>
          </Botao>
        )}
      </div>
    </li>
  )
}

/** Uma linha de rótulo e valor no cartão: o rótulo à esquerda, o valor à direita, cortado se não couber. */
function ParCartao({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex min-h-9 min-w-0 items-center justify-between gap-3 border-t-2 border-borda first:border-t-0">
      <dt className="t-apoio shrink-0">{rotulo}</dt>
      <dd className="min-w-0 truncate text-right text-[15px] font-bold text-tinta first-letter:uppercase">{children}</dd>
    </div>
  )
}

/** "Confirme sua turma": a faixa de 56 px com a turma nova que a coordenação pôs para o professor. Confirmar abre a
    turma (D3); "Não é minha" abre o painel da casca já no formulário (o motivo e o envio à coordenação). */
function ConfirmeSuaTurma({ a, aoConfirmar, aoContestar }: { a: AlocacaoEstado; aoConfirmar: () => void; aoContestar: () => void }) {
  const materia = materiaDe(a.disciplina)
  return (
    <section aria-label="Turma para confirmar"
      className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 rounded-[16px] border-2 border-amarelo-borda bg-amarelo-claro py-1.5 pl-2 pr-2 max-sm:p-3">
      {materia && <LadrilhoIcone familia={materia.familia} tamanho={40} icone={<Icone id={materia.icone} familia={materia.familia} />} />}
      <p className="min-w-0 flex-1 truncate">
        <span className="t-cartao text-tinta">Confirme sua turma</span>
        <span className="t-apoio text-apoio"> · {a.turma} · {a.disciplina}</span>
      </p>
      <div className="flex gap-2 max-sm:w-full [&>*]:max-sm:flex-1">
        <Botao variante="secundario" tamanho="p" onClick={aoContestar}>Não é minha</Botao>
        <Botao variante="oficial" tamanho="p" onClick={aoConfirmar}>Confirmar</Botao>
      </div>
    </section>
  )
}
