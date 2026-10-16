import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronDown, ChevronRight } from 'lucide-react'
import { BarraProgresso, Botao, Cartao, CabecalhoPagina, MenuMais, Pagina, Secao, SeloNovo, materiaDe } from '@/components/duo'
import { Onca } from '@/components/duo/onca'
import { useTarefasDoAluno, type TarefaViva } from '@/dados/avaliacoes'
import { useAlocacoes } from '@/dados/escola-estado'
import { useAlunoAtual } from '@/dados/sessao'
import { cn } from '@/lib/utils'
import { LadrilhoMateria, SeloEstado, paraTarefaViva } from './_pecas'

/* TAREFAS (/aluno/tarefas), 14ª rodada, 05/10/2026 (plano ux-composicao, 1.2 e 5.2; Plurall: a lista do aluno por
   urgência). Só o que os professores passaram a ESTE aluno, vivo (`useTarefasDoAluno`).
   · Página de leitura (880): o título "Tarefas" e, à direita, o filtro de matéria.
   · Três seções, cada uma com o número: PARA FAZER (o mesmo cálculo do número azul da lateral) · ENTREGUES (a
     professora está vendo) · CORRIGIDAS. Em Para fazer, o prazo mais perto primeiro; o atraso vem por último e calmo
     ("Ainda dá", D59): nada de urgência fabricada.
   · Linha de 64 px: o ladrilho da matéria · o título (e NOVO) com "Química · Prof. Camila Souza" · à direita, na lista
     começada, a barra de 96 px e "2 de 8", e o selo do prazo ou do estado. A linha inteira abre; a prova por fazer
     abre em tela de foco.
   · Aluno novo: a onça dormindo a 1/3 e "Nada pra fazer agora".
   · Proibido aqui: ranking, média da turma, lista de quem entregou (regra 50, item 9). */

const PARA_FAZER: TarefaViva['estadoVivo'][] = ['pra-fazer', 'atrasada', 'aberta', 'abre-em']
/** A ordem de Para fazer: o que abre agora, depois o prazo da semana, o que abre depois e, calmo, o atrasado. */
const PESO: Record<TarefaViva['estadoVivo'], number> = { aberta: 0, 'pra-fazer': 1, 'abre-em': 2, atrasada: 3, entregue: 4, corrigida: 5 }

/** Quem passou a tarefa: a alocação confirmada da turma; sem ela, quem dá a matéria na escola. */
const PROFESSOR_DA_MATERIA: Record<string, string> = { Química: 'Camila Souza', Física: 'Rafael Antunes', História: 'Marta Ribeiro', Matemática: 'Paulo Lemos' }
function useProfessorDe() {
  const aluno = useAlunoAtual()
  const aloc = useAlocacoes()
  return (materia: string) => {
    const nome = aloc.find((a) => a.turmaId === aluno.turmaId && a.disciplina === materia && a.estado === 'confirmado')?.professor ?? PROFESSOR_DA_MATERIA[materia]
    return nome ? `${materia} · Prof. ${nome}` : materia
  }
}

function LinhaTarefaViva({ t, quem }: { t: TarefaViva; quem: string }) {
  const comecada = (t.estadoVivo === 'pra-fazer' || t.estadoVivo === 'atrasada') && t.progresso.total > 0 && t.progresso.feitas > 0
  const f = materiaDe(t.materia)?.familia ?? 'azul'
  return (
    <Link to={paraTarefaViva(t)} aria-label={`${t.titulo}, ${quem}, ${t.selo}${t.novo ? ', novo' : ''}`}
      className="group/linha flex min-h-16 w-full items-center gap-3 border-t-2 border-borda px-4 py-2 transition-colors duration-150 first:border-t-0 hover:bg-fundo-suave">
      <LadrilhoMateria materia={t.materia} tipo={t.tipo === 'prova' ? 'prova' : undefined} />
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="flex min-w-0 items-center gap-2">
          <span className="t-cartao truncate text-tinta" title={t.titulo}>{t.titulo}</span>
          {t.novo && <SeloNovo tamanho="p" className="max-md:hidden" />}
        </span>
        <span className="t-apoio truncate">{quem}</span>
        {/* no celular, o estado (e o NOVO) desce para baixo do nome: a linha não corta o título */}
        <span className="mt-1 flex flex-wrap items-center gap-2 md:hidden">
          <SeloEstado t={t} tamanho="p" />
          {t.novo && <SeloNovo tamanho="p" />}
          {comecada && <span className="text-[14px] font-bold tabular-nums text-apoio">{t.progresso.feitas} de {t.progresso.total}</span>}
        </span>
      </span>
      {comecada && (
        <span className="hidden shrink-0 items-center gap-2 md:flex">
          <BarraProgresso valor={t.progresso.feitas} max={t.progresso.total} familia={f} altura={12} className="w-24"
            rotulo={`${t.progresso.feitas} de ${t.progresso.total} questões`} />
          <span className="w-12 text-[15px] font-bold tabular-nums text-apoio">{t.progresso.feitas} de {t.progresso.total}</span>
        </span>
      )}
      <span className="hidden shrink-0 md:flex"><SeloEstado t={t} /></span>
      <ChevronRight aria-hidden strokeWidth={2.5} className="size-5 shrink-0 text-apagado transition-transform duration-150 group-hover/linha:translate-x-0.5" />
    </Link>
  )
}

