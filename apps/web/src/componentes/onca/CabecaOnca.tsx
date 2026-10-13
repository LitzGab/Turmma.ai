/**
 * As cores da onça (`docs/interface.md` 9.7): **fixas nos dois temas**. A onça é a mesma no claro e no escuro, e por isso
 * não lê token: é o único desenho do produto, com o QR, que escreve cor à mão (`ARQUIVOS_COM_COR_EM_LINHA`, em
 * `estilos.test.ts`). A língua (`#FF9FB0`) é da boca aberta, que nenhuma expressão desta peça tem.
 */
const PELAGEM = '#E8732E'
const SOMBRA = '#D75F18'
const REALCE = '#ED935D'
const CREME = '#FDEBDD'
const ROSETA = '#7A3412'
const PUPILA = '#16233E'
const OLHO = '#FFFFFF'
const NARIZ = '#E5838C'

/** Os tamanhos do avatar, em px: 24 na linha da mensagem, 32 na assinatura, 40 e 48 no cabeçalho (9.7). */
export type TamanhoDaCabeca = 24 | 32 | 40 | 48

interface PropsDaCabecaOnca {
  readonly tamanho: TamanhoDaCabeca
}

/**
 * A cabeça da onça: **um desenho só, com uma expressão neutra, parado** (`docs/interface.md` 9.7; D80, item 3). Só
 * círculos e retângulos arredondados (o nariz é um retângulo de canto grande), mais um traço para a boca: sem contorno
 * nas formas e sem degradê.
 *
 * É a peça mais restrita do produto, de propósito (D58; Decreto 12.880, art. 11; regra 70, itens 4a e 4b):
 *
 * - **Só `tamanho`.** Não há pose, "pensando", humor nem expressão que mude com quem usa: nem com a presença ou a ausência,
 *   nem com o acerto, o erro, o tempo de uso ou o assunto da conversa. Dois renders do mesmo tamanho dão o mesmo HTML.
 * - **Parada.** Nenhum `animate`, transição, temporizador nem efeito: ela é desenho, e o que a faria viva não existe aqui.
 * - **Sem nome e sem texto.** `aria-hidden`, sem `<title>` nem `<desc>`: "onça" não é o nome de agente nenhum. Quem
 *   assina é a função, ao lado (`AssinaturaIA`).
 *
 * Quem a desenha é só o `AvatarAgente`, que a põe num círculo com o anel do agente (a cadeia fechada é um teste:
 * `componentes/ia/avatar-so-nas-duas-pecas.test.ts`). O SVG preenche a caixa em que está: o círculo é do avatar.
 */
export function CabecaOnca({ tamanho }: PropsDaCabecaOnca) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="block size-full shrink-0">
      {/* As orelhas, com o creme por dentro: o rosto cobre a parte de baixo delas. */}
      <circle cx="13" cy="13.5" r="6.5" fill={PELAGEM} />
      <circle cx="35" cy="13.5" r="6.5" fill={PELAGEM} />
      <circle cx="13" cy="11.5" r="2.6" fill={CREME} />
      <circle cx="35" cy="11.5" r="2.6" fill={CREME} />
      {/* O rosto: a sombra aparece só embaixo, como a borda grossa de uma peça do sistema. */}
      <rect x="6" y="14" width="36" height="30" rx="14" fill={SOMBRA} />
      <rect x="6" y="11.5" width="36" height="30" rx="14" fill={PELAGEM} />
      <rect x="19" y="14" width="10" height="2.4" rx="1.2" fill={REALCE} />
      {/* As rosetas: três na testa e uma em cada bochecha. */}
      <circle cx="24" cy="19.5" r="1.5" fill={ROSETA} />
      <circle cx="17.5" cy="20" r="1.2" fill={ROSETA} />
      <circle cx="30.5" cy="20" r="1.2" fill={ROSETA} />
      <circle cx="10.5" cy="31" r="1.2" fill={ROSETA} />
      <circle cx="37.5" cy="31" r="1.2" fill={ROSETA} />
      {/* O focinho, o nariz e a boca: o "w" pequeno de quem olha de frente. */}
      <rect x="15.5" y="29" width="17" height="11" rx="5.5" fill={CREME} />
      <rect x="21" y="29.8" width="6" height="4" rx="2" fill={NARIZ} />
      <path d="M24 33.8V36M20.4 36q1.8 2.2 3.6.2 1.8 2 3.6-.2" fill="none" stroke={PUPILA} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* Os olhos, de frente: a pupila no meio do branco. */}
      <circle cx="17.5" cy="26" r="3.4" fill={OLHO} />
      <circle cx="30.5" cy="26" r="3.4" fill={OLHO} />
      <circle cx="17.5" cy="26" r="1.9" fill={PUPILA} />
      <circle cx="30.5" cy="26" r="1.9" fill={PUPILA} />
    </svg>
  )
}
