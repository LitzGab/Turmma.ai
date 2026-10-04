import { CodigoDeErro, NOME_DA_FERRAMENTA, type ArtefatoResumido, type Entrega } from '@educa/shared'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil } from 'lucide-react'
import { useId, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'wouter'
import { consultaArtefato, renomearArtefato } from '../../api/artefatos'
import { CHAVE_DOS_ARTEFATOS } from '../../api/chaves-do-professor'
import { ErroDaApi, mensagemDoErro } from '../../api/cliente'
import { consultaEntregasDaTurma } from '../../api/entregas'
import { consultaTitulosDosMateriais } from '../../api/titulos-dos-materiais'
import { consultaMeusVinculos } from '../../api/vinculos'
import { caminhoDaAdaptacaoDoArtefato, caminhoDoArtefatoDoProfessor, ROTAS_DO_PROFESSOR } from '../../caminhos'
import { Botao } from '../../componentes/Botao'
import { Campo } from '../../componentes/Campo'
import { EstadoCarregando, EstadoErro, EstadoVazio } from '../../componentes/estado'
import { AssinaturaIA } from '../../componentes/ia/AssinaturaIA'
import { LinhaAprovacao } from '../../componentes/ia/LinhaAprovacao'
import { CabecalhoDeSecao } from '../../componentes/Tela'
import { formatarDataHora } from '../../formatar'
import { useTituloDaTela } from '../../titulo'
import { ConteudoDoArtefato } from './ConteudoDoArtefato'
import { aprovacaoDaEntrega, textoDaAdaptacao, VERBO_DA_ENTREGA } from './entregas'
import { ExportarPdf } from './ExportarPdf'
import { ferramentaDoCatalogo } from './ferramentas'
import { Pagina } from './Pagina'
import { nomesDasDisciplinas, nomesDasTurmas } from './turmas-da-professora'

const TAMANHO_MAXIMO_DO_TITULO = 160

/** A situação da versão adaptada, com quem decidiu e quando, quando a leitura das entregas da turma a trouxe. */
function LinhaDaVersao({ versao, entregas, carregando }: { versao: Pick<ArtefatoResumido, 'entrega'>; entregas: readonly Entrega[] | undefined; carregando: boolean }) {
  if (versao.entrega === null) return null
  const completa = entregas?.find((entrega) => entrega.id === versao.entrega?.id)
  if (completa !== undefined) return <LinhaAprovacao aprovacao={aprovacaoDaEntrega(completa)} verbo={VERBO_DA_ENTREGA} />
  // A pendente não tem autor: a linha já pode dizer que espera a professora, sem a leitura das entregas.
  if (versao.entrega.estado === 'pendente') return <LinhaAprovacao aprovacao={{ estado: 'pendente' }} />
  // A decidida só é afirmada com quem decidiu (regra 70, item 6): sem a leitura, a tela diz onde ver, e não inventa.
  return <p className="text-sm text-sutil">{carregando ? 'Carregando quem decidiu…' : 'A decisão desta versão está em Seu time.'}</p>
}

/**
 * Um artefato aberto (`docs/mvp-rapido.md` 9.2): a atividade — questões, alternativas, gabarito e explicação, que são da
 * professora e nunca do aluno — ou o plano de aula, com a **página de origem** de cada questão, o renomear, o **exportar
 * em PDF** e o "Pedir versão adaptada". A versão adaptada mostra a adaptação pelo **tipo** e o estado da entrega dela:
 * pendente, aprovada por quem e quando, ou rejeitada com o motivo.
 *
 * Só o professor com vínculo confirmado na turma abre: o de outra turma, o de outra escola e o que não existe respondem
 * igual (regra 10, item 6), e a tela diz uma coisa só.
 *
 * Aplicar à turma chega com a A3: as aplicações já feitas aparecem aqui, e o botão de aplicar entra na barra de ações
 * quando a rota existir. Nenhum botão sem efeito ocupa o lugar dele.
 */
export default function Artefato({ artefatoId }: { artefatoId: string }) {
  const cliente = useQueryClient()
  const [, navegar] = useLocation()
  const artefato = useQuery(consultaArtefato(artefatoId))
  const dados = artefato.data
  const materiais = useQuery(consultaTitulosDosMateriais)
  const vinculos = useInfiniteQuery(consultaMeusVinculos)
  const temVersao = dados !== undefined && (dados.entrega !== null || dados.versoesAdaptadas.length > 0)
  const entregas = useQuery({ ...consultaEntregasDaTurma(dados?.turmaId ?? ''), enabled: temVersao })
  const [novoTitulo, definirNovoTitulo] = useState<string | undefined>(undefined)
  const lugarDoRenomear = useRef<HTMLSpanElement>(null)
  // O formulário some com o foco dentro dele: o foco volta ao botão que o abriu, que só religa no render seguinte.
  const devolverOFoco = () => requestAnimationFrame(() => lugarDoRenomear.current?.querySelector('button')?.focus())
  const idDasVersoes = useId()
  const idDasAplicacoes = useId()
  useTituloDaTela(dados?.titulo ?? 'Artefato')

  const renomear = useMutation({
    mutationFn: (titulo: string) => renomearArtefato(artefatoId, titulo),
    onSuccess: (renomeado) => {
      cliente.setQueryData(consultaArtefato(artefatoId).queryKey, renomeado)
      void cliente.invalidateQueries({ queryKey: CHAVE_DOS_ARTEFATOS })
      definirNovoTitulo(undefined)
      devolverOFoco()
    },
  })

  const voltar = (
    // Relativo à área: o `Route` aninhado em `/professor` resolve o `to` a partir da base dela.
    <Link to={ROTAS_DO_PROFESSOR.ferramentas} className="inline-flex min-h-11 items-center gap-2 self-start text-caramelo-texto underline">
      <ArrowLeft aria-hidden="true" size={18} />
      Voltar para Ferramentas
    </Link>
  )

  if (dados === undefined) {
    const naoEncontrado = artefato.error instanceof ErroDaApi && artefato.error.codigo === CodigoDeErro.NAO_ENCONTRADO
    return (
      <Pagina titulo="Artefato" antes={voltar}>
        {artefato.isPending ? (
          <EstadoCarregando rotulo="Carregando o artefato…" />
        ) : naoEncontrado ? (
          <EstadoVazio titulo="Este artefato não está disponível" descricao="Ele pode ter sido gerado para uma turma que não é mais sua, ou o endereço está errado. O que você gerou está em Ferramentas." />
        ) : (
          <EstadoErro erro={artefato.error} tentando={artefato.isFetching} aoTentarDeNovo={() => void artefato.refetch({ cancelRefetch: false })} />
        )}
      </Pagina>
    )
  }

  const itensDosVinculos = vinculos.data?.pages.flatMap((pagina) => pagina.itens) ?? []
  const turma = nomesDasTurmas(itensDosVinculos)[dados.turmaId]
  const disciplina = nomesDasDisciplinas(itensDosVinculos)[dados.disciplinaId]
  const adaptada = dados.origemId !== null
  const tipo = adaptada ? 'Versão adaptada' : NOME_DA_FERRAMENTA[dados.tipo]
  const descricao = [tipo, turma, disciplina, `gerado em ${formatarDataHora(dados.criadoEm)}`].filter((parte) => parte !== undefined).join(' · ')
  // Só a atividade objetiva que não é versão adaptada se adapta (o contrato recusa as outras).
  const podeAdaptar = dados.tipo === 'atividade_objetiva' && !adaptada
  const funcao = adaptada ? 'adaptacao' : ferramentaDoCatalogo(dados.tipo).funcao

  function aoRenomear(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault()
    const titulo = novoTitulo?.trim() ?? ''
    if (titulo === '' || renomear.isPending) return
    renomear.mutate(titulo)
  }

  return (
    <Pagina
      titulo={dados.titulo}
      objeto
      descricao={descricao}
      antes={voltar}
      acoes={
        <>
          {/* O `Botao` não aceita `ref`: o foco volta ao "Renomear" pelo invólucro dele. */}
          <span ref={lugarDoRenomear} className="inline-flex">
            <Botao variante="discreto" tamanho="compacto" onClick={() => definirNovoTitulo(dados.titulo)} disabled={novoTitulo !== undefined}>
              <Pencil aria-hidden="true" size={16} strokeWidth={1.75} className="shrink-0" />
              Renomear
            </Botao>
          </span>
          <ExportarPdf artefatoId={dados.id} titulo={dados.titulo} variante="secundario" />
          {podeAdaptar && (
            // Relativo à área, como os links: o `Route` aninhado em `/professor` resolve a partir da base dela.
            <Botao onClick={() => navegar(caminhoDaAdaptacaoDoArtefato(dados.id))}>Pedir versão adaptada</Botao>
          )}
          {/* A3: o "Aplicar à turma" entra aqui, com a rota de `atividades-aplicadas`. */}
        </>
      }
    >
      {novoTitulo !== undefined && (
        <form onSubmit={aoRenomear} className="flex min-w-0 flex-col gap-3 rounded-cartao border border-linha bg-superficie p-4">
          <Campo rotulo="Novo título" value={novoTitulo} onChange={(evento) => definirNovoTitulo(evento.target.value)} maxLength={TAMANHO_MAXIMO_DO_TITULO} autoComplete="off" autoFocus />
          <p role="alert" className="rounded-controle bg-erro-cx p-3 break-words text-erro empty:hidden">
            {renomear.isError ? mensagemDoErro(renomear.error) : ''}
          </p>
          <div className="flex flex-wrap gap-3">
            <Botao type="submit" variante="secundario" disabled={renomear.isPending || novoTitulo.trim() === ''}>
              {renomear.isPending ? 'Salvando…' : 'Salvar o título'}
            </Botao>
            <Botao
              variante="secundario"
              onClick={() => {
                definirNovoTitulo(undefined)
                renomear.reset()
                devolverOFoco()
              }}
            >
              Cancelar
            </Botao>
          </div>
        </form>
      )}

      <div className="flex min-w-0 flex-col gap-2">
        {/* Toda saída de IA leva a assinatura e o selo "IA", iguais em todo o produto. */}
        <AssinaturaIA funcao={funcao} />
        {dados.adaptacao !== null && (
          <p className="min-w-0 break-words text-apoio">
            <span className="font-medium text-tinta">Adaptação: </span>
            {textoDaAdaptacao(dados.adaptacao)}
          </p>
        )}
        {adaptada && (
          <div className="flex min-w-0 flex-col items-start gap-2">
            <LinhaDaVersao versao={dados} entregas={entregas.data?.itens} carregando={entregas.isPending} />
            {dados.entrega?.estado === 'pendente' && (
              <p className="min-w-0 text-sm break-words text-sutil">
                Esta versão só pode ir aos alunos depois que você aprovar.{' '}
                <Link to={ROTAS_DO_PROFESSOR.timeDoAssistente} className="text-caramelo-texto underline">
                  Ver e decidir em Seu time
                </Link>
              </p>
            )}
            {dados.origemId !== null && (
              <Link to={caminhoDoArtefatoDoProfessor(dados.origemId)} className="inline-flex min-h-11 items-center text-sm text-caramelo-texto underline md:min-h-9">
                Abrir a atividade de origem
              </Link>
            )}
          </div>
        )}
      </div>

      <ConteudoDoArtefato conteudo={dados.conteudo} materiais={materiais.data ?? {}} />

      {dados.versoesAdaptadas.length > 0 && (
        <section aria-labelledby={idDasVersoes} className="flex min-w-0 flex-col gap-3">
          <CabecalhoDeSecao id={idDasVersoes} titulo="Versões adaptadas" apoio="Cada uma só pode ir aos alunos depois de aprovada por você." />
          <ul className="flex min-w-0 flex-col gap-2">
            {dados.versoesAdaptadas.map((versao) => (
              <li key={versao.id} className="flex min-w-0 flex-col items-start gap-2 rounded-cartao border border-linha bg-superficie p-4">
                <Link to={caminhoDoArtefatoDoProfessor(versao.id)} className="inline-flex min-h-11 items-center font-medium break-words text-caramelo-texto underline md:min-h-9">
                  {versao.adaptacao === null ? versao.titulo : textoDaAdaptacao(versao.adaptacao)}
                </Link>
                <LinhaDaVersao versao={versao} entregas={entregas.data?.itens} carregando={entregas.isPending} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {dados.aplicacoes.length > 0 && (
        <section aria-labelledby={idDasAplicacoes} className="flex min-w-0 flex-col gap-2">
          <CabecalhoDeSecao id={idDasAplicacoes} titulo="Atribuída à turma" />
          <ul className="flex min-w-0 flex-col gap-1 text-apoio">
            {dados.aplicacoes.map((aplicacao) => (
              <li key={aplicacao.id} className="break-words">
                {nomesDasTurmas(itensDosVinculos)[aplicacao.turmaId] ?? 'Turma'} · {aplicacao.estado === 'aberta' ? 'aberta' : 'encerrada'} · {formatarDataHora(aplicacao.aplicadaEm)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Pagina>
  )
}