function Grupo({ titulo, tarefas, vazio, quem }: { titulo: string; tarefas: TarefaViva[]; vazio: string; quem: (m: string) => string }) {
  return (
    <Secao titulo={titulo} n={tarefas.length}>
      {tarefas.length === 0 ? (
        <p className="t-apoio flex min-h-12 items-center gap-2 rounded-[16px] border-2 border-dashed border-borda px-4">
          <Check aria-hidden className="size-4 shrink-0" strokeWidth={3} /> {vazio}
        </p>
      ) : (
        <Cartao semRespiro className="overflow-hidden">
          {tarefas.map((t) => <LinhaTarefaViva key={t.id} t={t} quem={quem(t.materia)} />)}
        </Cartao>
      )}
    </Secao>
  )
}

export function Atividades() {
  const todas = useTarefasDoAluno()
  const quem = useProfessorDe()
  const [materia, setMateria] = useState<string | null>(null)
  const materias = [...new Set(todas.map((t) => t.materia))]
  const lista = materia ? todas.filter((t) => t.materia === materia) : todas

  const paraFazer = lista.filter((t) => PARA_FAZER.includes(t.estadoVivo)).sort((a, b) => PESO[a.estadoVivo] - PESO[b.estadoVivo] || a.ordem - b.ordem)
  const entregues = lista.filter((t) => t.estadoVivo === 'entregue')
  const corrigidas = lista.filter((t) => t.estadoVivo === 'corrigida')

  const filtro = materias.length > 1 ? (
    <MenuMais rotulo="Filtrar por matéria"
      itens={[{ rotulo: 'Todas as matérias', aoEscolher: () => setMateria(null) }, ...materias.map((m) => ({ rotulo: m, aoEscolher: () => setMateria(m) }))]}
      gatilho={<Botao variante="secundario" tamanho="m">{materia ?? 'Todas as matérias'} <ChevronDown strokeWidth={2.5} /></Botao>} />
  ) : undefined

  return (
    <Pagina tipo="leitura" cabecalho={<CabecalhoPagina titulo="Tarefas" acoes={filtro} />}>
      {todas.length === 0 ? (
        <div className="grid min-h-full flex-1 grid-rows-[1fr_auto_2fr] justify-items-center">
          <span aria-hidden />
          <div className="grid justify-items-center gap-3 text-center">
            <Onca pose="dormindo" tamanho={96} animada={false} />
            <h2 className="t-secao text-tinta">Nada pra fazer agora</h2>
            <p className="t-apoio max-w-[36ch]">Quando um professor mandar uma tarefa, ela aparece aqui.</p>
          </div>
          <span aria-hidden />
        </div>
      ) : (
        <div className={cn('grid content-start gap-6')}>
          <Grupo titulo="Para fazer" tarefas={paraFazer} vazio="Nada pra fazer agora." quem={quem} />
          <Grupo titulo="Entregues" tarefas={entregues} vazio="Nada esperando a professora." quem={quem} />
          <Grupo titulo="Corrigidas" tarefas={corrigidas} vazio="Nenhuma corrigida ainda." quem={quem} />
        </div>
      )}
    </Pagina>
  )
}
