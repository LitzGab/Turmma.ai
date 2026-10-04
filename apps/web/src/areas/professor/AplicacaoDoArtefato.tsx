import { CodigoDeErro, type AtividadeAplicada, type RespostaArtefato } from '@educa/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useId, useRef, useState } from 'react'
import { Link } from 'wouter'
import { aplicarAtividade, consultaAtividadesAplicadas, encerrarAtividade, recarregarAtividades } from '../../api/atividades'
import { textoDaFalha } from '../../componentes/texto-da-falha'
import { caminhoDaCorrecaoDoProfessor } from '../../caminhos'
import { Botao } from '../../componentes/Botao'
import { DialogoDeConfirmacao } from '../../componentes/DialogoDeConfirmacao'
import { CabecalhoDeSecao } from '../../componentes/Tela'
import { formatarDataHora } from '../../formatar'
import { EFEITO_DE_APLICAR, EFEITO_DE_ENCERRAR, ESCOLHA_DE_AVALIATIVA, semCorrecao, situacaoDaAplicacao, TEXTO_SEM_CORRECAO, textoDeAlunos } from './aprovar'

/** O que a tela diz quando a API recusa aplicar: a que já está aberta, e a versão adaptada que ainda não foi aprovada. */
const TEXTOS_DA_APLICACAO: Partial<Record<CodigoDeErro, string>> = {
  [CodigoDeErro.CONFLITO]: 'Esta atividade já está aberta para a turma. Encerre a que está aberta antes de aplicar de novo.',
}

type Escolha = (typeof ESCOLHA_DE_AVALIATIVA)[number]['valor']

/**
 * A atividade pode ir para a turma? Só a atividade objetiva; a versão adaptada, só depois de aprovada (regra 70, item
 * 3: o banco também recusa); e não enquanto ela já está aberta para a turma.
 */
export function podeAplicar(artefato: Pick<RespostaArtefato, 'tipo' | 'entrega'>, aplicadas: readonly Pick<AtividadeAplicada, 'estado'>[]): boolean {
  if (artefato.tipo !== 'atividade_objetiva') return false
  if (artefato.entrega !== null && artefato.entrega.estado !== 'aprovada') return false
  return !aplicadas.some((aplicada) => aplicada.estado === 'aberta')
}

interface PropsDaAplicacao {
  readonly artefato: RespostaArtefato
  readonly nomeDaTurma: string | undefined
}

/**
 * **Aplicar à turma e encerrar** (A3; `docs/mvp-contratos.md`, "Atividade e correção"): a atividade objetiva vai para a
 * turma com a escolha "é avaliativa?", que diz o que acontece com o Tutor; depois ela aparece como "Atribuída à turma",
 * com quantos já enviaram, e pode ser encerrada.
 *
 * As duas são decisões da professora, registradas com quem e quando, e por isso passam pela confirmação que diz o que
 * vai acontecer antes (regra 50, item 8): aplicar mostra a atividade, a turma e o efeito da escolha; encerrar diz que as
 * respostas param, que a correção é feita e que ela fica esperando a professora. A versão adaptada só aplica aprovada.
 */
