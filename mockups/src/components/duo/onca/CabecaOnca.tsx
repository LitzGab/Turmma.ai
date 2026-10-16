import { useId } from 'react'
import { ONCA, PINTA_PATH } from './paleta'
import type { ExpressaoCabeca } from './tipos'
import { Boca, Focinho, Mascara, Olhos, Orelha, Rosetas } from './partes'
import { CABECA_D, ROSETAS } from './geometria'
import './onca.css'

/* A CABEÇA RECORTADA DE PERTO (4.6): orelhas, topo do corpo, máscara, olhos e focinho.
   No quadrado, a máscara chega a 9 unidades das bordas (a regra do avatar do Duo pede encostar; encostando,
   o topo do corpo enchia o quadrado e a cabeça virava um ladrilho laranja, sem silhueta).
   Abaixo de 32 px a roseta da testa sai: vira ruído. */

/** O recorte no quadro de 240: orelhas inteiras; a máscara vai de x 53 a 187. */
export const VIEWBOX_CABECA = '44 32 152 152'

export function CabecaOnca({ tamanho = 48, expressao = 'frente', className, rotulo }: {
  tamanho?: number; expressao?: ExpressaoCabeca; className?: string; rotulo?: string
}) {
  const uid = 'cab' + useId().replace(/[^a-zA-Z0-9-]/g, '')
  const a11y = rotulo ? { role: 'img' as const, 'aria-label': rotulo } : { 'aria-hidden': true as const }
  return (
    <svg viewBox={VIEWBOX_CABECA} width={tamanho} height={tamanho} className={['onca', className ?? ''].join(' ')} style={{ overflow: 'hidden' }} {...a11y}>
      <MioloCabeca uid={uid} expressao={expressao} rosetas={tamanho >= 32} />
    </svg>
  )
}

/** O desenho da cabeça, para ser posto dentro de outro SVG (o avatar). */
export function MioloCabeca({ uid, expressao, rosetas }: { uid: string; expressao: ExpressaoCabeca; rosetas: boolean }) {
  const olhos = expressao === 'feliz' ? 'feliz' : expressao === 'pensando' ? 'cima' : 'frente'
  const boca = expressao === 'feliz' ? 'aberta' : expressao === 'pensando' ? 'lado' : 'w'
  return (
    <>
      <defs>
        <path id={`${uid}-pinta`} fillRule="evenodd" d={PINTA_PATH} />
        <clipPath id={`${uid}-corpo`}><path d={CABECA_D} /></clipPath>
      </defs>
      <Orelha lado="e" />
      <Orelha lado="d" />
      <path d={CABECA_D} fill={ONCA.pelagem} />
      {rosetas && <Rosetas pinta={`${uid}-pinta`} clip={`${uid}-corpo`} lista={[ROSETAS[0]]} />}
      <Mascara />
      <Olhos tipo={olhos} uid={uid} />
      <Focinho />
      <Boca tipo={boca} uid={uid} />
    </>
  )
}
