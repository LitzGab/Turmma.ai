import { MOTIVOS_DE_SUSPENSAO, NOME_DO_MOTIVO_DE_SUSPENSAO, type Agente, type FuncaoDaGovernanca, type MotivoDeSuspensao } from '@educa/shared'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { aplicarFuncao, consultaFuncoesDaGovernanca, retomarFuncao, suspenderFuncao } from '../../api/governanca'
import { Botao } from '../../componentes/Botao'
import { Cartao } from '../../componentes/Cartao'
import { DialogoDeConfirmacao } from '../../componentes/DialogoDeConfirmacao'
import { Anuncio, useEnvioUnico } from '../../componentes/dialogos'
import { EstadoCarregando, EstadoErro } from '../../componentes/estado'
import { AvatarAgente } from '../../componentes/ia/AvatarAgente'
import { Selecao } from '../../componentes/Selecao'
import { Estado } from '../../componentes/SeloDeEstado'
import { Tela } from '../../componentes/Tela'
import { textoDaFalha } from '../../componentes/texto-da-falha'
import { formatarDataHora } from '../../formatar'
import { useTituloDaTela } from '../../titulo'
import { O_QUE_A_IA_NUNCA_FAZ } from './nunca-faz'
import { AVISO_DA_SUSPENSAO, EFEITO_DA_SUSPENSAO } from './textos-da-governanca'

const OPCOES_DE_MOTIVO = MOTIVOS_DE_SUSPENSAO.map((motivo) => ({ valor: motivo, rotulo: NOME_DO_MOTIVO_DE_SUSPENSAO[motivo] }))

function ehMotivo(valor: string): valor is MotivoDeSuspensao {
  return (MOTIVOS_DE_SUSPENSAO as readonly string[]).includes(valor)
}

interface FuncaoDoAgente {
  readonly funcao: FuncaoDaGovernanca
  readonly agente: string
}

/**
 * Agentes (MVP, A5; `docs/interface.md` 11.7; D9, D32, D60; regra 70, item 5): a tela que responde "o que essa IA faz
 * sozinha?". Três cartões, um por agente, com as funções de cada um: o que a função faz sozinha e o que espera uma
 * pessoa, nas palavras do catálogo `FUNCOES` (as mesmas que o professor lê), o selo de alto risco, e a suspensão **só
 * daquela função**, que vale no servidor. Embaixo, o que nenhuma função faz.
 */
export default function Agentes() {
  useTituloDaTela('Agentes')
  const cliente = useQueryClient()
  const funcoes = useQuery(consultaFuncoesDaGovernanca)
  const [suspendendo, definirSuspendendo] = useState<FuncaoDoAgente | undefined>(undefined)
  const [anuncio, definirAnuncio] = useState('')
  // Para onde o foco vai se o botão que abriu a confirmação não estiver mais na tela quando ela fecha.
  const avisos = useRef<HTMLDivElement>(null)
  const retomada = useEnvioUnico({
    mutationFn: (funcao: FuncaoDaGovernanca) => retomarFuncao(funcao.chave),
    onSuccess: (nova) => {
      aplicarFuncao(cliente, nova)
      definirAnuncio(`A função "${nova.nome}" voltou a funcionar nesta escola.`)
    },
    // A que já tinha sido retomada em outra aba responde como inexistente: a lista é lida de novo e mostra como está.
    onError: () => void cliente.invalidateQueries({ queryKey: consultaFuncoesDaGovernanca.queryKey }),
  })

  if (funcoes.isPending) {
    return (
      <Tela titulo="Agentes">
        <EstadoCarregando rotulo="Carregando os agentes…" />
      </Tela>
    )
  }
  if (funcoes.isError) {
    return (
      <Tela titulo="Agentes">
        <EstadoErro erro={funcoes.error} tentando={funcoes.isFetching} aoTentarDeNovo={() => void funcoes.refetch({ cancelRefetch: false })} />
      </Tela>
    )
  }

  return (
    <Tela titulo="Agentes">
      <p className="max-w-prose text-apoio">
        São três agentes, um para cada pessoa da escola. Cada função diz aqui o que faz sozinha e o que espera uma pessoa. A escola pode suspender uma função sem desligar as outras.
      </p>
      <div ref={avisos} tabIndex={-1}>
        <Anuncio texto={anuncio} />
      </div>
      {retomada.mutacao.isError && (
        <p role="alert" className="rounded-controle border border-erro bg-erro-cx p-3 break-words text-erro">
          {textoDaFalha(retomada.mutacao.error, { NAO_ENCONTRADO: 'Esta função já não estava suspensa. A lista foi atualizada.' })}
        </p>
      )}
      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
        {funcoes.data.agentes.map((agente) => (
          <CartaoDoAgente
            key={agente.agente}
            agente={agente.agente}
            nome={agente.nome}
            funcoes={agente.funcoes}
            retomando={retomada.mutacao.isPending ? retomada.mutacao.variables.chave : undefined}
            aoSuspender={(funcao) => {
              definirAnuncio('')
              retomada.mutacao.reset()
              definirSuspendendo({ funcao, agente: agente.nome })
            }}
            aoRetomar={(funcao) => {
              definirAnuncio('')
              retomada.enviar(funcao)
            }}
          />
        ))}
      </div>

      <Cartao titulo="O que a IA nunca faz">
        <p className="text-apoio">Vale para os três agentes e para todas as funções, por lei ou por escolha do produto. Não há configuração que ligue isto.</p>
        <ul className="mt-3 flex min-w-0 list-disc flex-col gap-1.5 pl-5">
          {O_QUE_A_IA_NUNCA_FAZ.map((frase) => (
            <li key={frase} className="break-words text-tinta">
              {frase}
            </li>
          ))}
        </ul>
      </Cartao>

      {suspendendo !== undefined && (
        <SuspenderFuncao
          key={suspendendo.funcao.chave}
          alvo={suspendendo}
          aoFechar={() => definirSuspendendo(undefined)}
          focoDeReserva={() => avisos.current?.focus()}
          aoSuspender={(nova) => {
            aplicarFuncao(cliente, nova)
            definirAnuncio(`A função "${nova.nome}" está suspensa nesta escola.`)
            definirSuspendendo(undefined)
          }}
        />
      )}
    </Tela>
  )
}

