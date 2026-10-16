import { useState } from 'react'
import { Check, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { AvatarAgente, Estado } from '@/components/turmma/ia'
import { Cartao, NotaMockup } from '@/components/turmma/tela'
import { TelaAluno } from './_pecas'

/* "O que o Tutor sabe de mim" (D66). A memória é sobre o TRABALHO do aluno, nunca sobre a pessoa:
   atividades e avaliações com resultado, resumos de sessão em formato fixo, e o que o professor pediu
   para reforçar. O aluno vê tudo e pode contestar cada item. */

const TRABALHOS = [
  { id: 't1', titulo: 'Lista de balanceamento', quando: '10/09', resultado: '6 de 8', assunto: 'conservação da massa, equação balanceada' },
  { id: 't2', titulo: 'Lista de mol e massa molar', quando: '15/09', resultado: '3 de 8', assunto: 'passar de massa para mol' },
  { id: 't3', titulo: 'Exercícios de reagente limitante', quando: 'em aberto', resultado: 'não entregue', assunto: 'reagente limitante' },
]

/* Resumo de sessão em FORMATO FIXO: cinco campos, sempre os mesmos. Não existe campo de texto livre. */
const SESSOES = [
  { id: 's1', quando: '16/09, na aula de Química', campos: { Assunto: 'Estequiometria', Habilidade: 'Passar de massa para mol', Exercício: 'Lista de mol, questão 3', 'Onde travou': 'Dividiu a massa molar pela massa, em vez do contrário', 'Como terminou': 'Refez a conta e acertou' } },
  { id: 's2', quando: '18/09, na aula de Química', campos: { Assunto: 'Estequiometria', Habilidade: 'Achar o reagente limitante', Exercício: 'Lista de estequiometria, questão 4', 'Onde travou': 'Comparou as massas direto, sem passar para mol', 'Como terminou': 'A aula acabou antes de terminar' } },
]

const REFORCO = [
  { id: 'r1', texto: 'Passar de massa para mol', quem: 'Professora Camila · 17/09' },
  { id: 'r2', texto: 'Foco da semana no 2ºB: reagente limitante e rendimento', quem: 'Professora Camila · para a turma toda' },
]

const MOTIVOS = ['Isso não aconteceu assim', 'Esse resultado está errado', 'Não quero que o Tutor use isso']

export function Memoria() {
  const [aberto, setAberto] = useState<string | null>(null)
  const [contestados, setContestados] = useState<string[]>([])
  const [motivo, setMotivo] = useState(MOTIVOS[0])

  const contestar = (id: string) => contestados.includes(id)
    ? <Estado tipo="pendente" size="lg">Contestado: a professora vai olhar</Estado>
    : <Button variant="secundario" size="sm" className="h-11 text-base md:h-10" onClick={() => setAberto(id)}>Contestar</Button>

  return (
    <TelaAluno titulo="O que o Tutor sabe de mim"
      descricao="O Tutor guarda o que você FEZ no sistema: atividades, provas e as conversas de estudo. Ele nunca guarda nada sobre o seu jeito, o seu humor ou o seu comportamento.">

      <div className="mb-6 flex items-start gap-3 rounded-cartao bg-info-cx p-4 text-base leading-relaxed text-info">
        <AvatarAgente id="tutor" tamanho={32} />
        <p>O Tutor usa esta lista para saber por onde começar a ajudar. Se alguma coisa estiver errada, toque em <b className="font-semibold">Contestar</b>. Quem olha é a sua professora, não um programa.</p>
      </div>

      <section className="mb-8">
        <h2 className="rotulo mb-3">Atividades e provas</h2>
        <ul className="grid gap-2.5">
          {TRABALHOS.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-cartao border border-linha bg-superficie p-4">
              <div className="min-w-0">
                <p className="text-base font-semibold text-tinta">{t.titulo} <span className="font-normal text-sutil">· {t.quando}</span></p>
                <p className="text-base text-apoio">Resultado: {t.resultado} · Assunto: {t.assunto}</p>
              </div>
              {contestar(t.id)}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="rotulo mb-3">Resumos das conversas de estudo</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {SESSOES.map((s) => (
            <Cartao key={s.id} titulo={s.quando} acao={contestar(s.id)}>
              <dl className="grid gap-2.5 text-base">
                {Object.entries(s.campos).map(([k, v]) => (
                  <div key={k} className="grid gap-0.5 sm:grid-cols-[130px_1fr] sm:gap-3">
                    <dt className="font-medium text-sutil">{k}</dt>
                    <dd className="text-tinta">{v}</dd>
                  </div>
                ))}
              </dl>
            </Cartao>
          ))}
        </div>
        <p className="mt-3 text-base text-sutil">Todo resumo tem sempre estes cinco campos. As conversas inteiras são apagadas depois de um tempo; só o resumo fica.</p>
      </section>

      <section className="mb-2">
        <h2 className="rotulo mb-3">O que sua professora pediu para reforçar</h2>
        <ul className="grid gap-2.5">
          {REFORCO.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-cartao border border-linha bg-superficie p-4">
              <div className="min-w-0">
                <p className="text-base font-semibold text-tinta">{r.texto}</p>
                <p className="inline-flex items-center gap-1.5 text-base text-apoio"><UserRound className="size-4" /> {r.quem}</p>
              </div>
              {contestar(r.id)}
            </li>
          ))}
        </ul>
      </section>

      <Dialog open={aberto !== null} onOpenChange={(o) => { if (!o) setAberto(null) }}>
        <DialogContent className="rounded-caixa border-linha sm:rounded-caixa!">
          <DialogHeader>
            <DialogTitle className="font-titulo text-xl">Contestar este item</DialogTitle>
            <DialogDescription className="text-base text-apoio">Diga o que está errado. A professora Camila recebe o seu pedido e responde. Até lá, o item fica marcado como contestado.</DialogDescription>
          </DialogHeader>
          <RadioGroup value={motivo} onValueChange={setMotivo} className="gap-2" aria-label="Motivo">
            {MOTIVOS.map((m) => (
              <label key={m} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-controle border border-linha px-3 text-base text-tinta hover:bg-realce">
                <RadioGroupItem value={m} className="size-5 border-borda-campo text-noite data-[state=checked]:border-noite" /> {m}
              </label>
            ))}
          </RadioGroup>
          <Textarea aria-label="Quer explicar? (opcional)" placeholder="Quer explicar? (não é obrigatório)" className="min-h-[88px] rounded-controle border-borda-campo bg-superficie text-base" />
          <DialogFooter className="gap-2 sm:space-x-0">
            <DialogClose asChild><Button variant="secundario" className="flex-1 text-base">Cancelar</Button></DialogClose>
            <Button className="flex-1 text-base" onClick={() => { if (aberto) setContestados((c) => [...c, aberto]); setAberto(null) }}><Check /> Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NotaMockup>
        A4 / F9. D66: a memória alcança atividades, avaliações e sessões, pelo registro do trabalho — nenhum campo guarda texto sobre o jeito, o humor ou o
        comportamento do aluno, e o resumo de sessão tem formato fixo. O aluno vê o que o Tutor sabe e contesta, com análise humana (D60; regra 70, item 4d).
      </NotaMockup>
    </TelaAluno>
  )
}
