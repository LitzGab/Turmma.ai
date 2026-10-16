import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { AvisoIA, BarraConversa, BoasVindas, ConversaVazia, saudacao } from '@/components/duo'
import { AtalhosFerramenta, CaixaPedido } from '@/components/turmma/pedido'
import { useParametro } from '@/components/turmma/tela'
import { acervo } from '@/dados/conversas'
import { useEscolaAtiva } from '@/dados/escola-ativa'
import { aulaAgoraOuProxima, type AulaAgora } from '@/dados/grade'
import { useAgora } from '@/dados/demo/nucleo'
import { useProfessorAtual } from '@/dados/sessao'
import { useTurmasDoProfessor } from '@/dados/turmas-professora'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

/* INÍCIO DO PROFESSOR — 14ª rodada (05/10/2026; plano ux-composicao 1.3 e 5.1). "Toda essa área precisa ser dedicada
   para os chats, assim como é uma IA."

   Só a conversa (ConversaVazia: o grupo a 1/3 da altura livre, coluna de 768):
   · na barra de 56 px, CENTRADA na coluna (no eixo da onça, da caixa e dos atalhos), a PÍLULA DA AULA (como o seletor de modelo do ChatGPT), da grade (`aulaAgoraOuProxima`):
     "AGORA · 10H30 · 2ºB QUÍMICA · COMEÇAR AULA →" leva à aula; fora dela, "PRÓXIMA · TERÇA 7H30 · 2ºB · PREPARAR →"
     abre a conversa nova com a turma e o conteúdo. Sem grade (o Marcos), sem pílula. No celular, desce para cima da
     saudação;
   · 15ª rodada: a saudação das IAs ("Bom dia, Camila", com a onça pequena ao lado) e "O que vamos preparar hoje?";
   · a caixa (a turma da aula; foco no computador), os atalhos em pílulas e "Nada chega à turma sem você aprovar"
     (abre ?config=ia).
   "Esperando você" virou o SINO da casca (turmma/sino.tsx), e o painel de cada item a casca desenha (?item=).
   `?mais=1` (o endereço da antiga janela Mais) leva a /professor/ferramentas, com `corrigir` e `turma`. */

/** A pílula da aula, na barra de cima. */
function PilulaDaAula({ a, curta }: { a: AulaAgora; curta?: boolean }) {
  const { aula, agora } = a
  const para = agora
    ? `/professor/turmas/${aula.turmaId}/aula`
    : `/professor/conversa/nova?turma=${encodeURIComponent(aula.turmaId)}${aula.conteudo ? `&pedido=${encodeURIComponent(aula.conteudo)}` : ''}`
  const turma = curta ? aula.turma : `${aula.turma} ${aula.materia}`
  return (
    <Link to={para} aria-label={`${a.rotulo}, ${aula.turma} ${aula.materia}: ${agora ? 'começar aula' : 'preparar'}`}
      className="degrau degrau-branco group inline-flex min-w-0 max-w-full rounded-full [--altura-degrau:3px] [--face:var(--color-white)] [--lado:var(--color-borda)]">
      <span className="face flex h-9 min-w-0 items-center gap-2 rounded-full border-2 border-borda pl-3 pr-3.5 text-[13px] font-bold uppercase leading-none tracking-[.04em]">
        <span aria-hidden className={cn('size-2 shrink-0 rounded-full', agora ? 'bg-verde' : 'bg-apagado')} />
        <span className={cn('shrink-0', agora ? 'text-verde-texto' : 'text-sutil')}>{a.rotulo}</span>
        <span aria-hidden className="text-apagado">·</span>
        <span className="shrink-0 text-tinta">{turma}</span>
        <span aria-hidden className="text-apagado">·</span>
        <span className="flex shrink-0 items-center gap-1 text-azul-texto">
          {agora ? (curta ? 'Começar' : 'Começar aula') : 'Preparar'}
          <ArrowRight aria-hidden className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" strokeWidth={3} />
        </span>
      </span>
    </Link>
  )
}

