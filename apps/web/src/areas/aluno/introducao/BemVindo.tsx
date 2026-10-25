import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useId, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'wouter'
import { concluirIntroducao, consultaEu } from '../../../api/eu'
import { ROTAS_DO_ALUNO } from '../../../caminhos'
import { TamanhoDaLetra } from '../../../componentes/ajustes/TamanhoDaLetra'
import { EstadoErro } from '../../../componentes/estado'
import { Balao } from '../../../componentes/introducao/Balao'
import { Introducao, type PassoDaIntroducao } from '../../../componentes/introducao/Introducao'
import { TelaDeFoco } from '../../../componentes/introducao/TelaDeFoco'
import { CLASSES_DO_LINK_SECUNDARIO } from '../../../componentes/ui/botao-secundario'
import { Onca } from '../../../componentes/ui/onca/Onca'
import { useTituloDaTela } from '../../../titulo'
import { GRUPOS_DO_AVISO } from './aviso-de-privacidade'
import { FALA_DO_TUTOR, PASSOS_DO_ALUNO, TOTAL_DE_PASSOS, type PassoDoAluno } from './textos-da-introducao'

/** O `['eu']` envelhece em 60 s e não se relê ao voltar para a aba (Tech Spec, seção 9): o desvio da entrada já o leu. */
const LEITURA_DA_INTRODUCAO = { staleTime: 60_000, refetchOnWindowFocus: false } as const

/** As frases de um passo, uma por linha, em `t-corpo`: texto fixo de `textos-da-introducao.ts`. */
function Linhas({ linhas }: { readonly linhas: readonly string[] }) {
  return (
    <ul className="flex w-full min-w-0 flex-col gap-2">
      {linhas.map((linha) => (
        <li key={linha} className="t-corpo min-w-0 break-words rounded-controle border-2 border-borda bg-superficie px-4 py-3 text-tinta">
          {linha}
        </li>
      ))}
    </ul>
  )
}

/** Falta menos que isto (em px) para o fim da região: já se leu tudo. */
const FOLGA_DO_FIM = 4

/**
 * O aviso de privacidade: quatro grupos, cada um com o título e as frases (`aviso-de-privacidade.ts`). São 17 frases, que não
 * cabem ao lado da onça, da fala e do botão em 1366 × 768 (RF20): **só o miolo rola**, e o "Continuar" fica à vista. A região
 * rolável tem nome e entra no Tab (`scrollable-region-focusable`), para quem usa teclado a ler inteira. **Enquanto há o que ler
 * abaixo, uma faixa com "Role para ler mais" cobre o pé da região**: sem ele o aluno veria três frases e uma cortada ao meio, e
 * acharia que o aviso acabou. Chegando ao fim, a faixa sai. (A guarda de cor da web não aceita degradê com transparência nem modificador de opacidade: a faixa é de cor cheia.)
 */
function AvisoDePrivacidade() {
  const [haMais, definirHaMais] = useState(true)
  return (
    <div className="relative w-full min-w-0">
      <div
        role="region"
        aria-label="Aviso de privacidade"
        tabIndex={0}
        onScroll={(evento) => {
          const regiao = evento.currentTarget
          definirHaMais(regiao.scrollTop + regiao.clientHeight < regiao.scrollHeight - FOLGA_DO_FIM)
        }}
        className="flex max-h-[28dvh] w-full min-w-0 flex-col gap-4 overflow-y-auto rounded-controle border-2 border-borda p-4 text-left"
      >
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
      </div>
      {haMais && (
        <div aria-hidden="true" data-mais-abaixo="" className="pointer-events-none absolute inset-x-[2px] bottom-[2px] flex h-9 items-center justify-center rounded-b-controle border-t-2 border-borda bg-fundo">
          <span className="t-apoio text-sutil">Role para ler mais</span>
        </div>
      )}
    </div>
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
 * introdução volta na entrada seguinte. A resposta da rota entra no cache `['eu']`. Dois cliques seguidos fazem um
 * POST só. "Sair" e fechar a aba não gravam. Revendo, a data já existe: todo passo fecha, nada é gravado e a pessoa volta a Eu,
 * de onde veio.
 */
export default function BemVindo() {
  useTituloDaTela('Bem-vindo')
  const eu = useQuery({ ...consultaEu, ...LEITURA_DA_INTRODUCAO })
  const cliente = useQueryClient()
  const [, ir] = useLocation()
  const idDoPasso = useId()
  /** O POST já saiu: o segundo clique, no mesmo quadro, não faz outro. */
  const jaGravou = useRef(false)

  // O que o `onSuccess` guarda é a primeira data, a mesma que o `GET /v1/eu` devolveria; sem `['eu']` no cache não há o que atualizar.
  const gravar = useMutation({
    mutationFn: concluirIntroducao,
    onSuccess: ({ introducaoVistaEm }) => cliente.setQueryData(consultaEu.queryKey, (antes) => (antes === undefined ? antes : { ...antes, introducaoVistaEm })),
  })

  const revendo = eu.data !== undefined && eu.data.introducaoVistaEm !== null

  function terminar(): void {
    if (!revendo && !jaGravou.current) {
      jaGravou.current = true
      gravar.mutate()
    }
    ir(revendo ? ROTAS_DO_ALUNO.eu : ROTAS_DO_ALUNO.inicio, { replace: true })
  }

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
