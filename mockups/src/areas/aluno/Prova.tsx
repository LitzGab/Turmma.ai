import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppWindow, ArrowLeft, ArrowRight, CircleCheck, Clock, HardDriveDownload, Lock, Save, WifiOff, type LucideIcon } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Cartao, NotaMockup } from '@/components/turmma/tela'
import { cn } from '@/lib/utils'
import { Alternativas, QUESTOES_ESTEQUIOMETRIA, RespostaSalva, TelaAluno } from './_pecas'

/* Prova online (F6, fora do MVP). Antes de começar o aluno LÊ o que vai acontecer (D70):
   sair da aba aparece para o professor, o Tutor pausa, cada resposta salva na hora e o relógio é do servidor.
   Em andamento: resposta salva por item, e queda de rede vira faixa calma — o tempo parado não conta (regra 80, item 6). */

const QUESTOES = QUESTOES_ESTEQUIOMETRIA
const AVISOS: { icone: LucideIcon; titulo: string; texto: string }[] = [
  { icone: AppWindow, titulo: 'Sair da aba da prova aparece para o seu professor.',
    texto: 'Se você trocar de aba ou de janela, o professor vê quantas vezes isso aconteceu. Nada acontece sozinho com a sua prova nem com o seu resultado. Isso só vale durante a prova.' },
  { icone: Lock, titulo: 'O Tutor fica pausado até você entregar.', texto: 'Durante a prova você responde sem ajuda do Tutor. Depois da entrega ele volta.' },
  { icone: Save, titulo: 'Cada resposta é salva na hora.', texto: 'Se a internet cair, as respostas ficam guardadas neste computador e vão para o sistema quando a rede voltar. O tempo parado não conta.' },
  { icone: Clock, titulo: 'O relógio da prova fica no sistema da escola.', texto: 'Mudar a hora do computador não muda o tempo da prova. Você tem 50 minutos.' },
]

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export function Prova() {
  const [fase, setFase] = useState<'antes' | 'andamento' | 'entregue'>('antes')
  const [atual, setAtual] = useState(0)
  const [respostas, setRespostas] = useState<Record<number, string>>({})
  const [semRede, setSemRede] = useState(false)
  const [resta, setResta] = useState(50 * 60)
  const feitas = Object.keys(respostas).length

  // O relógio é do servidor; aqui só simulamos. Com a rede caída ele para: o tempo parado não conta.
  useEffect(() => {
    if (fase !== 'andamento' || semRede) return
    const t = window.setInterval(() => setResta((r) => Math.max(0, r - 1)), 1000)
    return () => window.clearInterval(t)
  }, [fase, semRede])

  if (fase === 'antes') {
    return (
      <TelaAluno objeto largura="conversa" titulo="Prova de estequiometria" descricao="Química · Professora Camila · 8 questões · 50 minutos. Leia antes de começar.">
        <Cartao>
          <ul className="grid gap-5">
            {AVISOS.map((a) => {
              const Icone = a.icone
              return (
                <li key={a.titulo} className="flex items-start gap-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-controle bg-info-cx text-info"><Icone className="size-5" strokeWidth={1.75} /></span>
                  <div>
                    <p className="text-base font-semibold text-tinta">{a.titulo}</p>
                    <p className="text-base leading-relaxed text-apoio">{a.texto}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </Cartao>
        {/* Voltar do mesmo tamanho de começar: recusar nunca é mais difícil que aceitar (D59). */}
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Button variant="secundario" className="text-base" asChild><Link to="/aluno/atividades">Agora não, voltar</Link></Button>
          <Button className="text-base" onClick={() => setFase('andamento')}>Começar a prova</Button>
        </div>
        <NotaMockup>
          F6 (prova online, fora do MVP de apresentação). D70: o aluno é avisado antes; a saída da aba é fato mostrado só ao professor,
          sem consequência automática e sem histórico. Tutor travado em avaliação (seção 2). Regra 80, item 6: resposta nunca se perde.
        </NotaMockup>
      </TelaAluno>
    )
  }

  if (fase === 'entregue') {
    return (
      <TelaAluno objeto largura="conversa" titulo="Prova de estequiometria">
        <Cartao className="grid justify-items-center gap-4 py-10 text-center">
          <span className="grid size-14 place-items-center rounded-cartao bg-ok-cx text-ok"><CircleCheck className="size-7" strokeWidth={1.75} /></span>
          <h2 className="font-titulo text-[22px] font-semibold tracking-[-0.02em] text-tinta">Prova entregue.</h2>
          <p className="max-w-[46ch] text-base leading-relaxed text-apoio">
            Todas as suas respostas chegaram. Seu professor vê o resultado antes de você, e ele aparece em "Meu desempenho" depois que for aprovado.
          </p>
          <p className="text-base text-sutil">O Tutor já voltou a funcionar.</p>
          <Button variant="secundario" className="text-base" asChild><Link to="/aluno/atividades">Voltar para as atividades</Link></Button>
        </Cartao>
      </TelaAluno>
    )
  }

  const q = QUESTOES[atual]
  return (
    <div className="mx-auto w-full max-w-[760px] px-4 pb-16 md:px-8">
      {/* Barra presa no topo: onde estou, quanto tempo falta. O relógio não muda de cor nem pisca. */}
      <div className="sticky top-14 z-20 -mx-4 mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-linha bg-fundo px-4 py-3 md:top-0 md:-mx-8 md:px-8">
        <h1 className="font-corpo text-base font-semibold text-tinta">Prova de estequiometria <span className="font-normal text-sutil">· questão {atual + 1} de {QUESTOES.length}</span></h1>
        <p className="inline-flex items-center gap-1.5 text-base font-semibold tabular-nums text-tinta" role="timer">
          <Clock className="size-[18px] text-sutil" strokeWidth={1.75} /> Faltam {mmss(resta)}{semRede && <span className="font-normal text-sutil"> · parado</span>}
        </p>
      </div>

      {semRede && (
        <div role="status" className="mb-5 flex items-start gap-3 rounded-cartao bg-pendente-cx p-4 text-base leading-relaxed text-pendente">
          <WifiOff className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} />
          <p><b className="font-semibold">Sem conexão.</b> Suas respostas estão guardadas e vão ser enviadas quando a rede voltar. O tempo parado não conta.</p>
        </div>
      )}

      <Cartao className="grid gap-5">
        <p className="text-[17px] leading-relaxed text-tinta">{q.enunciado}</p>
        <Alternativas questao={q} nome={`p${atual}`} valor={respostas[atual]} aoEscolher={(v) => setRespostas((r) => ({ ...r, [atual]: v }))} />
        {semRede && respostas[atual]
          ? <p className="inline-flex h-7 items-center gap-1.5 text-base text-pendente" role="status"><HardDriveDownload className="size-4" /> Guardada neste computador. Vai ser enviada quando a rede voltar.</p>
          : <RespostaSalva salvo={!!respostas[atual]} />}
      </Cartao>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <Button variant="secundario" className="text-base" disabled={atual === 0} onClick={() => setAtual((a) => a - 1)}><ArrowLeft /> Anterior</Button>
        {atual < QUESTOES.length - 1 ? (
          <Button variant="secundario" className="text-base" onClick={() => setAtual((a) => a + 1)}>Próxima <ArrowRight /></Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild><Button className="text-base" disabled={semRede}>Entregar a prova</Button></AlertDialogTrigger>
            <AlertDialogContent className="rounded-caixa border-linha sm:rounded-caixa!">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-titulo text-xl">Entregar a prova de estequiometria?</AlertDialogTitle>
                <AlertDialogDescription className="text-base text-apoio">
                  Você respondeu {feitas} de {QUESTOES.length} questões e ainda faltam {mmss(resta)}. Depois de entregar, não dá para voltar.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 sm:space-x-0">
                <AlertDialogCancel className="mt-0 h-11 flex-1 text-base">Continuar a prova</AlertDialogCancel>
                <AlertDialogAction className="h-11 flex-1 text-base" onClick={() => setFase('entregue')}>Entregar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <ol className="mt-5 flex flex-wrap gap-1.5" aria-label="Questões">
        {QUESTOES.map((_, i) => (
          <li key={i}>
            <button type="button" onClick={() => setAtual(i)} aria-label={`Ir para a questão ${i + 1}${respostas[i] ? ', respondida' : ''}`}
              className={cn('grid size-11 place-items-center rounded-controle border text-base font-medium transition-colors duration-150 md:size-9',
                i === atual ? 'border-noite bg-noite text-white' : respostas[i] ? 'border-linha bg-realce text-tinta' : 'border-linha bg-superficie text-sutil hover:bg-realce')}>
              {i + 1}
            </button>
          </li>
        ))}
      </ol>

      <p className="mt-5 text-base text-sutil">Saídas da aba nesta prova: 0. Seu professor vê este número. O Tutor está pausado.</p>

      <label className="mt-6 flex w-fit items-center gap-3 rounded-controle border border-dashed border-linha px-3 py-2">
        <span className="text-xs font-medium text-sutil">Simular queda de rede</span>
        <Switch checked={semRede} onCheckedChange={setSemRede} aria-label="Simular queda de rede" className="data-[state=checked]:bg-noite data-[state=unchecked]:bg-borda-campo" />
      </label>

      <NotaMockup>
        F6 (prova resiliente, fora do MVP). Gravação a cada item, reenvio quando a conexão volta e relógio no servidor: queda do sistema
        não conta como tempo do aluno (regra 80, item 6). O contador de saídas da aba visível ao próprio aluno é proposta deste mockup (D70 só exige o aviso antes).
      </NotaMockup>
    </div>
  )
}