export function Home() {
  const [params] = useSearchParams()
  const prof = useProfessorAtual()
  const local = useLocation()
  const turmaPedida = (local.state as { turma?: string } | null)?.turma ?? ''
  // a antiga janela "Mais" virou a aba Ferramentas
  if (params.get('mais')) {
    const p = new URLSearchParams()
    if (params.get('corrigir')) p.set('corrigir', '1')
    if (params.get('turma')) p.set('turma', params.get('turma')!)
    return <Navigate to={`/professor/ferramentas${p.size ? `?${p}` : ''}`} replace />
  }
  // Trocar de professor (?como=) ou chegar com outra turma recria a caixa: a turma escolhida não fica presa à de antes.
  return <Inicio key={`${prof.id}:${turmaPedida}`} />
}

function Inicio() {
  // Quem chega de outra tela com um pedido já escrito encontra o texto na caixa; NOVA CONVERSA limpa.
  const local = useLocation()
  const chegada = local.state as { pedido?: string; nova?: boolean; turma?: string } | null
  const [texto, setTexto] = useState(chegada?.pedido ?? '')
  const caixa = useRef<HTMLDivElement>(null)
  const celular = useIsMobile()
  useEffect(() => {
    if (chegada?.nova) { setTexto(''); return }
    if (!chegada?.pedido) return
    setTexto(chegada.pedido)
    if (celular) return
    // o cursor no FIM do pedido, para completar o tema
    const q = requestAnimationFrame(() => {
      const t = caixa.current?.querySelector('textarea')
      if (!t) return
      t.focus()
      t.setSelectionRange(t.value.length, t.value.length)
    })
    return () => cancelAnimationFrame(q)
  }, [local.key]) // eslint-disable-line react-hooks/exhaustive-deps
  const navegar = useNavigate()
  const escola = useEscolaAtiva()
  const prof = useProfessorAtual()
  const agora = useAgora() // a pílula anda com o relógio da demonstração
  const aula = aulaAgoraOuProxima(prof.id, escola.id)
  const turmas = useTurmasDoProfessor(escola.id)
  const todas = useTurmasDoProfessor() // a turma de Ferramentas pode ser de outra escola do professor
  // a turma que veio de Ferramentas manda; senão a da aula; senão a primeira
  const turmaInicial = (chegada?.turma && todas.some((t) => t.id === chegada.turma) ? chegada.turma : undefined)
    ?? aula?.aula.turmaId ?? turmas[0]?.id
  // A turma da caixa nasce com a da aula; os atalhos levam a que estiver escolhida.
  const [turmaDoPedido, setTurmaDoPedido] = useState(turmaInicial ?? '')
  const aoMudarTurma = useCallback((id: string) => setTurmaDoPedido(id), [])
  const [, setConfig] = useParametro('config')

  return (
    <ConversaVazia
      barra={!celular ? <BarraConversa inicio={aula ? <div className="flex min-w-0 flex-1 justify-center"><PilulaDaAula a={aula} /></div> : undefined} /> : undefined}
      topo={(
        <div className="grid justify-items-center gap-5">
          {celular && aula && <PilulaDaAula a={aula} curta />}
          <BoasVindas agente="assistente" titulo={`${saudacao(agora.hora)}, ${prof.primeiro}`} subtitulo="O que vamos preparar hoje?" />
        </div>
      )}
      caixa={(
        <div ref={caixa}>
        <CaixaPedido valor={texto} aoMudar={setTexto} aoMudarTurma={aoMudarTurma} turmaInicial={turmaInicial} autoFocus={!celular}
          aoEnviar={(pedido, extra) => navegar(`/professor/conversa/${acervo.criarConversa({ pedido, ferramenta: 'conversa', turmaId: extra.turmaId, anexos: extra.anexos }).id}`)} />
        </div>
      )}
      baixo={(
        <div className="grid justify-items-center gap-5">
          <AtalhosFerramenta turmaId={turmaDoPedido} />
          <AvisoIA>
            O Assistente é uma IA e pode errar · <button type="button" onClick={() => setConfig('ia')}>Nada chega à turma sem você aprovar</button>
          </AvisoIA>
        </div>
      )}
    />
  )
}
