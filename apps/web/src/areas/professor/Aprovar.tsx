import { CodigoDeErro, type Destaque, type RespostaDestaqueAberto } from '@educa/shared'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { Link } from 'wouter'
import { abrirDestaque, aprovarLote, consultaCorrecaoDoLote, recarregarDepoisDoLote } from '../../api/atividades'
import { ErroDaApi, mensagemDoErro } from '../../api/cliente'
import { consultaEntregas, decidirEntrega } from '../../api/entregas'
import { consultaMeusVinculos } from '../../api/vinculos'
import { ROTAS_DO_PROFESSOR } from '../../caminhos'
import { BarraPresa } from '../../componentes/BarraPresa'
import { BarraRotulada } from '../../componentes/BarraRotulada'
import { Botao } from '../../componentes/Botao'
import { CampoLongo } from '../../componentes/CampoLongo'
import { DialogoDeConfirmacao } from '../../componentes/DialogoDeConfirmacao'
import { EstadoCarregando, EstadoErro, EstadoVazio } from '../../componentes/estado'
import { AssinaturaIA } from '../../componentes/ia/AssinaturaIA'
import { LinhaAprovacao } from '../../componentes/ia/LinhaAprovacao'
import { NumeroPainel } from '../../componentes/NumeroPainel'
import { Estado } from '../../componentes/SeloDeEstado'
import { Tabela } from '../../componentes/Tabela'
import { CabecalhoDeSecao, Tela } from '../../componentes/Tela'
import { problemaDoTexto } from '../../componentes/texto-longo'
import { useTituloDaTela } from '../../titulo'
import {
  acertosDoAluno,
  AVISO_DA_REJEICAO_DO_LOTE,
  contadorDosDestaques,
  EFEITO_DE_APROVAR_O_LOTE,
  EFEITO_DE_REJEITAR_O_LOTE,
  estadoDoDestaque,
  letraDaAlternativa,
  motivosDoDestaque,
  resumoDoLote,
  rotuloDaFaixa,
  rotuloDeAprovar,
  textoDaMedia,
  textoDeAlunos,
  textoDosCorrigidos,
} from './aprovar'
import { aprovacaoDaEntrega, AUTOR_QUE_SAIU, LIMITES_DA_JUSTIFICATIVA, VERBO_DA_ENTREGA } from './entregas'
import { nomesDasTurmas } from './turmas-da-professora'

const idDoDestaque = (alunoId: string) => `destaque-${alunoId}`

