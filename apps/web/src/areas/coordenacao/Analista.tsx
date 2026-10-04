import { NOME_DO_ALERTA_DO_ANALISTA, TEXTO_DA_HIPOTESE, type ConteudoDoResumoDoAnalista } from '@educa/shared'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { emCurso } from '../../api/ciclo-de-execucao'
import { useCicloDeExecucao } from '../../api/execucoes'
import { consultaResumoDoAnalista, gerarResumoDoAnalista, lugarDoResumoDoAnalista } from '../../api/governanca'
import { BarraRotulada } from '../../componentes/BarraRotulada'
import { Botao } from '../../componentes/Botao'
import { Cartao } from '../../componentes/Cartao'
import { EstadoCarregando, EstadoErro, EstadoVazio } from '../../componentes/estado'
import { AvatarAgente } from '../../componentes/ia/AvatarAgente'
import { AvisoFila } from '../../componentes/ia/AvisoFila'
import { NumeroPainel } from '../../componentes/NumeroPainel'
import { Estado } from '../../componentes/SeloDeEstado'
import { CabecalhoDeSecao, Tela } from '../../componentes/Tela'
import { formatarData, formatarDataHora, formatarQuantidade } from '../../formatar'
import { useTituloDaTela } from '../../titulo'
import { DadoNominal } from './DadoNominal'
import { acertoPercentual, AVISO_DE_HIPOTESE, falhaDoResumo, formatarPercentual, fraseDoAlerta, nomeDoRecorte } from './textos-da-governanca'

const enviarPedido = (_pedido: null, chaveEnvio: string) => gerarResumoDoAnalista(chaveEnvio)

/**
 * Analista de desempenho escolar (MVP, A5; `docs/interface.md` 3; D34, D45, D57, D64; regra 70, itens 7 a 9): o resumo
 * da escola, **sempre em agregado por série e disciplina**, e só do que os professores já aprovaram.
 *
 * - **O alerta é hipótese com contexto.** O resumo não tem texto livre: a tela monta a frase a partir do tipo, do
 *   número medido, da referência e das hipóteses de lista fechada. Nunca conclui sobre professor nem sobre aluno.
 * - **O recorte com menos de dois professores não tem número**, e a tela diz isso: o número dele seria o de uma pessoa.
 * - **"Gerar resumo"** segue o ciclo de execução das outras telas de IA: 202, consulta até terminar, e o resumo novo é
 *   lido. Função suspensa e limite de pedidos viram aviso, nunca erro cru.
 * - O dado nominal fica à parte, com o aviso de auditoria (`DadoNominal`).
 */
