import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ClipboardList, FileCheck2, PenLine, type LucideIcon } from 'lucide-react'
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item'
import { Estado, LinhaAprovacao } from '@/components/turmma/ia'
import { NotaMockup } from '@/components/turmma/tela'
import { TelaAluno } from './_pecas'

/* Atividades e provas (seção 2). Só o que o professor atribuiu A ESTE aluno.
   Proibido aqui: ranking, média da turma, lista de quem entregou (regra 50, item 9). */

type Linha = { para?: string; icone: LucideIcon; titulo: string; detalhe: string; selo?: ReactNode; extra?: ReactNode }

const PARA_FAZER: Linha[] = [
  { para: '/aluno/prova', icone: ClipboardList, titulo: 'Prova de estequiometria', detalhe: 'Química · hoje, na 3ª aula · 8 questões · 50 minutos',
    selo: <Estado tipo="info" size="lg">Avaliação: o Tutor fica pausado</Estado> },
  { para: '/aluno/atividades/estequiometria', icone: PenLine, titulo: 'Lista de estequiometria', detalhe: 'Química · para quinta, 24/09 · 8 questões · você já fez 2',
    selo: <Estado tipo="contorno" size="lg">Em andamento</Estado> },
  { para: '/aluno/atividades/estequiometria', icone: PenLine, titulo: 'Exercícios de reagente limitante', detalhe: 'Química · era para 17/09 · ainda dá para entregar',
    selo: <Estado tipo="contorno" size="lg">Para fazer</Estado> },
]

const ENTREGUES: Linha[] = [
  { icone: FileCheck2, titulo: 'Lista de mol e massa molar', detalhe: 'Entregue em 15/09 · seu professor está vendo o resultado antes de você' },
]

const COM_DEVOLUTIVA: Linha[] = [
  { para: '/aluno/desempenho', icone: FileCheck2, titulo: 'Lista de balanceamento', detalhe: 'Você acertou 6 de 8 · veja o que reforçar',
    extra: <LinhaAprovacao verbo="Devolutiva aprovada por" quando="12/09, 14h10" className="text-base" /> },
]

function Lista({ titulo, vazio, linhas }: { titulo: string; vazio: string; linhas: Linha[] }) {
  return (
    <section className="mb-8">
      <h2 className="rotulo mb-3">{titulo}</h2>
      {linhas.length === 0 ? (
        <p className="rounded-cartao border border-dashed border-linha p-5 text-base text-apoio">{vazio}</p>
      ) : (
        <ul className="grid gap-2.5">
          {linhas.map((l) => {
            const Icone = l.icone
            const miolo = (
              <>
                <ItemMedia className="size-10 rounded-controle bg-realce-suave text-tinta"><Icone className="size-5" strokeWidth={1.75} /></ItemMedia>
                <ItemContent className="min-w-0 gap-1">
                  <ItemTitle className="text-base font-semibold text-tinta">{l.titulo}</ItemTitle>
                  <ItemDescription className="line-clamp-none text-base text-apoio">{l.detalhe}</ItemDescription>
                  {l.extra && <div className="pt-1">{l.extra}</div>}
                </ItemContent>
                {(l.selo || l.para) && (
                  <ItemActions className="gap-2">
                    {l.selo}
                    {l.para && <ChevronRight className="size-5 shrink-0 text-sutil" aria-hidden />}
                  </ItemActions>
                )}
              </>
            )
            return (
              <li key={l.titulo}>
                {l.para ? (
                  <Item asChild variant="outline" className="min-h-[72px] rounded-cartao border-linha bg-superficie transition-colors duration-150 hover:bg-realce">
                    <Link to={l.para}>{miolo}</Link>
                  </Item>
                ) : (
                  <Item variant="outline" className="min-h-[72px] rounded-cartao border-linha bg-superficie">{miolo}</Item>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export function Atividades() {
  return (
    <TelaAluno titulo="Atividades e provas" descricao="O que seus professores passaram para você. Só você vê esta lista.">
      <Lista titulo="Para fazer" linhas={PARA_FAZER} vazio="Nada para fazer agora. Quando um professor passar uma atividade, ela aparece aqui." />
      <Lista titulo="Entregues" linhas={ENTREGUES} vazio="Você ainda não entregou nenhuma atividade." />
      <Lista titulo="Com devolutiva do professor" linhas={COM_DEVOLUTIVA} vazio="Nenhuma devolutiva ainda. Ela chega depois que o professor aprova." />
      <NotaMockup>
        A3 (fatia do F6/F9). Só o que foi atribuído a este aluno; o resultado chega depois de aprovado pelo professor (regra 70, item 3).
        Sem ranking, sem média da turma, sem lista de quem entregou (regra 50, item 9). Atraso dito com calma, sem urgência fabricada (D59).
      </NotaMockup>
    </TelaAluno>
  )
}
