import { useMemo, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Ban, Bell, Check, Lock, ShieldAlert } from 'lucide-react'
import {
  ChatDados, Contador, Introducao, LadrilhoIcone, Opcao, Selo, TIPO_FILA, type Familia, type RespostaDados, type RoteiroDados,
} from '@/components/duo'
import { useItensDoSino } from '@/components/turmma/sino'
import { Icone, type IconeId } from '@/components/duo/icones'
import { ROTEIRO } from '@/dados/estrutura'
import { useProfessoresDaEscola, useTurmasDaEscola } from '@/dados/escola-estado'
import { COORDENADORA } from '@/dados/escola'
import { FAIXAS, painelDa } from '@/dados/gestao'
import { ESCOLA, PERIODO } from '@/dados/numeros-escola'
import { preferencias } from '@/dados/preferencias'
import { sessao, useIntroducaoVista } from '@/dados/sessao'
import { cn } from '@/lib/utils'

/* A INTRODUÇÃO DA COORDENAÇÃO (/coordenacao/bem-vindo; plano de painéis e introdução, seção 2.5; fluxo F19).
   A pessoa chega aqui depois do convite e do segundo fator da primeira vez (o gatilho mora na entrada). Cinco telas:
   1. o papel, que veio do convite (D2);
   2. o que é sensível espera no SINO (14ª rodada: o sino com o número de verdade e a prévia da lista) e como quer
      saber dele: configura `preferencias.coordenacao` (o mesmo de Minha conta › Notificações). Risco à vida chega
      sempre, na hora (D78);
   3. o Analista, numa pergunta pronta (quantos abaixo de 75%, de dados/gestao.ts: contagem, nunca média) e "De onde veio" (D34; D64);
   4. os limites: ninguém ranqueia professor, e a IA nunca decide sobre aluno (D45; D64; regra 70);
   5. o fim: a trilha dos 7 passos da escola, com a mesma conta de `useMontagem` (coordenacao/Estrutura.tsx).
   · já vista, e sem ?rever=1 nem ?como= → o Painel; o X → o Painel. O fim leva à Escola (montar) ou ao Painel. */

/* ── Tela 1: o papel ──────────────────────────────────────────────────────────────────────────────────── */

function ItemLadrilho({ id, familia, children }: { id: IconeId; familia: Familia; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <LadrilhoIcone familia={familia} tamanho={56} icone={<Icone id={id} familia={familia} />} />
      <span className="t-cartao min-w-0 flex-1 text-tinta">{children}</span>
    </li>
  )
}

/* ── Tela 2: o sino e a prévia da lista (só leitura) ─────────────────────────────────────────────────────── */

/* 14ª rodada: "Esperando você" virou o SINO no canto de cima, com o número. A prévia mostra o sino com o número de
   verdade (useItensDoSino, o mesmo da casca) e as três primeiras linhas da lista, como ela abre. */
function PreviaSino() {
  const itens = useItensDoSino('coordenacao')
  const n = itens.length
  return (
    <div aria-label={`O sino: ${n} esperando você (prévia)`} role="group"
      className="overflow-hidden rounded-[16px] border-2 border-borda bg-white shadow-[0_4px_0_0_var(--color-borda)]">
      <div className="flex h-14 items-center gap-3 border-b-2 border-borda px-3">
        <span aria-hidden className="relative grid size-10 shrink-0 place-items-center rounded-full bg-fundo-suave text-tinta">
          <Bell className="size-[22px]" strokeWidth={2.5} />
          {n > 0 && <Contador n={n} tamanho="p" className="absolute -right-2 -top-1.5" />}
        </span>
        <span className="t-cartao min-w-0 flex-1 text-tinta">Esperando você</span>
        <span className="t-apoio shrink-0">no canto de cima</span>
      </div>
      {n === 0
        ? <p className="t-corpo px-3 py-4 text-apoio">Tudo em dia.</p>
        : (
          <ul>
            {itens.slice(0, 3).map((i) => {
              const t = TIPO_FILA[i.tipo]
              return (
                <li key={i.id} className="flex h-14 items-center gap-3 border-t-2 border-borda px-3 first:border-t-0">
                  <LadrilhoIcone familia={t.familia} tamanho={32} icone={<Icone id={t.icone} tamanho={24} familia={t.familia} />} />
                  <span className="t-cartao min-w-0 flex-1 truncate text-tinta">{i.curto ?? i.titulo}</span>
                  {i.prazo
                    ? <Selo familia="vermelho" tamanho="p">{i.prazo}</Selo>
                    : i.urgente ? <Selo familia="vermelho" tamanho="p">Urgente</Selo> : null}
                </li>
              )
            })}
          </ul>
        )}
    </div>
  )
}

/* ── Tela 3: o mini Analista ─────────────────────────────────────────────────────────────────────────── */

