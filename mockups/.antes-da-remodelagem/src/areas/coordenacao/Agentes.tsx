import { useState } from 'react'
import { Ban, Check, Hourglass, PauseCircle, Play, ShieldAlert } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge-2'
import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AvatarAgente, Estado, SeloIA } from '@/components/turmma/ia'
import { NotaMockup, Tela } from '@/components/turmma/tela'
import { LISTA_AGENTES, agente, type AgenteId } from '@/dados/agentes'
import { COORDENADORA, hoje } from '@/dados/escola'
import { cn } from '@/lib/utils'
import { Aviso, CANTO_DIALOGO, ListaMarcada } from './_a-pecas'

/* Agentes (11.7): um cartão por agente — agora três, um por pessoa da escola (revisão da D32, 19/09/2026). No Assistente,
   a autonomia, a AIA e a suspensão são POR FUNÇÃO (D9, D60). Em cada um: o que faz sozinho, o que espera aprovação, o que nunca faz,
   em português comum (D9). É a tela para apontar quando alguém pergunta "o que essa IA faz sozinha?".
   Os de alto risco mostram o resumo da Avaliação de Impacto Algorítmico e podem ser suspensos na escola (D60). */

const AIA: Partial<Record<AgenteId, { versao: string; finalidade: string; riscos: string[]; salvaguardas: string[]; contestar: string }>> = {
  tutor: {
    versao: 'AIA v1.2 · revista em 02/09/2026',
    finalidade: 'Ajudar o aluno a estudar o conteúdo da turma por perguntas, com o professor acompanhando.',
    riscos: ['Entregar resposta pronta e tirar o esforço do aluno', 'Aluno tratar o Tutor como pessoa', 'Assunto pessoal delicado aparecer na conversa'],
    salvaguardas: ['Escopo preso ao material da turma, aplicado no servidor', 'Diz o que é quando perguntado, e que pode errar', 'Mensagem fixa revisada pela escola e sinal ao professor, sem o conteúdo', 'Pacote de 60 perguntas por dia, com o ponto de parada visível'],
    contestar: 'O aluno vê o que o Tutor sabe do trabalho dele e pode contestar. O professor pode corrigir um sinal.',
  },
  corretor: {
    versao: 'AIA v1.1 · revista em 02/09/2026',
    finalidade: 'Corrigir objetivas e montar o diagnóstico por habilidade para o professor validar.',
    riscos: ['Gabarito errado propagar para a turma inteira', 'Aprovação virar clique reflexo', 'Correção de discursiva por IA'],
    salvaguardas: ['Destaca casos fora da curva, que precisam ser abertos antes de aprovar', 'Registro da validação: o que foi mostrado, o que foi aberto, quem confirmou', 'Em redação e discursiva não produz nada sobre o texto do aluno'],
    contestar: 'O professor rejeita com justificativa; o aluno pede revisão ao professor.',
  },
  adaptador: {
    versao: 'AIA v1.0 · 28/08/2026',
    finalidade: 'Propor a versão adaptada de prova e atividade a partir do tipo de adaptação registrado.',
    riscos: ['Guardar dado sensível de saúde', 'Baixar o que é cobrado do aluno'],
    salvaguardas: ['Recebe só o tipo de adaptação, de lista fechada; não há campo de texto livre', 'Muda a forma, nunca o conteúdo cobrado', 'Toda versão nasce pendente e só chega ao aluno com o professor aprovando'],
    contestar: 'Professor rejeita com justificativa; família e aluno falam com a coordenação.',
  },
  analista: {
    versao: 'AIA v1.0 · 28/08/2026',
    finalidade: 'Avisar a coordenação de mudança relevante de desempenho e de consumo, em agregado.',
    riscos: ['Virar vigilância ou ranking de professor', 'Expor aluno em risco para quem não é o professor dele'],
    salvaguardas: ['Agregado só com dois ou mais professores no recorte', 'Nominal só com finalidade e auditoria', 'Alerta é hipótese com contexto; não recomenda decisão'],
    contestar: 'O professor vê primeiro o próprio indicador e pode pedir revisão (LGPD, art. 20).',
  },
}

