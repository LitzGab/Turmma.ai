import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CircleCheck, MessageCircleQuestion } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Cartao, NotaMockup } from '@/components/turmma/tela'
import { cn } from '@/lib/utils'
import { Alternativas, QUESTOES_ESTEQUIOMETRIA, RespostaSalva, TelaAluno } from './_pecas'

/* Atividade objetiva no navegador (A3). Uma questão por vez, "Resposta salva" a cada item,
   e o Tutor disponível — atividade não é avaliação. O resultado só chega depois que o professor aprova. */

const QUESTOES = QUESTOES_ESTEQUIOMETRIA

export function Atividade() {
  const [atual, setAtual] = useState(2)
  const [respostas, setRespostas] = useState<Record<number, string>>({ 0: 'C', 1: 'B' })
  const [entregue, setEntregue] = useState(false)
  const feitas = Object.keys(respostas).length
  const q = QUESTOES[atual]

  if (entregue) {
    return (
      <TelaAluno objeto titulo="Lista de estequiometria" largura="conversa">
        <Cartao className="grid justify-items-center gap-4 py-10 text-center">
          <span className="grid size-14 place-items-center rounded-cartao bg-ok-cx text-ok"><CircleCheck className="size-7" strokeWidth={1.75} /></span>
          <h2 className="font-titulo text-[22px] font-semibold tracking-[-0.02em] text-tinta">Entregue.</h2>
          <p className="max-w-[46ch] text-base leading-relaxed text-apoio">
            Seu professor vê o resultado antes de você. Quando ele aprovar, o resultado aparece em "Meu desempenho",
            com o que vale a pena reforçar.
          </p>
          <p className="text-base text-sutil">Entregue em 21/09, às 10h42 · {feitas} de {QUESTOES.length} questões respondidas</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secundario" className="text-base" asChild><Link to="/aluno/atividades">Voltar para as atividades</Link></Button>
          </div>
        </Cartao>
        <NotaMockup>A3. O diagnóstico do Corretor nasce pendente e só chega ao aluno depois de aprovado pelo professor (regra 70, item 3; D46). Sem nota: é diagnóstico formativo.</NotaMockup>
      </TelaAluno>
    )
  }

  return (
    <TelaAluno objeto largura="conversa" titulo="Lista de estequiometria"
      descricao="Química · Professora Camila · para quinta, 24/09. Não é prova: pode consultar o livro e pedir ajuda ao Tutor."
      acoes={<Button variant="secundario" className="text-base" asChild><Link to="/aluno"><MessageCircleQuestion /> Pedir ajuda ao Tutor</Link></Button>}>

      {/* Onde estou: número em texto e uma marca por questão. Sem barra que enche para comemorar. */}
      <nav aria-label="Questões" className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        <p className="text-base font-semibold text-tinta">Questão {atual + 1} de {QUESTOES.length}</p>
        <ol className="flex flex-wrap gap-1.5">
          {QUESTOES.map((_, i) => (
            <li key={i}>
              <button type="button" onClick={() => setAtual(i)} aria-label={`Ir para a questão ${i + 1}${respostas[i] ? ', respondida' : ''}`} aria-current={i === atual ? 'step' : undefined}
                className={cn('grid size-11 place-items-center rounded-controle border text-base font-medium transition-colors duration-150 md:size-9',
                  i === atual ? 'border-noite bg-noite text-white' : respostas[i] ? 'border-linha bg-realce text-tinta' : 'border-linha bg-superficie text-sutil hover:bg-realce')}>
                {i + 1}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <Cartao className="grid gap-5">
        <p className="text-[17px] leading-relaxed text-tinta">{q.enunciado}</p>
        <Alternativas questao={q} nome={`q${atual}`} valor={respostas[atual]} aoEscolher={(v) => setRespostas((r) => ({ ...r, [atual]: v }))} />
        <RespostaSalva salvo={!!respostas[atual]} />
      </Cartao>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <Button variant="secundario" className="text-base" disabled={atual === 0} onClick={() => setAtual((a) => a - 1)}><ArrowLeft /> Anterior</Button>
        {atual < QUESTOES.length - 1 ? (
          <Button variant="secundario" className="text-base" onClick={() => setAtual((a) => a + 1)}>Próxima <ArrowRight /></Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild><Button className="text-base">Entregar a atividade</Button></AlertDialogTrigger>
            <AlertDialogContent className="rounded-caixa border-linha sm:rounded-caixa!">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-titulo text-xl">Entregar a lista de estequiometria?</AlertDialogTitle>
                <AlertDialogDescription className="text-base text-apoio">
                  Você respondeu {feitas} de {QUESTOES.length} questões. Depois de entregar, não dá para mudar as respostas.
                  Seu professor vê o resultado antes de você.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 sm:space-x-0">
                <AlertDialogCancel className="mt-0 h-11 flex-1 text-base">Continuar respondendo</AlertDialogCancel>
                <AlertDialogAction className="h-11 flex-1 text-base" onClick={() => setEntregue(true)}>Entregar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      <p className="mt-4 text-base text-sutil">Pode parar quando quiser. Suas respostas ficam guardadas e você continua depois.</p>

      <NotaMockup>
        A3 (fatia do F6). Atividade objetiva online, gravada a cada item (regra 80, item 6). O Tutor fica disponível porque não é avaliação;
        em prova ele trava (ver Prova). Ponto de parada sempre visível e sem recompensa por terminar (D59).
      </NotaMockup>
    </TelaAluno>
  )
}
