import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Ban, Check, Hourglass, Pause } from 'lucide-react'
import { Aviso, Botao, Recolhivel, Segmentado, Selo, SeloIA, familia } from '@/components/duo'
import { AvatarIA } from '@/components/duo/onca'
import { AGENTES, type FuncaoId } from '@/dados/agentes'
import { ia, usePausas } from '@/dados/ia'
import { agora } from '@/dados/demo/nucleo'
import { cn } from '@/lib/utils'
import { DialogoMotivo } from './Denuncias'

/* COMO CADA IA TRABALHA (12ª rodada, polimento C1, 04/10/2026; plano 5.3; fluxo F15). Abre ao lado, em IA
   (?ver=como, e ?ia=tutor para chegar já no Tutor); /coordenacao/agentes chega aqui.

   Uma IA por vez, no Segmentado com o rosto da onça: FAZ SOZINHO · ESPERA UM PROFESSOR · NUNCA FAZ; as funções com o
   selo ALTO RISCO (D9, D60); a AIA recolhida, numa VERSÃO SÓ — a mesma que o Dossiê mostra.
   No fim, PAUSAR (perigo), com motivo: chama `ia.pausar` (fica na Auditoria). Pausado, o Aviso "Tutor pausado" e
   REATIVAR no mesmo lugar. O efeito aparece no aluno: a onça dorme e "A escola pausou o Tutor por enquanto." (D60). */

export type IdIA = 'assistente' | 'tutor' | 'analista'

/** A Avaliação de Impacto Algorítmico de cada IA: UMA versão, lida aqui e no Dossiê. */
export const AIA: Record<IdIA, {
  versao: string; revista: string; vigente: boolean; nota?: string
  finalidade: string; riscos: string[]; salvaguardas: string[]; contestar: string
}> = {
  assistente: {
    versao: 'v3', revista: '02/09/2026', vigente: true,
    finalidade: 'Ajudar o professor a preparar, corrigir objetivas e adaptar, com o professor aprovando antes de chegar ao aluno.',
    riscos: ['Gabarito errado para a turma inteira', 'Aprovação virar clique reflexo', 'Dado de saúde na adaptação'],
    salvaguardas: ['Destaca o fora da curva, que o professor abre antes', 'Registra o que foi mostrado, aberto e aprovado', 'Adaptação só com tipo de lista fechada', 'Nada sobre redação e discursiva'],
    contestar: 'O professor recusa com motivo; o aluno usa "Isso está errado?".',
  },
  tutor: {
    versao: 'v3', revista: '02/09/2026', vigente: true,
    finalidade: 'Ajudar o aluno a estudar o conteúdo da turma por perguntas, com o professor acompanhando.',
    riscos: ['Entregar resposta pronta', 'O aluno tratar o Tutor como pessoa', 'Assunto pessoal delicado na conversa'],
    salvaguardas: ['Preso ao material da turma', 'Diz o que é e que pode errar', 'Mensagem combinada e encaminhamento à orientação', 'Limite de 60 perguntas por dia'],
    contestar: 'O aluno vê o que o Tutor lembra e pode dizer "Isso está errado?".',
  },
  analista: {
    versao: 'v1', revista: '04/08/2026', vigente: false,
    nota: 'O pedido principal mudou em 15/09. A revisão fica pronta até segunda.',
    finalidade: 'Avisar a coordenação de mudança de desempenho e de consumo, em agregado.',
    riscos: ['Virar vigilância ou ranking de professor', 'Expor aluno a quem não é o professor dele'],
    salvaguardas: ['Agregado só com dois ou mais professores', 'Dado com nome só com finalidade registrada', 'Alerta é hipótese, não decisão'],
    contestar: 'O professor vê primeiro o próprio indicador e pode pedir revisão (LGPD, art. 20).',
  },
}

export const textoAIA = (id: IdIA) => `AIA ${AIA[id].versao} · revista em ${AIA[id].revista}`

