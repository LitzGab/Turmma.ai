import { useEffect, useRef } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Check, ChevronDown, ChevronLeft } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { itemT, menuT } from '@/components/turmma/painel'
import { NotaMockup } from '@/components/turmma/tela'
import { PeleTeachy } from '@/components/turmma/teachy'
import { escolaDe, TURMAS } from '@/dados/escola'
import { cn } from '@/lib/utils'
import { AlunosTurma } from './abas-turma/Alunos'
import { AtividadesTurma } from './abas-turma/Atividades'
import { FrequenciaTurma } from './abas-turma/Frequencia'
import { MuralTurma } from './abas-turma/Mural'
import { NotasTurma } from './abas-turma/Notas'
import { RankingTurma } from './abas-turma/Ranking'
import { RecursosTurma } from './abas-turma/Recursos'
import { UsoTutorTurma } from './abas-turma/UsoTutor'
import { VisaoGeralTurma } from './abas-turma/VisaoGeral'

/* A TURMA ABERTA — CÓPIA da moldura da Teachy (oitava rodada, 20/09/2026). Na sétima rodada a barra tinha abas em
   pílula, o resumo da turma e dois botões, "adaptados" da Teachy; o Gabriel olhou e disse: "eu quero um ctrl c e ctrl v
   da Teachy. Não está interessante o seu." Então agora é o desenho de lá, com as medidas tiradas no Chrome dele:
   · a BARRA de 49 px (branca, fio de 1 px embaixo, respiro 12 16 0): "‹" que volta para a lista, o nome da turma em
     Quicksand 18/700 (que é também o menu para trocar de turma, mantendo a aba) e, encostadas à direita, as NOVE ABAS:
     links de 36 px, respiro 8 × 20, canto 8 8 0 0; a ativa em Quicksand 14/700, fundo cinza claro e o sublinhado de
     2 px no laranja da pinta (na Teachy é azul), colado no fio da barra;
   · Visão Geral · Atividades · Recursos · Mural · Alunos · Notas · Uso de IA · Frequência · Ranking — a ordem de lá,
     mais o "Ranking" que o Gabriel pediu ("dentro de turmas, quero estabelecer um rank também");
   · embaixo da barra o conteúdo ROLA COMO DOCUMENTO, numa coluna de até 1152 px. A barra fica.
   O que SAIU da barra: o resumo "32 alunos · …", o botão "Convidar alunos" (foi para o "Adicionar" da aba Alunos, como
   na Teachy) e o "Modo sala" (virou item do menu "Gerenciar" da Visão Geral). A aba "Sala" virou subaba de "Alunos" e
   "Tutor" virou "Uso de IA"; "Recursos" e "Mural", que tinham ficado de fora, entraram.
   Endereço: /professor/turmas/:turma?aba=visao|atividades|recursos|mural|alunos|notas|uso|frequencia|ranking. Os
   endereços antigos continuam abrindo: `aba=sala` é a aba Alunos na subaba Sala (e `&aluno=<id>` abre a ficha daquele
   aluno), `aba=tutor` é Uso de IA. Trocar de aba só troca o parâmetro, com `replace`, para o "voltar" do navegador
   levar à lista e não descer uma escada de abas.
   CONTRATO DAS ABAS (novo): cada uma recebe { turmaId } e é um bloco de ALTURA NATURAL dentro da coluna; não faz
   rolagem própria nem `flex-1` (a exceção é a sala de carteiras, dentro de Alunos, com 600 px). A PÁGINA nunca rola:
   quem rola é o contêiner embaixo da barra. No celular a barra quebra: o nome em cima e as abas rolando de lado
   embaixo, com a aba ativa entrando na vista. */

const ABAS = [
  { id: 'visao', nome: 'Visão Geral' }, { id: 'atividades', nome: 'Atividades' }, { id: 'recursos', nome: 'Recursos' }, { id: 'mural', nome: 'Mural' },
  { id: 'alunos', nome: 'Alunos' }, { id: 'notas', nome: 'Notas' }, { id: 'uso', nome: 'Uso de IA' }, { id: 'frequencia', nome: 'Frequência' }, { id: 'ranking', nome: 'Ranking' },
] as const
type AbaId = (typeof ABAS)[number]['id']
const ANTIGAS: Record<string, AbaId> = { sala: 'alunos', tutor: 'uso' }

