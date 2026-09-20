import {
  AVISO_DO_COMPLEMENTO,
  CONTESTACOES_DE_VINCULO,
  EFEITO_DA_CONTESTACAO,
  ESTADOS_EM_DECISAO,
  NOME_DA_CONTESTACAO,
  NOME_DO_ESTADO_DE_VINCULO,
  TAMANHO_MAXIMO_DO_COMPLEMENTO,
  type ContestacaoDeVinculo,
  type EstadoDeVinculo,
  type Vinculo,
} from '@educa/shared'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useId, useState, type FormEvent } from 'react'
import { mensagemDoErro } from '../api/cliente'
import { confirmarVinculo, consultaMeusVinculos, contestarVinculo } from '../api/vinculos'
import { Botao } from '../componentes/Botao'
import { EstadoCarregando, EstadoErro, EstadoVazio } from '../componentes/estado'

/** A contestação que está sendo escrita, no estado da página: a lista pode recarregar por baixo sem levá-la junto. */
interface ContestacaoEmAndamento {
  readonly vinculoId: string
  /** Vazio enquanto nenhum motivo foi escolhido: sem ele, a contestação não é enviada. */
  readonly codigo: ContestacaoDeVinculo | ''
  readonly complemento: string
}

const emDecisao = (estado: EstadoDeVinculo): boolean => (ESTADOS_EM_DECISAO as readonly EstadoDeVinculo[]).includes(estado)

/** "7ºA · Matemática", ou só a turma quando o vínculo não tem disciplina. */
function nomeDoVinculo(vinculo: Vinculo): string {
  return vinculo.disciplina === undefined ? vinculo.turma.nome : `${vinculo.turma.nome} · ${vinculo.disciplina.nome}`
}

/**
 * Os vínculos do professor na escola ativa (RF4, RF20). Um cartão por turma e disciplina: o professor que dá duas
 * disciplinas na mesma turma tem dois, e confirma ou contesta cada um separadamente.
 *
 * - **O estado aparece em texto**, e não só em cor (regra 50, item 11).
 * - **Contestar mostra o que vai acontecer antes de enviar** (regra 50, item 8): a coordenação vê, e o vínculo não dá
 *   acesso à turma até ser corrigido. O complemento é texto livre que a coordenação lê, e por isso a tela avisa para
 *   não escrever nome de aluno ali (regra 20).
 * - **O que está sendo escrito mora aqui, na página**, e não no cartão: a lista some e volta a cada recarga — e a
 *   sessão pode até vencer no meio —, e nada disso pode apagar o que a professora digitou (regra 80, item 6).
 *
 * Quatro estados: carregando, erro com "Tentar de novo", vazio convidando a falar com a coordenação, e a lista.
 */
export function Vinculos() {
  const cliente = useQueryClient()
  const vinculos = useInfiniteQuery(consultaMeusVinculos)
  const [contestacao, definirContestacao] = useState<ContestacaoEmAndamento | undefined>(undefined)

  const recarregar = () => cliente.invalidateQueries({ queryKey: consultaMeusVinculos.queryKey })

  const confirmar = useMutation({ mutationFn: (id: string) => confirmarVinculo(id), onSuccess: recarregar })
  const contestar = useMutation({
    mutationFn: (pedido: ContestacaoEmAndamento & { codigo: ContestacaoDeVinculo }) => {
      const complemento = pedido.complemento.trim()
      return contestarVinculo(pedido.vinculoId, { contestacao: pedido.codigo, ...(complemento === '' ? {} : { complemento }) })
    },
    onSuccess: async () => {
      definirContestacao(undefined)
      await recarregar()
    },
  })

  const itens = vinculos.data?.pages.flatMap((pagina) => pagina.itens) ?? []
  // Uma decisão por vez: dois cliques seguidos no mesmo cartão, ou em dois cartões, são ação oficial repetida.
  const decidindo = confirmar.isPending || contestar.isPending

  function aoConfirmar(id: string): void {
    if (decidindo) return
    confirmar.mutate(id)
  }

  function aoContestar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault()
    if (decidindo || contestacao === undefined || contestacao.codigo === '') return
    contestar.mutate({ ...contestacao, codigo: contestacao.codigo })
  }

  return (
    <section className="flex min-w-0 flex-col gap-4" aria-labelledby="titulo-vinculos">
      <h1 id="titulo-vinculos" className="text-xl font-semibold sm:text-2xl">
        Meus vínculos
      </h1>
      <p className="text-slate-700">Confira as turmas e disciplinas que a coordenação alocou para você neste ano letivo.</p>

      {vinculos.isPending && <EstadoCarregando rotulo="Carregando os seus vínculos…" />}
      {vinculos.isError && <EstadoErro erro={vinculos.error} tentando={vinculos.isFetching} aoTentarDeNovo={() => void vinculos.refetch({ cancelRefetch: false })} />}
      {!vinculos.isPending && !vinculos.isError && itens.length === 0 && (
        <EstadoVazio
          titulo="Nenhuma turma alocada ainda"
          descricao="A coordenação ainda não alocou turmas para você neste ano letivo. Fale com ela para ser alocado; assim que isso acontecer, as turmas aparecem aqui para você confirmar."
        />
      )}

      {itens.length > 0 && (
        <ul className="flex flex-col gap-3">
          {itens.map((vinculo) => (
            <li key={vinculo.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-medium break-words text-slate-900">{nomeDoVinculo(vinculo)}</p>
              {/* O estado em texto: a cor sozinha não chega a quem não a distingue nem ao leitor de tela. */}
              <p className="mt-1 text-slate-700">
                {NOME_DO_ESTADO_DE_VINCULO[vinculo.estado]}
                {vinculo.contestacao !== undefined && ` · ${NOME_DA_CONTESTACAO[vinculo.contestacao]}`}
              </p>
              {confirmar.isError && confirmar.variables === vinculo.id && (
                <p role="alert" className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-red-900">
                  {mensagemDoErro(confirmar.error)}
                </p>
              )}
              {emDecisao(vinculo.estado) &&
                (contestacao?.vinculoId === vinculo.id ? (
                  <FormularioDeContestacao
                    contestacao={contestacao}
                    enviando={contestar.isPending}
                    falha={contestar.isError ? contestar.error : undefined}
                    aoMudar={definirContestacao}
                    aoEnviar={aoContestar}
                    aoCancelar={() => definirContestacao(undefined)}
                  />
                ) : (
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Botao onClick={() => aoConfirmar(vinculo.id)} disabled={decidindo} className="disabled:bg-slate-600">
                      {confirmar.isPending && confirmar.variables === vinculo.id ? 'Confirmando…' : 'Confirmar'}
                    </Botao>
                    <button
                      type="button"
                      onClick={() => definirContestacao({ vinculoId: vinculo.id, codigo: '', complemento: '' })}
                      disabled={decidindo}
                      className="inline-flex min-h-11 items-center rounded-md border border-slate-400 px-4 py-2 text-base font-medium text-blue-800 active:bg-slate-100 disabled:text-slate-600"
                    >
                      Contestar
                    </button>
                  </div>
                ))}
            </li>
          ))}
        </ul>
      )}

      {vinculos.hasNextPage && (
        <Botao onClick={() => void vinculos.fetchNextPage()} disabled={vinculos.isFetchingNextPage} className="self-start disabled:bg-slate-600">
          {vinculos.isFetchingNextPage ? 'Carregando…' : 'Ver mais vínculos'}
        </Botao>
      )}
    </section>
  )
}