/* O texto de cada IA, escrito para a COORDENAÇÃO ler: quem aprova é o professor, não ela. */
const PARA_COORDENACAO: Record<IdIA, { paraQuem: string; esperaTitulo: string; faz: string[]; espera: string[]; nunca: string[] }> = {
  assistente: {
    paraQuem: 'Para o professor', esperaTitulo: 'Espera um professor',
    faz: ['Rascunho de prova, atividade e plano, quando pedem', 'Corrige objetivas', 'Cita material e página'],
    espera: ['As notas, antes de chegarem ao aluno', 'Toda versão adaptada'],
    nunca: ['Nota em redação ou discursiva', 'Guardar laudo ou CID', 'Avisar fora do horário útil'],
  },
  tutor: {
    paraQuem: 'Para o aluno, com o professor da turma', esperaTitulo: 'Espera um professor',
    faz: ['Responde por perguntas, dentro do conteúdo', 'Avisa o professor onde a turma travou'],
    espera: ['Busca em fontes: a escola libera, o professor liga'],
    nunca: ['Entregar resposta pronta', 'Dizer que é uma pessoa', 'Aconselhar em assunto pessoal'],
  },
  analista: {
    paraQuem: 'Para a coordenação', esperaTitulo: 'Espera a coordenação',
    faz: ['Resumo de segunda, em agregado', 'Alerta quando algo muda'],
    espera: ['Ver dados com nome, com a finalidade registrada'],
    nunca: ['Ranking de professor', 'Falar com professor ou família', 'Recomendar decisão sobre pessoa'],
  },
}

const NOME_FUNCAO: Partial<Record<FuncaoId, string>> = { correcao: 'a correção', adaptacao: 'a adaptação' }
const MOTIVOS = ['Conferência com a família', 'Erro de conteúdo', 'Pedido da direção']