export function Turma() {
  const { turma: id } = useParams()
  const [params] = useSearchParams()
  const navegar = useNavigate()
  const barraDeAbas = useRef<HTMLElement>(null)
  const documento = useRef<HTMLDivElement>(null)

  const pedida = params.get('aba') ?? 'visao'
  const aba: AbaId = ANTIGAS[pedida] ?? (ABAS.some((a) => a.id === pedida) ? (pedida as AbaId) : 'visao')

  // aba nova ou turma nova: o documento volta para o alto e, no celular, a aba ativa entra na vista
  useEffect(() => {
    documento.current?.scrollTo({ top: 0 })
    const ativa = barraDeAbas.current?.querySelector<HTMLElement>('[aria-current="page"]')
    const barra = barraDeAbas.current
    if (ativa && barra) barra.scrollTo({ left: ativa.offsetLeft - (barra.clientWidth - ativa.offsetWidth) / 2 })
  }, [aba, id])

  const t = TURMAS.find((x) => x.id === id)
  if (!t) return <Navigate to="/professor/turmas" replace />
  // `aba=sala` continua no endereço enquanto a subaba Sala estiver aberta: é a aba Alunos que lê
  const endereco = (turmaId: string, a: string) => `/professor/turmas/${turmaId}${a === 'visao' ? '' : `?aba=${a}`}`

  return (
    <PeleTeachy className="flex h-[calc(100svh-56px)] min-h-0 flex-col bg-superficie md:h-svh">
      {/* A BARRA: 12 de respiro + 36 da aba + 1 do fio = 49 px. Abaixo de 1040 px de área ela quebra em duas linhas. */}
      <header data-barra-turma className="@container shrink-0 border-b border-linha bg-superficie">
        <div className="flex flex-col px-4 pt-3 @[1040px]:h-12 @[1040px]:flex-row @[1040px]:items-end @[1040px]:justify-between @[1040px]:gap-6">
          <div className="flex h-9 min-w-0 shrink-0 items-center gap-1">
            <Link to="/professor/turmas" aria-label="Voltar para as turmas" title="Turmas" className="-ml-1 grid size-7 shrink-0 place-items-center rounded-[8px] text-tinta transition-colors duration-150 hover:bg-realce-suave">
              <ChevronLeft aria-hidden className="size-5" strokeWidth={2} />
            </Link>
            <DropdownMenu>
              <h1 className="flex min-w-0">
                <DropdownMenuTrigger asChild>
                  <button type="button" title="Trocar de turma"
                    className="inline-flex h-8 min-w-0 items-center gap-1 rounded-[8px] px-1.5 outline-none transition-colors duration-150 hover:bg-realce-suave focus-visible:bg-realce-suave data-[state=open]:bg-realce-suave">
                    <span className="truncate font-teachy text-[18px] font-bold leading-8 text-tinta">{t.nome}</span>
                    <span className="sr-only">, {t.disciplina}. Trocar de turma</span>
                    <ChevronDown aria-hidden className="size-4 shrink-0 text-inativo" strokeWidth={2} />
                  </button>
                </DropdownMenuTrigger>
              </h1>
              <DropdownMenuContent align="start" className={cn(menuT, 'w-64')}>
                {TURMAS.map((x) => (
                  <DropdownMenuItem key={x.id} className={cn(itemT, 'h-11')} onSelect={() => { if (x.id !== t.id) navegar(endereco(x.id, pedida === 'sala' ? 'sala' : aba)) }}>
                    <span className="w-8 shrink-0 font-teachy font-bold">{x.nome}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] leading-4">{x.disciplina} · {x.serie}</span>
                      <span className="block truncate text-[12px] leading-4 text-inativo">{escolaDe(x.escolaId).nome}</span>
                    </span>
                    {x.id === t.id && <Check aria-hidden className="!text-tinta" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <nav ref={barraDeAbas} aria-label={`Abas do ${t.nome}`} className="-mx-4 flex min-w-0 overflow-x-auto px-4 [scrollbar-width:none] @[1040px]:mx-0 @[1040px]:px-0 [&::-webkit-scrollbar]:hidden">
            {ABAS.map((a) => (
              <Link key={a.id} to={endereco(t.id, a.id)} replace aria-current={a.id === aba ? 'page' : undefined}
                className={cn('inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-t-[8px] border-b-2 px-5 py-2 text-[14px] leading-5 outline-none transition-colors duration-150 focus-visible:bg-realce-suave',
                  a.id === aba ? 'border-caramelo bg-realce-suave font-teachy font-bold text-tinta' : 'border-transparent text-apoio hover:bg-[#FAFAFA] hover:text-tinta')}>
                {a.nome}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* `relative`: o que é `sr-only` (absoluto) dentro das abas fica preso a este contêiner, e não estica a PÁGINA */}
      <div ref={documento} data-documento-turma className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1152px] px-4 pb-10 sm:px-9">
          {aba === 'visao' && <VisaoGeralTurma key={t.id} turmaId={t.id} />}
          {aba === 'atividades' && <AtividadesTurma key={t.id} turmaId={t.id} />}
          {aba === 'recursos' && <RecursosTurma key={t.id} turmaId={t.id} />}
          {aba === 'mural' && <MuralTurma key={t.id} turmaId={t.id} />}
          {aba === 'alunos' && <AlunosTurma key={t.id} turmaId={t.id} />}
          {aba === 'notas' && <NotasTurma key={t.id} turmaId={t.id} />}
          {aba === 'uso' && <UsoTutorTurma key={t.id} turmaId={t.id} />}
          {aba === 'frequencia' && <FrequenciaTurma key={t.id} turmaId={t.id} />}
          {aba === 'ranking' && <RankingTurma key={t.id} turmaId={t.id} />}
        </div>
      </div>

      <NotaMockup>
        A turma aberta é cópia da moldura da Teachy (20/09/2026, oitava rodada). Da referência saíram "Criar turma" (a turma vem da estrutura da escola, regra 60 item 8) e o azul
        (entrou o laranja da pinta no sublinhado da aba). "Ranking" é nosso. Escola: {escolaDe(t.escolaId).nome}. D34: aluno com nome só para o professor da turma.
      </NotaMockup>
    </PeleTeachy>
  )
}
