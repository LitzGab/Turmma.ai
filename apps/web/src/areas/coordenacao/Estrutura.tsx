import {
  ANOS_DA_ETAPA,
  CodigoDeErro,
  ESTADOS_DO_PROFESSOR_ALOCAVEIS,
  ETAPAS,
  fimCaiAteOAnoSeguinte,
  fimDepoisDoInicio,
  inicioCaiNoAnoLetivo,
  MAIOR_ANO_LETIVO,
  MENOR_ANO_LETIVO,
  nomeDaSerie,
  TAMANHO_MAXIMO_NOME_DISCIPLINA,
  TAMANHO_MAXIMO_NOME_TURMA,
  TURNOS,
  type AnoLetivo,
  type Disciplina,
  type EstadoDoProfessor,
  type Etapa,
  type Serie,
  type Turma,
  type Turno,
} from '@educa/shared'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Link } from 'wouter'
import {
  abrirAnoLetivo,
  CHAVE_DA_ESTRUTURA,
  consultaAnosLetivos,
  consultaDisciplinas,
  consultaSeries,
  consultaTurmas,
  consultaVinculos,
  criarAnoLetivo,
  criarDisciplina,
  criarSerie,
  criarTurma,
  excluirDisciplina,
  excluirTurma,
  renomearDisciplina,
  renomearTurma,
} from '../../api/estrutura'
import { consultaProfessores } from '../../api/professores'
import { caminhoDaTurmaNaEstrutura } from '../../caminhos'
import { CLASSES_DO_BOTAO_PERIGO, CLASSES_DO_BOTAO_SECUNDARIO, CLASSES_DO_LINK_SECUNDARIO } from '../../componentes/botao-secundario'
import { Campo } from '../../componentes/Campo'
import { useDialogoDaTela } from '../../componentes/dialogo-aberto'
import { EstadoCarregando, EstadoErro, EstadoVazio } from '../../componentes/estado'
import { formatarData } from '../../formatar'
import { useTituloDaTela } from '../../titulo'
import { Alocacao } from './Alocacao'
import { AlertaDaFalha, Anuncio, ConfirmacaoDePerigo, DialogoDeFormulario, listaMudou, textoDaFalha, useEnvioUnico } from './dialogos'
import { ordenarPeloNome, ordenarSeries, ordenarTurmas } from './ordem'

/** O nome da turma com o turno, quando a escola informou: "7ºA · manhã". */
const NOME_DO_TURNO: Readonly<Record<Turno, string>> = { manha: 'manhã', tarde: 'tarde', noite: 'noite', integral: 'integral' }

/** Os diálogos da tela, um por vez. Os de renomear e excluir levam o item da linha, fotografado na abertura. */
type TipoDeDialogo = 'ano' | 'serie' | 'disciplina' | 'turma' | 'renomear_disciplina' | 'excluir_disciplina' | 'renomear_turma' | 'excluir_turma'
type AlvoDoDialogo = { readonly id: string; readonly nome: string }

/** Um passo do roteiro: feito, falta, ou um passo que a tela não mede (a lista de cada turma, lida só com auditoria). */
interface PassoDoRoteiro {
  readonly titulo: string
  readonly texto: string
  readonly feito: boolean | undefined
}

/**
 * O que a tela sabe de cada passo. `undefined` é "ainda não sei": a leitura daquele passo está carregando ou falhou, e o
 * passo fica sem marca. Dizer "falta" ali mandaria a coordenação criar o que a escola já tem.
 */
interface ContagemDoRoteiro {
  readonly anoEmCurso: boolean
  readonly series: number | undefined
  readonly disciplinas: number | undefined
  readonly turmas: number | undefined
  readonly professores: number | undefined
  readonly vinculos: number | undefined
}

/**
 * O roteiro da escola até a alocação (`docs/interface.md` 3; W4, "Estrutura"): o vazio o mostra inteiro, e com dado ele
 * diz o que falta. A lista de nomes não tem marca: saber se cada turma tem lista seria ler a lista de cada uma, e cada
 * leitura da coordenação vai para a auditoria (regra 20, item 10).
 */
function passosDoRoteiro(dados: ContagemDoRoteiro | undefined): PassoDoRoteiro[] {
  const tem = (quantos: number | undefined) => (quantos === undefined ? undefined : quantos > 0)
  return [
    { titulo: 'Ano letivo', texto: 'Crie o ano letivo e abra: as turmas nascem no ano em curso.', feito: dados?.anoEmCurso },
    { titulo: 'Séries', texto: 'Do 6º ao 9º ano e do 1º ao 3º do Ensino Médio.', feito: tem(dados?.series) },
    { titulo: 'Disciplinas', texto: 'As que os professores dão.', feito: tem(dados?.disciplinas) },
    { titulo: 'Turmas', texto: 'Cada turma numa série do ano em curso.', feito: tem(dados?.turmas) },
    { titulo: 'Lista de nomes', texto: 'Abra cada turma e cole a lista ou envie o arquivo, com nome e matrícula.', feito: undefined },
    { titulo: 'Professores', texto: 'Cadastre cada professor com o e-mail dele e mande o convite.', feito: tem(dados?.professores) },
    { titulo: 'Alocação', texto: 'Ligue cada professor à turma e à disciplina. Ele confirma pelo convite.', feito: tem(dados?.vinculos) },
  ]
}

