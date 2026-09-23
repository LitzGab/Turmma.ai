import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Eye, FolderLock, LogOut, MessageCircleQuestion, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { AvatarAgente } from '@/components/turmma/ia'
import { Cartao, NotaMockup } from '@/components/turmma/tela'
import { TelaAluno } from './_pecas'

/* Aviso de privacidade em linguagem de faixa etária (seção 2; D61, D65). Palavra de 11 anos, frase curta.
   O caminho de sair e de pedir para apagar é tão curto quanto o de entrar (D59). */

const GUARDAMOS = ['Seu nome e sua turma', 'Sua matrícula, para você entrar', 'As atividades e provas que você fez aqui', 'Suas conversas de estudo com o Tutor, por pouco tempo']
const NAO_TEMOS = ['Seu e-mail', 'Sua foto', 'Seu endereço ou telefone', 'Sua data de nascimento', 'Nada sobre a sua saúde', 'Nada sobre o seu jeito ou o seu humor']

const QUEM_VE = [
  { quem: 'Você', oque: 'Tudo o que é seu: atividades, resultados e o que o Tutor sabe de você.' },
  { quem: 'Seus professores', oque: 'Suas atividades, seus resultados e como você usa o Tutor nas aulas deles.' },
  { quem: 'A coordenação', oque: 'Os números da turma toda juntos. Para ver algo só seu, fica registrado quem abriu e por quê.' },
  { quem: 'Seus colegas', oque: 'Nada. Nenhum colega vê o seu resultado, e você não vê o deles.' },
  { quem: 'A Turmma (quem faz o sistema)', oque: 'Só cuida do sistema para a escola. Não vende nem usa seus dados para propaganda.' },
]

function PedirParaApagar() {
  const [enviado, setEnviado] = useState(false)
  return (
    <Dialog onOpenChange={(o) => { if (!o) setEnviado(false) }}>
      <DialogTrigger asChild><Button variant="secundario" className="text-base"><FolderLock /> Pedir para ver ou apagar meus dados</Button></DialogTrigger>
      <DialogContent className="rounded-caixa border-linha sm:rounded-caixa!">
        <DialogHeader>
          <DialogTitle className="font-titulo text-xl">Ver ou apagar meus dados</DialogTitle>
          <DialogDescription className="text-base text-apoio">
            O pedido vai para a secretaria da sua escola. Como você é menor de idade, ela confirma com o seu responsável antes de apagar.
          </DialogDescription>
        </DialogHeader>
        {enviado && <p className="flex items-center gap-2 rounded-controle bg-ok-cx p-3 text-base text-ok"><Check className="size-5" /> Pedido enviado para a secretaria.</p>}
        <DialogFooter className="gap-2 sm:space-x-0">
          <DialogClose asChild><Button variant="secundario" className="flex-1 text-base">{enviado ? 'Fechar' : 'Cancelar'}</Button></DialogClose>
          {!enviado && <Button variant="secundario" className="flex-1 text-base" onClick={() => setEnviado(true)}>Enviar pedido</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function Privacidade() {
  return (
    <TelaAluno titulo="Privacidade" descricao="O que a Turmma guarda sobre você, quem pode ver, e como sair. Em dois minutos de leitura.">
      <div className="grid gap-5 lg:grid-cols-2">
        <Cartao titulo="O que guardamos">
          <ul className="grid gap-2.5 text-base text-apoio">
            {GUARDAMOS.map((g) => <li key={g} className="flex items-start gap-2.5"><Check className="mt-1 size-4 shrink-0 text-ok" strokeWidth={2.4} /> {g}</li>)}
          </ul>
        </Cartao>
        <Cartao titulo="O que NÃO temos">
          <ul className="grid gap-2.5 text-base text-apoio">
            {NAO_TEMOS.map((g) => <li key={g} className="flex items-start gap-2.5"><X className="mt-1 size-4 shrink-0 text-sutil" strokeWidth={2.4} /> {g}</li>)}
          </ul>
        </Cartao>
      </div>

      <Cartao titulo="Quem vê o quê" className="mt-5">
        <dl className="grid gap-3.5">
          {QUEM_VE.map((l) => (
            <div key={l.quem} className="grid gap-0.5 border-b border-linha pb-3.5 last:border-0 last:pb-0 sm:grid-cols-[220px_1fr] sm:gap-4">
              <dt className="text-base font-semibold text-tinta">{l.quem}</dt>
              <dd className="text-base leading-relaxed text-apoio">{l.oque}</dd>
            </div>
          ))}
        </dl>
      </Cartao>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Cartao>
          <div className="mb-3 flex items-center gap-2.5"><AvatarAgente id="tutor" tamanho={32} /><h2 className="font-corpo text-base font-semibold text-tinta">O Tutor é um programa</h2></div>
          <p className="text-base leading-relaxed text-apoio">
            O Tutor é um programa de computador, não uma pessoa. Ele lê o material da sua turma e faz perguntas para você pensar. Ele pode errar.
          </p>
          <p className="mt-3 flex items-start gap-2.5 text-base leading-relaxed text-apoio"><Eye className="mt-1 size-4 shrink-0 text-sutil" /> Seu professor vê como você usa o Tutor. Isso está sempre escrito no topo da conversa.</p>
          <Button variant="secundario" className="mt-4 text-base" asChild><Link to="/aluno/memoria"><MessageCircleQuestion /> Ver o que o Tutor sabe de mim</Link></Button>
        </Cartao>

        <Cartao titulo="Sair e pedir para apagar">
          <p className="text-base leading-relaxed text-apoio">
            Sair é um clique, igual a entrar. Pedir para ver ou apagar seus dados também: o botão está aqui, sem formulário comprido.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secundario" className="text-base" asChild><Link to="/entrar"><LogOut /> Sair agora</Link></Button>
            <PedirParaApagar />
          </div>
          <p className="mt-4 text-base text-sutil">Viu algo errado? Use <Link to="/aluno/avisar" className="font-medium text-caramelo-texto underline underline-offset-4">Avisar um adulto</Link>.</p>
        </Cartao>
      </div>

      <NotaMockup>
        F9 / F3 (fora do MVP). Aviso em linguagem de faixa etária (D43, D61) e letramento em IA numa das três portas (D65). Aluno sem e-mail, foto, endereço
        ou data de nascimento (regra 20, item 2). Sair e revogar nunca mais longos que aceitar (D59). A confirmação com o responsável no pedido de eliminação é proposta deste mockup.
      </NotaMockup>
    </TelaAluno>
  )
}
