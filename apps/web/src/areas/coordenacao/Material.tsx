import { CodigoDeErro, MENSAGEM_DA_FALHA_DE_MATERIAL, TAMANHO_MAXIMO_DO_LICENCIANTE, TAMANHO_MAXIMO_TITULO_DO_MATERIAL, type Disciplina, type Material as MaterialDaEscola, type MotivoDaRecusaDoMaterial } from '@educa/shared'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Upload } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { ErroDaApi } from '../../api/cliente'
import { consultaDisciplinas } from '../../api/estrutura'
import { consultaMateriais, enviarMaterial, excluirMaterial, type CamposDoEnvioDeMaterial } from '../../api/material'
import { aoTrocarDeSessao } from '../../api/sessao'
import { Botao } from '../../componentes/Botao'
import { CLASSES_DO_BOTAO_SECUNDARIO } from '../../componentes/botao-secundario'
import { Campo } from '../../componentes/Campo'
import { Cartao } from '../../componentes/Cartao'
import { useDialogoDaTela } from '../../componentes/dialogo-aberto'
import { DialogoDeConfirmacao } from '../../componentes/DialogoDeConfirmacao'
import { Anuncio, useEnvioUnico } from '../../componentes/dialogos'
import { EstadoCarregando, EstadoErro, EstadoVazio } from '../../componentes/estado'
import { Selecao } from '../../componentes/Selecao'
import { Estado } from '../../componentes/SeloDeEstado'
import { Tela } from '../../componentes/Tela'
import { listaMudou, textoDaFalha } from '../../componentes/texto-da-falha'
import { useTituloDaTela } from '../../titulo'
import {
  AVISO_DE_SEM_LICENCA,
  BYTES_DA_ASSINATURA,
  CAMPOS_DO_ENVIO,
  camposDoEnvio,
  doMaisNovoAoMaisAntigo,
  errosDoRascunho,
  motivoDaRecusa,
  OPCOES_DE_LICENCA,
  OPCOES_DE_TITULARIDADE,
  origemDoMaterial,
  problemaDoArquivo,
  RASCUNHO_VAZIO,
  tamanhoPorExtenso,
  TEXTO_DA_RECUSA,
  TEXTO_DE_UM_ARQUIVO_POR_VEZ,
  textoDoEstado,
  TEXTOS_DA_FALHA_DA_EXCLUSAO,
  TEXTOS_DA_FALHA_DO_ENVIO,
  tituloPeloArquivo,
  type RascunhoDoEnvio,
} from './material-envio'
import { AvisoDeListaIncompleta } from './pecas-da-lista'

/** Um envio recusado por licença: existe só nesta tela, porque a recusa não vira material (D5). */
interface Recusa {
  readonly chave: number
  readonly titulo: string
  readonly motivo: MotivoDaRecusaDoMaterial
}

interface Envio {
  readonly campos: CamposDoEnvioDeMaterial
  readonly arquivo: File | undefined
  /** O material que falhou e que este envio substitui: sai da lista quando o novo entra. */
  readonly substitui: string | undefined
}

const FAMILIA_DO_ESTADO = { processando: 'pendente', pronto: 'ok', falhou: 'erro' } as const
const CLASSES_DO_ITEM = 'flex min-w-0 flex-col gap-3 rounded-cartao border bg-superficie p-4 md:flex-row md:items-start md:justify-between'

/**
 * Material (MVP, A2; `docs/interface.md` 3; D5, D22, D75): a coordenação envia o PDF com a titularidade e a licença
 * declaradas, e acompanha o que entrou, o que está sendo lido, o que falhou e o que foi recusado por falta de licença.
 *
 * - **Sem licença, ou sem a declaração, o envio é recusado**: a tela manda só o pedido, sem o arquivo, para a recusa
 *   ficar na auditoria da escola, e mostra "Envio recusado" com o motivo. A recusa não vira linha no banco: ela vive
 *   nesta tela, em borda tracejada, até a pessoa dispensá-la ou sair.
 * - O arquivo entra arrastado **ou** pelo botão: nada aqui só funciona arrastando (regra 50, item 2a).
 * - A lista é do TanStack Query, e se relê sozinha enquanto houver material `processando`.
 * - Excluir é `perigo`, com a confirmação que diz o que acontece (regra 50, item 8).
 *
 * Os quatro estados: carregando; erro com "Tentar de novo"; vazio, que convida a enviar o primeiro material; e com dado.
 */
