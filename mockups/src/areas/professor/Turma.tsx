import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Check, ChevronDown } from 'lucide-react'
import { Botao, CabecalhoPagina, Dialogo, EstadoVazio, MenuMais, Pagina, Selo } from '@/components/duo'
import { Onca } from '@/components/duo/onca'
import { useAbrirSino } from '@/components/turmma/sino'
import { definirEscolaAtiva } from '@/dados/escola-ativa'
import { useEsperandoNaTurma } from './_pecas'
import { useTurmasDoProfessor, type TurmaProfessora } from '@/dados/turmas-professora'
import { AlunosTurma } from './abas-turma/Alunos'
import { AtividadesTurma } from './abas-turma/Atividades'
import { HojeTurma } from './abas-turma/Hoje'
import { ajustesTurma, useAjustesTurma, type AjustesTurma as Ajustes } from './abas-turma/UsoTutor'

/* A TURMA ABERTA (/professor/turmas/:turma) — 14ª rodada (05/10/2026; plano ux-composicao 1.3, 5.1 e 5.2).
   Página do tipo Painel (até 1200), com o cabeçalho único (CabecalhoPagina):
   · ‹ Turmas (fora da coluna) · o título "2ºB · Química ▾", que é o menu de trocar de turma mantendo a aba · o
     complemento "2º ano EM · Manhã · 32 alunos" · à direita, "5 esperando" (abre o sino já filtrado na turma; F32
     passo 6) e o ⋯ com os Ajustes da turma, a PORTA ÚNICA deles: Busca do Tutor nesta turma (a 2ª chave; a 1ª é da
     escola, e nunca vale em avaliação; D68) · Preparar a semana toda segunda · Silenciar o Tutor hoje (com
     confirmação). O dado mora em abas-turma/UsoTutor (`useAjustesTurma`), que a aba Hoje e o lado do aluno leem.
   · As abas HOJE · ATIVIDADES · ALUNOS (R3), presas a ?aba=; NOVA ATIVIDADE fica na ponta direita da linha das abas,
     só em Atividades. Os endereços antigos viram os novos com replace: visao → hoje; recursos e mural → atividades;
     notas → alunos com ver=notas; frequencia e ranking → alunos; sala → Começar aula; uso e tutor → hoje com o painel
     do Tutor (ver=tutor).
   · O painel do item (?item=) é desenhado pela Casca, por cima desta tela.
   · Abre só as turmas do professor da SESSÃO (as de sempre e as que ele confirmou, como a 3ºA); outra turma mostra
     "Esta turma não é sua." Abrir uma turma de outra escola troca a escola ativa (regra 10). */

const ABAS = [{ id: 'hoje', rotulo: 'Hoje' }, { id: 'atividades', rotulo: 'Atividades' }, { id: 'alunos', rotulo: 'Alunos' }]

const ANTIGAS: Record<string, Record<string, string>> = {
  visao: { aba: 'hoje' },
  recursos: { aba: 'atividades' }, mural: { aba: 'atividades' },
  notas: { aba: 'alunos', ver: 'notas' },
  frequencia: { aba: 'alunos' }, ranking: { aba: 'alunos' },
  uso: { aba: 'hoje', ver: 'tutor' }, tutor: { aba: 'hoje', ver: 'tutor' },
}

export function Turma() {
  const { turma: id = '' } = useParams()
  const [params] = useSearchParams()
  const minhas = useTurmasDoProfessor()
  const t = minhas.find((x) => x.id === id)

  // abrir uma turma de outra escola troca a escola ativa (o seletor do alto da lateral acompanha)
  useEffect(() => { if (t) definirEscolaAtiva(t.escolaId) }, [t])

  // endereço antigo: troca os parâmetros e volta com replace (o "voltar" do navegador não passa por ele)
  const pedida = params.get('aba')
  if (pedida === 'sala' || pedida === 'carteiras') return <Navigate to={`/professor/turmas/${id}/aula`} replace />
  if (pedida && ANTIGAS[pedida]) {
    const p = new URLSearchParams(params)
    p.delete('aba')
    for (const [k, v] of Object.entries(ANTIGAS[pedida])) { if (k === 'aba' && v === 'hoje') continue; p.set(k, v) }
    const q = p.toString()
    return <Navigate to={`/professor/turmas/${id}${q ? `?${q}` : ''}`} replace />
  }

  if (!t) {
    return (
      <Pagina tipo="painel" cabecalho={<CabecalhoPagina titulo="Turma" voltar={{ para: '/professor/turmas', rotulo: 'Turmas' }} />}>
        <div className="grid min-h-[320px] flex-1 grid-rows-[1fr_auto_2fr]">
          <span aria-hidden />
          <EstadoVazio ilustracao={<Onca pose="pensando" tamanho={96} />} titulo="Esta turma não é sua."
            acao={<Botao asChild variante="secundario" tamanho="m"><Link to="/professor/turmas">Ver suas turmas</Link></Botao>} />
          <span aria-hidden />
        </div>
      </Pagina>
    )
  }
  return <TurmaAberta key={t.id} t={t} />
}

