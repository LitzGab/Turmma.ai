import { NOMES_DOS_AGENTES, type Agente } from '@educa/shared'
import { SeloIA } from '../ia/AssinaturaIA'
import { CREME, DesenhoDaCabeca, PELAGEM, ROSETA, SOMBRA } from './CabecaOnca'

/**
 * As três poses da onça de corpo inteiro (`docs/interface.md` 9.7; D80, item 3). **Acolhendo** não existe: a expressão de
 * preocupação não entra no produto, e o tipo não a aceita.
 */
export const POSES = ['acenando', 'apontando', 'comemorando'] as const
export type Pose = (typeof POSES)[number]

/** As poses da introdução: acenando e apontando. A comemorando é só da `Comemoracao`, e o tipo já a recusa. */
export type PoseDaIntroducao = Exclude<Pose, 'comemorando'>

/** A largura do desenho, em px: 88 no celular e 120 no computador, e 120 e 160 na comemoração (mockup 2.8). */
export type TamanhoDaOnca = 88 | 120 | 160

interface PropsDaOnca {
  readonly pose: Pose
  /** Quem a onça é na tela: a função dele assina embaixo (D17, D58). */
  readonly agente: Agente
  readonly tamanho: TamanhoDaOnca
}

/** O quadro do desenho, em unidades: o corpo e os braços moram nele, e a cabeça (48 × 48) é aumentada para caber. */
const LARGURA = 120
const ALTURA = 132
/** A cabeça, no alto e centrada: 48 unidades vezes 1,5. */
const POSICAO_DA_CABECA = 'translate(24 2) scale(1.5)'

type Lado = 'esquerdo' | 'direito'

/** Onde cada braço nasce, no ombro. */
const OMBRO: Readonly<Record<Lado, readonly [number, number]>> = { esquerdo: [36, 74], direito: [84, 74] }

interface Braco {
  readonly lado: Lado
  /** O giro em graus, em torno do ombro: 0 deixa o braço pendurado, e o ângulo positivo o afasta para fora do corpo. */
  readonly angulo: number
  readonly comprimento: number
}

/**
 * O que muda de uma pose para outra: **só os braços**. O corpo e a cabeça são os mesmos, e o rosto é o neutro da
 * `CabecaOnca` em todas (D80, item 3): nenhuma pose tem outra boca, outro olho nem outra expressão.
 */
const BRACOS: Readonly<Record<Pose, readonly Braco[]>> = {
  acenando: [
    { lado: 'esquerdo', angulo: 12, comprimento: 34 },
    { lado: 'direito', angulo: 210, comprimento: 34 },
  ],
  apontando: [
    { lado: 'esquerdo', angulo: 12, comprimento: 34 },
    { lado: 'direito', angulo: -60, comprimento: 30 },
  ],
  comemorando: [
    { lado: 'esquerdo', angulo: 150, comprimento: 34 },
    { lado: 'direito', angulo: 210, comprimento: 34 },
  ],
}

function DesenhoDoBraco({ lado, angulo, comprimento }: Braco) {
  const [x, y] = OMBRO[lado]
  return (
    <g transform={`rotate(${String(angulo)} ${String(x)} ${String(y)})`}>
      <rect x={x - 6} y={y} width="12" height={comprimento} rx="6" fill={PELAGEM} />
      <circle cx={x} cy={y + comprimento - 2} r="7.5" fill={CREME} />
    </g>
  )
}

/** O que não muda: o rabo, o corpo com a sombra embaixo, a barriga, as rosetas e os pés. */
function DesenhoDoCorpo() {
  return (
    <>
      <rect x="82" y="96" width="14" height="30" rx="7" fill={SOMBRA} transform="rotate(-35 88 100)" />
      <rect x="32" y="62" width="56" height="60" rx="24" fill={SOMBRA} />
      <rect x="32" y="59" width="56" height="60" rx="24" fill={PELAGEM} />
      <rect x="44" y="74" width="32" height="40" rx="16" fill={CREME} />
      <circle cx="38" cy="96" r="2.2" fill={ROSETA} />
      <circle cx="82" cy="96" r="2.2" fill={ROSETA} />
      <circle cx="40" cy="108" r="2" fill={ROSETA} />
      <circle cx="80" cy="108" r="2" fill={ROSETA} />
      <rect x="36" y="116" width="22" height="11" rx="5.5" fill={PELAGEM} />
      <rect x="62" y="116" width="22" height="11" rx="5.5" fill={PELAGEM} />
    </>
  )
}

/**
 * A onça de corpo inteiro, **parada e igual em qualquer render** (`docs/interface.md` 9.7; D80, item 3; regra 70, itens 4a
 * e 4b). É um animal desenhado, nas cores fixas da `CabecaOnca`, sem contorno nem degradê, e nunca tem traço de pessoa.
 *
 * - **Três poses, e só o corpo muda.** O rosto é o `DesenhoDaCabeca` da X1, o mesmo nas três: olhos e boca neutros. Não
 *   há humor, "pensando" nem expressão que dependa de quem usa.
 * - **Sempre assinada.** O desenho vem na mesma `figure` do nome da função e do selo "IA", e o nome acessível é a
 *   função: "onça" não é o nome de agente nenhum (D17, D58). Por isso só a `Introducao`, a `Comemoracao` e as
 *   introduções de cada papel a importam (`ia/avatar-so-nas-duas-pecas.test.ts`).
 * - **Sem movimento.** Nenhum temporizador, efeito nem estilo em linha. O salto da comemoração é da `Comemoracao`, em
 *   CSS, e a introdução não move a onça.
 * - **`comemorando` é da `Comemoracao`.** Só ela a desenha, depois do envio confirmado (RF8, RF19).
 */
export function Onca({ pose, agente, tamanho }: PropsDaOnca) {
  const funcao = NOMES_DOS_AGENTES[agente]
  return (
    <figure data-onca="" data-pose={pose} className="m-0 flex min-w-0 flex-col items-center gap-2">
      <svg
        width={tamanho}
        height={Math.round((tamanho * ALTURA) / LARGURA)}
        viewBox={`0 0 ${String(LARGURA)} ${String(ALTURA)}`}
        aria-hidden="true"
        focusable="false"
        className="block shrink-0"
      >
        <DesenhoDoCorpo />
        {BRACOS[pose].map((braco) => (
          <DesenhoDoBraco key={braco.lado} {...braco} />
        ))}
        <g data-rosto="" transform={POSICAO_DA_CABECA}>
          <DesenhoDaCabeca />
        </g>
      </svg>
      <figcaption data-onca-assinatura="" className="flex min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span className="text-[15px] leading-5 font-bold break-words text-tinta">{funcao}</span>
        <SeloIA />
      </figcaption>
    </figure>
  )
}
