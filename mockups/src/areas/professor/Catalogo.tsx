import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Cartao, EstadoVazio, LadrilhoIcone } from '@/components/duo'
import { Icone } from '@/components/duo/icones'
import { Onca } from '@/components/duo/onca'
import { notasDoLote, useLotes, type Lote } from '@/dados/avaliacoes'
import { useTurmasDoProfessor } from '@/dados/turmas-professora'

/* "QUE PROVA CORRIGIR?" (14ª rodada, 05/10/2026; plano ux-composicao 1.3). Antes era o miolo da janela "Mais"; a janela
   saiu e a página Ferramentas (professor/Ferramentas.tsx) abre isto AO LADO quando ela escolhe Correção de objetiva
   (também por `?corrigir=1`). Os lotes que esperam o professor, do mais antigo ao mais novo: a objetiva se corrige
   sozinha quando a turma entrega e as notas esperam a aprovação dele (regra 70). Escolher um leva às notas
   (/professor/aprovar/<id>?de=ferramentas, para o ‹ voltar dar em Ferramentas). Sem lote, a onça dormindo e as últimas corrigidas, que abrem o lote. */

const ordemDaData = (d: string) => { const [dia, mes] = d.split('/').map(Number); return (mes || 0) * 100 + (dia || 0) }
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

/** Um lote numa linha: o ladrilho das notas, o título e a turma com o número de provas e de destaques. */
export function LinhaLote({ l, aprovado, aoAbrir }: { l: Lote; aprovado?: boolean; aoAbrir: () => void }) {
  const n = notasDoLote(l)
  const apoio = aprovado
    ? `${l.turma} · ${plural(n, 'nota aprovada', 'notas aprovadas')}`
    : `${l.turma} · ${plural(n, 'prova', 'provas')}${l.destaques.length ? ` · ${plural(l.destaques.length, 'destaque', 'destaques')}` : ''}`
  return (
    <Cartao como="button" onClick={aoAbrir} className="flex w-full min-w-0 items-center gap-3 p-3 text-left md:p-3" aria-label={`${l.titulo}, ${apoio}`}>
      <LadrilhoIcone className="shrink-0" familia={aprovado ? 'verde' : 'amarelo'} tamanho={44} icone={<Icone id={aprovado ? 'aprovado' : 'notas'} tamanho={32} />} />
      <span className="min-w-0 flex-1">
        <span className="t-cartao block truncate text-tinta">{l.titulo}</span>
        <span className="t-apoio block truncate">{apoio}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-apagado" strokeWidth={2.5} />
    </Cartao>
  )
}

/** "Que prova corrigir?": os lotes que esperam o professor; sem lote, a onça dormindo e as últimas corrigidas. */
export function QueProvaCorrigir() {
  const navegar = useNavigate()
  const turmas = useTurmasDoProfessor()
  const lotes = useLotes()
  const minhas = turmas.map((t) => t.id)
  const meus = lotes.filter((l) => minhas.includes(l.turmaId))
  const esperando = meus.filter((l) => l.estado === 'espera' && notasDoLote(l) > 0).sort((a, b) => ordemDaData(a.data) - ordemDaData(b.data))
  const corrigidas = meus.filter((l) => l.estado === 'aprovado').sort((a, b) => ordemDaData(b.data) - ordemDaData(a.data)).slice(0, 3)
  const abrir = (l: Lote) => navegar(`/professor/aprovar/${l.id}?de=ferramentas`)
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      {esperando.length > 0 ? (
        <>
          <p className="t-corpo text-apoio">A objetiva já veio corrigida. Você revê os destaques e aprova as notas.</p>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-2.5 p-0.5 pb-1.5">
            {esperando.map((l) => <LinhaLote key={l.id} l={l} aoAbrir={() => abrir(l)} />)}
          </div>
        </>
      ) : (
        <EstadoVazio ilustracao={<Onca pose="dormindo" tamanho={96} />} titulo="Nenhuma prova para corrigir" className="py-2"
          acao={<p className="t-apoio -mt-2 max-w-[420px]">A objetiva se corrige sozinha quando a turma entrega. As notas esperam você aqui.</p>} />
      )}
      {corrigidas.length > 0 && (
        <div className="mt-2 grid grid-cols-[minmax(0,1fr)] gap-2.5">
          <p className="t-selo text-sutil">Corrigidas</p>
          {corrigidas.map((l) => <LinhaLote key={l.id} l={l} aprovado aoAbrir={() => abrir(l)} />)}
        </div>
      )}
    </div>
  )
}
