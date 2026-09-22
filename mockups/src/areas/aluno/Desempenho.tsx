import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, MessageCircleQuestion, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { AssinaturaIA, ChipFonte, LinhaAprovacao } from '@/components/turmma/ia'
import { Cartao, NotaMockup } from '@/components/turmma/tela'
import { BarraCalma, TelaAluno } from './_pecas'

/* Meu desempenho: SÓ do próprio aluno (seção 2). Barras em cor neutra, sem média da turma,
   sem ranking, sem número subindo. Tudo que veio de IA está assinado e foi aprovado pelo professor. */

const MINHAS_HABILIDADES = [
  { nome: 'Conservar a massa e usar proporções', acertos: 7, total: 8 },
  { nome: 'Passar de massa para mol', acertos: 3, total: 8 },
  { nome: 'Ler uma equação balanceada', acertos: 6, total: 8 },
  { nome: 'Achar o reagente limitante', acertos: 2, total: 6 },
  { nome: 'Calcular o rendimento', acertos: 4, total: 6 },
]

function PedirRevisao() {
  const [enviado, setEnviado] = useState(false)
  return (
    <Dialog onOpenChange={(o) => { if (!o) setEnviado(false) }}>
      <DialogTrigger asChild><Button variant="secundario" className="text-base">Pedir para o professor rever</Button></DialogTrigger>
      <DialogContent className="rounded-caixa border-linha sm:rounded-caixa!">
        <DialogHeader>
          <DialogTitle className="font-titulo text-xl">Pedir para o professor rever</DialogTitle>
          <DialogDescription className="text-base text-apoio">Achou que algum resultado está errado? Escreva o que você acha. Quem olha é a professora Camila, não um programa.</DialogDescription>
        </DialogHeader>
        {enviado ? (
          <p className="flex items-center gap-2 rounded-controle bg-ok-cx p-3 text-base text-ok"><Check className="size-5" /> Pedido enviado para a professora Camila.</p>
        ) : (
          <Textarea aria-label="O que você acha que está errado" placeholder="Exemplo: na questão 5 eu marquei a C, mas apareceu como errada." className="min-h-[120px] rounded-controle border-borda-campo bg-superficie text-base" />
        )}
        <DialogFooter className="gap-2 sm:space-x-0">
          <DialogClose asChild><Button variant="secundario" className="flex-1 text-base">{enviado ? 'Fechar' : 'Cancelar'}</Button></DialogClose>
          {!enviado && <Button className="flex-1 text-base" onClick={() => setEnviado(true)}>Enviar pedido</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function Desempenho() {
  return (
    <TelaAluno titulo="Meu desempenho" descricao="Só você e seus professores veem esta tela. Aqui não aparece o resultado de nenhum colega.">
      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Cartao titulo="Química · acertos por assunto">
          <div className="grid gap-5">
            {MINHAS_HABILIDADES.map((h) => (
              <BarraCalma key={h.nome} rotulo={h.nome} valor={h.acertos} maximo={h.total} texto={`${h.acertos} de ${h.total}`} />
            ))}
          </div>
          <p className="mt-5 text-base text-sutil">Conta as listas e a prova de setembro que sua professora já aprovou.</p>
        </Cartao>

        <Cartao titulo="O que vale reforçar">
          <ul className="grid gap-4 text-base text-apoio">
            <li>
              <p className="font-semibold text-tinta">Passar de massa para mol</p>
              <p>Você acertou 3 de 8. A explicação está no seu livro <ChipFonte pagina={145} />.</p>
            </li>
            <li>
              <p className="font-semibold text-tinta">Achar o reagente limitante</p>
              <p>Você acertou 2 de 6. Veja o exemplo resolvido <ChipFonte pagina={151} />.</p>
            </li>
          </ul>
          <Button variant="secundario" className="mt-5 text-base" asChild><Link to="/aluno"><MessageCircleQuestion /> Estudar isso com o Tutor</Link></Button>
        </Cartao>
      </div>

      <section className="mt-8">
        <h2 className="rotulo mb-3">Devolutivas dos professores</h2>
        <div className="grid gap-3">
          <Cartao>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-base font-semibold text-tinta">Lista de balanceamento · 6 de 8</p>
              <AssinaturaIA id="corretor" />
            </div>
            <p className="mt-3 text-base leading-relaxed text-apoio">
              Você acertou todas as de conservação da massa. Errou as duas em que era preciso passar de massa para mol antes de comparar.
            </p>
            <LinhaAprovacao className="mt-3 text-base" quando="12/09, 14h10" />
          </Cartao>
          <Cartao>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-base font-semibold text-tinta">Questão escrita sobre a lei de Lavoisier</p>
              <p className="inline-flex items-center gap-1.5 text-base text-apoio"><UserRound className="size-4" /> Escrita pela professora Camila</p>
            </div>
            <p className="mt-3 text-base leading-relaxed text-apoio">
              "Boa explicação do experimento. Faltou dizer por que o sistema precisa estar fechado. Reescreva só esse trecho e me mostre na quinta."
            </p>
            <p className="mt-3 text-base text-sutil">Em resposta escrita, quem lê e comenta é sempre a professora. Nenhum programa avalia o seu texto.</p>
          </Cartao>
        </div>
        <div className="mt-5"><PedirRevisao /></div>
      </section>

      <NotaMockup>
        A3 / F9. Só o próprio aluno (regra 50, item 9). Diagnóstico de objetiva assinado pelo Corretor e só visível depois de aprovado (regra 70, item 3);
        em discursiva a devolutiva é do professor, sem IA (D55). Caminho de contestação com análise humana (D60). Barras neutras, sem comparação com a turma.
      </NotaMockup>
    </TelaAluno>
  )
}