interface PropsDoCartaoDoAgente {
  readonly agente: Agente
  readonly nome: string
  readonly funcoes: readonly FuncaoDaGovernanca[]
  /** A função cuja retomada está no ar: o botão dela desliga. */
  readonly retomando: string | undefined
  readonly aoSuspender: (funcao: FuncaoDaGovernanca) => void
  readonly aoRetomar: (funcao: FuncaoDaGovernanca) => void
}

function CartaoDoAgente({ agente, nome, funcoes, retomando, aoSuspender, aoRetomar }: PropsDoCartaoDoAgente) {
  return (
    <section data-agente={agente} aria-label={nome} className="flex min-w-0 flex-col gap-4 rounded-cartao border border-linha bg-superficie p-4 lg:p-5">
      <div className="flex min-w-0 items-center gap-3">
        <AvatarAgente agente={agente} tamanho={48} />
        <h2 className="min-w-0 text-lg leading-tight font-semibold break-words text-tinta">{nome}</h2>
      </div>
      <ul className="flex min-w-0 flex-col gap-4">
        {funcoes.map((funcao) => (
          <li key={funcao.chave} data-funcao={funcao.chave} className="flex min-w-0 flex-col gap-2 border-t border-linha pt-4">
            <h3 className="font-medium break-words text-tinta">{funcao.nome}</h3>
            <div className="flex min-w-0 flex-wrap gap-2">
              {funcao.altoRisco && <Estado familia="info">Alto risco: tem avaliação de impacto</Estado>}
              {funcao.suspensao !== null ? (
                <Estado familia="pendente">{`Suspensa nesta escola desde ${formatarDataHora(funcao.suspensao.suspensaEm)}`}</Estado>
              ) : (
                <Estado familia="ok">Funcionando</Estado>
              )}
            </div>
            {funcao.suspensao?.motivo != null && <p className="text-sm break-words text-apoio">Motivo: {NOME_DO_MOTIVO_DE_SUSPENSAO[funcao.suspensao.motivo]}</p>}
            <dl className="flex min-w-0 flex-col gap-2">
              <div className="min-w-0">
                <dt className="text-[13px] font-medium text-sutil">Faz sozinha</dt>
                <dd className="break-words text-tinta">{funcao.fazSozinha}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[13px] font-medium text-sutil">Espera aprovação</dt>
                <dd className="break-words text-tinta">{funcao.esperaAprovacao}</dd>
              </div>
            </dl>
            <div>
              {funcao.suspensao !== null ? (
                <Botao variante="secundario" tamanho="compacto" aria-label={`Retomar a função ${funcao.nome}`} onClick={() => aoRetomar(funcao)} disabled={retomando === funcao.chave}>
                  {retomando === funcao.chave ? 'Retomando…' : 'Retomar esta função'}
                </Botao>
              ) : (
                <Botao variante="perigo" tamanho="compacto" aria-label={`Suspender a função ${funcao.nome}`} onClick={() => aoSuspender(funcao)}>
                  Suspender esta função
                </Botao>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

interface PropsDoSuspender {
  readonly alvo: FuncaoDoAgente
  readonly aoFechar: () => void
  readonly aoSuspender: (nova: FuncaoDaGovernanca) => void
  readonly focoDeReserva: () => void
}

/** A confirmação de suspender: diz o que acontece com os pedidos novos e com o que já foi feito, antes de confirmar. */
function SuspenderFuncao({ alvo, aoFechar, aoSuspender, focoDeReserva }: PropsDoSuspender) {
  const [motivo, definirMotivo] = useState('')
  const { enviar, mutacao } = useEnvioUnico({
    mutationFn: () => suspenderFuncao(alvo.funcao.chave, ehMotivo(motivo) ? motivo : undefined),
    onSuccess: aoSuspender,
  })
  return (
    <DialogoDeConfirmacao
      titulo={`Suspender a função ${alvo.funcao.nome}`}
      familia="perigo"
      resumo={[
        { rotulo: 'Função', valor: alvo.funcao.nome },
        { rotulo: 'Agente', valor: alvo.agente },
      ]}
      efeito={EFEITO_DA_SUSPENSAO}
      aviso={AVISO_DA_SUSPENSAO}
      rotuloDeConfirmar={`Suspender ${alvo.funcao.nome}`}
      rotuloConfirmando="Suspendendo…"
      aoConfirmar={() => enviar(undefined)}
      aoFechar={aoFechar}
      confirmando={mutacao.isPending}
      {...(mutacao.isError ? { falha: textoDaFalha(mutacao.error) } : {})}
      focoDeReserva={focoDeReserva}
    >
      <Selecao rotulo="Motivo" opcoes={OPCOES_DE_MOTIVO} valor={motivo} aoMudar={definirMotivo} marcador="Sem motivo registrado" dica="Opcional. Fica na auditoria, junto da suspensão." />
    </DialogoDeConfirmacao>
  )
}
