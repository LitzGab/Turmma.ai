import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Botao, LinhaDeFonte } from '@/components/duo'
import { PainelLado } from '@/components/turmma/painel-lado'
import { listaDaCelula, type ColunaComNome } from '@/dados/gestao-escola'
import { ia, useAuditoriaDaDemo } from '@/dados/ia'
import { DialogoMotivo } from './Denuncias'

/* A LISTA COM NOME DO PAINEL (06/10/2026; pesquisa/paineis-gestao/plano.md, T1). O segundo nível de um cartão de ação
   ou de uma célula da tabela por turma: primeiro o MOTIVO (lista fechada, D34), depois os nomes, num painel ao lado.
   O motivo vai para a auditoria (ia.verDadosComNome, "Viu dado com nome", com o alvo legível: "Lista · APOIA · 2ºB").
   Quem já registrou o motivo daquela lista nesta demonstração vê de novo sem repetir o pedido, como no alerta do
   Analista (_alerta.tsx). Cada aluno leva o próprio número e o motivo em uma linha; nenhuma média. */

const FINALIDADES_DA_LISTA = [
  'Apoio aos alunos, com o professor da turma',
  'Conversa com a família',
  'Conselho de classe',
  'Pedido do titular do dado',
]
const FINALIDADES_DO_APOIA = ['Abrir o aviso no APOIA', ...FINALIDADES_DA_LISTA]

export type PedidoDeLista = { coluna: ColunaComNome; turmaId?: string }

/** O pedido de lista e o painel ao lado. `pedido` null fecha tudo. */
export function ListaComMotivo({ pedido, aoFechar }: { pedido: PedidoDeLista | null; aoFechar: () => void }) {
  const lista = pedido ? listaDaCelula(pedido.coluna, pedido.turmaId) : null
  const auditoria = useAuditoriaDaDemo()
  const registro = lista ? auditoria.find((l) => l.acao === 'Viu dado com nome' && l.alvo === lista.alvo) : undefined
  // fechar o diálogo sem motivo fecha o pedido inteiro
  const [desistiu, setDesistiu] = useState<string | null>(null)
  // o diálogo se fecha também depois de confirmar: só é desistência quando não houve motivo
  const confirmou = useRef(false)
  const pedindo = !!lista && !registro && desistiu !== lista.alvo

  const fechar = () => { setDesistiu(null); aoFechar() }
  const turmaId = pedido?.turmaId
  const curto = lista ? lista.alvo.replace(/^Lista · /, '') : ''

  return (
    <>
      <DialogoMotivo aberto={pedindo} aoMudar={(v) => {
          if (v || !lista) return
          if (confirmou.current) { confirmou.current = false; return }
          setDesistiu(lista.alvo); fechar()
        }}
        titulo="Ver os nomes"
        frase={lista ? <>{lista.titulo}: <b className="font-bold text-tinta">{lista.alunos.length} {lista.alunos.length === 1 ? 'aluno' : 'alunos'}</b>. O motivo fica registrado com seu nome e a hora.</> : null}
        motivos={pedido?.coluna === 'apoia' ? FINALIDADES_DO_APOIA : FINALIDADES_DA_LISTA} rotuloMotivo="Para quê" confirmar="Ver e registrar"
        aoConfirmar={(m) => { if (lista) { confirmou.current = true; ia.verDadosComNome(lista.alvo, m) } }} />

      <PainelLado aberto={!!lista && !!registro} aoFechar={fechar} titulo={curto}
        descricao="A lista com nome, aberta com o motivo registrado."
        rodape={turmaId && (
          <Botao variante="secundario" tamanho="m" asChild><Link to={`/coordenacao/escola/turmas/${turmaId}`}>Abrir a turma</Link></Botao>
        )}>
        {lista && registro && (
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <p className="t-cartao text-tinta">{lista.titulo}</p>
              <p className="t-apoio">{lista.limiar}</p>
              <LinhaDeFonte origem={lista.origem} />
            </div>
            <ul aria-label={`${lista.alunos.length} alunos`} className="overflow-hidden rounded-[16px] border-2 border-borda bg-white">
              {lista.alunos.map((a) => (
                <li key={a.matricula + a.nome} className="grid gap-0.5 border-t-2 border-borda px-4 py-2.5 first:border-t-0">
                  <p className="flex min-w-0 items-baseline gap-2">
                    <span className="min-w-0 flex-1 truncate text-[15px] font-bold leading-5 text-tinta">{a.nome}</span>
                    {!turmaId && <span className="shrink-0 text-[13px] font-bold uppercase tracking-[.04em] text-sutil">{a.turma}</span>}
                    <span className="shrink-0 text-[13px] font-medium tabular-nums text-sutil">{a.matricula}</span>
                  </p>
                  <p className="text-[14px] font-medium leading-5 text-apoio">{a.motivo}</p>
                </li>
              ))}
            </ul>
            <p className="t-apoio flex items-start gap-1.5">
              <Lock aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} /> Registrado · {registro.quem} · {registro.quando} · {registro.finalidade}
            </p>
          </div>
        )}
      </PainelLado>
    </>
  )
}
