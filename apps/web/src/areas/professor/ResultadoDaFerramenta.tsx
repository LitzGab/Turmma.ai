import type { ChaveDeFuncao } from '@educa/shared'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'wouter'
import { consultaArtefato } from '../../api/artefatos'
import { consultaTitulosDosMateriais } from '../../api/titulos-dos-materiais'
import { caminhoDoArtefatoDoProfessor, ROTAS_DO_PROFESSOR } from '../../caminhos'
import { classesDoBotao } from '../../componentes/botao-secundario'
import { EstadoCarregando, EstadoErro } from '../../componentes/estado'
import { MensagemIA } from '../../componentes/ia/Mensagem'
import { ConteudoDoArtefato } from './ConteudoDoArtefato'
import { textoDaAdaptacao } from './entregas'
import { ExportarPdf } from './ExportarPdf'

interface PropsDoResultado {
  readonly artefatoId: string
  /** A entrega que nasceu com o artefato: só a versão adaptada tem, e ela nasce pendente. */
  readonly entregaId: string | null
  /** A função do Assistente que gerou: é ela que assina. */
  readonly funcao: ChaveDeFuncao
}

const CLASSES_DA_ACAO = `${classesDoBotao({ variante: 'discreto', tamanho: 'compacto' })} hover:bg-realce-suave hover:text-tinta`

/**
 * O que a ferramenta gerou, como resposta do Assistente (`docs/interface.md` 11.3): a **assinatura da IA**, o conteúdo
 * com a página de cada questão, as fontes e as ações, **sempre visíveis** (abrir o artefato, exportar em PDF). É a mesma
 * resposta no cartão dentro da conversa e no formulário de Ferramentas.
 *
 * A versão adaptada nasce **pendente** e diz isso aqui mesmo, com o caminho para decidir: ela não vai a aluno nenhum
 * antes da aprovação registrada (regra 70, item 3).
 */
export function ResultadoDaFerramenta({ artefatoId, entregaId, funcao }: PropsDoResultado) {
  const artefato = useQuery(consultaArtefato(artefatoId))
  const materiais = useQuery(consultaTitulosDosMateriais)
  if (artefato.isPending) return <EstadoCarregando rotulo="Carregando o que foi gerado…" />
  if (artefato.isError) return <EstadoErro erro={artefato.error} tentando={artefato.isFetching} aoTentarDeNovo={() => void artefato.refetch({ cancelRefetch: false })} />
  const { data } = artefato
  return (
    <MensagemIA
      funcao={funcao}
      // A entrega recém-nascida é sempre pendente: a aprovação só existe depois da decisão, no Seu time.
      {...(entregaId === null ? {} : { aprovacao: { aprovacao: { estado: 'pendente' as const } } })}
      acoes={
        <>
          {/* Relativo à área: o `Route` aninhado em `/professor` resolve o `to` a partir da base dela. */}
          <Link to={caminhoDoArtefatoDoProfessor(data.id)} className={CLASSES_DA_ACAO}>
            Abrir o artefato
          </Link>
          <ExportarPdf artefatoId={data.id} titulo={data.titulo} />
          {entregaId !== null && (
            <Link to={ROTAS_DO_PROFESSOR.timeDoAssistente} className={CLASSES_DA_ACAO}>
              Ver e decidir em Seu time
            </Link>
          )}
        </>
      }
    >
      <div className="flex min-w-0 flex-col gap-3">
        <p className="min-w-0 font-semibold break-words text-tinta">{data.titulo}</p>
        {data.adaptacao !== null && <p className="min-w-0 text-sm break-words text-sutil">Adaptação: {textoDaAdaptacao(data.adaptacao)}</p>}
        <ConteudoDoArtefato conteudo={data.conteudo} materiais={materiais.data ?? {}} resumido />
        {entregaId !== null && <p className="min-w-0 text-sm break-words text-sutil">Esta versão só pode ir aos alunos depois que você aprovar.</p>}
      </div>
    </MensagemIA>
  )
}
