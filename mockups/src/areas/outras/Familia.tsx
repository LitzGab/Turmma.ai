import { useNavigate, Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { BarraApp, CabecalhoPagina, Cartao, LadrilhoIcone, Linha, MenuMais, materiaDe } from '@/components/duo'
import { Icone } from '@/components/duo/icones'
import { SeloEstado } from '@/areas/aluno/_pecas'
import { useTarefasDoAluno, type TarefaViva } from '@/dados/avaliacoes'
import { ALUNO, ESCOLAS } from '@/dados/escola'

/* A FAMÍLIA (/familia), 12ª rodada: uma passada leve na pele Duolingo. FORA da demonstração (D80: sem conta do
   responsável até o parecer do art. 24 do ECA Digital); só aparece no Mapa, recolhida em "Depois".
   Dois blocos: ENTREGAS (o atraso no topo, uma vez só) e NOTAS ("Aprovada por" em cinza). Lê as tarefas do Lucas do
   estado da demonstração: a nota que a professora aprova aparece aqui. Nada da IA chega à família sem um professor
   (regra 70). O responsável vê só o próprio filho (regra 60, item 11).
   14ª rodada: Leitura 880, o título "Lucas · 2ºB" na coluna (a barra leva a escola); no escuro, tudo por token. */

const ORDEM: Record<TarefaViva['estadoVivo'], number> = { atrasada: 0, aberta: 1, 'pra-fazer': 2, 'abre-em': 3, entregue: 4, corrigida: 5 }

function IconeMateria({ t }: { t: TarefaViva }) {
  const m = materiaDe(t.materia)
  return <LadrilhoIcone familia={m?.familia ?? 'azul'} tamanho={40} icone={<Icone id={m?.icone ?? 'lista'} />} />
}

/* O mesmo selo que o aluno vê (AINDA DÁ neutro, A PROFESSORA ESTÁ VENDO, CORRIGIDA): um glossário só, nada de
   vermelho que soe como cobrança. */
const SeloEntrega = ({ t }: { t: TarefaViva }) => <SeloEstado t={t} />

export function Familia() {
  const navegar = useNavigate()
  const tarefas = useTarefasDoAluno('lucas')
  const entregas = tarefas.filter((t) => t.estadoVivo !== 'corrigida').sort((a, b) => ORDEM[a.estadoVivo] - ORDEM[b.estadoVivo])
  const notas = tarefas.filter((t) => t.estadoVivo === 'corrigida')
  const devolutiva = (t: TarefaViva) => t.resultado?.recado ?? t.devolutiva
  /* "Aprovada por" uma vez só, no cabeçalho, quando é a mesma pessoa em todas as notas */
  const quem = [...new Set(notas.map((t) => devolutiva(t)?.aprovadoPor).filter(Boolean))]
  const umaSo = quem.length === 1 ? quem[0] : undefined

  return (
    <div className="flex h-svh min-h-0 flex-col bg-white text-tinta">
      <BarraApp
        contexto={<span className="min-w-0 truncate text-[17px] font-bold">{ESCOLAS[0].nome}</span>}
        acoes={<MenuMais rotulo="Sua conta" itens={[{ rotulo: 'Sair', icone: <LogOut />, aoEscolher: () => navegar('/entrar') }]} />}
      />

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid w-full max-w-[880px] gap-5 px-4 pb-6 pt-3 md:box-content md:px-8 md:pt-4">
          {/* o título na coluna, não na barra (14ª rodada): quem a família acompanha */}
          <CabecalhoPagina titulo={`${ALUNO.primeiro} · ${ALUNO.turma}`} complemento={ESCOLAS[0].nome} />

          <section aria-labelledby="f-entregas" className="grid gap-3">
            <h2 id="f-entregas" className="t-secao">Entregas</h2>
            <Cartao semRespiro classeCaixa="overflow-hidden">
              {entregas.map((t) => (
                <Linha key={t.id} inicio={<IconeMateria t={t} />} titulo={t.titulo}
                  abaixo={<>{t.materia}<span className="sm:hidden"><SeloEntrega t={t} /></span></>}
                  fim={<span className="max-sm:hidden"><SeloEntrega t={t} /></span>} />
              ))}
            </Cartao>
          </section>

          <section aria-labelledby="f-notas" className="grid gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <h2 id="f-notas" className="t-secao">Notas</h2>
              {umaSo && <span className="t-apoio">{`Aprovadas por ${umaSo}`}</span>}
            </div>
            <Cartao semRespiro classeCaixa="overflow-hidden">
              {notas.map((t) => {
                const acertos = t.resultado?.acertos ?? t.acertos ?? 0
                const total = t.resultado?.total ?? t.total ?? t.questoes
                const dev = devolutiva(t)
                return (
                  <Linha key={t.id} inicio={<IconeMateria t={t} />} titulo={t.titulo}
                    abaixo={dev ? (umaSo ? `${t.materia} · ${dev.quando}` : `Aprovada por ${dev.aprovadoPor} · ${dev.quando}`) : t.materia}
                    fim={<span className="text-[19px] font-bold tabular-nums">{`${acertos} de ${total}`}</span>} />
                )
              })}
            </Cartao>
          </section>

          <p className="t-apoio">
            Tudo aqui passou por um professor. A IA não lança nota e não fala com a família.{' '}
            <Link to="/e/colegio-aurora/dados" className="font-bold text-azul-texto underline-offset-4 hover:underline">Privacidade</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
