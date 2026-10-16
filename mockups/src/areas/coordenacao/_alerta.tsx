import { useState } from 'react'
import { Lock } from 'lucide-react'
import { Botao, FaixaResultado, MenuMais, Selo } from '@/components/duo'
import { AssinaturaIA } from '@/components/turmma/ia'
import { PainelLado } from '@/components/turmma/painel-lado'
import { useItemFila } from '@/dados/fila'
import { ia, useAlertasVistos, useAuditoriaDaDemo } from '@/dados/ia'
import { PainelRevisao } from '../professor/_fila'
import { alertaDe, type AlertaAnalista } from './Analista'
import { DialogoMotivo } from './Denuncias'

/* O PAINEL DO ITEM DA COORDENAÇÃO (14ª rodada, 05/10/2026; plano ux-composicao, 1.7 e 7.2). Quem desenha é a Casca:
   o sino (ou um ?item= no endereço) abre o item que não tem página própria por cima de QUALQUER tela da coordenação.
   · Os alertas do Analista (alerta-a1, alerta-a2), com o "Ver dados com nome" (finalidade registrada na auditoria);
   · a memória contestada sem professor da matéria (tipo revisao), no PainelRevisao do professor, assinado pela Helena.
   O PainelAlerta, as FINALIDADES e a HIPOTESE foram COPIADOS do antigo Início (coordenacao/Inicio.tsx), que passa a
   ser o Painel e deixa de desenhar o painel do item. */

const HIPOTESE = 'O Analista só avisa você. Não fala com professor nem com família.'

export const FINALIDADES = [
  'Conversa com os professores da série',
  'Apoio aos alunos, com o professor da turma',
  'Pedido do titular do dado',
]

export function PainelAlerta({ alerta, aoFechar }: { alerta: AlertaAnalista | undefined; aoFechar: () => void }) {
  const vistos = useAlertasVistos()
  const auditoria = useAuditoriaDaDemo()
  const [pedindo, setPedindo] = useState(false)
  const visto = !!alerta && vistos.includes(alerta.id)
  // o dado com nome aparece depois que a finalidade foi registrada (no painel ou na conversa com o Analista)
  const registro = alerta ? auditoria.find((l) => l.acao === 'Viu dado com nome' && l.alvo === alerta.id) : undefined
  const menu = registro ? null : <MenuMais alinhar="start" lado="top" itens={[{ rotulo: 'Ver dados com nome', icone: <Lock />, aoEscolher: () => setPedindo(true) }]} />

  return (
    <>
      <PainelLado aberto={!!alerta} aoFechar={aoFechar} titulo={alerta?.curto ?? ''}
        rodape={alerta && (visto
          ? <FaixaResultado tipo="info" titulo="Visto" acao={menu}
              className="-mx-6 -mt-3 -mb-[calc(12px+env(safe-area-inset-bottom,0px))] basis-[calc(100%+48px)] border-t-0" />
          : (
            <>
              {menu}
              <span className="flex-1" />
              <Botao variante="oficial" onClick={() => ia.marcarAlertaVisto(alerta.id)}>Marcar como visto</Botao>
            </>
          ))}>
        {alerta && (
          <div className="grid gap-5">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
              <AssinaturaIA id="analista" />
              {alerta.natureza === 'hipotese'
                ? <Selo familia="anil" title={HIPOTESE}>Hipótese</Selo>
                : <Selo title="Contagem das entregas registradas pelos professores.">Contagem</Selo>}
              <span className="t-apoio">{alerta.quando}</span>
            </div>
            <p className="t-corpo text-tinta"><b className="font-bold">{alerta.titulo}.</b> {alerta.texto}</p>
            <div className="flex flex-wrap gap-2" aria-label="Recorte">
              {alerta.recorte.map((r) => <Selo key={r} familia="anil" className="normal-case">{r}</Selo>)}
              {!registro && <Selo icone={<Lock strokeWidth={2.5} />} title={alerta.fechado}>Fechado</Selo>}
            </div>

            {registro && (
              <section aria-label="Dados com nome" className="grid gap-2">
                <h3 className="t-selo text-sutil">{alerta.comNome.titulo}</h3>
                <ul className="overflow-hidden rounded-[16px] border-2 border-borda bg-white">
                  {alerta.comNome.linhas.map((l) => (
                    <li key={l.nome} className="flex min-h-12 items-center gap-3 border-t-2 border-borda px-4 first:border-t-0">
                      <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-tinta">{l.nome}</span>
                      <span className="shrink-0 text-[15px] font-medium tabular-nums text-apoio">{l.valor}</span>
                    </li>
                  ))}
                </ul>
                <p className="t-apoio flex items-start gap-1.5">
                  <Lock aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} /> Registrado · {registro.quem} · {registro.quando} · {registro.finalidade}
                </p>
              </section>
            )}
          </div>
        )}
      </PainelLado>
      <DialogoMotivo aberto={pedindo} aoMudar={setPedindo} titulo="Ver dados com nome"
        frase="Fica registrado com seu nome, a hora e a finalidade." motivos={FINALIDADES} rotuloMotivo="Para quê" confirmar="Ver e registrar"
        aoConfirmar={(f) => { if (alerta) ia.verDadosComNome(alerta.id, f) }} />
    </>
  )
}

/** O painel do item (?item=) na coordenação: o alerta do Analista ou a revisão sem professor da matéria. Outro tipo
    (que tem página própria) não abre nada. */
export function PainelDoItemCoordenacao({ itemId, aoFechar }: { itemId: string | null; aoFechar: () => void }) {
  const alerta = alertaDe(itemId) ?? undefined
  const itemFila = useItemFila(itemId)
  const revisao = itemFila?.tipo === 'revisao' && itemFila.papel === 'coordenacao' ? itemFila : undefined
  return (
    <>
      <PainelAlerta key={alerta?.id ?? 'nenhum'} alerta={alerta} aoFechar={aoFechar} />
      {revisao && <PainelRevisao key={revisao.id} item={revisao} aoFechar={aoFechar} quem={{ nome: 'Helena Martins', papel: 'coordenacao' }} />}
    </>
  )
}