function TurmaAberta({ t }: { t: TurmaProfessora }) {
  const [params, setParams] = useSearchParams()
  const aba = ABAS.some((a) => a.id === params.get('aba')) ? params.get('aba')! : 'hoje'
  const esperando = useEsperandoNaTurma(t.id)
  const abrirSino = useAbrirSino()

  // o painel de uma atividade (?atividade=) é da aba Atividades: em outra aba, sai da URL
  useEffect(() => {
    if (aba !== 'atividades' && params.has('atividade')) setParams((p) => { const n = new URLSearchParams(p); n.delete('atividade'); return n }, { replace: true })
  }, [aba, params, setParams])

  const mudarAba = (id: string) => setParams((p) => {
    const n = new URLSearchParams()
    if (id !== 'hoje') n.set('aba', id)
    // o que é da sessão (quem está vendo, o tema) segue; o que é da aba fica para trás
    for (const k of ['como', 'tema']) { const v = p.get(k); if (v) n.set(k, v) }
    return n
  })

  const complemento = [t.serie, t.turno, t.alunos ? `${t.alunos} alunos` : null].filter(Boolean).join(' · ')

  return (
    <Pagina tipo="painel" rolagem={aba === 'hoje' ? 'corpo' : 'nenhuma'}
      cabecalho={(
        <CabecalhoPagina voltar={{ para: '/professor/turmas', rotulo: 'Turmas' }} titulo={<TrocarTurma t={t} aba={aba} />}
          complemento={<><span className="sm:hidden">{t.disciplina}</span><span className="max-sm:hidden">{complemento}</span></>}
          acoes={(
            <>
              {esperando > 0 && (
                <button type="button" onClick={() => abrirSino(t.id)} aria-label={`${esperando} esperando você no ${t.nome}: abrir a lista`}
                  className="inline-flex h-11 items-center rounded-[12px] px-1.5 outline-none transition-colors duration-150 hover:bg-amarelo-claro focus-visible:bg-amarelo-claro">
                  <Selo familia="amarelo">{esperando}<span className="max-sm:hidden">&nbsp;esperando</span></Selo>
                </button>
              )}
              <AjustesTurma t={t} />
            </>
          )}
          abas={{
            abas: ABAS, valor: aba, aoMudar: mudarAba,
            fim: aba === 'atividades' ? (
              <Botao asChild variante="primario" tamanho="p">
                <Link to={`/professor/conversa/nova?ferramenta=atividade&turma=${t.id}`}>Nova atividade</Link>
              </Botao>
            ) : undefined,
          }} />
      )}>
      {aba === 'hoje' && <HojeTurma turmaId={t.id} />}
      {aba === 'atividades' && <AtividadesTurma turmaId={t.id} />}
      {aba === 'alunos' && <AlunosTurma turmaId={t.id} />}
    </Pagina>
  )
}

/** "2ºB · Química ▾": o nome da turma é o menu de trocar de turma, mantendo a aba. Só as turmas da mesma escola. */
function TrocarTurma({ t, aba }: { t: TurmaProfessora; aba: string }) {
  const navegar = useNavigate()
  const turmas = useTurmasDoProfessor(t.escolaId)
  const gatilho = (
    <button type="button" aria-label={`${t.nome} · ${t.disciplina}. Trocar de turma`}
      className="-ml-2 inline-flex h-11 max-w-full shrink-0 items-center gap-1.5 rounded-[12px] px-2 text-tinta outline-none transition-colors duration-150 hover:bg-fundo-suave focus-visible:bg-fundo-suave data-[state=open]:bg-fundo-suave">
      <span className="whitespace-nowrap">{t.nome}<span className="max-sm:hidden"> · {t.disciplina}</span></span>
      <ChevronDown aria-hidden className="size-5 shrink-0 text-sutil" strokeWidth={2.5} />
    </button>
  )
  return (
    <MenuMais alinhar="start" gatilho={gatilho}
      itens={turmas.map((x) => ({
        rotulo: `${x.nome} · ${x.disciplina}`,
        icone: x.id === t.id ? <Check strokeWidth={3} /> : <span className="size-[18px]" />,
        aoEscolher: () => { if (x.id !== t.id) navegar(`/professor/turmas/${x.id}${aba === 'hoje' ? '' : `?aba=${aba}`}`) },
      }))} />
  )
}

/** O ⋯ com os Ajustes da turma: cada item liga e desliga, com o visto quando está ligado. Silenciar pede confirmação
    e diz o efeito numa frase (o aluno vê o Tutor descansando até amanhã; a aba Hoje mostra o selo). */
function AjustesTurma({ t }: { t: TurmaProfessora }) {
  const a = useAjustesTurma(t.id)
  const [confirmar, setConfirmar] = useState(false)
  const trocar = (k: keyof Ajustes) => ajustesTurma.mudar(t.id, k, !a[k])
  const marca = (ligado: boolean) => (ligado ? <Check strokeWidth={3} className="!text-verde-texto" /> : <span className="size-[18px] rounded-[5px] border-2 border-borda" />)
  return (
    <>
      <MenuMais rotulo={`Ajustes do ${t.nome}`} itens={[
        { rotulo: 'Busca do Tutor nesta turma', icone: marca(a.busca), aoEscolher: () => trocar('busca') },
        { rotulo: 'Preparar a semana toda segunda', icone: marca(a.semana), aoEscolher: () => trocar('semana') },
        { rotulo: a.silencio ? 'Tutor silenciado hoje' : 'Silenciar o Tutor hoje', icone: marca(a.silencio),
          aoEscolher: () => { if (a.silencio) trocar('silencio'); else setConfirmar(true) } },
      ]} />
      <Dialogo aberto={confirmar} aoMudar={setConfirmar} titulo={`Silenciar o Tutor do ${t.nome} hoje?`} largura={440}
        rodape={(
          <div className="flex w-full justify-end gap-3">
            <Botao variante="secundario" tamanho="m" onClick={() => setConfirmar(false)}>Voltar</Botao>
            <Botao variante="oficial" tamanho="m" onClick={() => { ajustesTurma.mudar(t.id, 'silencio', true); setConfirmar(false) }}>Silenciar hoje</Botao>
          </div>
        )}>
        <p className="t-corpo text-apoio">Os alunos do {t.nome} veem o Tutor descansando até amanhã. Avisar um adulto continua funcionando.</p>
      </Dialogo>
    </>
  )
}
