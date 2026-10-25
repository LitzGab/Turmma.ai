import { useId, type ReactNode } from 'react'
import { Link } from 'wouter'
import { ROTAS_DO_ALUNO } from '../../../caminhos'
import { TamanhoDaLetra } from '../../../componentes/ajustes/TamanhoDaLetra'
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
import { GRUPOS_DO_AVISO } from './aviso-de-privacidade'
import { FALA_DO_TUTOR, PASSOS_DO_ALUNO, TOTAL_DE_PASSOS, type PassoDoAluno } from './textos-da-introducao'

/**
 * O aviso de privacidade: quatro grupos, cada um com o título e as frases (`aviso-de-privacidade.ts`). São 17 frases, que não
 * cabem ao lado da onça, da fala e do botão em 1366 × 768 (RF20): **só o miolo rola**, e o "Continuar" fica à vista. A região
 * rolável (`RegiaoQueRola`, a mesma da introdução do professor) tem nome, entra no Tab e avisa "Role para ler mais" enquanto há
 * o que ler abaixo.
 */
function AvisoDePrivacidade() {
  return (
    <RegiaoQueRola nome="Aviso de privacidade" alturaMaxima="max-h-[28dvh]">
      {GRUPOS_DO_AVISO.map((grupo) => (
        <section key={grupo.titulo} className="flex min-w-0 flex-col gap-2">
          <h2 className="t-cartao min-w-0 break-words text-tinta">{grupo.titulo}</h2>
          <ul className="flex min-w-0 flex-col gap-2">
            {grupo.frases.map((frase) => (
              <li key={frase} className="t-corpo min-w-0 break-words text-tinta">
                {frase}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </RegiaoQueRola>
  )
}

/**
 * O tamanho da letra, com as três opções lado a lado a partir de 640 px: em coluna o passo passava de 940 px e rolava a 1366 × 768
 * (RF20). A peça é a mesma de "Ajustes"; quem a põe em linha é este passo, e abaixo de 640 px ela segue em coluna.
 */
function PassoDaLetra() {
  return (
    <div className="w-full min-w-0 sm:[&_fieldset]:flex-row sm:[&_fieldset]:flex-wrap sm:[&_label]:flex-1 sm:[&_legend]:w-full sm:[&_p]:w-full">
      <TamanhoDaLetra />
    </div>
  )
}

function conteudoDoPasso(passo: PassoDoAluno): ReactNode {
  if (passo.id === 'privacidade') return <AvisoDePrivacidade />
  if (passo.id === 'letra') return <PassoDaLetra />
  return <Linhas linhas={passo.linhas} />
}

/**
 * A introdução do aluno (telas do aluno e primeiro acesso, 9.0; RF12 a RF14, RF16 a RF19; mockup 2.8): quatro passos numa
 * tela de foco, dentro da casca. O Tutor é um programa e pode errar; quem dá a aula acompanha; o aviso de privacidade; o
 * tamanho da letra. Os três primeiros são avisos e não se pulam na primeira vez; o último se pula.
 *
 * **Quatro estados.** Carregando: a fala do passo 1 e o "Sair", sem "Fechar" nem "Pular" (o modo ainda não se sabe). Erro:
 * `EstadoErro` com "Tentar de novo", "Voltar para a abertura" e o "Sair" da moldura. Data desconhecida vale o modo primeira
 * vez: só uma data **conhecida e preenchida** vira "revendo". Com dado, os passos.
 *
 * **Concluir e pular gravam a data e levam o aluno à abertura, mesmo se a gravação falhar**: a pessoa nunca fica presa, e a
 * introdução volta na entrada seguinte. Dois cliques seguidos fazem um POST só. "Sair" e fechar a aba não gravam. Revendo, a
 * data já existe: todo passo fecha, nada é gravado e a pessoa volta a Eu, de onde veio. Tudo isso é de `useIntroducao`, que
 * as introduções dos outros papéis também usam.
 */
export default function BemVindo() {
  useTituloDaTela('Bem-vindo')
  const idDoPasso = useId()
  const { eu, revendo, terminar } = useIntroducao({ aoTerminar: ROTAS_DO_ALUNO.inicio, aoRever: ROTAS_DO_ALUNO.eu })

  if (eu.data === undefined && eu.isError) {
    return (
      <TelaDeFoco
        passo={1}
        total={TOTAL_DE_PASSOS}
        idDoPasso={idDoPasso}
        rodape={
          <Link to={ROTAS_DO_ALUNO.inicio} replace className={`${CLASSES_DO_LINK_SECUNDARIO} flex-1`}>
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
        <Onca pose="acenando" agente="tutor" tamanho={120} />
        <Balao fala={FALA_DO_TUTOR} descritoPor={idDoPasso} />
        <p role="status" className="sr-only">
          Carregando…
        </p>
      </TelaDeFoco>
    )
  }

  const passos: readonly PassoDaIntroducao[] = PASSOS_DO_ALUNO.map((passo) => ({ pose: passo.pose, fala: passo.fala, obrigatorio: passo.obrigatorio, conteudo: conteudoDoPasso(passo) }))
  return <Introducao passos={passos} agente="tutor" revendo={revendo} aoConcluir={terminar} aoPular={terminar} />
}
