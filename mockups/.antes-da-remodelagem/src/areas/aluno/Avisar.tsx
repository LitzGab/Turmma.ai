import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleCheck, Phone, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Cartao, NotaMockup } from '@/components/turmma/tela'
import { cn } from '@/lib/utils'
import { TelaAluno } from './_pecas'

/* "Avisar um adulto" (D61): o canal de notificação do ECA Digital, art. 28, na mão do aluno.
   Lista fechada do que aconteceu + texto opcional, quem recebe dito com clareza,
   e Cancelar do mesmo tamanho de Enviar (D59). */

const OPCOES = [
  { id: 'tutor', titulo: 'O Tutor disse algo errado ou estranho', detalhe: 'Uma resposta que não fez sentido, ou que não era sobre a matéria.' },
  { id: 'conteudo', titulo: 'Vi um conteúdo que não devia estar aqui', detalhe: 'Algo impróprio numa atividade, num material ou numa resposta.' },
  { id: 'dados', titulo: 'Acho que alguém viu algo meu que não devia', detalhe: 'Por exemplo, outra pessoa entrou na minha conta.' },
  { id: 'incomodo', titulo: 'Alguma coisa no sistema me incomodou', detalhe: 'Você não precisa saber explicar direito. Conte do seu jeito.' },
  { id: 'outro', titulo: 'Outra coisa', detalhe: 'Escreva abaixo o que aconteceu.' },
]

export function Avisar() {
  const [opcao, setOpcao] = useState('')
  const [enviado, setEnviado] = useState(false)

  if (enviado) {
    return (
      <TelaAluno titulo="Avisar um adulto" largura="conversa">
        <Cartao className="grid justify-items-center gap-4 py-10 text-center">
          <span className="grid size-14 place-items-center rounded-cartao bg-ok-cx text-ok"><CircleCheck className="size-7" strokeWidth={1.75} /></span>
          <h2 className="font-titulo text-[22px] font-semibold tracking-[-0.02em] text-tinta">Aviso enviado.</h2>
          <p className="max-w-[48ch] text-base leading-relaxed text-apoio">
            A orientação educacional da sua escola recebeu o seu aviso. Uma pessoa vai ler, não um programa. Ela pode procurar você na escola para conversar.
          </p>
          <p className="text-base text-sutil">Protocolo 2026-0917 · enviado em 21/09, às 10h42</p>
          <Button variant="secundario" className="text-base" asChild><Link to="/aluno">Voltar para o Tutor</Link></Button>
        </Cartao>
      </TelaAluno>
    )
  }

  return (
    <TelaAluno titulo="Avisar um adulto" largura="conversa"
      descricao="Viu algo errado no sistema, ou alguma coisa aqui incomodou você? Conte para um adulto da escola. Você não vai ter problema por avisar.">

      <form onSubmit={(e) => { e.preventDefault(); if (opcao) setEnviado(true) }} className="grid gap-5">
        <Cartao titulo="O que aconteceu?">
          <RadioGroup value={opcao} onValueChange={setOpcao} className="gap-2.5" aria-label="O que aconteceu">
            {OPCOES.map((o) => (
              <label key={o.id} htmlFor={`aviso-${o.id}`}
                className={cn('flex min-h-[60px] cursor-pointer items-start gap-3 rounded-controle border p-3.5 transition-colors duration-150',
                  opcao === o.id ? 'border-noite bg-info-cx' : 'border-linha bg-superficie hover:bg-realce')}>
                <RadioGroupItem id={`aviso-${o.id}`} value={o.id} className="mt-0.5 size-5 shrink-0 border-borda-campo text-noite data-[state=checked]:border-noite" />
                <span className="min-w-0">
                  <span className="block text-base font-semibold text-tinta">{o.titulo}</span>
                  <span className="block text-base text-apoio">{o.detalhe}</span>
                </span>
              </label>
            ))}
          </RadioGroup>

          <div className="mt-5 grid gap-2">
            <Label htmlFor="aviso-texto" className="text-base font-semibold text-tinta">Quer contar mais? <span className="font-normal text-sutil">(não é obrigatório)</span></Label>
            <Textarea id="aviso-texto" placeholder="Escreva com as suas palavras." className="min-h-[110px] rounded-controle border-borda-campo bg-superficie text-base" />
          </div>
        </Cartao>

        <Cartao className="grid gap-3">
          <p className="flex items-start gap-3 text-base leading-relaxed text-apoio">
            <UserRound className="mt-1 size-5 shrink-0 text-sutil" strokeWidth={1.75} />
            <span><b className="font-semibold text-tinta">Quem recebe:</b> a orientação educacional do Colégio Aurora. Uma pessoa lê o seu aviso. Seus colegas não ficam sabendo.</span>
          </p>
          <p className="flex items-start gap-3 text-base leading-relaxed text-apoio">
            <Phone className="mt-1 size-5 shrink-0 text-sutil" strokeWidth={1.75} />
            <span>Se você estiver em perigo agora, fale com um adulto perto de você. O CVV atende no 188, de graça, a qualquer hora.</span>
          </p>
        </Cartao>

        {/* Cancelar do mesmo tamanho de Enviar (D59) */}
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" variant="secundario" className="text-base" asChild><Link to="/aluno">Cancelar</Link></Button>
          <Button type="submit" className="text-base" disabled={!opcao}>Enviar aviso</Button>
        </div>
        {!opcao && <p className="text-base text-sutil">Escolha uma opção acima para enviar.</p>}
      </form>

      <NotaMockup>
        F9 / F12 (fora do MVP). D61: canal de notificação de violação do ECA Digital, art. 28, com o mesmo peso de qualquer item da lateral.
        A análise é humana e a tela diz isso. O aviso aparece para a coordenação em "Denúncias". Sair e cancelar nunca são mais difíceis que enviar (D59).
      </NotaMockup>
    </TelaAluno>
  )
}