function Roteiro({ passos, titulo }: { passos: readonly PassoDoRoteiro[]; titulo: string }) {
  const idDoTitulo = useId()
  return (
    <section aria-labelledby={idDoTitulo} className="rounded-cartao border border-linha bg-superficie p-4">
      <h2 id={idDoTitulo} className="font-semibold text-tinta">
        {titulo}
      </h2>
      <ol className="mt-3 flex flex-col gap-2">
        {passos.map((passo, posicao) => (
          <li key={passo.titulo} className="flex min-w-0 gap-3">
            <span className="w-6 shrink-0 text-right text-sutil tabular-nums">{posicao + 1}.</span>
            <span className="min-w-0 break-words">
              <span className="font-medium text-tinta">{passo.titulo}</span>
              {/* O estado em texto, e não só em cor (regra 50, item 11). */}
              {passo.feito !== undefined && <span className={passo.feito ? 'text-ok' : 'text-pendente'}>{passo.feito ? ' · feito' : ' · falta'}</span>}
              <span className="block text-sm text-apoio">{passo.texto}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** As seções da tela que têm escrita: o anúncio de cada ação aparece na seção dela. */
type SecaoDaTela = 'ano' | 'series' | 'disciplinas' | 'turmas' | 'alocacao'

interface PropsDaSecao {
  readonly titulo: string
  readonly tituloRef: RefObject<HTMLHeadingElement | null>
  /** O anúncio da última ação desta seção, ou vazio. */
  readonly anuncio: string
  readonly acao?: ReactNode
  readonly children: ReactNode
}

/** Uma seção da tela, com o título que recebe o foco quando o botão que tinha o foco sai (o item excluído). */
function Secao({ titulo, tituloRef, anuncio, acao, children }: PropsDaSecao) {
  const idDoTitulo = useId()
  return (
    <section aria-labelledby={idDoTitulo} className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 ref={tituloRef} id={idDoTitulo} tabIndex={-1} className="text-lg font-semibold text-tinta">
          {titulo}
        </h2>
        {acao}
      </div>
      <Anuncio texto={anuncio} />
      {children}
    </section>
  )
}

/** "Mostrando os primeiros 1.000": a lista passou do teto de páginas que a tela lê (`lerPaginas`). */
function AvisoDeListaIncompleta({ completa }: { completa: boolean }) {
  if (completa) return null
  return <p className="text-sm text-apoio">A lista é maior do que esta tela mostra: aparecem só os primeiros.</p>
}

/**
 * Estrutura (A1, 13.0; `docs/interface.md` 3 e 11.1; RF3 e RF8): a coordenação monta a escola numa tela só — o ano
 * letivo, as séries, as disciplinas e as turmas, com renomear e excluir, e a alocação dos professores. A lista de nomes
 * de cada turma abre a partir da turma (`ListaDaTurma`). É onde a coordenação abre enquanto a Governança não existe.
 *
 * Os quatro estados (W4): carregando; erro com "Tentar de novo"; vazio, que é a escola sem ano letivo, com o roteiro até
 * a alocação e o botão do primeiro passo; e com dado, o roteiro com o que falta e as seções. Cada seção tem o seu
 * carregando e o seu erro, e a tela continua em pé quando uma delas falha.
 *
 * O que a API decide, a tela não refaz: "5º ano" nem aparece na escolha de série, mas quem recusa é a API (E1). As
 * escritas passam por diálogos, um por vez; cada abertura nasce vazia.
 */
export function Estrutura() {
  useTituloDaTela('Estrutura')
  const cliente = useQueryClient()
  const anos = useQuery(consultaAnosLetivos)
  const anoEmCurso = anos.data?.itens.find((ano) => ano.situacao === 'em_curso')
  const series = useQuery(consultaSeries)
  const disciplinas = useQuery(consultaDisciplinas)
  // Turmas e vínculos são do ano em curso: sem ele a API responde como inexistente, e a tela nem pergunta.
  const turmas = useQuery({ ...consultaTurmas, enabled: anoEmCurso !== undefined })
  const professores = useQuery(consultaProfessores)
  const vinculos = useQuery({ ...consultaVinculos, enabled: anoEmCurso !== undefined })
  const dialogo = useDialogoDaTela<TipoDeDialogo, AlvoDoDialogo>()
  const aberta = dialogo.aberta
  // O item da linha, fotografado na abertura: os diálogos de renomear e de excluir só existem com ele.
  const alvo = aberta?.alvo
  const [anuncio, definirAnuncio] = useState<{ secao: SecaoDaTela; texto: string } | undefined>(undefined)
  const anunciar = (secao: SecaoDaTela, texto: string) => definirAnuncio(texto === '' ? undefined : { secao, texto })
  const anuncioDa = (secao: SecaoDaTela) => (anuncio?.secao === secao ? anuncio.texto : '')
  const tituloDoAno = useRef<HTMLHeadingElement>(null)
  const tituloDasSeries = useRef<HTMLHeadingElement>(null)
  const tituloDasDisciplinas = useRef<HTMLHeadingElement>(null)
  const tituloDasTurmas = useRef<HTMLHeadingElement>(null)

  const recarregar = useCallback(() => cliente.invalidateQueries({ queryKey: CHAVE_DA_ESTRUTURA }), [cliente])

  /** Abrir um diálogo apaga o anúncio da ação anterior: o que ele dizia já não é o que a pessoa está fazendo. */
  function abrir(tipo: TipoDeDialogo, item?: AlvoDoDialogo): void {
    definirAnuncio(undefined)
    dialogo.abrir(tipo, item)
  }

  if (anos.isPending) return <EstadoCarregando rotulo="Carregando a estrutura da escola…" />

  const cabecalho = <h1 className="sr-only">Estrutura</h1>

  if (anos.isError)
    return (
      <section className="flex min-w-0 flex-col gap-6">
        {cabecalho}
        <EstadoErro erro={anos.error} tentando={anos.isFetching} aoTentarDeNovo={() => void anos.refetch({ cancelRefetch: false })} />
      </section>
    )

  const alocaveis = professores.data?.itens.filter((professor) => (ESTADOS_DO_PROFESSOR_ALOCAVEIS as readonly EstadoDoProfessor[]).includes(professor.estado))
  // Turmas e vínculos são do ano em curso: sem ele não há leitura a esperar, e o passo falta de fato.
  const passos = passosDoRoteiro(
    anos.data.itens.length === 0
      ? undefined
      : {
          anoEmCurso: anoEmCurso !== undefined,
          series: series.data?.itens.length,
          disciplinas: disciplinas.data?.itens.length,
          turmas: anoEmCurso === undefined ? 0 : turmas.data?.itens.length,
          professores: alocaveis?.length,
          vinculos: anoEmCurso === undefined ? 0 : vinculos.data?.itens.length,
        },
  )

  return (
    <section className="flex min-w-0 flex-col gap-8">
      {cabecalho}

      {anos.data.itens.length === 0 ? (
        <>
          <EstadoVazio
            titulo="Comece pelo ano letivo"
            descricao="A escola se monta nesta ordem, e cada passo abre o seguinte. As turmas nascem no ano letivo em curso."
            acao={{ rotulo: 'Criar o ano letivo', aoAcionar: () => abrir('ano') }}
          />
          <Roteiro titulo="O roteiro até a alocação" passos={passos} />
        </>
      ) : (
        <>
          <Roteiro titulo="O que falta para a escola começar" passos={passos} />
          <AnosLetivos
            anos={anos.data.itens}
            tituloRef={tituloDoAno}
            anuncio={anuncioDa('ano')}
            aoCriar={() => abrir('ano')}
            aoAnunciar={(texto) => anunciar('ano', texto)}
            recarregar={recarregar}
          />

          <Secao
            titulo="Séries"
            tituloRef={tituloDasSeries}
            anuncio={anuncioDa('series')}
            acao={
              <button type="button" onClick={() => abrir('serie')} className={CLASSES_DO_BOTAO_SECUNDARIO}>
                Nova série
              </button>
            }
          >
            {series.isPending ? (
              <EstadoCarregando rotulo="Carregando as séries…" />
            ) : series.isError ? (
              <EstadoErro erro={series.error} tentando={series.isFetching} aoTentarDeNovo={() => void series.refetch({ cancelRefetch: false })} />
            ) : series.data.itens.length === 0 ? (
              <p className="text-apoio">Nenhuma série ainda. Crie as séries que a escola tem, do 6º ano ao 3º do Ensino Médio.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {ordenarSeries(series.data.itens).map((serie) => (
                  <li key={serie.id} className="rounded-controle border border-linha bg-superficie px-3 py-2 break-words">
                    {nomeDaSerie(serie)}
                  </li>
                ))}
              </ul>
            )}
          </Secao>

          <Secao
            titulo="Disciplinas"
            tituloRef={tituloDasDisciplinas}
            anuncio={anuncioDa('disciplinas')}
            acao={
              <button type="button" onClick={() => abrir('disciplina')} className={CLASSES_DO_BOTAO_SECUNDARIO}>
                Nova disciplina
              </button>
            }
          >
            {disciplinas.isPending ? (
              <EstadoCarregando rotulo="Carregando as disciplinas…" />
            ) : disciplinas.isError ? (
              <EstadoErro erro={disciplinas.error} tentando={disciplinas.isFetching} aoTentarDeNovo={() => void disciplinas.refetch({ cancelRefetch: false })} />
            ) : disciplinas.data.itens.length === 0 ? (
              <p className="text-apoio">Nenhuma disciplina ainda. Crie as que os professores dão, como Matemática e Língua Portuguesa.</p>
            ) : (
              <>
                <ul className="flex flex-col gap-3">
                  {ordenarPeloNome(disciplinas.data.itens).map((disciplina) => (
                    <Linha key={disciplina.id} titulo={disciplina.nome}>
                      <AcoesDaLinha
                        nome={disciplina.nome}
                        tipo="a disciplina"
                        aoRenomear={() => abrir('renomear_disciplina', disciplina)}
                        aoExcluir={() => abrir('excluir_disciplina', disciplina)}
                      />
                    </Linha>
                  ))}
                </ul>
                <AvisoDeListaIncompleta completa={disciplinas.data.completa} />
              </>
            )}
          </Secao>

          <Secao
            titulo={anoEmCurso === undefined ? 'Turmas' : `Turmas de ${String(anoEmCurso.ano)}`}
            tituloRef={tituloDasTurmas}
            anuncio={anuncioDa('turmas')}
            acao={
              anoEmCurso !== undefined && (
                <button type="button" onClick={() => abrir('turma')} className={CLASSES_DO_BOTAO_SECUNDARIO}>
                  Nova turma
                </button>
              )
            }
          >
            {anoEmCurso === undefined ? (
              <p className="text-apoio">As turmas nascem no ano letivo em curso. Abra o ano letivo acima para criar as turmas.</p>
            ) : turmas.isPending ? (
              <EstadoCarregando rotulo="Carregando as turmas…" />
            ) : turmas.isError ? (
              <EstadoErro erro={turmas.error} tentando={turmas.isFetching} aoTentarDeNovo={() => void turmas.refetch({ cancelRefetch: false })} />
            ) : turmas.data.itens.length === 0 ? (
              <p className="text-apoio">Nenhuma turma ainda. Crie cada turma numa série; depois abra a turma para subir a lista de nomes.</p>
            ) : (
              <>
                <ul className="flex flex-col gap-3">
                  {ordenarTurmas(turmas.data.itens).map((turma) => (
                    <Linha key={turma.id} titulo={turma.nome} detalhe={detalheDaTurma(turma)}>
                      <Link to={caminhoDaTurmaNaEstrutura(turma.id)} className={CLASSES_DO_LINK_SECUNDARIO}>
                        Lista de nomes<span className="sr-only"> da turma {turma.nome}</span>
                      </Link>
                      <AcoesDaLinha nome={turma.nome} tipo="a turma" aoRenomear={() => abrir('renomear_turma', turma)} aoExcluir={() => abrir('excluir_turma', turma)} />
                    </Linha>
                  ))}
                </ul>
                <AvisoDeListaIncompleta completa={turmas.data.completa} />
              </>
            )}
          </Secao>

          <Alocacao anoEmCurso={anoEmCurso !== undefined} anuncio={anuncioDa('alocacao')} aoAnunciar={(texto) => anunciar('alocacao', texto)} />
        </>
      )}

      {aberta?.tipo === 'ano' && (
        <NovoAnoLetivo
          key={aberta.numero}
          aoFechar={dialogo.fechar}
          aoCriar={(ano) => {
            anunciar('ano', `Ano letivo ${String(ano.ano)} criado. Abra o ano para criar as turmas.`)
            dialogo.fecharSeAinda(aberta)
          }}
          recarregar={recarregar}
          // O "Criar o ano letivo" do vazio sai da tela quando o primeiro ano chega: o foco vai para a seção do ano.
          focoDeReserva={() => tituloDoAno.current?.focus()}
        />
      )}
      {aberta?.tipo === 'serie' && (
        <NovaSerie
          key={aberta.numero}
          existentes={series.data?.itens ?? []}
          aoFechar={dialogo.fechar}
          aoCriar={(serie) => {
            anunciar('series', `${nomeDaSerie(serie)} criado.`)
            dialogo.fecharSeAinda(aberta)
          }}
          recarregar={recarregar}
        />
      )}
      {aberta?.tipo === 'disciplina' && (
        <NovaDisciplina
          key={aberta.numero}
          aoFechar={dialogo.fechar}
          aoCriar={(disciplina) => {
            anunciar('disciplinas', `Disciplina ${disciplina.nome} criada.`)
            dialogo.fecharSeAinda(aberta)
          }}
          recarregar={recarregar}
        />
      )}
      {aberta?.tipo === 'turma' && anoEmCurso !== undefined && (
        <NovaTurma
          key={aberta.numero}
          anoLetivo={anoEmCurso}
          series={series.data?.itens ?? []}
          aoFechar={dialogo.fechar}
          aoCriar={(turma) => {
            anunciar('turmas', `Turma ${turma.nome} criada. Abra a turma para subir a lista de nomes.`)
            dialogo.fecharSeAinda(aberta)
          }}
          recarregar={recarregar}
        />
      )}
      {aberta?.tipo === 'renomear_disciplina' && alvo !== undefined && (
        <Renomear
          key={aberta.numero}
          titulo="Renomear a disciplina"
          rotulo="Nome da disciplina"
          atual={alvo.nome}
          maximo={TAMANHO_MAXIMO_NOME_DISCIPLINA}
          renomear={(nome) => renomearDisciplina(alvo.id, nome)}
          conflito="Já existe uma disciplina com este nome na escola. Escolha outro."
          aoFechar={dialogo.fechar}
          aoRenomear={(nome) => {
            anunciar('disciplinas', `Disciplina renomeada para ${nome}.`)
            dialogo.fecharSeAinda(aberta)
          }}
          recarregar={recarregar}
          focoDeReserva={() => tituloDasDisciplinas.current?.focus()}
        />
      )}
      {aberta?.tipo === 'renomear_turma' && alvo !== undefined && (
        <Renomear
          key={aberta.numero}
          titulo="Renomear a turma"
          rotulo="Nome da turma"
          atual={alvo.nome}
          maximo={TAMANHO_MAXIMO_NOME_TURMA}
          renomear={(nome) => renomearTurma(alvo.id, nome)}
          conflito="Já existe uma turma com este nome neste ano letivo. Escolha outro."
          aoFechar={dialogo.fechar}
          aoRenomear={(nome) => {
            anunciar('turmas', `Turma renomeada para ${nome}.`)
            dialogo.fecharSeAinda(aberta)
          }}
          recarregar={recarregar}
          focoDeReserva={() => tituloDasTurmas.current?.focus()}
        />
      )}
      {aberta?.tipo === 'excluir_disciplina' && alvo !== undefined && (
        <ConfirmacaoDePerigo
          key={aberta.numero}
          titulo="Excluir a disciplina"
          texto={
            <>
              A disciplina <span className="font-medium text-tinta">{alvo.nome}</span> sai da escola. Só sai a disciplina sem professor alocado nela, nem
              em alocação já encerrada.
            </>
          }
          rotuloDaAcao="Excluir disciplina"
          rotuloEmAndamento="Excluindo…"
          acao={() => excluirDisciplina(alvo.id)}
          aoFechar={dialogo.fechar}
          aoConcluir={() => {
            anunciar('disciplinas', `Disciplina ${alvo.nome} excluída.`)
            dialogo.fecharSeAinda(aberta)
          }}
          aoTerminar={recarregar}
          textosDaFalha={{
            [CodigoDeErro.CONFLITO]: 'Esta disciplina não pode sair: há professor alocado nela, também em alocação já encerrada. A lista foi atualizada.',
            [CodigoDeErro.NAO_ENCONTRADO]: 'Esta disciplina já não existe. A lista foi atualizada.',
          }}
          focoDeReserva={() => tituloDasDisciplinas.current?.focus()}
        />
      )}
      {aberta?.tipo === 'excluir_turma' && alvo !== undefined && (
        <ConfirmacaoDePerigo
          key={aberta.numero}
          titulo="Excluir a turma"
          texto={
            <>
              A turma <span className="font-medium text-tinta">{alvo.nome}</span> sai do ano letivo. Só sai a turma vazia: sem nomes na lista, sem
              professor alocado (também em alocação encerrada), sem pedido de aluno e sem acesso da turma em vigor.
            </>
          }
          rotuloDaAcao="Excluir turma"
          rotuloEmAndamento="Excluindo…"
          acao={() => excluirTurma(alvo.id)}
          aoFechar={dialogo.fechar}
          aoConcluir={() => {
            anunciar('turmas', `Turma ${alvo.nome} excluída.`)
            dialogo.fecharSeAinda(aberta)
          }}
          aoTerminar={recarregar}
          textosDaFalha={{
            [CodigoDeErro.CONFLITO]:
              'Esta turma não pode sair: ela ainda tem nomes na lista, professor alocado, pedido de aluno ou acesso da turma em vigor. Os nomes livres saem pela lista de nomes da turma; a alocação, o pedido e o acesso não se desfazem por esta tela. A lista foi atualizada.',
            [CodigoDeErro.NAO_ENCONTRADO]: 'Esta turma já não existe. A lista foi atualizada.',
          }}
          focoDeReserva={() => tituloDasTurmas.current?.focus()}
        />
      )}
    </section>
  )
}

/** A série e o turno da turma, por extenso. */
function detalheDaTurma(turma: Turma): string {
  return turma.turno === null ? nomeDaSerie(turma.serie) : `${nomeDaSerie(turma.serie)} · ${NOME_DO_TURNO[turma.turno]}`
}

/** Um item da lista: o cartão, em uma coluna no celular e em linha a partir de 768 px (W12). */
function Linha({ titulo, detalhe, children }: { titulo: string; detalhe?: string; children: ReactNode }) {
  return (
    <li className="flex min-w-0 flex-col gap-3 rounded-cartao border border-linha bg-superficie p-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="font-medium break-words text-tinta">{titulo}</p>
        {detalhe !== undefined && <p className="text-sm break-words text-apoio">{detalhe}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </li>
  )
}

/** Renomear e Excluir da linha, com o nome do item no nome acessível do botão (WCAG 2.5.3). */
function AcoesDaLinha({ nome, tipo, aoRenomear, aoExcluir }: { nome: string; tipo: string; aoRenomear: () => void; aoExcluir: () => void }) {
  return (
    <>
      <button type="button" onClick={aoRenomear} className={CLASSES_DO_BOTAO_SECUNDARIO}>
        Renomear<span className="sr-only"> {tipo} {nome}</span>
      </button>
      <button type="button" onClick={aoExcluir} className={CLASSES_DO_BOTAO_PERIGO}>
        Excluir<span className="sr-only"> {tipo} {nome}</span>
      </button>
    </>
  )
}

const SITUACAO_DO_ANO: Readonly<Record<AnoLetivo['situacao'], string>> = { planejado: 'Planejado', em_curso: 'Em curso', encerrado: 'Encerrado' }

/** O ano letivo: os anos da escola, e "Abrir" no planejado quando nenhum está em curso. */
function AnosLetivos({
  anos,
  tituloRef,
  anuncio,
  aoCriar,
  aoAnunciar,
  recarregar,
}: {
  anos: readonly AnoLetivo[]
  tituloRef: RefObject<HTMLHeadingElement | null>
  anuncio: string
  aoCriar: () => void
  aoAnunciar: (texto: string) => void
  recarregar: () => unknown
}) {
  const temEmCurso = anos.some((ano) => ano.situacao === 'em_curso')
  // O "Abrir" sai da linha com o ano aberto: depois de recarregar, o foco vai para o título da seção.
  const { enviar, mutacao } = useEnvioUnico({
    mutationFn: abrirAnoLetivo,
    onSuccess: async (ano) => {
      await recarregar()
      aoAnunciar(`Ano letivo ${String(ano.ano)} aberto. Agora crie as turmas.`)
      tituloRef.current?.focus()
    },
    onError: recarregar,
  })
  const ordenados = [...anos].sort((a, b) => b.ano - a.ano)
  return (
    <Secao
      titulo="Ano letivo"
      tituloRef={tituloRef}
      anuncio={anuncio}
      acao={
        <button type="button" onClick={aoCriar} className={CLASSES_DO_BOTAO_SECUNDARIO}>
          Novo ano letivo
        </button>
      }
    >
      {mutacao.isError && (
        <AlertaDaFalha
          texto={textoDaFalha(mutacao.error, {
            [CodigoDeErro.CONFLITO]: 'Já há um ano letivo em curso na escola. Só um fica em curso por vez.',
            [CodigoDeErro.NAO_ENCONTRADO]: 'Este ano letivo já não existe. A lista foi atualizada.',
          })}
        />
      )}
      <ul className="flex flex-col gap-3">
        {ordenados.map((ano) => (
          <Linha key={ano.id} titulo={String(ano.ano)} detalhe={`${SITUACAO_DO_ANO[ano.situacao]} · de ${formatarData(ano.inicio)} a ${formatarData(ano.fim)}`}>
            {ano.situacao === 'planejado' && !temEmCurso && (
              <button type="button" onClick={() => enviar(ano.id)} disabled={mutacao.isPending} className={CLASSES_DO_BOTAO_SECUNDARIO}>
                {mutacao.isPending && mutacao.variables === ano.id ? 'Abrindo…' : `Abrir o ano letivo ${String(ano.ano)}`}
              </button>
            )}
          </Linha>
        ))}
      </ul>
    </Secao>
  )
}

/**
 * O diálogo de criar fecha com a lista já recarregada: o item novo está na tela quando o foco volta, e o "Criando…" fica
 * até lá. A falha também recarrega, porque o `NAO_ENCONTRADO` diz que a série ou o ano mudou.
 */
function depoisDeCriar<Criado>(aoCriar: (criado: Criado) => void, recarregar: () => unknown) {
  return {
    onSuccess: async (criado: Criado) => {
      await recarregar()
      aoCriar(criado)
    },
    onError: recarregar,
  }
}

interface PropsDeCriar<Criado> {
  readonly aoFechar: () => void
  readonly aoCriar: (criado: Criado) => void
  readonly recarregar: () => unknown
}

/** O período típico de um ano letivo, para a coordenação só conferir: o calendário de verdade vem no F2. */
function periodoTipico(ano: number): { inicio: string; fim: string } {
  return { inicio: `${String(ano)}-02-01`, fim: `${String(ano)}-12-15` }
}

/**
 * O ano letivo novo. O ano não se altera nem se exclui depois de criado, e por isso o diálogo não deixa o período
 * contradizer o ano calado: o início e o fim acompanham o ano digitado enquanto a pessoa não mexe neles (preparar 2027 em
 * novembro de 2026 não grava o período de 2026), o início precisa cair no ano digitado, e o fim, nele ou no seguinte (a
 * rede que termina o ano letivo em janeiro é normal). Quem recusa é a API, pelo mesmo contrato (`packages/shared`); aqui o
 * erro vai para o campo, em texto, antes de enviar.
 */
function NovoAnoLetivo({ aoFechar, aoCriar, recarregar, focoDeReserva }: PropsDeCriar<AnoLetivo> & { focoDeReserva: () => void }) {
  const [ano, definirAno] = useState(() => String(new Date().getFullYear()))
  const [periodoDigitado, definirPeriodoDigitado] = useState<{ inicio: string; fim: string } | undefined>(undefined)
  const [erros, definirErros] = useState<{ ano?: string; inicio?: string; fim?: string }>({})
  const campoDoAno = useRef<HTMLInputElement>(null)
  const campoDoInicio = useRef<HTMLInputElement>(null)
  const campoDoFim = useRef<HTMLInputElement>(null)
  const { enviar, mutacao } = useEnvioUnico({ mutationFn: criarAnoLetivo, ...depoisDeCriar(aoCriar, recarregar) })

  const numero = Number(ano)
  const anoValido = Number.isInteger(numero) && numero >= MENOR_ANO_LETIVO && numero <= MAIOR_ANO_LETIVO
  const { inicio, fim } = periodoDigitado ?? periodoTipico(anoValido ? numero : new Date().getFullYear())

  function aoEnviar(): void {
    const erroDoInicio =
      inicio === '' ? 'Preencha o início.' : anoValido && !inicioCaiNoAnoLetivo(numero, inicio) ? `O início precisa cair em ${String(numero)}, o ano letivo digitado.` : undefined
    const erroDoFim =
      fim === ''
        ? 'Preencha o fim.'
        : inicio !== '' && !fimDepoisDoInicio(inicio, fim)
          ? 'O fim precisa ser depois do início.'
          : anoValido && !fimCaiAteOAnoSeguinte(numero, fim)
            ? `O fim precisa cair em ${String(numero)} ou em ${String(numero + 1)}.`
            : undefined
    const novos = {
      ...(anoValido ? {} : { ano: `Digite o ano com quatro algarismos, entre ${String(MENOR_ANO_LETIVO)} e ${String(MAIOR_ANO_LETIVO)}.` }),
      ...(erroDoInicio === undefined ? {} : { inicio: erroDoInicio }),
      ...(erroDoFim === undefined ? {} : { fim: erroDoFim }),
    }
    definirErros(novos)
    // O foco vai para o primeiro campo com erro: o leitor de tela lê o erro ao chegar nele.
    if (novos.ano !== undefined) campoDoAno.current?.focus()
    else if (novos.inicio !== undefined) campoDoInicio.current?.focus()
    else if (novos.fim !== undefined) campoDoFim.current?.focus()
    else enviar({ ano: numero, inicio, fim })
  }

  return (
    <DialogoDeFormulario
      titulo="Novo ano letivo"
      aoFechar={aoFechar}
      focoDeReserva={focoDeReserva}
      aoEnviar={aoEnviar}
      enviando={mutacao.isPending}
      rotuloDoEnvio="Criar ano letivo"
      rotuloEnviando="Criando…"
      falha={mutacao.isError ? textoDaFalha(mutacao.error, { [CodigoDeErro.CONFLITO]: 'Este ano letivo já existe na escola.' }) : undefined}
    >
      <Campo ref={campoDoAno} rotulo="Ano" name="ano" inputMode="numeric" autoComplete="off" value={ano} onChange={(evento) => definirAno(evento.target.value)} erro={erros.ano} />
      <Campo
        ref={campoDoInicio}
        rotulo="Início"
        name="inicio"
        type="date"
        value={inicio}
        onChange={(evento) => definirPeriodoDigitado({ inicio: evento.target.value, fim })}
        erro={erros.inicio}
      />
      <Campo ref={campoDoFim} rotulo="Fim" name="fim" type="date" value={fim} onChange={(evento) => definirPeriodoDigitado({ inicio, fim: evento.target.value })} erro={erros.fim} />
      <p className="text-sm text-apoio">
        O ano nasce planejado, e o ano e o período não se alteram depois: confira antes de criar. Depois de criado, abra o ano para criar as turmas nele.
      </p>
    </DialogoDeFormulario>
  )
}

/** As séries do recorte (D43), na ordem da escola, pelo `ANOS_DA_ETAPA` de `packages/shared`. */
const SERIES_DO_RECORTE: ReadonlyArray<{ etapa: Etapa; ano: number }> = ETAPAS.flatMap((etapa) =>
  Array.from({ length: ANOS_DA_ETAPA[etapa].maior - ANOS_DA_ETAPA[etapa].menor + 1 }, (_, posicao) => ({ etapa, ano: ANOS_DA_ETAPA[etapa].menor + posicao })),
)

function NovaSerie({ existentes, aoFechar, aoCriar, recarregar }: PropsDeCriar<Serie> & { existentes: readonly Serie[] }) {
  const disponiveis = SERIES_DO_RECORTE.filter((serie) => !existentes.some((existente) => existente.etapa === serie.etapa && existente.ano === serie.ano))
  const [escolhida, definirEscolhida] = useState(() => (disponiveis[0] === undefined ? '' : `${disponiveis[0].etapa}:${String(disponiveis[0].ano)}`))
  const campo = useId()
  const { enviar, mutacao } = useEnvioUnico({ mutationFn: criarSerie, ...depoisDeCriar(aoCriar, recarregar) })

  function aoEnviar(): void {
    const serie = disponiveis.find((opcao) => `${opcao.etapa}:${String(opcao.ano)}` === escolhida)
    if (serie !== undefined) enviar(serie.etapa === 'em' ? { etapa: 'em', ano: serie.ano } : { etapa: 'ef_anos_finais', ano: serie.ano })
  }

  return (
    <DialogoDeFormulario
      titulo="Nova série"
      aoFechar={aoFechar}
      aoEnviar={aoEnviar}
      enviando={mutacao.isPending}
      rotuloDoEnvio="Criar série"
      rotuloEnviando="Criando…"
      semNovaTentativa={disponiveis.length === 0}
      falha={mutacao.isError ? textoDaFalha(mutacao.error, { [CodigoDeErro.CONFLITO]: 'Esta série já existe na escola.' }) : undefined}
    >
      {disponiveis.length === 0 ? (
        <p className="text-apoio">A escola já tem todas as séries do 6º ano ao 3º do Ensino Médio.</p>
      ) : (
        <div className="flex flex-col gap-1">
          <label htmlFor={campo} className="font-medium">
            Série
          </label>
          <select
            id={campo}
            value={escolhida}
            onChange={(evento) => definirEscolhida(evento.target.value)}
            className="min-h-11 min-w-0 rounded-controle border border-borda-campo bg-superficie px-3 py-2 text-base text-tinta"
          >
            {disponiveis.map((serie) => (
              <option key={`${serie.etapa}:${String(serie.ano)}`} value={`${serie.etapa}:${String(serie.ano)}`}>
                {nomeDaSerie(serie)}
              </option>
            ))}
          </select>
        </div>
      )}
    </DialogoDeFormulario>
  )
}

function NovaDisciplina({ aoFechar, aoCriar, recarregar }: PropsDeCriar<Disciplina>) {
  const [nome, definirNome] = useState('')
  const [erroDoNome, definirErroDoNome] = useState<string | undefined>(undefined)
  const campo = useRef<HTMLInputElement>(null)
  const { enviar, mutacao } = useEnvioUnico({ mutationFn: criarDisciplina, ...depoisDeCriar(aoCriar, recarregar) })

  function aoEnviar(): void {
    const limpo = nome.trim()
    definirErroDoNome(limpo === '' ? 'Digite o nome da disciplina.' : undefined)
    if (limpo !== '') enviar({ nome: limpo })
    else campo.current?.focus()
  }

  return (
    <DialogoDeFormulario
      titulo="Nova disciplina"
      aoFechar={aoFechar}
      aoEnviar={aoEnviar}
      enviando={mutacao.isPending}
      rotuloDoEnvio="Criar disciplina"
      rotuloEnviando="Criando…"
      falha={mutacao.isError ? textoDaFalha(mutacao.error, { [CodigoDeErro.CONFLITO]: 'Já existe uma disciplina com este nome na escola.' }) : undefined}
    >
      <Campo
        ref={campo}
        rotulo="Nome da disciplina"
        dica="Como a escola chama: Matemática, Língua Portuguesa, Química."
        name="nome"
        autoComplete="off"
        maxLength={TAMANHO_MAXIMO_NOME_DISCIPLINA}
        value={nome}
        onChange={(evento) => definirNome(evento.target.value)}
        erro={erroDoNome}
      />
    </DialogoDeFormulario>
  )
}

function NovaTurma({ anoLetivo, series, aoFechar, aoCriar, recarregar }: PropsDeCriar<Turma> & { anoLetivo: AnoLetivo; series: readonly Serie[] }) {
  const ordenadas = ordenarSeries(series)
  const [serieId, definirSerieId] = useState(() => ordenadas[0]?.id ?? '')
  // A série escolhida só vale enquanto está na lista: a que outra pessoa excluiu com o diálogo aberto sai da escolha
  // quando a lista recarrega, e o envio seguinte manda a série que a tela mostra, e não a que a API acabou de recusar.
  const serieEscolhida = ordenadas.some((serie) => serie.id === serieId) ? serieId : (ordenadas[0]?.id ?? '')
  const [nome, definirNome] = useState('')
  const [turno, definirTurno] = useState<Turno | ''>('')
  const [erroDoNome, definirErroDoNome] = useState<string | undefined>(undefined)
  const campoDaSerie = useId()
  const campoDoTurno = useId()
  const campoDoNome = useRef<HTMLInputElement>(null)
  const { enviar, mutacao } = useEnvioUnico({ mutationFn: criarTurma, ...depoisDeCriar(aoCriar, recarregar) })

  function aoEnviar(): void {
    const limpo = nome.trim()
    definirErroDoNome(limpo === '' ? 'Digite o nome da turma, como 7ºA.' : undefined)
    if (limpo === '') campoDoNome.current?.focus()
    if (limpo === '' || serieEscolhida === '') return
    // O ano vai só para conferir: se ele deixou de estar em curso, a API responde como inexistente, em vez de a turma
    // cair calada noutro ano.
    enviar({ serieId: serieEscolhida, nome: limpo, anoLetivoId: anoLetivo.id, ...(turno === '' ? {} : { turno }) })
  }

  const falha = mutacao.isError
    ? textoDaFalha(mutacao.error, {
        [CodigoDeErro.CONFLITO]: 'Já existe uma turma com este nome neste ano letivo.',
        [CodigoDeErro.NAO_ENCONTRADO]: 'A série ou o ano letivo mudou enquanto você preenchia. A tela foi atualizada: confira e tente de novo.',
      })
    : undefined

  return (
    <DialogoDeFormulario
      titulo={`Nova turma em ${String(anoLetivo.ano)}`}
      aoFechar={aoFechar}
      aoEnviar={aoEnviar}
      enviando={mutacao.isPending}
      rotuloDoEnvio="Criar turma"
      rotuloEnviando="Criando…"
      semNovaTentativa={ordenadas.length === 0}
      falha={falha}
    >
      {ordenadas.length === 0 ? (
        <p className="text-apoio">Crie a série primeiro: toda turma pertence a uma série.</p>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor={campoDaSerie} className="font-medium">
              Série
            </label>
            <select
              id={campoDaSerie}
              value={serieEscolhida}
              onChange={(evento) => definirSerieId(evento.target.value)}
              className="min-h-11 min-w-0 rounded-controle border border-borda-campo bg-superficie px-3 py-2 text-base text-tinta"
            >
              {ordenadas.map((serie) => (
                <option key={serie.id} value={serie.id}>
                  {nomeDaSerie(serie)}
                </option>
              ))}
            </select>
          </div>
          <Campo
            ref={campoDoNome}
            rotulo="Nome da turma"
            dica="Como a escola chama: 7ºA, 2ºB."
            name="nome"
            autoComplete="off"
            maxLength={TAMANHO_MAXIMO_NOME_TURMA}
            value={nome}
            onChange={(evento) => definirNome(evento.target.value)}
            erro={erroDoNome}
          />
          <div className="flex flex-col gap-1">
            <label htmlFor={campoDoTurno} className="font-medium">
              Turno (opcional)
            </label>
            <select
              id={campoDoTurno}
              value={turno}
              onChange={(evento) => definirTurno(evento.target.value === '' ? '' : (TURNOS.find((opcao) => opcao === evento.target.value) ?? ''))}
              className="min-h-11 min-w-0 rounded-controle border border-borda-campo bg-superficie px-3 py-2 text-base text-tinta"
            >
              <option value="">Sem turno</option>
              {TURNOS.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {NOME_DO_TURNO[opcao]}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </DialogoDeFormulario>
  )
}

interface PropsDeRenomear {
  readonly titulo: string
  readonly rotulo: string
  readonly atual: string
  readonly maximo: number
  readonly renomear: (nome: string) => Promise<unknown>
  /** O texto do `CONFLITO`: o nome já é de outro item. Ele fica no campo, com o foco nele, para a pessoa trocar. */
  readonly conflito: string
  readonly aoFechar: () => void
  readonly aoRenomear: (nome: string) => void
  readonly recarregar: () => unknown
  readonly focoDeReserva: () => void
}

function Renomear({ titulo, rotulo, atual, maximo, renomear, conflito, aoFechar, aoRenomear, recarregar, focoDeReserva }: PropsDeRenomear) {
  const [nome, definirNome] = useState(atual)
  const [erroDoNome, definirErroDoNome] = useState<string | undefined>(undefined)
  const campo = useRef<HTMLInputElement>(null)
  const { enviar, mutacao } = useEnvioUnico({
    mutationFn: renomear,
    onSuccess: async (_resposta, enviado: string) => {
      await recarregar()
      aoRenomear(enviado)
    },
    onError: recarregar,
  })
  const conflitou = mutacao.isError && listaMudou(mutacao.error, [CodigoDeErro.CONFLITO])
  const sumiu = mutacao.isError && listaMudou(mutacao.error, [CodigoDeErro.NAO_ENCONTRADO])
  // O nome já é de outro item: o erro fica no campo, e o foco volta para ele, para a pessoa trocar o nome ali mesmo.
  useEffect(() => {
    if (conflitou) campo.current?.focus()
  }, [conflitou, mutacao.submittedAt])

  function aoEnviar(): void {
    const limpo = nome.trim()
    if (limpo === '') {
      definirErroDoNome('Digite o nome novo.')
      campo.current?.focus()
      return
    }
    definirErroDoNome(undefined)
    enviar(limpo)
  }

  return (
    <DialogoDeFormulario
      titulo={titulo}
      aoFechar={aoFechar}
      aoEnviar={aoEnviar}
      enviando={mutacao.isPending}
      rotuloDoEnvio="Salvar nome"
      rotuloEnviando="Salvando…"
      semNovaTentativa={sumiu}
      falha={mutacao.isError && !conflitou ? textoDaFalha(mutacao.error, { [CodigoDeErro.NAO_ENCONTRADO]: 'Este item já não existe. A lista foi atualizada.' }) : undefined}
      focoDeReserva={focoDeReserva}
    >
      <Campo
        ref={campo}
        rotulo={rotulo}
        name="nome"
        autoComplete="off"
        maxLength={maximo}
        value={nome}
        onChange={(evento) => definirNome(evento.target.value)}
        erro={erroDoNome ?? (conflitou ? conflito : undefined)}
      />
    </DialogoDeFormulario>
  )
}
