import { TAMANHO_MAXIMO_DA_JUSTIFICATIVA, TAMANHO_MINIMO_DA_JUSTIFICATIVA } from '@educa/shared'
import { useRef, useState } from 'react'
import { Botao } from '../../componentes/Botao'
import { CampoLongo } from '../../componentes/CampoLongo'
import { DialogoDeConfirmacao } from '../../componentes/DialogoDeConfirmacao'
import { problemaDoTexto } from '../../componentes/texto-longo'
import { Secao } from '../Secao'

type Confirmacao = 'aprovar' | 'suspender' | 'andamento' | 'falha' | 'rejeitar'

const RESUMO_DO_LOTE = [
  { rotulo: 'Atividade', valor: 'Estequiometria: lista 3' },
  { rotulo: 'Turma', valor: '2ºB' },
  { rotulo: 'Correções', valor: '32' },
] as const

function DemonstracaoDaConfirmacao() {
  const [dialogo, definirDialogo] = useState<Confirmacao | undefined>(undefined)
  const [decisao, definirDecisao] = useState('')
  const [justificativa, definirJustificativa] = useState('')
  const resultado = useRef<HTMLParagraphElement>(null)
  const aprovado = decisao === 'Aprovado'
  const fechar = () => definirDialogo(undefined)
  const decidir = (texto: string) => {
    definirDecisao(texto)
    definirDialogo(undefined)
  }
  const justificativas = { minimo: TAMANHO_MINIMO_DA_JUSTIFICATIVA, maximo: TAMANHO_MAXIMO_DA_JUSTIFICATIVA }
  return (
    <>
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        {/* Depois de aprovar, o gatilho desliga: o foco não tem como voltar para ele, e vai para o resultado. */}
        <Botao variante="oficial" disabled={aprovado} onClick={() => definirDialogo('aprovar')}>
          Aprovar 32 correções
        </Botao>
        <Botao variante="perigo" onClick={() => definirDialogo('rejeitar')}>
          Rejeitar o lote
        </Botao>
        <Botao variante="perigo" onClick={() => definirDialogo('suspender')}>
          Suspender a função
        </Botao>
        <Botao variante="secundario" onClick={() => definirDialogo('andamento')}>
          Ver a confirmação em andamento
        </Botao>
        <Botao variante="secundario" onClick={() => definirDialogo('falha')}>
          Ver a confirmação com falha
        </Botao>
      </div>
      <p ref={resultado} tabIndex={-1} role="status" data-decisao="" className="min-h-6 text-sm text-sutil">
        {decisao}
      </p>
      {(dialogo === 'aprovar' || dialogo === 'andamento' || dialogo === 'falha') && (
        <DialogoDeConfirmacao
          familia="oficial"
          titulo="Aprovar 32 correções"
          resumo={RESUMO_DO_LOTE}
          efeito="O diagnóstico por habilidade chega aos alunos da turma."
          rotuloDeConfirmar="Aprovar 32 correções"
          rotuloConfirmando="Aprovando…"
          confirmando={dialogo === 'andamento'}
          {...(dialogo === 'falha' ? { falha: 'Não foi possível aprovar. Tente de novo em instantes.' } : {})}
          aoConfirmar={() => (dialogo === 'aprovar' ? decidir('Aprovado') : undefined)}
          aoFechar={fechar}
          focoDeReserva={() => resultado.current?.focus()}
        />
      )}
      {dialogo === 'rejeitar' && (
        <DialogoDeConfirmacao
          familia="perigo"
          titulo="Rejeitar 32 correções"
          resumo={RESUMO_DO_LOTE}
          efeito="Nenhum diagnóstico chega aos alunos, e o Assistente recebe o motivo."
          rotuloDeConfirmar="Rejeitar 32 correções"
          impedido={problemaDoTexto(justificativa, justificativas) !== undefined}
          aoConfirmar={() => decidir('Rejeitado')}
          aoFechar={fechar}
        >
          <CampoLongo rotulo="Motivo da rejeição" obrigatorio dica="De 8 a 500 caracteres. O Assistente usa o motivo para refazer." valor={justificativa} aoMudar={definirJustificativa} {...justificativas} />
        </DialogoDeConfirmacao>
      )}
      {dialogo === 'suspender' && (
        <DialogoDeConfirmacao
          familia="perigo"
          titulo="Suspender a correção de objetiva"
          resumo={[{ rotulo: 'Função', valor: 'Assistente · correção de objetiva' }]}
          efeito="O Assistente para de corrigir atividades nesta escola até a função ser retomada."
          aviso="A suspensão fica na auditoria da escola."
          rotuloDeConfirmar="Suspender a função"
          aoConfirmar={() => decidir('Suspensa')}
          aoFechar={fechar}
        />
      )}
    </>
  )
}

export default function SecoesDeSobrepor() {
  return (
    <Secao nome="confirmacao" titulo="Diálogo de confirmação">
      <DemonstracaoDaConfirmacao />
    </Secao>
  )
}
