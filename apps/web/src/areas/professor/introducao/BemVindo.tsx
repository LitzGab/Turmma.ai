import { useId, type ReactNode } from 'react'
import { Link } from 'wouter'
import { ROTAS } from '../../../caminhos'
import { EstadoErro } from '../../../componentes/estado'
import { Balao } from '../../../componentes/introducao/Balao'
import { Introducao, type PassoDaIntroducao } from '../../../componentes/introducao/Introducao'
import { Linhas } from '../../../componentes/introducao/Linhas'
import { RegiaoQueRola } from '../../../componentes/introducao/RegiaoQueRola'
import { TelaDeFoco } from '../../../componentes/introducao/TelaDeFoco'
import { useIntroducao } from '../../../componentes/introducao/use-introducao'
import { CLASSES_DO_LINK_SECUNDARIO } from '../../../componentes/ui/botao-secundario'
import { Onca } from '../../../componentes/ui/onca/Onca'
import { useTituloDaTela } from '../../../titulo'
import { NAVEGACAO } from '../../navegacao'
import { AGENTE_DA_INTRODUCAO, DESCRICAO_DO_LUGAR, FALA_DO_PASSO_1, PASSOS_DO_PROFESSOR, TITULO_DE_ONDE_FICA_CADA_COISA, TOTAL_DE_PASSOS, type PassoDoProfessor } from './textos-da-introducao'

/**
 * O primeiro lugar do professor, lido da navegação: é para onde ele vai ao terminar, ao pular e ao fechar a revisão. O `~` faz o
 * endereço valer pela raiz do site, e não pela base `/professor` em que a tela está.
 */
const PRIMEIRO_LUGAR = `~${NAVEGACAO.professor[0]?.caminho ?? ROTAS.novaConversa}`

/**
 * "Onde fica cada coisa": um item por lugar de `NAVEGACAO.professor`, na ordem da lateral, com uma frase de cada. A lista **sai da
 * navegação**: o lugar que a fase não tem não aparece, e o que a fase acrescentar entra sozinho. Texto, e não link: a pessoa ainda
 * está na introdução, e "Continuar" é o caminho para o primeiro lugar. Lugar sem frase em `DESCRICAO_DO_LUGAR` mostraria só o
 * rótulo e um ponto solto: o teste dos textos reprova a navegação que ganhar um lugar sem ela.
 */
function OndeFicaCadaCoisa() {
  return (
    <section aria-labelledby="onde-fica-cada-coisa" className="flex w-full min-w-0 flex-col gap-2 text-left">
      <h2 id="onde-fica-cada-coisa" className="t-cartao min-w-0 break-words text-tinta">
        {TITULO_DE_ONDE_FICA_CADA_COISA}
      </h2>
      <ul className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
        {NAVEGACAO.professor.map((lugar) => (
          <li key={lugar.caminho} className="t-corpo min-w-0 break-words rounded-controle border-2 border-borda bg-superficie px-4 py-3 text-tinta">
            <span className="font-bold">{lugar.rotulo}</span>
            <span className="text-sutil"> · {DESCRICAO_DO_LUGAR[lugar.rotulo]}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function conteudoDoPasso(passo: PassoDoProfessor, ultimo: boolean): ReactNode {
  if (!ultimo) return <Linhas linhas={passo.linhas} />
  // O último passo leva a lista de lugares: não cabe a 1366 × 768 ao lado da onça e do botão (RF20), e só o miolo rola.
  return (
    <RegiaoQueRola nome="Leia até o fim" alturaMaxima="max-h-[34dvh]">
      <Linhas linhas={passo.linhas} />
      <OndeFicaCadaCoisa />
    </RegiaoQueRola>
  )
}

/**
 * A introdução do professor (telas do aluno e primeiro acesso, 10.0; RF12, RF15 a RF19; mockup 14): quatro passos numa tela de foco,
 * dentro da casca. O Assistente prepara e ele aprova; só a resposta do Tutor chega ao aluno sem a aprovação dele, uma a uma; a IA
 * não corrige redação nem discursiva; e usar ou não a ferramenta não gera número sobre ele. **Os quatro se pulam**, e o último traz
 * "onde fica cada coisa", lida de `NAVEGACAO.professor`.
 *
 * **Quatro estados.** Carregando: a fala do passo 1 e o "Sair", sem "Fechar" nem "Pular" (o modo ainda não se sabe). Erro:
 * `EstadoErro` com "Tentar de novo", "Voltar para a abertura" e o "Sair" da moldura. Data desconhecida vale o modo primeira
 * vez. Com dado, os passos.
 *
 * **Concluir e pular gravam a data e levam o professor ao primeiro lugar dele, mesmo se a gravação falhar.** "Sair" e fechar a
 * aba não gravam. Revendo (pelo menu da pessoa), a data já existe: todo passo fecha, nada é gravado e ele vai ao mesmo primeiro
 * lugar, porque o menu da pessoa está em toda tela e não há uma única de onde ele veio. Tudo isso é de `useIntroducao`.
 * A introdução só grava a data: não confirma turma, não liga nada e não gera documento.
 */
export default function BemVindo() {
  useTituloDaTela('Bem-vindo')
  const idDoPasso = useId()
  const { eu, revendo, terminar } = useIntroducao({ aoTerminar: PRIMEIRO_LUGAR, aoRever: PRIMEIRO_LUGAR })

  if (eu.data === undefined && eu.isError) {
    return (
      <TelaDeFoco
        passo={1}
        total={TOTAL_DE_PASSOS}
        idDoPasso={idDoPasso}
        rodape={
          <Link to={PRIMEIRO_LUGAR} replace className={`${CLASSES_DO_LINK_SECUNDARIO} flex-1`}>
            Voltar para a abertura
          </Link>
        }
      >
        <h1 className="sr-only">Introdução</h1>
        <EstadoErro erro={eu.error} tentando={eu.isFetching} aoTentarDeNovo={() => void eu.refetch({ cancelRefetch: false })} />
      </TelaDeFoco>
    )
  }

  if (eu.data === undefined) {
    return (
      <TelaDeFoco passo={1} total={TOTAL_DE_PASSOS} idDoPasso={idDoPasso} rodape={null}>
        <Onca pose="acenando" agente={AGENTE_DA_INTRODUCAO} tamanho={120} />
        <Balao fala={FALA_DO_PASSO_1} descritoPor={idDoPasso} />
        <p role="status" className="sr-only">
          Carregando…
        </p>
      </TelaDeFoco>
    )
  }

  const passos: readonly PassoDaIntroducao[] = PASSOS_DO_PROFESSOR.map((passo, indice) => ({
    pose: passo.pose,
    fala: passo.fala,
    obrigatorio: passo.obrigatorio,
    conteudo: conteudoDoPasso(passo, indice === PASSOS_DO_PROFESSOR.length - 1),
  }))
  return <Introducao passos={passos} agente={AGENTE_DA_INTRODUCAO} revendo={revendo} aoConcluir={terminar} aoPular={terminar} />
}