/* A pergunta da introdução é a do Painel novo: quantos alunos passaram do limiar, nunca a média (06/10/2026). */
const FREQ = painelDa('escola').frequencia
const nFaixa = (id: string) => FREQ.faixas.find((f) => f.id === id)?.alunos ?? 0

const PERGUNTA_FREQUENCIA = 'Quantos alunos estão abaixo de 75% de frequência?'

const ROTEIRO_ANALISTA: RoteiroDados = {
  abertura: '',
  placeholder: 'Pergunte sobre a escola',
  selo: { rotulo: 'Nome só com motivo', titulo: 'Dado com nome só com motivo, e fica registrado.' },
  sugestoes: [{ rotulo: PERGUNTA_FREQUENCIA, pergunta: PERGUNTA_FREQUENCIA }],
  responder: (): RespostaDados => ({
    id: 'intro-frequencia',
    frase: <><b>{nFaixa('reprova')} alunos</b> estão abaixo de 75%: reprovariam por falta se o ano fechasse hoje. Outros {nFaixa('cronica')} estão em falta crônica.</>,
    visual: {
      tipo: 'barras', max: painelDa('escola').totalDeAlunos, familia: 'anil',
      itens: FAIXAS.map((f) => ({ rotulo: f.rotulo, valor: nFaixa(f.id), texto: `${nFaixa(f.id)} alunos` })),
    },
    fonte: `Diário oficial (Professor Online) lido hoje às 7h · ${ESCOLA.nome}, ${PERIODO.curto}`,
  }),
}

/* ── Tela 4: os limites ──────────────────────────────────────────────────────────────────────────────── */

const NUNCA = ['Ranquear professor', 'Dar nota sem o professor', 'Decidir sobre um aluno']

function CartaoNunca({ children }: { children: ReactNode }) {
  return (
    <li className="flex min-h-16 items-center gap-3 rounded-[12px] border-2 border-borda bg-white px-3 py-2">
      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-fundo-suave text-apoio">
        <Ban className="size-6" strokeWidth={2.5} />
      </span>
      <span className="t-cartao min-w-0 flex-1 text-tinta">{children}</span>
    </li>
  )
}

/* ── Tela 5: a trilha dos 7 passos ───────────────────────────────────────────────────────────────────── */

/** A mesma conta de `useMontagem` em coordenacao/Estrutura.tsx (copiada: aquele arquivo não muda). */
function useFeitosDaMontagem(): boolean[] {
  const turmas = useTurmasDaEscola()
  const profs = useProfessoresDaEscola()
  return useMemo(() => {
    const semLista = turmas.filter((t) => t.nomes === 0)
    const semConvite = profs.filter((p) => p.estado === 'vencido')
    const semAlocacao = turmas.filter((t) => (t.criada || t.id === 'au-3a') && t.professores.length === 0)
    return [true, true, true, turmas.length > 0, semLista.length === 0, semConvite.length === 0, semAlocacao.length === 0]
  }, [turmas, profs])
}