export function AplicacaoDoArtefato({ artefato, nomeDaTurma }: PropsDaAplicacao) {
  const cliente = useQueryClient()
  const atividades = useQuery(consultaAtividadesAplicadas(artefato.turmaId))
  const [dialogo, definirDialogo] = useState<{ tipo: 'aplicar' } | { tipo: 'encerrar'; aplicada: AtividadeAplicada } | undefined>(undefined)
  const [escolha, definirEscolha] = useState<Escolha | undefined>(undefined)
  const [tentou, definirTentou] = useState(false)
  const [aviso, definirAviso] = useState('')
  const decidindo = useRef(false)
  const secao = useRef<HTMLElement>(null)
  const idDoTitulo = useId()
  const idDaEscolha = useId()

  const aplicadas = (atividades.data?.itens ?? []).filter((aplicada) => aplicada.artefatoId === artefato.id)
  const fechar = () => definirDialogo(undefined)
  const aoTerminar = async () => {
    recarregarAtividades(cliente)
    await cliente.invalidateQueries({ queryKey: consultaAtividadesAplicadas(artefato.turmaId).queryKey })
    fechar()
  }
  const aplicar = useMutation({ mutationFn: (avaliativa: boolean) => aplicarAtividade({ artefatoId: artefato.id, turmaId: artefato.turmaId, avaliativa }), onSuccess: aoTerminar, onSettled: () => (decidindo.current = false) })
  const encerrar = useMutation({ mutationFn: (id: string) => encerrarAtividade(id), onSuccess: aoTerminar, onSettled: () => (decidindo.current = false) })

  function abrirAplicar(): void {
    aplicar.reset()
    definirEscolha(undefined)
    definirTentou(false)
    definirDialogo({ tipo: 'aplicar' })
  }

  function confirmarAplicar(): void {
    definirTentou(true)
    const escolhida = ESCOLHA_DE_AVALIATIVA.find((opcao) => opcao.valor === escolha)
    if (escolhida === undefined || decidindo.current) return
    decidindo.current = true
    aplicar.mutate(escolhida.avaliativa)
  }

  function confirmarEncerrar(aplicada: AtividadeAplicada): void {
    if (decidindo.current) return
    decidindo.current = true
    encerrar.mutate(aplicada.id)
  }

  /** A atividade já está encerrada: pedir a correção de novo não muda nada para os alunos, e não passa pelo diálogo. */
  function corrigirDeNovo(aplicada: AtividadeAplicada): void {
    if (decidindo.current) return
    decidindo.current = true
    definirAviso('')
    encerrar.mutate(aplicada.id, {
      onSuccess: ({ atividade }) => definirAviso(atividade.entrega === null ? TEXTO_SEM_CORRECAO[semCorrecao(atividade) ?? 'correcao_suspensa'] : 'Correção feita. Ela está esperando você revisar.'),
    })
  }

  const turma = nomeDaTurma ?? 'Turma da atividade'
  const aplicavel = atividades.data !== undefined && podeAplicar(artefato, aplicadas)
  // A versão adaptada que ainda não foi aprovada não vai à turma: a tela diz por quê, em vez de oferecer um botão que a API recusa.
  const esperaAprovacao = artefato.tipo === 'atividade_objetiva' && artefato.entrega !== null && artefato.entrega.estado === 'pendente'
  if (artefato.tipo !== 'atividade_objetiva') return null

  return (
    <section ref={secao} tabIndex={-1} aria-labelledby={idDoTitulo} data-aplicacao-do-artefato="" className="flex min-w-0 flex-col gap-3 rounded-cartao">
      <CabecalhoDeSecao
        id={idDoTitulo}
        titulo="Na turma"
        apoio={aplicadas.length === 0 ? 'Esta atividade ainda não foi aplicada.' : 'Atribuída à turma.'}
        acao={
          aplicavel ? (
            <Botao variante="oficial" onClick={abrirAplicar}>
              Aplicar à turma
            </Botao>
          ) : undefined
        }
      />
      {atividades.isError && (
        <p role="alert" className="rounded-controle bg-erro-cx p-3 break-words text-erro">
          {textoDaFalha(atividades.error)}
        </p>
      )}
      <p role="status" className="rounded-controle bg-info-cx p-3 break-words text-info empty:hidden">
        {aviso}
      </p>
      {encerrar.isError && dialogo === undefined && (
        <p role="alert" className="rounded-controle bg-erro-cx p-3 break-words text-erro">
          {textoDaFalha(encerrar.error)}
        </p>
      )}
      {esperaAprovacao && <p className="min-w-0 text-sm break-words text-sutil">Esta versão adaptada só pode ser aplicada à turma depois que você aprovar.</p>}
      {aplicadas.length > 0 && (
        <ul className="flex min-w-0 flex-col gap-2">
          {aplicadas.map((aplicada) => {
            const motivo = semCorrecao(aplicada)
            return (
            <li key={aplicada.id} data-atividade-aplicada={aplicada.estado} className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-cartao border border-linha bg-superficie p-4">
              <div className="flex min-w-0 flex-1 basis-56 flex-col gap-1">
                <p className="font-medium break-words text-tinta">{situacaoDaAplicacao(aplicada)}</p>
                <p className="text-sm break-words text-sutil">
                  {turma} · aplicada em {formatarDataHora(aplicada.aplicadaEm)}
                  {aplicada.encerradaEm !== null && ` · encerrada em ${formatarDataHora(aplicada.encerradaEm)}`}
                </p>
                {aplicada.avaliativa && aplicada.estado === 'aberta' && <p className="text-sm break-words text-sutil">É avaliativa: o Tutor está pausado para a turma até você encerrar.</p>}
                {motivo !== undefined && (
                  <p data-sem-correcao={motivo} className="text-sm break-words text-sutil">
                    {TEXTO_SEM_CORRECAO[motivo]}
                  </p>
                )}
              </div>
              {aplicada.estado === 'aberta' && (
                <Botao
                  variante="oficial"
                  onClick={() => {
                    encerrar.reset()
                    definirDialogo({ tipo: 'encerrar', aplicada })
                  }}
                >
                  Encerrar a atividade
                </Botao>
              )}
              {aplicada.entrega !== null && (
                // Relativo à área: o `Route` aninhado em `/professor` resolve o `to` a partir da base dela.
                <Link to={caminhoDaCorrecaoDoProfessor(aplicada.id)} className="inline-flex min-h-11 items-center text-caramelo-texto underline">
                  {aplicada.entrega.estado === 'pendente' ? 'Revisar a correção' : 'Ver a correção'}
                </Link>
              )}
              {/* Encerrada sem lote que valha (função suspensa, ou lote rejeitado): encerrar de novo corrige de novo. */}
              {(motivo === 'correcao_suspensa' || motivo === 'lote_rejeitado') && (
                <Botao variante="secundario" disabled={encerrar.isPending} onClick={() => corrigirDeNovo(aplicada)}>
                  {encerrar.isPending && encerrar.variables === aplicada.id ? 'Corrigindo…' : 'Corrigir de novo'}
                </Botao>
              )}
            </li>
            )
          })}
        </ul>
      )}

      {dialogo?.tipo === 'aplicar' && (
        <DialogoDeConfirmacao
          titulo="Aplicar à turma"
          familia="oficial"
          resumo={[
            { rotulo: 'Atividade', valor: artefato.titulo },
            { rotulo: 'Turma', valor: turma },
            { rotulo: 'Questões', valor: artefato.conteudo.tipo === 'atividade_objetiva' ? String(artefato.conteudo.questoes.length) : '—' },
          ]}
          efeito={EFEITO_DE_APLICAR}
          rotuloDeConfirmar="Aplicar à turma"
          rotuloConfirmando="Aplicando…"
          aoConfirmar={confirmarAplicar}
          aoFechar={fechar}
          confirmando={aplicar.isPending}
          focoDeReserva={() => secao.current?.focus()}
          {...(aplicar.isError ? { falha: textoDaFalha(aplicar.error, TEXTOS_DA_APLICACAO) } : {})}
        >
          <fieldset aria-describedby={idDaEscolha} className="flex min-w-0 flex-col gap-2">
            <legend className="font-medium">Esta atividade é avaliativa?</legend>
            {ESCOLHA_DE_AVALIATIVA.map((opcao) => (
              <label key={opcao.valor} className={`flex min-h-11 min-w-0 cursor-pointer items-start gap-3 rounded-controle border border-borda-campo px-3 py-2 ${escolha === opcao.valor ? 'bg-realce-suave' : 'bg-superficie'}`}>
                <input type="radio" name="avaliativa" value={opcao.valor} checked={escolha === opcao.valor} onChange={() => definirEscolha(opcao.valor)} disabled={aplicar.isPending} className="mt-0.5 size-6 shrink-0 accent-noite" />
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium break-words">{opcao.rotulo}</span>
                  <span className="text-sm break-words text-apoio">{opcao.descricao}</span>
                </span>
              </label>
            ))}
            <p id={idDaEscolha} className="text-sm text-erro empty:hidden">
              {tentou && escolha === undefined ? 'Escolha se a atividade é prática ou avaliativa.' : ''}
            </p>
          </fieldset>
        </DialogoDeConfirmacao>
      )}
      {dialogo?.tipo === 'encerrar' && (
        <DialogoDeConfirmacao
          titulo="Encerrar a atividade"
          familia="oficial"
          resumo={[
            { rotulo: 'Atividade', valor: dialogo.aplicada.titulo },
            { rotulo: 'Turma', valor: turma },
            { rotulo: 'Já enviaram', valor: `${String(dialogo.aplicada.participacao.enviaram)} de ${textoDeAlunos(dialogo.aplicada.participacao.alunos)}` },
          ]}
          efeito={EFEITO_DE_ENCERRAR}
          rotuloDeConfirmar="Encerrar a atividade"
          rotuloConfirmando="Encerrando…"
          aoConfirmar={() => confirmarEncerrar(dialogo.aplicada)}
          aoFechar={fechar}
          confirmando={encerrar.isPending}
          focoDeReserva={() => secao.current?.focus()}
          {...(encerrar.isError ? { falha: textoDaFalha(encerrar.error) } : {})}
        />
      )}
    </section>
  )
}