export default function Analista() {
  useTituloDaTela('Analista')
  const cliente = useQueryClient()
  const resumo = useQuery(consultaResumoDoAnalista)
  const { ciclo, demorando, iniciar, repetir, limpar } = useCicloDeExecucao(lugarDoResumoDoAnalista, enviarPedido)
  const gerando = emCurso(ciclo)
  const concluiu = ciclo?.etapa === 'concluida'
  // Quando o resumo novo chega, o foco vai para ele: o botão volta a dizer "Gerar resumo", e quem usa teclado não fica perdido.
  const resumoNovo = useRef<HTMLParagraphElement>(null)
  const focarResumo = useRef(false)

  // O resumo que a execução gravou é lido de novo quando ela conclui, e o pedido sai do lugar: o botão volta.
  useEffect(() => {
    if (!concluiu) return
    focarResumo.current = true
    void cliente.invalidateQueries({ queryKey: consultaResumoDoAnalista.queryKey }).then(() => {
      if (focarResumo.current) resumoNovo.current?.focus()
      focarResumo.current = false
    })
    limpar()
  }, [concluiu, cliente, limpar])

  const gerar = useCallback(() => {
    limpar()
    iniciar(null)
  }, [iniciar, limpar])

  const falha = ciclo?.etapa === 'falhou' ? falhaDoResumo(ciclo.erro) : undefined
  const acoes = (
    // Um `primario` por tela: com o erro na tela, o "Tentar de novo" dele é o primário.
    <Botao variante={resumo.isError ? 'secundario' : 'primario'} onClick={gerar} disabled={gerando}>
      {gerando ? 'Gerando o resumo…' : 'Gerar resumo'}
    </Botao>
  )

  return (
    <Tela titulo="Analista" acoes={acoes}>
      <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-cartao border border-linha bg-superficie p-4">
        <AvatarAgente agente="analista_de_desempenho_escolar" tamanho={48} />
        <div className="min-w-0 flex-1 basis-56">
          <p className="font-semibold break-words text-tinta">Analista de desempenho escolar</p>
          <p className="break-words text-apoio">Resume o desempenho por série e disciplina, a partir do que os professores já aprovaram. Só avisa a coordenação: nunca contata professor nem família.</p>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3 empty:hidden">
        <p role="status" className="text-apoio empty:hidden">
          {gerando ? 'O Analista está montando o resumo. Você pode continuar nesta tela.' : ''}
        </p>
        {gerando && demorando && <AvisoFila situacao="demora" />}
        {falha !== undefined && (falha.repetivel ? <AvisoFila situacao="falha" aoTentarDeNovo={repetir} /> : <p role="alert" className="rounded-controle border border-pendente bg-pendente-cx p-3 break-words text-pendente">{falha.texto}</p>)}
      </div>

      {resumo.isPending && <EstadoCarregando rotulo="Carregando o resumo…" />}
      {resumo.isError && <EstadoErro erro={resumo.error} tentando={resumo.isFetching} aoTentarDeNovo={() => void resumo.refetch({ cancelRefetch: false })} />}
      {resumo.data !== undefined &&
        (resumo.data.resumo === null ? (
          <EstadoVazio
            variante="tracejado"
            titulo="Nenhum resumo gerado ainda"
            descricao="Use “Gerar resumo” para o Analista montar o acerto por habilidade de cada série e disciplina, com os alertas. Só entra o que os professores já aprovaram, e nenhum nome de aluno ou de professor."
          />
        ) : (
          <Resumo geradoEm={resumo.data.resumo.geradoEm} conteudo={resumo.data.resumo.conteudo} foco={resumoNovo} />
        ))}

      <DadoNominal />
    </Tela>
  )
}