function Trilha({ feitos }: { feitos: boolean[] }) {
  const agora = feitos.findIndex((f) => !f)
  const quantos = feitos.filter(Boolean).length
  return (
    <div className="grid gap-2">
      <p className="t-apoio text-center">{`A escola: ${quantos} de ${ROTEIRO.length} feitos`}</p>
      <ol aria-label="Os passos para montar a escola"
        className="grid grid-flow-col grid-rows-4 gap-x-3 gap-y-2 md:-mx-24 md:grid-flow-row md:grid-cols-7 md:grid-rows-none md:gap-2">
        {ROTEIRO.map((p, i) => {
          const feito = feitos[i]
          const atual = i === agora
          return (
            <li key={p.id} aria-current={atual ? 'step' : undefined}
              className="flex items-center gap-2 md:flex-col md:gap-1.5 md:text-center">
              <span aria-hidden className={cn(
                'grid size-8 shrink-0 place-items-center rounded-full border-2 text-[15px] font-bold md:size-9',
                feito && 'border-verde-degrau bg-verde text-sobre-cor',
                atual && 'border-azul-degrau bg-azul text-sobre-cor animate-[pulsa_900ms_ease-in-out_3] motion-reduce:animate-none',
                !feito && !atual && 'border-borda bg-white text-apoio',
              )}>
                {feito ? <Check className="size-5" strokeWidth={3.5} /> : i + 1}
              </span>
              <span className={cn('text-[14px] font-bold leading-[18px]', atual ? 'text-azul-texto' : feito ? 'text-tinta' : 'text-apoio')}>
                {/* o mesmo nome do painel "O que falta" (Estrutura.tsx), que o COMEÇAR abre logo depois */}
                {p.id === 'alocacao' ? 'Turmas do professor' : p.titulo}
                <span className="sr-only">{feito ? ' (feito)' : atual ? ' (agora)' : ''}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ── A página ────────────────────────────────────────────────────────────────────────────────────────── */

type Resumo = 'semanal' | 'quando'
type Destino = 'montar' | 'painel'

export function BemVindoCoordenacao() {
  const navegar = useNavigate()
  const [params] = useSearchParams()
  // lido uma vez: a raiz do app tira o ?como= da barra logo depois
  const [forcada] = useState(() => params.has('rever') || params.has('como'))
  const vista = useIntroducaoVista('coordenacao')
  // Lida uma vez, ao abrir: o COMEÇAR marca a introdução como vista antes de navegar, e a guarda não pode passar por cima do destino.
  const [vistaAoAbrir] = useState(() => vista)
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [respondeu, setRespondeu] = useState(false)
  const [destino, setDestino] = useState<Destino>('montar')
  const feitos = useFeitosDaMontagem()

  if (vistaAoAbrir && !forcada) return <Navigate to="/coordenacao" replace />

  const sair = () => navegar('/coordenacao', { replace: true })
  const comecar = () => {
    sessao.verIntroducao('coordenacao')
    navegar(destino === 'montar' ? '/coordenacao/escola?painel=roteiro' : '/coordenacao', { replace: true })
  }

  return (
    <Introducao rotulo="Introdução da coordenação" agente="analista" aoSair={sair}
      passos={[
        {
          id: 'papel', pose: 'acenando',
          fala: `Oi, ${COORDENADORA.primeiro}! Você coordena o ${ESCOLA.nome} aqui.`,
          conteudo: (
            <ul className="grid gap-3">
              <ItemLadrilho id="escola" familia="azul">Monta a escola</ItemLadrilho>
              <ItemLadrilho id="notas" familia="amarelo">Aprova o que é sensível</ItemLadrilho>
              <ItemLadrilho id="alerta" familia="anil">Vê quantos alunos pedem ação</ItemLadrilho>
            </ul>
          ),
        },
        {
          id: 'fila', pose: 'apontando',
          fala: 'O que é sensível espera você aqui.',
          pronto: resumo !== null,
          reacao: 'Anotado!',
          aoContinuar: () => preferencias.mudar({ coordenacao: { resumo: resumo === 'semanal', alerta: true } }),
          conteudo: (
            <div className="grid gap-3">
              <PreviaSino />
              <fieldset className="grid gap-2 md:grid-cols-2">
                <legend className="mb-2 text-[16px] font-bold leading-5 text-tinta">Como quer saber?</legend>
                <Opcao nome="coord-resumo" valor="semanal" marcado={resumo === 'semanal'} aoMudar={() => setResumo('semanal')}>
                  Resumo toda segunda, 7h
                </Opcao>
                <Opcao nome="coord-resumo" valor="quando" marcado={resumo === 'quando'} aoMudar={() => setResumo('quando')}>
                  Só quando algo esperar por mim
                </Opcao>
              </fieldset>
              <p className="flex items-start gap-2 text-[15px] font-medium leading-5 text-apoio">
                <ShieldAlert aria-hidden className="mt-px size-[18px] shrink-0 text-roxo-texto" strokeWidth={2.5} />
                Risco à vida chega sempre, na hora, para quem tem a atribuição.
              </p>
            </div>
          ),
        },
        {
          id: 'analista', pose: 'apontando',
          fala: 'Pergunte qualquer coisa sobre a escola.',
          pronto: respondeu,
          conteudo: (
            <div className="grid gap-3">
              <ChatDados compacto roteiro={ROTEIRO_ANALISTA} aoResponder={() => setRespondeu(true)} />
              <p className="flex items-center gap-2 text-[15px] font-medium leading-5 text-apoio">
                <Lock aria-hidden className="size-[18px] shrink-0 text-sutil" strokeWidth={2.5} />
                Dado com nome só com motivo, e fica registrado.
              </p>
            </div>
          ),
        },
        {
          id: 'limites', pose: 'acolhendo', rotuloContinuar: 'Entendi',
          fala: 'Aqui ninguém ranqueia professor, e eu nunca decido sobre aluno.',
          conteudo: (
            <ul aria-label="O que não acontece aqui" className="grid gap-2">
              {NUNCA.map((n) => <CartaoNunca key={n}>{n}</CartaoNunca>)}
            </ul>
          ),
        },
      ]}
      fim={{
        fala: 'Pronto! Agora é montar a escola.',
        aoComecar: comecar,
        conteudo: (
          <div className="grid gap-4">
            <Trilha feitos={feitos} />
            <fieldset className="grid gap-2 md:grid-cols-2">
              <legend className="sr-only">Por onde começar</legend>
              <Opcao nome="coord-destino" valor="montar" marcado={destino === 'montar'} aoMudar={() => setDestino('montar')}>
                Montar a escola
              </Opcao>
              <Opcao nome="coord-destino" valor="painel" marcado={destino === 'painel'} aoMudar={() => setDestino('painel')}>
                Ver o painel primeiro
              </Opcao>
            </fieldset>
          </div>
        ),
      }} />
  )
}