/** O que a abertura de um destaque mostra: as respostas do aluno, questão a questão, e o acerto dele nos lotes aprovados antes. */
function DestaqueAberto({ aberto }: { aberto: RespostaDestaqueAberto }) {
  return (
    <div data-destaque-aberto="" className="flex min-w-0 flex-col gap-3 border-t border-linha pt-3">
      <Tabela
        rotulo={`Respostas de ${aberto.destaque.nome}`}
        colunas={[
          { chave: 'questao', titulo: 'Questão', celula: (resposta) => String(resposta.questao) },
          { chave: 'marcou', titulo: 'Marcou', celula: (resposta) => (resposta.alternativa === null ? 'Em branco' : letraDaAlternativa(resposta.alternativa)) },
          { chave: 'gabarito', titulo: 'Gabarito', celula: (resposta) => letraDaAlternativa(resposta.gabarito) },
          { chave: 'resultado', titulo: 'Resultado', celula: (resposta) => (resposta.correta ? 'Acertou' : resposta.alternativa === null ? 'Não respondeu' : 'Errou') },
        ]}
        linhas={aberto.respostas}
        chaveDaLinha={(resposta) => String(resposta.questao)}
      />
      {aberto.historico.length === 0 ? (
        <p className="text-sm text-sutil">Este aluno ainda não tem correção aprovada antes desta.</p>
      ) : (
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm font-medium text-tinta">Nas correções aprovadas antes</p>
          <ul className="flex min-w-0 flex-col gap-0.5 text-sm text-apoio">
            {aberto.historico.map((lote, indice) => (
              <li key={indice} className="break-words">
                {lote.titulo}: {String(lote.acertos)} de {String(lote.total)} {lote.total === 1 ? 'acerto' : 'acertos'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * **Aprovar a correção de objetiva** (`docs/interface.md` 11.5; D33, D46, D56; regra 50, item 8; regra 70): a tela em que
 * a supervisão humana não pode virar clique reflexo. O Assistente corrigiu pelo gabarito; quem faz o resultado valer é a
 * professora, depois de olhar o que precisa ser olhado.
 *
 * - **O resumo do lote**, assinado pela função com o selo de IA: quantos têm correção, a média de acertos, a distribuição,
 *   o acerto por habilidade e por questão. **É diagnóstico, não nota**: a tela fala em acertos e habilidades.
 * - **"Abra estes N antes de aprovar"**: cada destaque com o motivo em texto, fechado como pendente e aberto como ok, com
 *   a hora. Abrir chama a rota que registra a abertura: é a tela mostrando o que o registro da validação vai guardar.
 * - **O botão de aprovar é o único `oficial` da tela**, preso embaixo, e fica desligado até o último destaque ser aberto,
 *   com o contador ao lado dizendo por quê. Quem libera é a API (`podeAprovar`).
 * - **Confirmar diz o que vai acontecer**: a atividade, a turma, quantas correções, e que o diagnóstico chega aos alunos.
 *   Depois, a tela mostra "Validação registrada por … · quando". **Rejeitar** é `perigo` e pede justificativa.
 *
 * A tela não manda o que mostrou: o "apresentado" do registro é montado pelo servidor.
 */
export default function Aprovar({ atividadeAplicadaId }: { atividadeAplicadaId: string }) {
  useTituloDaTela('Revisar a correção')
  const cliente = useQueryClient()
  const correcao = useQuery(consultaCorrecaoDoLote(atividadeAplicadaId))
  const entregas = useInfiniteQuery(consultaEntregas)
  const vinculos = useInfiniteQuery(consultaMeusVinculos)
  const [abertos, definirAbertos] = useState<Readonly<Record<string, RespostaDestaqueAberto>>>({})
  const [decisao, definirDecisao] = useState<'aprovar' | 'rejeitar' | undefined>(undefined)
  const [justificativa, definirJustificativa] = useState('')
  const [tentouRejeitar, definirTentouRejeitar] = useState(false)
  const [aviso, definirAviso] = useState('')
  const decidindo = useRef(false)
  const situacao = useRef<HTMLDivElement>(null)
  const idDosDestaques = useId()
  const idDasOutras = useId()
  const dados = correcao.data

  const abrir = useMutation({
    mutationFn: (alunoId: string) => abrirDestaque(atividadeAplicadaId, alunoId),
    onSuccess: async (aberto) => {
      definirAbertos((atuais) => ({ ...atuais, [aberto.destaque.alunoId]: aberto }))
      // A abertura ficou registrada: a tela relê o lote, que traz a hora e libera o botão quando for a última.
      await cliente.invalidateQueries({ queryKey: consultaCorrecaoDoLote(atividadeAplicadaId).queryKey })
    },
  })

  const fechar = () => definirDecisao(undefined)
  const decidir = useMutation({
    mutationFn: async (escolha: 'aprovar' | 'rejeitar') => {
      if (dados === undefined) throw new ErroDaApi(CodigoDeErro.ERRO_INTERNO)
      if (escolha === 'aprovar') await aprovarLote(dados.entrega.id)
      else await decidirEntrega(dados.entrega.id, { decisao: 'rejeitar', justificativa: justificativa.trim() })
    },
    onSuccess: async () => {
      definirAviso('')
      // A tela relê o lote antes de o diálogo fechar: a barra de decisão já saiu, e o foco vai para a situação registrada.
      await recarregarDepoisDoLote(cliente)
      fechar()
    },
    onError: async (erro) => {
      if (!(erro instanceof ErroDaApi)) return
      // Outra aba já decidiu, ou um destaque deixou de estar aberto: a tela se atualiza e diz o que houve, sem alarme.
      if (erro.codigo !== CodigoDeErro.ENTREGA_JA_DECIDIDA && erro.codigo !== CodigoDeErro.DESTAQUES_NAO_ABERTOS) return
      definirAviso(erro.codigo === CodigoDeErro.ENTREGA_JA_DECIDIDA ? 'Esta correção já tinha sido decidida. A tela foi atualizada com a decisão.' : 'Ainda há destaque para abrir. A tela foi atualizada: abra o que falta e aprove de novo.')
      await recarregarDepoisDoLote(cliente)
      fechar()
    },
    onSettled: () => {
      decidindo.current = false
    },
  })

  const voltar = (
    // Relativo à área: o `Route` aninhado em `/professor` resolve o `to` a partir da base dela.
    <Link to={ROTAS_DO_PROFESSOR.timeDoAssistente} className="inline-flex min-h-11 items-center gap-2 self-start text-caramelo-texto underline">
      <ArrowLeft aria-hidden="true" size={18} />
      Voltar para o Seu time
    </Link>
  )

  if (dados === undefined) {
    const naoEncontrada = correcao.error instanceof ErroDaApi && correcao.error.codigo === CodigoDeErro.NAO_ENCONTRADO
    return (
      <Tela titulo="Revisar a correção" largura="formulario" antes={voltar}>
        {correcao.isPending ? (
          <EstadoCarregando rotulo="Carregando a correção…" />
        ) : naoEncontrada ? (
          <EstadoVazio titulo="Esta correção não está disponível" descricao="A atividade pode ainda estar aberta, ser de uma turma que não é mais sua, ou o endereço está errado. A correção nasce quando você encerra a atividade, e aparece em Seu time." />
        ) : (
          <EstadoErro erro={correcao.error} tentando={correcao.isFetching} aoTentarDeNovo={() => void correcao.refetch({ cancelRefetch: false })} />
        )}
      </Tela>
    )
  }

  const { resumo, destaques, outras } = dados
  const pendente = dados.entrega.estado === 'pendente'
  const contador = contadorDosDestaques(dados)
  const entregaInteira = entregas.data?.pages.flatMap((pagina) => pagina.itens).find((entrega) => entrega.id === dados.entrega.id)
  const turma = entregaInteira === undefined ? undefined : nomesDasTurmas(vinculos.data?.pages.flatMap((pagina) => pagina.itens) ?? [])[entregaInteira.turmaId]
  const problemaDaJustificativa = problemaDoTexto(justificativa, LIMITES_DA_JUSTIFICATIVA)
  const falha = decidir.isError && !(decidir.error instanceof ErroDaApi && (decidir.error.codigo === CodigoDeErro.ENTREGA_JA_DECIDIDA || decidir.error.codigo === CodigoDeErro.DESTAQUES_NAO_ABERTOS)) ? mensagemDoErro(decidir.error) : undefined

  function abrirDecisao(escolha: 'aprovar' | 'rejeitar'): void {
    decidir.reset()
    definirJustificativa('')
    definirTentouRejeitar(false)
    definirAviso('')
    definirDecisao(escolha)
  }

  function confirmar(): void {
    if (decisao === undefined || decidindo.current) return
    if (decisao === 'rejeitar') {
      definirTentouRejeitar(true)
      if (problemaDaJustificativa !== undefined) return
    }
    decidindo.current = true
    decidir.mutate(decisao)
  }

  function linhaDoDestaque(destaque: Destaque) {
    const estado = estadoDoDestaque(destaque)
    const aberto = abertos[destaque.alunoId]
    const abrindo = abrir.isPending && abrir.variables === destaque.alunoId
    return (
      <li key={destaque.alunoId} id={idDoDestaque(destaque.alunoId)} data-destaque={estado.aberto ? 'aberto' : 'fechado'} className="flex min-w-0 flex-col gap-3 rounded-cartao border border-linha bg-superficie p-4">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-1 basis-56 flex-col gap-1">
            <p className="font-medium break-words text-tinta">{destaque.nome}</p>
            <p className="text-sm break-words text-apoio">{motivosDoDestaque(destaque)}</p>
            <p className="text-sm break-words text-sutil">{acertosDoAluno(destaque)}</p>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            {estado.aberto ? <Estado familia="ok">{estado.texto}</Estado> : <Estado familia="pendente">{estado.texto}</Estado>}
            {/* Abrir é o que fica registrado (D56). O já aberto pode ser visto de novo: a hora registrada continua a primeira. */}
            {(!estado.aberto || aberto === undefined) && (
              <Botao variante="secundario" disabled={abrir.isPending} onClick={() => abrir.mutate(destaque.alunoId)}>
                {abrindo ? 'Abrindo…' : estado.aberto ? 'Ver de novo' : 'Abrir'}
                <span className="sr-only"> a correção de {destaque.nome}</span>
              </Botao>
            )}
          </div>
        </div>
        {abrir.isError && abrir.variables === destaque.alunoId && (
          <p role="alert" className="rounded-controle bg-erro-cx p-3 break-words text-erro">
            {mensagemDoErro(abrir.error)}
          </p>
        )}
        {aberto !== undefined && <DestaqueAberto aberto={aberto} />}
      </li>
    )
  }

  return (
    <Tela titulo="Revisar a correção" largura="formulario" objeto descricao={turma === undefined ? dados.titulo : `${dados.titulo} · ${turma}`} antes={voltar}>
      <div className="flex min-w-0 flex-col gap-2">
        {/* A correção é saída de IA: leva a assinatura da função e o selo, como toda saída de IA do produto. */}
        <AssinaturaIA funcao="correcao_de_objetiva" />
        <p className="min-w-0 text-sm break-words text-sutil">Corrigi pelo gabarito e somei os acertos por habilidade. É diagnóstico: o resultado só chega aos alunos depois que você aprovar.</p>
      </div>

      <div ref={situacao} tabIndex={-1} data-situacao-do-lote={dados.entrega.estado} className="flex min-w-0 flex-col items-start gap-2 rounded-cartao">
        {dados.validacao !== null ? (
          <LinhaAprovacao aprovacao={{ estado: 'aprovada', por: dados.validacao.confirmadaPor?.nome ?? AUTOR_QUE_SAIU, quando: dados.validacao.confirmadaEm }} verbo="Validação registrada por" />
        ) : dados.entrega.estado === 'pendente' ? (
          <LinhaAprovacao aprovacao={{ estado: 'pendente' }} />
        ) : entregaInteira !== undefined ? (
          <LinhaAprovacao aprovacao={aprovacaoDaEntrega(entregaInteira)} verbo={VERBO_DA_ENTREGA} />
        ) : (
          // A decisão só é afirmada com quem decidiu (regra 70, item 6): sem a leitura da entrega, a tela diz onde ver.
          <p className="text-sm text-sutil">{dados.entrega.estado === 'rejeitada' ? 'Esta correção foi rejeitada. Quem rejeitou e por quê está em Seu time.' : 'Esta correção já foi decidida. A decisão está em Seu time.'}</p>
        )}
        {dados.validacao !== null && <p className="text-sm break-words text-sutil">Os alunos já podem ver o diagnóstico deles. O registro guarda o que esta tela mostrou e os destaques que foram abertos.</p>}
      </div>

      <p role="status" className="rounded-controle bg-info-cx p-3 break-words text-info empty:hidden">
        {aviso}
      </p>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <NumeroPainel rotulo="Correções" valor={textoDosCorrigidos(resumo)} apoio="Quem não abriu a atividade não tem correção." />
        <NumeroPainel rotulo="Média de acertos" valor={textoDaMedia(resumo)} />
        <NumeroPainel rotulo="Destaques para abrir" valor={String(destaques.length)} apoio="Correções que pedem o seu olhar antes de aprovar." />
      </div>

      <section aria-labelledby={idDosDestaques} className="flex min-w-0 flex-col gap-3">
        <CabecalhoDeSecao
          id={idDosDestaques}
          titulo={destaques.length === 0 ? 'Nenhuma correção para abrir antes de aprovar' : destaques.length === 1 ? 'Abra este antes de aprovar' : `Abra estes ${String(destaques.length)} antes de aprovar`}
          apoio={destaques.length === 0 ? 'Nenhuma correção deste lote ficou fora do esperado. Confira o resumo e aprove.' : 'São as correções fora da curva. Abrir cada uma fica registrado, com a hora.'}
        />
        {destaques.length > 0 && <ul className="flex min-w-0 flex-col gap-3">{destaques.map(linhaDoDestaque)}</ul>}
      </section>

      <section className="flex min-w-0 flex-col gap-3" aria-label="Distribuição dos acertos">
        <CabecalhoDeSecao titulo="Distribuição dos acertos" apoio="Quantos alunos ficaram em cada faixa de acertos." />
        <div className="flex min-w-0 flex-col gap-3 rounded-cartao border border-linha bg-superficie p-4">
          {resumo.distribuicao.map((faixa) => (
            <BarraRotulada key={`${String(faixa.de)}-${String(faixa.ate)}`} rotulo={rotuloDaFaixa(faixa)} valor={faixa.alunos} maximo={Math.max(resumo.corrigidos, 1)} texto={textoDeAlunos(faixa.alunos)} />
          ))}
        </div>
      </section>

      <section className="flex min-w-0 flex-col gap-3" aria-label="Acerto por habilidade">
        <CabecalhoDeSecao titulo="Acerto por habilidade" apoio="As respostas certas da turma em cada habilidade, somadas." />
        <div className="flex min-w-0 flex-col gap-3 rounded-cartao border border-linha bg-superficie p-4">
          {resumo.porHabilidade.map((item) => (
            <BarraRotulada key={item.habilidade.codigo} rotulo={`${item.habilidade.codigo} · ${item.habilidade.descricao}`} valor={item.acertos} maximo={item.total} texto={`${String(item.acertos)} de ${String(item.total)}`} />
          ))}
        </div>
      </section>

      <section className="flex min-w-0 flex-col gap-3" aria-label="Por questão">
        <CabecalhoDeSecao titulo="Por questão" apoio="Uma questão em que quase todos erram a mesma alternativa pode ter o gabarito errado." />
        <Tabela
          rotulo="Acertos por questão"
          colunas={[
            { chave: 'numero', titulo: 'Questão', celula: (questao) => String(questao.numero) },
            { chave: 'habilidade', titulo: 'Habilidade', celula: (questao) => questao.habilidade.codigo },
            { chave: 'gabarito', titulo: 'Gabarito', celula: (questao) => letraDaAlternativa(questao.gabarito) },
            { chave: 'acertos', titulo: 'Acertaram', celula: (questao) => `${String(questao.acertos)} de ${String(resumo.corrigidos)}` },
            { chave: 'marcacoes', titulo: 'Marcaram', celula: (questao) => questao.porAlternativa.map((quantos, alternativa) => `${letraDaAlternativa(alternativa)}: ${String(quantos)}`).join(' · ') },
            { chave: 'branco', titulo: 'Em branco', celula: (questao) => String(questao.emBranco) },
          ]}
          linhas={resumo.porQuestao}
          chaveDaLinha={(questao) => String(questao.numero)}
        />
      </section>

      {outras.length > 0 && (
        <section aria-labelledby={idDasOutras} className="flex min-w-0 flex-col gap-3">
          <CabecalhoDeSecao id={idDasOutras} titulo={outras.length === 1 ? 'A outra correção' : `As outras ${String(outras.length)} correções`} apoio="Dentro do esperado: não precisam ser abertas uma a uma." />
          <Tabela
            rotulo="As outras correções"
            colunas={[
              { chave: 'nome', titulo: 'Aluno', celula: (aluno) => aluno.nome },
              { chave: 'acertos', titulo: 'Acertos', celula: (aluno) => acertosDoAluno(aluno) },
            ]}
            linhas={outras}
            chaveDaLinha={(aluno) => aluno.alunoId}
          />
        </section>
      )}

      {pendente && (
        <BarraPresa
          rotulo="Aprovação do lote"
          informacao={
            <span data-contador-dos-destaques="">
              <span className="font-medium text-tinta">{contador.texto}.</span> {contador.porQue ?? 'Tudo aberto: a aprovação está liberada.'}
            </span>
          }
        >
          <Botao variante="perigo" onClick={() => abrirDecisao('rejeitar')}>
            Rejeitar…
          </Botao>
          <Botao variante="oficial" disabled={!dados.podeAprovar} onClick={() => abrirDecisao('aprovar')}>
            {rotuloDeAprovar(resumo.corrigidos)}
          </Botao>
        </BarraPresa>
      )}

      {decisao === 'aprovar' && (
        <DialogoDeConfirmacao
          titulo={rotuloDeAprovar(resumo.corrigidos)}
          familia="oficial"
          resumo={resumoDoLote(dados, turma)}
          efeito={EFEITO_DE_APROVAR_O_LOTE}
          rotuloDeConfirmar={rotuloDeAprovar(resumo.corrigidos)}
          rotuloConfirmando="Aprovando…"
          aoConfirmar={confirmar}
          aoFechar={fechar}
          confirmando={decidir.isPending}
          focoDeReserva={() => situacao.current?.focus()}
          {...(falha === undefined ? {} : { falha })}
        />
      )}
      {decisao === 'rejeitar' && (
        <DialogoDeConfirmacao
          titulo="Rejeitar a correção"
          familia="perigo"
          resumo={resumoDoLote(dados, turma)}
          efeito={EFEITO_DE_REJEITAR_O_LOTE}
          rotuloDeConfirmar="Rejeitar a correção"
          rotuloConfirmando="Rejeitando…"
          aoConfirmar={confirmar}
          aoFechar={fechar}
          confirmando={decidir.isPending}
          focoDeReserva={() => situacao.current?.focus()}
          {...(falha === undefined ? {} : { falha })}
        >
          <CampoLongo
            rotulo="Por que você está rejeitando?"
            dica={AVISO_DA_REJEICAO_DO_LOTE}
            valor={justificativa}
            aoMudar={definirJustificativa}
            obrigatorio
            desligado={decidir.isPending}
            erro={tentouRejeitar ? problemaDaJustificativa : undefined}
            {...LIMITES_DA_JUSTIFICATIVA}
          />
        </DialogoDeConfirmacao>
      )}
    </Tela>
  )
}
