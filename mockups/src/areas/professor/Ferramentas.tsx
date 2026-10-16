import { useNavigate } from 'react-router-dom'
import { Check, ChevronDown, MessageSquareText } from 'lucide-react'
import { Botao, Cartao, CabecalhoPagina, Pagina, Secao, Selo } from '@/components/duo'
import { CLASSE_FLUTUA } from '@/components/duo/menu'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconeFerramenta } from '@/components/turmma/icones-ferramenta'
import { PainelLado } from '@/components/turmma/painel-lado'
import { useTurmaDaSessao } from '@/components/turmma/pedido'
import { useParametro } from '@/components/turmma/tela'
import { ESCOLAS } from '@/dados/escola'
import { useEscolaAtiva } from '@/dados/escola-ativa'
import { CATALOGO, CATEGORIAS, SO_PEDIR, destinoDa, type Ferramenta } from '@/dados/ferramentas'
import { useTurmasDoProfessor, type TurmaProfessora } from '@/dados/turmas-professora'
import { cn } from '@/lib/utils'
import { QueProvaCorrigir } from './Catalogo'

/* FERRAMENTAS (/professor/ferramentas) — 14ª rodada (05/10/2026; plano ux-composicao 1.3, F36). "Essa parte do Mais,
   quero que seja uma aba separada como era antes."

   Página do tipo Painel, sem rolar a 1440 × 780 (o corpo rola por dentro):
   · o cabeçalho "Ferramentas" e, colado ao título (a borda direita é do sino), "Para a turma: [2ºB · Química ▾]" (as turmas do professor, a escola ativa
     na frente; o padrão é a turma da aula, `useTurmaDaSessao`; `?turma=` escolhe);
   · as NOVE ferramentas nos 4 grupos de dados/ferramentas.ts (Planejar · Preparar a aula · Avaliar · Corrigir), uma
     Secao por grupo (o nome e o apoio numa linha), os cartões em 3 colunas a 1440. O cartão é
     clicável, com degrau: o ícone ilustrado a 48, o nome e o texto inteiro da ferramenta (até 3 linhas: em 2, a
     frase saía cortada);
   · escolher leva a `destinoDa(id, turma)` (a conversa nova com o cartão preenchido; Adaptar e Redação têm rota
     própria). O Simulado ENEM fica apagado, com "Só no Ensino Médio", quando a turma é do Fundamental;
   · Correção de objetiva abre AO LADO "Que prova corrigir?" (também por `?corrigir=1`);
   · no fim, "Também dá para só pedir ao Assistente": cada pedido leva ao Início com o texto na caixa e a turma
     escolhida aqui no seletor da caixa. */

const ehEM = (t?: TurmaProfessora) => (t?.serie ?? '').includes('EM')