export default function Material() {
  useTituloDaTela('Material')
  const cliente = useQueryClient()
  const materiais = useQuery(consultaMateriais)
  const disciplinas = useQuery(consultaDisciplinas)
  const dialogo = useDialogoDaTela<'excluir', MaterialDaEscola>()
  const fecharDialogo = dialogo.fechar

  const [rascunho, definirRascunho] = useState<RascunhoDoEnvio>(RASCUNHO_VAZIO)
  const [arquivo, definirArquivo] = useState<File | undefined>(undefined)
  const [erroDoArquivo, definirErroDoArquivo] = useState<string | undefined>(undefined)
  const [conferindo, definirConferindo] = useState(false)
  const [sobre, definirSobre] = useState(false)
  const [tentou, definirTentou] = useState(false)
  const [substitui, definirSubstitui] = useState<string | undefined>(undefined)
  const [recusas, definirRecusas] = useState<readonly Recusa[]>([])
  const [anuncio, definirAnuncio] = useState('')
  const [falha, definirFalha] = useState<string | undefined>(undefined)

  const formulario = useRef<HTMLFormElement>(null)
  const entradaDeArquivo = useRef<HTMLInputElement>(null)
  const botaoDoArquivo = useRef<HTMLButtonElement>(null)
  const tituloDaLista = useRef<HTMLHeadingElement>(null)
  const alerta = useRef<HTMLParagraphElement>(null)
  const ultimaRecusa = useRef(0)
  const idDoErroDoArquivo = useId()
  const idDaDeclaracao = useId()
  const idDoAvisoDaLicenca = useId()

  const recarregar = useCallback(() => cliente.invalidateQueries({ queryKey: consultaMateriais.queryKey }), [cliente])
  useEffect(() => aoTrocarDeSessao(fecharDialogo), [fecharDialogo])

  const mudar = (parte: Partial<RascunhoDoEnvio>): void => definirRascunho((atual) => ({ ...atual, ...parte }))

  /** Confere o arquivo pelo conteúdo antes de aceitá-lo no formulário: tamanho e assinatura de PDF. */
  async function receberArquivos(arquivos: FileList | null): Promise<void> {
    definirFalha(undefined)
    if (arquivos === null || arquivos.length === 0) return
    if (arquivos.length > 1) return definirErroDoArquivo(TEXTO_DE_UM_ARQUIVO_POR_VEZ)
    const [escolhido] = arquivos
    if (escolhido === undefined) return
    definirConferindo(true)
    let comeco = new Uint8Array()
    try {
      comeco = new Uint8Array(await escolhido.slice(0, BYTES_DA_ASSINATURA).arrayBuffer())
    } catch {
      // Sem conseguir ler o começo, o arquivo é tratado como o que não se abre.
    }
    definirConferindo(false)
    const problema = problemaDoArquivo(escolhido.size, comeco)
    definirErroDoArquivo(problema)
    definirArquivo(problema === undefined ? escolhido : undefined)
    definirRascunho((atual) => ({ ...atual, temArquivo: problema === undefined, titulo: problema === undefined && atual.titulo.trim() === '' ? tituloPeloArquivo(escolhido.name) : atual.titulo }))
  }

  function aoSoltar(evento: DragEvent<HTMLDivElement>): void {
    evento.preventDefault()
    definirSobre(false)
    void receberArquivos(evento.dataTransfer.files)
  }

  const { enviar, mutacao } = useEnvioUnico<Envio, MaterialDaEscola>({
    mutationFn: ({ campos, arquivo: doEnvio }) => enviarMaterial(campos, doEnvio),
    onSuccess: async (_material, envio) => {
      if (envio.substitui !== undefined) await excluirMaterial(envio.substitui).catch(() => undefined)
      // A disciplina, a titularidade e a licença ficam para o próximo capítulo; a declaração é de cada material.
      definirRascunho((atual) => ({ ...atual, titulo: '', declaracao: false, temArquivo: false }))
      definirArquivo(undefined)
      definirSubstitui(undefined)
      definirTentou(false)
      if (entradaDeArquivo.current !== null) entradaDeArquivo.current.value = ''
      definirAnuncio('Material enviado. A leitura das páginas começa agora e leva alguns instantes.')
      await recarregar()
    },
    onError: (erro, envio) => {
      if (erro instanceof ErroDaApi && erro.codigo === CodigoDeErro.MATERIAL_SEM_LICENCA) {
        ultimaRecusa.current += 1
        const recusa: Recusa = { chave: ultimaRecusa.current, titulo: envio.campos.titulo, motivo: motivoDaRecusa(envio.campos) ?? 'sem_licenca' }
        definirRecusas((atuais) => [recusa, ...atuais])
        definirFalha(`Envio recusado. ${TEXTO_DA_RECUSA[recusa.motivo]}`)
      } else {
        definirFalha(textoDaFalha(erro, TEXTOS_DA_FALHA_DO_ENVIO))
        if (listaMudou(erro, [CodigoDeErro.CONFLITO])) void recarregar()
      }
    },
  })

  // A falha do envio recebe o foco quando chega: quem não a vê na tela a ouve.
  useEffect(() => {
    if (falha !== undefined) alerta.current?.focus()
  }, [falha])

  const erros = tentou ? errosDoRascunho(rascunho) : {}
  const recusa = motivoDaRecusa(rascunho)

  function aoEnviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault()
    definirTentou(true)
    definirAnuncio('')
    definirFalha(undefined)
    const campos = camposDoEnvio(rascunho)
    if (campos === undefined) {
      const comErro = errosDoRascunho(rascunho)
      const primeiro = CAMPOS_DO_ENVIO.find((campo) => comErro[campo] !== undefined)
      if (primeiro === 'arquivo') botaoDoArquivo.current?.focus()
      else if (primeiro !== undefined) formulario.current?.querySelector<HTMLElement>(`[data-campo="${primeiro}"] input, [data-campo="${primeiro}"] select`)?.focus()
      return
    }
    // O envio que será recusado vai sem o arquivo: a recusa fica registrada, e o arquivo não sai do computador.
    enviar({ campos, arquivo: recusa === null ? arquivo : undefined, substitui })
  }

  /** "Tentar de novo" de um material que falhou: o formulário volta com o que ele declarava, e pede o arquivo. */
  function tentarDeNovo(material: MaterialDaEscola): void {
    definirRascunho({ titulo: material.titulo, disciplinaId: material.disciplinaId, titularidade: material.titularidade, licenciante: material.licenciante ?? '', licenca: material.licenca, declaracao: false, temArquivo: false })
    definirArquivo(undefined)
    definirErroDoArquivo(undefined)
    definirSubstitui(material.id)
    definirTentou(false)
    definirFalha(undefined)
    definirAnuncio('Escolha o arquivo de novo, marque a declaração e envie. O material que falhou sai da lista quando o novo entrar.')
    if (entradaDeArquivo.current !== null) entradaDeArquivo.current.value = ''
    botaoDoArquivo.current?.focus()
  }

  const lista = materiais.data
  const dasDisciplinas = disciplinas.data
  const erroDaLeitura = (
    <EstadoErro
      erro={materiais.error ?? disciplinas.error}
      tentando={materiais.isFetching || disciplinas.isFetching}
      aoTentarDeNovo={() => {
        void materiais.refetch({ cancelRefetch: false })
        void disciplinas.refetch({ cancelRefetch: false })
      }}
    />
  )

  if (materiais.isPending || disciplinas.isPending) {
    return (
      <Tela titulo="Material" largura="formulario">
        <EstadoCarregando rotulo="Carregando os materiais…" />
      </Tela>
    )
  }
  if (lista === undefined || dasDisciplinas === undefined) {
    return (
      <Tela titulo="Material" largura="formulario">
        {erroDaLeitura}
      </Tela>
    )
  }

  const nomeDaDisciplina = new Map(dasDisciplinas.itens.map((disciplina: Disciplina) => [disciplina.id, disciplina.nome]))
  const emLeitura = lista.itens.filter((material) => material.estado === 'processando').length
  const semNada = lista.itens.length === 0 && recusas.length === 0
  const alvo = dialogo.aberta?.alvo
  const aberta = dialogo.aberta

  return (
    <Tela titulo="Material" largura="formulario">
      <Cartao titulo="Enviar material">
        {dasDisciplinas.itens.length === 0 ? (
          <p className="text-apoio">Antes de enviar material, crie as disciplinas da escola em Estrutura: todo material é de uma disciplina.</p>
        ) : (
          <form ref={formulario} className="flex min-w-0 flex-col gap-4" onSubmit={aoEnviar} noValidate>
            <div
              onDragOver={(evento) => {
                evento.preventDefault()
                definirSobre(true)
              }}
              onDragLeave={() => definirSobre(false)}
              onDrop={aoSoltar}
              className={`flex min-w-0 flex-col items-center gap-2 rounded-cartao border border-dashed p-5 text-center ${sobre ? 'border-tinta bg-realce-suave' : erros.arquivo !== undefined || erroDoArquivo !== undefined ? 'border-erro' : 'border-borda-campo'}`}
            >
              {arquivo === undefined ? <Upload aria-hidden="true" size={24} strokeWidth={1.75} className="text-sutil" /> : <FileText aria-hidden="true" size={24} strokeWidth={1.75} className="text-ok" />}
              {arquivo === undefined ? (
                <p className="text-apoio">Arraste o PDF para cá, ou escolha o arquivo. Um por vez, com até 20 MB.</p>
              ) : (
                <p className="max-w-full font-medium break-words text-tinta">
                  {arquivo.name} <span className="font-normal text-apoio">· {tamanhoPorExtenso(arquivo.size)}</span>
                </p>
              )}
              <button
                ref={botaoDoArquivo}
                type="button"
                className={CLASSES_DO_BOTAO_SECUNDARIO}
                onClick={() => entradaDeArquivo.current?.click()}
                {...(erros.arquivo !== undefined || erroDoArquivo !== undefined ? { 'aria-describedby': idDoErroDoArquivo } : {})}
              >
                {arquivo === undefined ? 'Escolher arquivo' : 'Trocar arquivo'}
              </button>
              <input ref={entradaDeArquivo} type="file" accept="application/pdf,.pdf" hidden tabIndex={-1} onChange={(evento) => void receberArquivos(evento.target.files)} data-testid="arquivo-do-material" />
              <p id={idDoErroDoArquivo} role="alert" className="text-sm text-erro empty:hidden">
                {erroDoArquivo ?? erros.arquivo}
              </p>
              <span role="status" className="sr-only">
                {conferindo ? 'Conferindo o arquivo…' : arquivo === undefined ? '' : `Arquivo escolhido: ${arquivo.name}`}
              </span>
            </div>

            <div data-campo="titulo">
              <Campo rotulo="Título" value={rascunho.titulo} maxLength={TAMANHO_MAXIMO_TITULO_DO_MATERIAL} onChange={(evento) => mudar({ titulo: evento.target.value })} erro={erros.titulo} autoComplete="off" />
            </div>
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <div data-campo="disciplinaId" className="min-w-0">
                <Selecao
                  rotulo="Disciplina"
                  marcador="Escolha a disciplina"
                  opcoes={dasDisciplinas.itens.map((disciplina) => ({ valor: disciplina.id, rotulo: disciplina.nome }))}
                  valor={rascunho.disciplinaId}
                  aoMudar={(disciplinaId) => mudar({ disciplinaId })}
                  erro={erros.disciplinaId}
                />
              </div>
              <div data-campo="titularidade" className="min-w-0">
                <Selecao
                  rotulo="De quem é o material"
                  marcador="Escolha o dono do conteúdo"
                  opcoes={OPCOES_DE_TITULARIDADE}
                  valor={rascunho.titularidade}
                  aoMudar={(valor) => mudar({ titularidade: OPCOES_DE_TITULARIDADE.find((opcao) => opcao.valor === valor)?.valor ?? '' })}
                  erro={erros.titularidade}
                />
              </div>
            </div>
            {rascunho.titularidade === 'terceiro_com_licenca' && (
              <div data-campo="licenciante">
                <Campo
                  rotulo="Quem deu a licença"
                  dica="O dono do conteúdo: a editora, o sistema de ensino ou o autor."
                  value={rascunho.licenciante}
                  maxLength={TAMANHO_MAXIMO_DO_LICENCIANTE}
                  onChange={(evento) => mudar({ licenciante: evento.target.value })}
                  erro={erros.licenciante}
                  autoComplete="organization"
                />
              </div>
            )}
            <div data-campo="licenca">
              <Selecao
                rotulo="Licença de uso (obrigatória)"
                marcador="Escolha a licença"
                opcoes={OPCOES_DE_LICENCA}
                valor={rascunho.licenca}
                aoMudar={(valor) => mudar({ licenca: OPCOES_DE_LICENCA.find((opcao) => opcao.valor === valor)?.valor ?? '' })}
                erro={erros.licenca}
                {...(recusa === 'sem_licenca' ? { dica: AVISO_DE_SEM_LICENCA } : {})}
              />
            </div>
            <div className="flex min-w-0 items-start gap-3">
              <input
                id={idDaDeclaracao}
                type="checkbox"
                checked={rascunho.declaracao}
                onChange={(evento) => mudar({ declaracao: evento.target.checked })}
                className="mt-0.5 size-6 shrink-0 accent-tinta"
                {...(recusa === 'sem_declaracao' && tentou ? { 'aria-describedby': idDoAvisoDaLicenca } : {})}
              />
              <label htmlFor={idDaDeclaracao} className="min-w-0 break-words text-tinta">
                Declaro que a escola pode usar este material com os professores e os alunos dela, pela licença indicada acima.
              </label>
            </div>
            <p id={idDoAvisoDaLicenca} className="text-sm text-apoio empty:hidden">
              {recusa === 'sem_declaracao' && tentou ? 'Sem a declaração marcada, o envio é recusado.' : ''}
            </p>

            <p ref={alerta} tabIndex={-1} role="alert" className="rounded-controle border border-erro bg-erro-cx p-3 break-words text-erro empty:hidden">
              {falha}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Botao type="submit" disabled={mutacao.isPending || conferindo}>
                {mutacao.isPending ? 'Enviando…' : 'Enviar material'}
              </Botao>
              <span role="status" className="text-apoio">
                {mutacao.isPending ? 'Enviando o material…' : ''}
              </span>
            </div>
          </form>
        )}
      </Cartao>

      <section className="flex min-w-0 flex-col gap-3" aria-label="Materiais da escola">
        <h2 ref={tituloDaLista} tabIndex={-1} className="text-base font-semibold text-tinta">
          Materiais da escola
        </h2>
        <Anuncio texto={anuncio} />
        <span role="status" className="sr-only">
          {emLeitura === 0 ? '' : emLeitura === 1 ? 'Um material está sendo lido.' : `${String(emLeitura)} materiais estão sendo lidos.`}
        </span>
        {materiais.isError && erroDaLeitura}
        {semNada ? (
          !materiais.isError && (
            <EstadoVazio
              titulo="Nenhum material ainda"
              descricao="Envie o primeiro PDF da escola, com a licença declarada. É dele que o Assistente e o Tutor tiram as atividades e as explicações, sempre citando a página."
              {...(dasDisciplinas.itens.length === 0 ? {} : { acao: { rotulo: 'Escolher o primeiro arquivo', aoAcionar: () => entradaDeArquivo.current?.click() } })}
            />
          )
        ) : (
          <>
            <AvisoDeListaIncompleta completa={lista.completa} />
            <ul className="flex min-w-0 flex-col gap-3">
              {recusas.map((recusada) => (
                <li key={`recusa-${String(recusada.chave)}`} className={`${CLASSES_DO_ITEM} border-dashed border-erro`}>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <p className="font-medium break-words text-tinta">{recusada.titulo}</p>
                    <div>
                      <Estado familia="erro">{recusada.motivo === 'sem_licenca' ? 'Envio recusado · sem licença' : 'Envio recusado · sem declaração'}</Estado>
                    </div>
                    <p className="text-sm break-words text-apoio">{TEXTO_DA_RECUSA[recusada.motivo]}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Botao variante="discreto" onClick={() => definirRecusas((atuais) => atuais.filter((outra) => outra.chave !== recusada.chave))}>
                      Dispensar<span className="sr-only"> o aviso de {recusada.titulo}</span>
                    </Botao>
                  </div>
                </li>
              ))}
              {doMaisNovoAoMaisAntigo(lista.itens).map((material) => (
                <li key={material.id} className={`${CLASSES_DO_ITEM} border-linha`}>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <p className="font-medium break-words text-tinta">{material.titulo}</p>
                    <p className="text-sm break-words text-apoio">
                      {nomeDaDisciplina.get(material.disciplinaId) ?? 'Disciplina'} · {origemDoMaterial(material)}
                    </p>
                    <div>
                      <Estado familia={FAMILIA_DO_ESTADO[material.estado]}>{textoDoEstado(material)}</Estado>
                    </div>
                    {material.falha !== null && <p className="text-sm break-words text-erro">{MENSAGEM_DA_FALHA_DE_MATERIAL[material.falha]}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {material.estado === 'falhou' && (
                      <Botao variante="secundario" onClick={() => tentarDeNovo(material)}>
                        Tentar de novo<span className="sr-only"> o envio de {material.titulo}</span>
                      </Botao>
                    )}
                    <Botao variante="perigo" onClick={() => dialogo.abrir('excluir', material)}>
                      Excluir<span className="sr-only"> {material.titulo}</span>
                    </Botao>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {aberta !== undefined && alvo !== undefined && (
        <ExcluirMaterial
          key={aberta.numero}
          material={alvo}
          disciplina={nomeDaDisciplina.get(alvo.disciplinaId) ?? 'Disciplina'}
          aoFechar={fecharDialogo}
          aoTerminar={recarregar}
          aoExcluir={() => {
            dialogo.fecharSeAinda(aberta)
            definirAnuncio('Material excluído. A busca do Assistente e do Tutor deixou de achá-lo.')
          }}
          focoDeReserva={() => tituloDaLista.current?.focus()}
        />
      )}
    </Tela>
  )
}

interface PropsDoExcluir {
  readonly material: MaterialDaEscola
  readonly disciplina: string
  readonly aoFechar: () => void
  /** Recarrega a lista depois do pedido, deu certo ou não. */
  readonly aoTerminar: () => Promise<void>
  readonly aoExcluir: () => void
  readonly focoDeReserva: () => void
}

/** A confirmação de excluir: diz o que acontece com o que já foi gerado e com a busca, antes de confirmar. */
function ExcluirMaterial({ material, disciplina, aoFechar, aoTerminar, aoExcluir, focoDeReserva }: PropsDoExcluir) {
  const { enviar, mutacao } = useEnvioUnico({
    mutationFn: (): Promise<void> => excluirMaterial(material.id),
    onSuccess: async () => {
      await aoTerminar()
      aoExcluir()
    },
    onError: () => void aoTerminar(),
  })
  return (
    <DialogoDeConfirmacao
      titulo="Excluir material"
      familia="perigo"
      resumo={[
        { rotulo: 'Material', valor: material.titulo },
        { rotulo: 'Disciplina', valor: disciplina },
        { rotulo: 'Situação', valor: textoDoEstado(material) },
      ]}
      efeito="As atividades e os planos já gerados continuam citando a página deste material. Daqui em diante, a busca do Assistente e do Tutor deixa de achá-lo, e o texto lido dele é apagado."
      rotuloDeConfirmar="Excluir material"
      rotuloConfirmando="Excluindo…"
      aoConfirmar={() => enviar(undefined)}
      aoFechar={aoFechar}
      confirmando={mutacao.isPending}
      {...(mutacao.isError ? { falha: textoDaFalha(mutacao.error, TEXTOS_DA_FALHA_DA_EXCLUSAO) } : {})}
      focoDeReserva={focoDeReserva}
    />
  )
}
