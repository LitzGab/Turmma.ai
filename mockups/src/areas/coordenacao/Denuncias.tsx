import { useState } from 'react'
import { Cpu, Flag, Inbox, Lock, Scale, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Estado } from '@/components/turmma/ia'
import { NotaMockup, NumeroPainel, Tela } from '@/components/turmma/tela'
import { AvisoInfo, dialogo, Par, Segmentos, TabelaResponsiva, type Coluna } from './_b-pecas'

/* Denúncias: o canal de notificação de violação (ECA Digital, art. 28; D61).
   Cada notificação diz o que foi apontado, o que foi feito, o prazo, o recurso —
   e se a análise foi HUMANA ou AUTOMATIZADA. O conteúdo de conversa de aluno não aparece na lista. */

type Situacao = 'aberta' | 'analise' | 'concluida'
type Notificacao = {
  id: string; origem: string; categoria: string; recebida: string; prazo: string
  analise: 'humana' | 'automatizada'; situacao: Situacao; recurso: boolean
  apontado: string; feito: { quando: string; oQue: string }[]
}

const INICIAIS: Notificacao[] = [
  { id: 'N-2026-0031', origem: 'Avisar um adulto · aluno do 2ºB', categoria: 'Resposta da IA que pareceu errada', recebida: '21/09, 9h12', prazo: 'até 23/09', analise: 'humana', situacao: 'aberta', recurso: false,
    apontado: 'O aluno marcou "o Tutor disse uma coisa que parece errada" em uma sessão de estequiometria de 21/09.',
    feito: [{ quando: '21/09, 9h12', oQue: 'Recebida. A orientação educacional foi avisada dentro do horário da escola.' }] },
  { id: 'N-2026-0030', origem: 'Avisar um adulto · aluno do 9ºA', categoria: 'Algo no sistema me deixou desconfortável', recebida: '18/09, 14h40', prazo: 'até 22/09', analise: 'humana', situacao: 'analise', recurso: false,
    apontado: 'O aluno escolheu "outra coisa" e pediu para falar com alguém. Não descreveu o motivo por escrito.',
    feito: [{ quando: '18/09, 14h40', oQue: 'Recebida e encaminhada à orientação educacional.' }, { quando: '19/09, 8h05', oQue: 'A orientadora conversou com o aluno em sala. Aguardando retorno da família.' }] },
  { id: 'N-2026-0029', origem: 'Sistema · filtro de conteúdo', categoria: 'Tentativa de assunto fora do conteúdo escolar', recebida: '17/09, 10h22', prazo: 'até 19/09', analise: 'automatizada', situacao: 'concluida', recurso: false,
    apontado: 'O filtro barrou um pedido fora do conteúdo da turma no Tutor. O Tutor respondeu com a mensagem fixa e não seguiu no assunto.',
    feito: [{ quando: '17/09, 10h22', oQue: 'Barrado automaticamente. Nenhum conteúdo foi gerado.' }, { quando: '17/09, 16h30', oQue: 'Revisado por Helena Martins: bloqueio correto, sem outra medida.' }] },
  { id: 'N-2026-0028', origem: 'Professor · pela tela de ajuda', categoria: 'Questão gerada com erro de conteúdo', recebida: '15/09, 11h03', prazo: 'até 17/09', analise: 'humana', situacao: 'concluida', recurso: false,
    apontado: 'Uma questão de prova citava a página certa, mas com o balanceamento errado. O professor não chegou a usar.',
    feito: [{ quando: '15/09, 11h03', oQue: 'Recebida.' }, { quando: '16/09, 9h20', oQue: 'Trecho do material reprocessado: a tabela da página tinha sido lida torta. Questão regenerada e conferida.' }] },
  { id: 'N-2026-0027', origem: 'Família · pelo canal da escola', categoria: 'Dúvida sobre uso de dado do aluno', recebida: '11/09, 13h15', prazo: 'até 15/09', analise: 'humana', situacao: 'concluida', recurso: false,
    apontado: 'A responsável perguntou se a conversa do filho com o Tutor é usada para treinar a IA.',
    feito: [{ quando: '12/09, 10h00', oQue: 'Respondido por escrito: não é usada para treinar modelo, fica 90 dias e só o professor da turma vê. Enviada a carta às famílias.' }] },
]

type Filtro = 'todas' | Situacao | 'recurso'
const ROTULO: Record<Situacao, string> = { aberta: 'Aberta', analise: 'Em análise', concluida: 'Concluída' }

function SeloAnalise({ tipo }: { tipo: Notificacao['analise'] }) {
  const Icone = tipo === 'humana' ? UserRound : Cpu
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-linha border border-linha bg-superficie px-2 text-xs font-medium text-apoio">
      <Icone className="size-3.5" strokeWidth={2} /> {tipo === 'humana' ? 'Análise humana' : 'Automatizada, revista por gente'}
    </span>
  )
}

function SeloSituacao({ s }: { s: Situacao }) {
  return <Estado tipo={s === 'concluida' ? 'ok' : s === 'aberta' ? 'pendente' : 'info'}>{ROTULO[s]}</Estado>
}