function EscolherTurma({ turmas, valor, aoMudar }: { turmas: TurmaProfessora[]; valor: string; aoMudar: (id: string) => void }) {
  const escola = useEscolaAtiva()
  const atual = turmas.find((t) => t.id === valor)
  const escolas = [...ESCOLAS].sort((a, b) => Number(b.id === escola.id) - Number(a.id === escola.id))
    .map((e) => ({ e, turmas: turmas.filter((t) => t.escolaId === e.id) })).filter((g) => g.turmas.length)
  if (!atual) return null
  return (
    <div className="flex items-center gap-2.5">
      <span className="t-apoio max-sm:hidden">Para a turma:</span>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Botao variante="secundario" tamanho="m" aria-label={`Para a turma: ${atual.nome} · ${atual.disciplina}. Trocar`}
            className="normal-case tracking-normal [&>.face]:gap-2 [&>.face]:text-[15px] [&>.face]:text-tinta">
            {atual.nome} · {atual.disciplina}
            <ChevronDown aria-hidden strokeWidth={2.75} />
          </Botao>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={8} className={cn(CLASSE_FLUTUA, 'z-50 w-72 p-1.5')}>
          {escolas.map(({ e, turmas: ts }) => (
            <DropdownMenuGroup key={e.id}>
              {escolas.length > 1 && <DropdownMenuLabel className="t-selo px-2.5 pb-1 pt-2 text-sutil">{e.nome}</DropdownMenuLabel>}
              {ts.map((t) => (
                <DropdownMenuItem key={t.id} onSelect={() => aoMudar(t.id)} className="h-12 gap-3 rounded-[10px] px-2.5">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-bold leading-5 text-tinta">{t.nome} · {t.disciplina}</span>
                    <span className="truncate text-[13px] font-medium leading-4 text-sutil">{t.serie}, {t.alunos} alunos</span>
                  </span>
                  {t.id === valor && <Check aria-hidden className="size-5 text-azul-texto" strokeWidth={3} />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/** O cartão de uma ferramenta: o ícone a 48, o nome e o texto. Todos com a MESMA altura (o texto em até 3 linhas,
    alinhado ao topo; o texto inteiro no title). Apagado quando não vale para a turma: o selo entra no lugar da
    primeira linha do texto, sem mexer no título. */
function CartaoFerramenta({ f, apagado, aoEscolher }: { f: Ferramenta; apagado?: string; aoEscolher: () => void }) {
  const miolo = (
    <>
      <IconeFerramenta id={f.id} className={cn('size-12 shrink-0', apagado && 'opacity-40 grayscale')} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn('t-cartao truncate', apagado ? 'text-sutil' : 'text-tinta')}>{f.nome}</span>
        {apagado && <Selo tamanho="p" className="my-0.5 self-start">{apagado}</Selo>}
        <span className="line-clamp-3 text-[14px] font-medium leading-[19px] text-sutil">{apagado ? 'Para usar, escolha uma turma do 1º ao 3º ano do Ensino Médio.' : f.texto}</span>
      </span>
    </>
  )
  const face = 'flex h-[108px] min-w-0 items-start gap-3 py-3 pl-3.5 pr-2.5 md:py-3 md:pl-3.5 md:pr-2.5'
  if (apagado) {
    return <Cartao aria-label={`${f.nome}: ${apagado.toLowerCase()}`} title={f.texto} className={cn(face, 'border-dashed bg-fundo-suave')}>{miolo}</Cartao>
  }
  return <Cartao como="button" onClick={aoEscolher} title={f.texto} className={cn(face, 'group')}>{miolo}</Cartao>
}

/* Cada grupo na SUA faixa, sempre na ordem do trabalho (Planejar · Preparar a aula · Avaliar · Corrigir), em qualquer
   largura: o nome do grupo em cima, os cartões embaixo, na mesma grade de 3 colunas (os cartões de todas as faixas
   alinham pela mesma coluna; a faixa com menos cartões só termina antes, à esquerda). */
export function Ferramentas() {
  const navegar = useNavigate()
  const turmas = useTurmasDoProfessor()
  const daSessao = useTurmaDaSessao()
  const [pedida, setTurma] = useParametro('turma')
  const [corrigir, setCorrigir] = useParametro('corrigir')
  const turmaId = turmas.some((t) => t.id === pedida) ? pedida! : daSessao
  const turma = turmas.find((t) => t.id === turmaId)

  const escolher = (f: Ferramenta) => {
    if (f.id === 'correcao') { setCorrigir('1'); return }
    navegar(destinoDa(f.id, turmaId))
  }

  return (
    <Pagina tipo="painel"
      cabecalho={<CabecalhoPagina titulo="Ferramentas" selo={turmas.length > 0 ? <EscolherTurma turmas={turmas} valor={turmaId} aoMudar={setTurma} /> : undefined} />}>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-y-6">
        {CATEGORIAS.map((c) => {
          const dela = CATALOGO.filter((f) => f.categoria === c.id)
          if (!dela.length) return null
          return (
            <Secao key={c.id} titulo={c.nome} apoio={<span className="max-md:hidden">{c.apoio}</span>}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {dela.map((f) => (
                  <CartaoFerramenta key={f.id} f={f} aoEscolher={() => escolher(f)}
                    apagado={f.id === 'simulado' && turma && !ehEM(turma) ? 'Só no Ensino Médio' : undefined} />
                ))}
              </div>
            </Secao>
          )
        })}

        <Secao titulo="Também dá para só pedir ao Assistente" apoio="Sem formulário: escreva na conversa." className="pb-6">
          <ul className="grid gap-x-4 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
            {SO_PEDIR.map((s) => (
              <li key={s.nome} className="min-w-0">
                <button type="button" onClick={() => navegar('/professor', { state: { pedido: s.pedido, turma: turmaId } })} title={s.pedido}
                  className="flex h-10 w-full min-w-0 items-center gap-2.5 rounded-[10px] px-2 text-left text-[15px] font-bold leading-5 text-apoio transition-colors duration-150 hover:bg-fundo-suave hover:text-tinta">
                  <MessageSquareText aria-hidden className="size-[18px] shrink-0 text-sutil" strokeWidth={2.5} />
                  <span className="truncate">{s.nome}</span>
                </button>
              </li>
            ))}
          </ul>
        </Secao>
      </div>

      <PainelLado aberto={corrigir === '1'} aoFechar={() => setCorrigir(null)} titulo="Que prova corrigir?"
        descricao="As provas objetivas que esperam a sua aprovação.">
        <QueProvaCorrigir />
      </PainelLado>
    </Pagina>
  )
}