function Resumo({ geradoEm, conteudo, foco }: { readonly geradoEm: string; readonly conteudo: ConteudoDoResumoDoAnalista; readonly foco: RefObject<HTMLParagraphElement | null> }) {
  const { escola, recortes, recortesNominais, periodo } = conteudo
  // Só o tipo que a tela sabe dizer: os outros tipos do contrato não são produzidos nesta versão e não ganham frase.
  const alertas = conteudo.alertas.flatMap((alerta) => {
    const frase = fraseDoAlerta(alerta)
    return frase === null ? [] : [{ alerta, frase }]
  })
  const sinais = escola.sinais.travou + escola.sinais.resposta_pronta + escola.sinais.duvida_repetida
  return (
    <div data-resumo-do-analista className="flex min-w-0 flex-col gap-4">
      <p ref={foco} tabIndex={-1} className="text-sm text-sutil">
        Resumo gerado em {formatarDataHora(geradoEm)}, com o que aconteceu de {formatarData(periodo.inicio)} a {formatarData(periodo.fim)}. Feito de dado agregado: nenhum nome de aluno ou de professor entrou nele.
      </p>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumeroPainel rotulo="Atividades aplicadas" valor={escola.atividadesAplicadas} />
        <NumeroPainel rotulo="Correções aprovadas" valor={escola.lotesAprovados} apoio={`${formatarQuantidade(escola.lotesEsperando, 'esperando', 'esperando')} o professor`} />
        <NumeroPainel rotulo="Trocas com o Tutor" valor={escola.trocasComOTutor} apoio={`${formatarQuantidade(sinais, 'aviso', 'avisos')} aos professores`} />
        <NumeroPainel rotulo="Versões adaptadas aprovadas" valor={escola.versoesAdaptadasAprovadas} />
      </div>

      <section className="flex min-w-0 flex-col gap-3" aria-labelledby="titulo-alertas">
        <CabecalhoDeSecao id="titulo-alertas" titulo="Alertas" apoio={AVISO_DE_HIPOTESE} />
        {alertas.length === 0 ? (
          <EstadoVazio titulo="Nenhum alerta neste resumo" descricao="O Analista avisa quando o acerto de uma habilidade, numa série e disciplina com correção aprovada de dois ou mais professores, fica abaixo do limite provisório desta versão." />
        ) : (
          <ul className="flex min-w-0 flex-col gap-3">
            {alertas.map(({ alerta, frase }) => (
              <li key={`${alerta.serie.id}:${alerta.disciplina.id}:${alerta.habilidade?.codigo ?? ''}`} data-alerta={alerta.tipo} className="flex min-w-0 flex-col gap-2 rounded-cartao border border-linha bg-superficie p-4 lg:p-5">
                <h3 className="font-medium break-words text-tinta">{NOME_DO_ALERTA_DO_ANALISTA[alerta.tipo]}</h3>
                <p className="max-w-prose break-words text-tinta">{frase}</p>
                <div className="min-w-0 rounded-controle bg-info-cx p-3 text-info">
                  <p className="font-medium">Hipóteses a conferir</p>
                  <ul className="mt-1 flex list-disc flex-col gap-1 pl-5">
                    {alerta.hipoteses.map((hipotese) => (
                      <li key={hipotese} className="break-words">
                        {TEXTO_DA_HIPOTESE[hipotese]}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex min-w-0 flex-col gap-3" aria-labelledby="titulo-recortes">
        <CabecalhoDeSecao id="titulo-recortes" titulo="Acerto por série e disciplina" apoio="Só das correções que os professores aprovaram. Um recorte só tem número quando dois ou mais professores aprovaram correção nele." />
        {recortes.length === 0 && recortesNominais.length === 0 && (
          <EstadoVazio titulo="Ainda não há correção aprovada" descricao="Quando um professor aprovar a correção de uma atividade objetiva, o acerto por habilidade da série e da disciplina aparece aqui no próximo resumo." />
        )}
        {recortes.map((recorte) => (
          <Cartao key={`${recorte.serie.id}:${recorte.disciplina.id}`} titulo={nomeDoRecorte(recorte)} nivel={3}>
            <p className="text-sm break-words text-sutil">
              {formatarQuantidade(recorte.alunos, 'aluno', 'alunos')} · {formatarQuantidade(recorte.lotesAprovados, 'correção aprovada', 'correções aprovadas')} · acerto de{' '}
              {formatarPercentual(recorte.acertoPercentual)}
            </p>
            <div className="mt-3 flex min-w-0 flex-col gap-3">
              {recorte.porHabilidade.map((medida) => (
                <BarraRotulada
                  key={medida.habilidade.codigo}
                  rotulo={medida.habilidade.descricao}
                  valor={acertoPercentual(medida.acertos, medida.total)}
                  texto={`${formatarPercentual(acertoPercentual(medida.acertos, medida.total))} · ${String(medida.acertos)} de ${String(medida.total)}`}
                  detalhe={medida.habilidade.codigo}
                />
              ))}
            </div>
          </Cartao>
        ))}
        {recortesNominais.length > 0 && (
          <Cartao titulo="Recortes sem número" nivel={3}>
            <p className="break-words text-apoio">Estes recortes têm correção aprovada, mas de menos de dois professores. O número deles seria o resultado de um professor só, e por isso não aparece no agregado.</p>
            <ul className="mt-3 flex min-w-0 flex-col gap-2">
              {recortesNominais.map((recorte) => (
                <li key={`${recorte.serie.id}:${recorte.disciplina.id}`} data-recorte-nominal className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 break-words text-tinta">{nomeDoRecorte(recorte)}</span>
                  <Estado familia="info">Menos de dois professores com correção aprovada: conta como nominal</Estado>
                </li>
              ))}
            </ul>
          </Cartao>
        )}
      </section>
    </div>
  )
}