function Bloco({ titulo, itens, icone, familia }: { titulo: string; itens: string[]; icone: ReactNode; familia: 'verde' | 'amarelo' | 'vermelho' }) {
  const cor = { verde: 'bg-verde-claro text-verde-texto', amarelo: 'bg-amarelo-claro text-amarelo-texto', vermelho: 'bg-vermelho-claro text-vermelho-texto' }[familia]
  return (
    <section>
      <h3 className="t-selo mb-2 text-sutil">{titulo}</h3>
      <ul className="grid gap-2">
        {itens.map((t) => (
          <li key={t} className="flex items-start gap-2.5 text-[15px] font-medium leading-5 text-tinta">
            <span aria-hidden className={cn('grid size-6 shrink-0 place-items-center rounded-full [&_svg]:size-3.5', cor)}>{icone}</span>
            <span className="pt-0.5">{t}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

type PedidoPausa = { chave: string; titulo: string }

/** O conteúdo do painel "Como cada IA trabalha". */
export function ComoCadaIATrabalha({ inicial = 'assistente' }: { inicial?: IdIA }) {
  const [id, setId] = useState<IdIA>(inicial)
  const [pedido, setPedido] = useState<PedidoPausa | null>(null)
  // o retorno do REATIVAR, no mesmo lugar da pausa: "Tutor reativado · 10h45" (o painel continua aberto)
  const [reativada, setReativada] = useState<{ chave: string; titulo: string; quando: string } | null>(null)
  const pausas = usePausas()
  const a = AGENTES[id]
  const aia = AIA[id]
  const pausa = pausas[id]
  const t = PARA_COORDENACAO[id]
  const reativar = (chave: string) => {
    ia.reativar(chave)
    setReativada({ chave, titulo: tituloDaPausa(chave).replace(/pausad([oa])/, 'reativad$1'), quando: agora().hora })
  }
  const nota = reativada && reativada.chave.split(':')[0] === id && !pausas[reativada.chave] ? reativada : null
  // o botão REATIVAR some com a pausa: o foco vai para a nota, e não para fora do painel
  const refNota = useRef<HTMLDivElement>(null)
  useEffect(() => { if (nota) refNota.current?.focus({ preventScroll: true }) }, [nota])

  return (
    <div className="grid gap-6">
      <Segmentado rotulo="Qual IA" valor={id} aoMudar={(v) => setId(v as IdIA)} className="w-full"
        opcoes={(['assistente', 'tutor', 'analista'] as IdIA[]).map((x) => ({ id: x, rotulo: AGENTES[x].curto, icone: <span className="inline-flex max-sm:hidden"><AvatarIA agente={x} tamanho={24} /></span> }))} />

      <header className="flex items-center gap-3">
        <AvatarIA agente={id} tamanho={48} className={pausa ? 'opacity-50' : undefined} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 t-cartao text-tinta">
            {a.curto} <SeloIA tamanho="p" />
            {a.altoRisco && <Selo familia="amarelo" tamanho="p">Alto risco</Selo>}
            {pausa && <Selo familia="vermelho" tamanho="p">Pausado</Selo>}
          </p>
          <p className="t-apoio">{t.paraQuem}</p>
        </div>
      </header>

      {pausa && (
        // o mesmo glifo de pausa da FaixaPausas (no Painel e em Registros): um estado, um ícone
        <div role="status" style={familia('vermelho')} className="flex items-start gap-3 rounded-[12px] border-2 border-(--borda) bg-(--claro) px-4 py-3">
          <span aria-hidden className="mt-px grid size-7 shrink-0 place-items-center rounded-full bg-white text-(--texto) [&_svg]:size-4"><Pause strokeWidth={3} /></span>
          <div className="min-w-0 flex-1">
            <p className="t-cartao text-tinta">{a.curto} pausado</p>
            <p className="mt-0.5 text-[15px] font-medium leading-[21px] text-tinta">{pausa.motivo} · {pausa.quando}</p>
          </div>
          <Botao variante="secundario" tamanho="p" className="shrink-0 self-center" onClick={() => reativar(id)}>Reativar</Botao>
        </div>
      )}

      {nota && (
        <div ref={refNota} tabIndex={-1} role="status" style={familia('verde')} className="flex items-center gap-3 rounded-[12px] outline-none border-2 border-(--borda) bg-(--claro) px-4 py-3">
          <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-(--texto) [&_svg]:size-4"><Check strokeWidth={3.5} /></span>
          <p className="min-w-0 flex-1 text-[15px] font-medium leading-5 text-tinta"><b className="font-bold">{nota.titulo}</b> · {nota.quando}</p>
          <Botao variante="fantasma" tamanho="p" className="-mr-2 shrink-0" onClick={() => setReativada(null)}>Fechar</Botao>
        </div>
      )}

      <Bloco titulo="Faz sozinho" itens={t.faz} icone={<Check strokeWidth={3.5} />} familia="verde" />
      <Bloco titulo={t.esperaTitulo} itens={t.espera} icone={<Hourglass strokeWidth={3} />} familia="amarelo" />
      <Bloco titulo="Nunca faz" itens={t.nunca} icone={<Ban strokeWidth={3} />} familia="vermelho" />

      {a.funcoes && (
        <section>
          <h3 className="t-selo mb-2 text-sutil">Funções</h3>
          <ul className="overflow-hidden rounded-[16px] border-2 border-borda bg-white">
            {a.funcoes.map((f) => {
              const chave = `${id}:${f.id}`
              const p = pausas[chave]
              const nome = f.id === 'dia' ? 'Dia e semana do professor' : f.nome
              return (
                <li key={f.id} className="flex min-h-14 items-center gap-3 border-t-2 border-borda px-4 py-2 first:border-t-0">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold leading-5 text-tinta">{nome}</span>
                    {(f.altoRisco || p) && (
                      <span className="mt-1 flex flex-wrap gap-1.5">
                        {f.altoRisco && <Selo familia="amarelo" tamanho="p">Alto risco</Selo>}
                        {p && <Selo familia="vermelho" tamanho="p">Pausada</Selo>}
                      </span>
                    )}
                  </span>
                  {f.altoRisco && !pausa && (p
                    ? <Botao variante="secundario" tamanho="p" onClick={() => reativar(chave)}>Reativar</Botao>
                    : <Botao variante="perigo" tamanho="p" onClick={() => setPedido({ chave, titulo: `Pausar ${NOME_FUNCAO[f.id] ?? f.nome}?` })}>Pausar</Botao>)}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <Recolhivel titulo="Avaliação de impacto (AIA)" apoio={`${aia.versao} · ${aia.vigente ? 'vigente' : 'em revisão'} · a mesma do Dossiê`}>
        <div className="grid gap-4">
          {aia.nota && <Aviso tom="atencao">{aia.nota}</Aviso>}
          <p className="t-corpo text-tinta">{aia.finalidade}</p>
          <Bloco titulo="Riscos que olhamos" itens={aia.riscos} icone={<Hourglass strokeWidth={3} />} familia="amarelo" />
          <Bloco titulo="O que segura cada risco" itens={aia.salvaguardas} icone={<Check strokeWidth={3.5} />} familia="verde" />
          <p className="t-apoio">{aia.contestar}</p>
        </div>
      </Recolhivel>

      {!pausa && (
        <Botao variante="perigo" className="justify-self-start" onClick={() => setPedido({ chave: id, titulo: `Pausar o ${a.curto}?` })}>
          Pausar o {a.curto}
        </Botao>
      )}

      <DialogoMotivo aberto={pedido !== null} aoMudar={(v) => { if (!v) setPedido(null) }} titulo={pedido?.titulo ?? ''}
        frase="Vale agora, na escola inteira, até alguém reativar. O que já foi aprovado continua valendo."
        motivos={MOTIVOS} confirmar="Pausar" variante="perigoCheio"
        aoConfirmar={(m) => { if (pedido) ia.pausar(pedido.chave, m) }} />
    </div>
  )
}

/** Título de uma pausa: "Tutor pausado" ou "Correção pausada · Assistente". */
export function tituloDaPausa(chave: string): string {
  const [agente, funcao] = chave.split(':') as [IdIA, string | undefined]
  const a = AGENTES[agente]
  if (!a) return `${chave} pausado`
  if (!funcao) return `${a.curto} pausado`
  const f = a.funcoes?.find((x) => x.id === funcao)
  return `${f?.nome ?? funcao} pausada · ${a.curto}`
}

/** As pausas em vigor, fora do painel: na página IA e no Painel da coordenação (ninguém esquece de reativar).
    Uma faixa de UMA linha (44 px), igual à do encaminhamento no Painel: não empurra a grade. */
export function FaixaPausas({ aoVer, className }: { aoVer?: (agente: IdIA) => void; className?: string }) {
  const pausas = usePausas()
  const chaves = Object.keys(pausas)
  if (!chaves.length) return null
  return (
    <div className={cn('grid gap-2', className)}>
      {chaves.map((chave) => {
        const p = pausas[chave]
        return (
          <div key={chave} role="status" style={familia('vermelho')}
            className="flex min-h-11 items-center gap-3 rounded-[12px] border-2 border-(--borda) bg-(--claro) py-0.5 pl-2 pr-1">
            <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-(--texto) [&_svg]:size-4"><Pause strokeWidth={3} /></span>
            <p className="min-w-0 flex-1 truncate text-[15px] font-medium leading-5 text-tinta">
              <b className="font-bold">{tituloDaPausa(chave)}</b>
              <span className="text-apoio"> · {p.motivo} · {p.quando} · {p.por}</span>
            </p>
            {aoVer
              ? <Botao variante="secundario" tamanho="p" onClick={() => aoVer(chave.split(':')[0] as IdIA)}>Ver</Botao>
              : <Botao variante="secundario" tamanho="p" onClick={() => ia.reativar(chave)}>Reativar</Botao>}
          </div>
        )
      })}
    </div>
  )
}