export function Agentes() {
  const [aia, setAia] = useState<AgenteId | null>(null)
  const [suspender, setSuspender] = useState<AgenteId | null>(null)
  const [suspensos, setSuspensos] = useState<AgenteId[]>([])

  return (
    <Tela titulo="Agentes"
      descricao="Cada agente, o que faz sozinho e o que espera uma pessoa da escola. É esta tela que responde à pergunta: o que essa IA faz sozinha?">
      <Aviso tom="info" className="mb-5">
        A regra é a mesma para todos: <b>o agente prepara, a escola aprova</b> antes de valer — sempre que houver nota, conversa com a família ou
        decisão sobre aluno. A única exceção é a resposta do Tutor, que acontece na hora e por isso é acompanhada pelo professor.
      </Aviso>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {LISTA_AGENTES.map((a) => {
          const suspenso = suspensos.includes(a.id)
          return (
            <article key={a.id} className={cn('flex flex-col rounded-cartao border bg-superficie p-4 lg:p-5', suspenso ? 'border-dashed border-borda-campo' : 'border-linha')}>
              <header className="flex items-start gap-3">
                <AvatarAgente id={a.id} tamanho={48} className={suspenso ? 'opacity-50' : undefined} />
                <div className="min-w-0 flex-1">
                  <h2 className="flex flex-wrap items-center gap-2 font-corpo text-base font-semibold leading-snug text-tinta">{a.nome} <SeloIA /></h2>
                  <p className="text-[13px] text-sutil">Para: {a.paraQuem}</p>
                </div>
              </header>

              <p className="mt-3 rounded-controle bg-ia-cx px-3 py-2 text-sm leading-snug text-apoio">
                <span className="rotulo mr-1.5">Autonomia</span><b className="font-semibold text-tinta">{a.autonomia}</b>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-apoio">{a.resumo}</p>

              {a.funcoes && (
                <ul className="mt-4 grid gap-px overflow-hidden rounded-controle border border-linha bg-linha">
                  {a.funcoes.map((f) => {
                    const legado = ({ correcao: 'corretor', adaptacao: 'adaptador' } as Record<string, AgenteId>)[f.id]
                    const parada = legado ? suspensos.includes(legado) : false
                    return (
                      <li key={f.id} className={cn('grid gap-1.5 bg-superficie px-3 py-2.5', parada && 'bg-erro-cx')}>
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] font-semibold text-tinta">
                          <f.icone className="size-4 shrink-0" /> {f.nome}
                          {f.altoRisco && <Badge variant="pendente" size="sm">Alto risco</Badge>}
                          {parada && <Badge variant="erro" size="sm">Suspensa</Badge>}
                        </p>
                        <p className="text-[13px] leading-snug text-sutil">{f.autonomia}</p>
                        {legado && (
                          <p className="flex flex-wrap gap-1">
                            <Button variant="discreto" size="sm" className="h-8 px-2.5" onClick={() => setAia(legado)}>Resumo da AIA</Button>
                            {parada
                              ? <Button variant="discreto" size="sm" className="h-8 px-2.5" onClick={() => setSuspensos((x) => x.filter((y) => y !== legado))}><Play /> Reativar</Button>
                              : <Button variant="perigo" size="sm" className="h-8 px-2.5" onClick={() => setSuspender(legado)}><PauseCircle /> Suspender só esta função</Button>}
                          </p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}

              <div className="mb-5 mt-4 grid gap-4">
                <div><p className="rotulo mb-2">Faz sozinho</p><ListaMarcada itens={a.fazSozinho} icone={<Check strokeWidth={2.4} />} cor="text-ok" /></div>
                <div><p className="rotulo mb-2">Espera aprovação</p><ListaMarcada itens={a.esperaAprovacao} icone={<Hourglass strokeWidth={2} />} cor="text-pendente" /></div>
                <div><p className="rotulo mb-2">Nunca faz</p><ListaMarcada itens={a.nuncaFaz} icone={<Ban strokeWidth={2} />} cor="text-erro" /></div>
              </div>

              <footer className="mt-auto flex flex-wrap items-center gap-2 border-t border-linha pt-4">
                {suspenso
                  ? <Estado tipo="erro">Suspenso nesta escola</Estado>
                  : a.altoRisco ? <Badge variant="pendente"><ShieldAlert strokeWidth={2.2} /> Alto risco · AIA</Badge> : <Estado tipo="contorno">Risco comum</Estado>}
                <span className="flex-1" />
                {a.altoRisco && !a.funcoes && <Button variant="discreto" size="sm" onClick={() => setAia(a.id)}>Ver resumo da AIA</Button>}
                {suspenso
                  ? <Button variant="secundario" size="sm" onClick={() => setSuspensos((s) => s.filter((x) => x !== a.id))}><Play /> Reativar</Button>
                  : a.altoRisco && !a.funcoes && <Button variant="perigo" size="sm" onClick={() => setSuspender(a.id)}><PauseCircle /> Suspender nesta escola</Button>}
              </footer>
              {suspenso && <p className="mt-3 rounded-linha bg-erro-cx px-3 py-2 text-[13px] leading-snug text-erro">Suspenso por {COORDENADORA.nome} · {hoje.curta}, {hoje.hora}. Fica registrado em auditoria.</p>}
            </article>
          )
        })}
      </div>

      {/* Resumo da Avaliação de Impacto Algorítmico (D60) */}
      <Dialog open={aia !== null} onOpenChange={(v) => { if (!v) setAia(null) }}>
        <DialogContent className={cn(CANTO_DIALOGO, 'max-h-[88svh] max-w-xl overflow-y-auto')}>
          {aia && AIA[aia] && (
            <>
              <DialogHeader className="text-left">
                <div className="flex items-center gap-3">
                  <AvatarAgente id={aia} tamanho={40} />
                  <div>
                    <DialogTitle className="font-titulo text-[20px] font-semibold tracking-[-0.02em] text-tinta">Avaliação de impacto · {agente(aia).curto}</DialogTitle>
                    <DialogDescription className="text-sm text-sutil">{AIA[aia]!.versao}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="grid gap-4 text-[15px] leading-relaxed text-apoio">
                <div><p className="rotulo mb-1.5">Para que serve</p><p className="text-tinta">{AIA[aia]!.finalidade}</p></div>
                <div><p className="rotulo mb-2">Riscos que olhamos</p><ListaMarcada itens={AIA[aia]!.riscos} icone={<ShieldAlert strokeWidth={2} />} cor="text-pendente" /></div>
                <div><p className="rotulo mb-2">O que segura cada risco</p><ListaMarcada itens={AIA[aia]!.salvaguardas} icone={<Check strokeWidth={2.4} />} cor="text-ok" /></div>
                <div><p className="rotulo mb-2">O que ele não deve fazer</p><ListaMarcada itens={agente(aia).nuncaFaz} icone={<Ban strokeWidth={2} />} cor="text-erro" /></div>
                <div><p className="rotulo mb-1.5">Como contestar</p><p>{AIA[aia]!.contestar}</p></div>
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <Button variant="secundario">Baixar a AIA completa em PDF</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Suspender é ação destrutiva: o diálogo diz o que acontece com o que o agente já produziu */}
      <AlertDialog open={suspender !== null} onOpenChange={(v) => { if (!v) setSuspender(null) }}>
        <AlertDialogContent className={CANTO_DIALOGO}>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="font-titulo text-[20px] font-semibold tracking-[-0.02em] text-tinta">Suspender o {suspender && agente(suspender).curto} no Colégio Aurora?</AlertDialogTitle>
            <AlertDialogDescription className="text-[15px] leading-relaxed text-apoio">Vale a partir de agora, para todas as turmas, até alguém da coordenação reativar.</AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="grid gap-2 text-[15px] leading-snug text-tinta">
            {[
              'Ele para de rodar e de avisar. Nada novo é gerado por ele.',
              'O que já foi aprovado continua valendo e fica na biblioteca e na auditoria.',
              'O que estava esperando aprovação fica guardado, sem chegar a aluno.',
              'Professores e, se for o Tutor, alunos veem um aviso calmo de que ele está desligado.',
            ].map((t) => <li key={t} className="flex gap-2.5"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-sutil" />{t}</li>)}
          </ul>
          <AlertDialogFooter className="gap-2 sm:space-x-0">
            <AlertDialogCancel className="mt-0">Manter ligado</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: 'destructive' })}
              onClick={() => { if (suspender) setSuspensos((s) => [...s, suspender]); setSuspender(null) }}>
              Suspender o {suspender && agente(suspender).curto}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NotaMockup>
        Spec A5 (fatia do F12; a suspensão por escola é do F11 completo). D9: autonomia declarada e visível, em português comum. D17 e D58: nome
        e avatar de função, sem rosto. D60: resumo da AIA com escopo negativo e procedimento de suspensão nos quatro agentes de alto risco.
        D47: a exceção do Tutor dita no aviso do topo.
      </NotaMockup>
    </Tela>
  )
}
