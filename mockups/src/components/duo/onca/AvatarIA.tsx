import { useId } from 'react'
import { TONS } from './paleta'
import { FAMILIA_DO_AGENTE, type AgenteIA } from './tipos'
import { MioloCabeca, VIEWBOX_CABECA } from './CabecaOnca'
import './onca.css'

/* O AVATAR DAS IAs (4.6): círculo branco com anel de 2 px na cor do agente e a cabeça da onça dentro.
   O nome da função vai SEMPRE ao lado (quem usa põe): o avatar nunca é a única identificação, e a onça
   não tem nome próprio nem se passa por pessoa (D17, D58).
   Folga: a cabeça (com as orelhas) fica 4 px para dentro da borda a partir de 32 px, e 3 px a 24 px, senão o
   rosto some. Um fio branco separa a cabeça do anel, para o anel laranja do Tutor não se fundir com a pelagem. */

export function AvatarIA({ agente, tamanho = 32, pensando = false, className }: {
  agente: AgenteIA; tamanho?: number; pensando?: boolean; className?: string
}) {
  const uid = 'av' + useId().replace(/[^a-zA-Z0-9-]/g, '')
  const S = tamanho
  const c = TONS[FAMILIA_DO_AGENTE[agente]]
  const folga = S < 32 ? 3 : 4
  const dentro = S - 2 * folga
  const r = S / 2
  return (
    <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S} className={['onca', className ?? ''].join(' ')} aria-hidden style={{ flex: 'none', overflow: 'visible' }}>
      <defs><clipPath id={`${uid}-disco`}><circle cx={r} cy={r} r={r - 2} /></clipPath></defs>
      <circle cx={r} cy={r} r={r - 1} style={{ fill: "var(--color-white)" }} stroke={c.face} strokeWidth={2} />
      <g clipPath={`url(#${uid}-disco)`}>
        <svg x={folga} y={folga + S * 0.06} width={dentro} height={dentro} viewBox={VIEWBOX_CABECA} overflow="visible">
          <MioloCabeca uid={uid} expressao={pensando ? 'pensando' : 'frente'} rosetas={S >= 40} />
        </svg>
      </g>
      {pensando && (
        <g>
          <rect x={S * 0.44} y={S * 0.68} width={S * 0.56} height={S * 0.32} rx={S * 0.16} style={{ fill: "var(--color-white)" }} stroke={c.face} strokeWidth={Math.max(1.5, S / 24)} />
          <g className="onca-pontos" fill={c.texto}>
            {[0, 1, 2].map((i) => <circle key={i} cx={S * (0.58 + i * 0.14)} cy={S * 0.84} r={Math.max(1.4, S * 0.05)} />)}
          </g>
        </g>
      )}
    </svg>
  )
}