export function Denuncias() {
  const [lista, setLista] = useState(INICIAIS)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [abertaId, setAbertaId] = useState<string | null>(null)

  const visiveis = lista.filter((n) => filtro === 'todas' ? true : filtro === 'recurso' ? n.recurso : n.situacao === filtro)
  const aberta = lista.find((n) => n.id === abertaId)
  const conta = (s: Situacao) => lista.filter((n) => n.situacao === s).length

  const concluir = (id: string) => setLista((l) => l.map((n) => n.id !== id ? n : {
    ...n, situacao: 'concluida', feito: [...n.feito, { quando: '21/09, 10h42', oQue: 'Concluída por Helena Martins. Quem notificou foi avisado e pode recorrer em até 10 dias.' }],
  }))

  const colunas: Coluna<Notificacao>[] = [
    { titulo: 'Notificação', celula: (n) => <><span className="block font-semibold text-tinta">{n.categoria}</span><span className="text-[13px] text-sutil">{n.id} · {n.origem}</span></> },
    { titulo: 'Recebida', celula: (n) => <span className="whitespace-nowrap tabular-nums">{n.recebida}</span> },
    { titulo: 'Prazo', celula: (n) => <span className="whitespace-nowrap tabular-nums">{n.prazo}</span> },
    { titulo: 'Análise', celula: (n) => <SeloAnalise tipo={n.analise} /> },
    { titulo: 'Situação', celula: (n) => <SeloSituacao s={n.situacao} /> },
  ]

  return (
    <Tela titulo="Denúncias"
      descricao="O canal de notificação de violação da escola. Cada notificação mostra o que foi apontado, o que foi feito, o prazo e como recorrer.">

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <NumeroPainel rotulo="Abertas" valor={conta('aberta')} apoio="dentro do prazo" />
        <NumeroPainel rotulo="Em análise" valor={conta('analise')} />
        <NumeroPainel rotulo="Concluídas no mês" valor={conta('concluida')} />
        <NumeroPainel rotulo="Resposta em" valor="2 dias" apoio="prazo da escola: 3 dias úteis" />
      </div>

      <AvisoInfo icone={Lock} className="mt-4">
        O conteúdo da conversa do aluno não aparece aqui. Quando a análise precisa do trecho, abrir é ação à parte, pede o motivo e fica em auditoria.
      </AvisoInfo>

      <div className="mb-3 mt-6">
        <Segmentos rotulo="Filtrar notificações" valor={filtro} aoMudar={setFiltro} opcoes={[
          { id: 'todas', nome: 'Todas', n: lista.length }, { id: 'aberta', nome: 'Abertas', n: conta('aberta') },
          { id: 'analise', nome: 'Em análise', n: conta('analise') }, { id: 'concluida', nome: 'Concluídas', n: conta('concluida') },
          { id: 'recurso', nome: 'Com recurso', n: 0 },
        ]} />
      </div>

      {visiveis.length === 0 ? (
        <EmptyState className="mx-auto max-w-none rounded-cartao border border-dashed border-linha bg-superficie p-10 hover:bg-superficie [&_.shadow-lg]:shadow-none"
          icons={[Flag, Scale, Inbox]} title="Nenhum recurso em aberto"
          description={'Quando alguém recorrer de uma decisão, o pedido aparece aqui, com o prazo.\nTodo mundo que notifica recebe a resposta e o caminho para recorrer.'}
          action={{ label: 'Ver todas as notificações', onClick: () => setFiltro('todas') }} />
      ) : (
        <TabelaResponsiva colunas={colunas} linhas={visiveis} chave={(n) => n.id}
          acao={(n) => <Button variant="secundario" size="sm" onClick={() => setAbertaId(n.id)}>Abrir</Button>} />
      )}

      <Dialog open={!!aberta} onOpenChange={(o) => !o && setAbertaId(null)}>
        <DialogContent className={`${dialogo} max-w-xl`}>
          {aberta && (
            <>
              <DialogHeader className="space-y-2 pr-6 text-left">
                <DialogTitle className="font-corpo text-base font-semibold leading-snug tracking-normal text-tinta">{aberta.categoria}</DialogTitle>
                <DialogDescription className="text-sm text-sutil">{aberta.id} · {aberta.origem} · recebida em {aberta.recebida}</DialogDescription>
                <div className="flex flex-wrap gap-2 pt-1"><SeloSituacao s={aberta.situacao} /><SeloAnalise tipo={aberta.analise} /></div>
              </DialogHeader>
              <Par rotulo="O que foi apontado"><p className="text-apoio">{aberta.apontado}</p></Par>
              <Par rotulo="O que foi feito">
                <ol className="grid gap-2.5 border-l border-linha pl-4">
                  {aberta.feito.map((f) => (
                    <li key={f.quando} className="relative text-sm leading-snug text-apoio before:absolute before:-left-[21px] before:top-1.5 before:size-2.5 before:rounded-full before:bg-noite">
                      <span className="block text-[13px] font-semibold tabular-nums text-tinta">{f.quando}</span>{f.oQue}
                    </li>
                  ))}
                </ol>
              </Par>
              <div className="grid gap-4 sm:grid-cols-2">
                <Par rotulo="Prazo"><p className="text-apoio">{aberta.prazo} · 3 dias úteis da escola</p></Par>
                <Par rotulo="Recurso"><p className="text-apoio">Quem notificou pode recorrer em até 10 dias. O recurso é lido por outra pessoa da direção.</p></Par>
              </div>
              <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:space-x-0">
                <Button variant="discreto" className="sm:mr-auto"><Lock /> Abrir o trecho da conversa…</Button>
                <Button variant="secundario">Registrar o que foi feito</Button>
                {aberta.situacao !== 'concluida' && <Button variant="oficial" onClick={() => concluir(aberta.id)}>Concluir notificação</Button>}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <NotaMockup>
        F12/F16 · fora do MVP de apresentação. Aplica D61 (canal de denúncia com o que foi apontado, o que foi feito e o recurso, dizendo se a análise
        foi humana ou automatizada), ECA Digital art. 28, D59 (aviso só no horário da escola) e regra 20 (conteúdo de conversa só com motivo e
        auditoria). "Concluir" é decisão oficial, por isso o botão azul-noite. Categorias e prazos são ilustrativos.
      </NotaMockup>
    </Tela>
  )
}