interface PropsDaContestacao {
  contestacao: ContestacaoEmAndamento
  enviando: boolean
  falha: unknown
  aoMudar: (contestacao: ContestacaoEmAndamento) => void
  aoEnviar: (evento: FormEvent<HTMLFormElement>) => void
  aoCancelar: () => void
}

/**
 * O formulário da contestação: o motivo em código fechado, o complemento curto e, antes de enviar, o que vai
 * acontecer. Sem motivo escolhido nada é enviado — o `required` do grupo segura no navegador, e a página confere de
 * novo antes de chamar a API.
 */
function FormularioDeContestacao({ contestacao, enviando, falha, aoMudar, aoEnviar, aoCancelar }: PropsDaContestacao) {
  const campoComplemento = useId()
  const aviso = useId()
  return (
    <form className="mt-3 flex flex-col gap-3" onSubmit={aoEnviar}>
      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium">O que está errado neste vínculo?</legend>
        {CONTESTACOES_DE_VINCULO.map((codigo) => (
          <label key={codigo} className="flex min-h-11 items-center gap-3">
            <input
              type="radio"
              name={`contestacao-${contestacao.vinculoId}`}
              value={codigo}
              checked={contestacao.codigo === codigo}
              onChange={() => aoMudar({ ...contestacao, codigo })}
              required
              className="h-6 w-6"
            />
            <span>{NOME_DA_CONTESTACAO[codigo]}</span>
          </label>
        ))}
      </fieldset>
      <div className="flex flex-col gap-1">
        <label htmlFor={campoComplemento} className="font-medium">
          Quer explicar? (opcional)
        </label>
        <p id={aviso} className="text-sm text-slate-700">
          {AVISO_DO_COMPLEMENTO} Até {TAMANHO_MAXIMO_DO_COMPLEMENTO} caracteres.
        </p>
        <textarea
          id={campoComplemento}
          aria-describedby={aviso}
          maxLength={TAMANHO_MAXIMO_DO_COMPLEMENTO}
          rows={3}
          value={contestacao.complemento}
          onChange={(evento) => aoMudar({ ...contestacao, complemento: evento.target.value })}
          className="rounded-md border border-slate-400 bg-white px-3 py-2 text-base"
        />
      </div>
      {/* Ação oficial: a professora vê o efeito antes de confirmar (regra 50, item 8). */}
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">{EFEITO_DA_CONTESTACAO}</p>
      {falha !== undefined && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-900">
          {mensagemDoErro(falha)}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Botao type="submit" disabled={enviando} className="disabled:bg-slate-600">
          {enviando ? 'Enviando…' : 'Enviar a contestação'}
        </Botao>
        <button
          type="button"
          onClick={aoCancelar}
          disabled={enviando}
          className="inline-flex min-h-11 items-center rounded-md border border-slate-400 px-4 py-2 text-base font-medium text-blue-800 active:bg-slate-100 disabled:text-slate-600"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
