/* A PALETA DA RODADA TURMMA × DUOLINGO (sistema-turmma-duolingo.md, 2.1.2 e 4.3).
   Hex literais de propósito: a onça e os ícones não dependem dos tokens da base A. */

export type FamiliaCor = 'laranja' | 'azul' | 'verde' | 'amarelo' | 'vermelho' | 'roxo' | 'turquesa' | 'anil' | 'lima' | 'rosa'

export type TonsFamilia = { face: string; degrau: string; claro: string; borda: string; texto: string }

/** As 10 famílias: face, degrau, claro, borda e texto (tabela 2.1.2). */
export const TONS: Record<FamiliaCor, TonsFamilia> = {
  laranja: { face: '#E8732E', degrau: '#BA5C25', claro: '#FDEBDD', borda: '#F5C0A1', texto: '#A85220' },
  azul: { face: '#1C9BEF', degrau: '#167CBF', claro: '#DFF1FD', borda: '#99D2F8', texto: '#146EAA' },
  verde: { face: '#2FBF5B', degrau: '#269949', claro: '#E2F6E8', borda: '#A1E2B5', texto: '#1F7C3B' },
  amarelo: { face: '#FFC31F', degrau: '#E0A000', claro: '#FFF7E0', borda: '#FFE49A', texto: '#8C6B11' },
  vermelho: { face: '#F2545B', degrau: '#C24349', claro: '#FDE7E8', borda: '#F9B2B5', texto: '#B84045' },
  roxo: { face: '#A56EF5', degrau: '#8458C4', claro: '#F2EBFE', borda: '#D6BEFA', texto: '#7D54BA' },
  turquesa: { face: '#1DBFAE', degrau: '#17998B', claro: '#DFF6F4', borda: '#99E2DB', texto: '#137A6F' },
  anil: { face: '#6A85F7', degrau: '#556AC6', claro: '#EAEEFE', borda: '#BCC8FB', texto: '#5165BC' },
  lima: { face: '#9ACD2E', degrau: '#7FB01C', claro: '#F1F8E2', borda: '#D2E8A1', texto: '#59771B' },
  rosa: { face: '#F57CB5', degrau: '#C46391', claro: '#FEEDF5', borda: '#FAC4DE', texto: '#A25277' },
}

/** As 10 famílias no modo escuro (14ª rodada; plano ux-composicao, 2.2). A onça NÃO muda de cor; isto é para os
    ícones e gráficos que leem hex. Quem está no React usa `useTons()` (onca/tons.ts). */
export const TONS_ESCURO: Record<FamiliaCor, TonsFamilia> = {
  laranja: { face: '#EB8447', degrau: '#BA5C25', claro: '#352C26', borda: '#734528', texto: '#EF9D6D' },
  azul: { face: '#37A7F1', degrau: '#167CBF', claro: '#143344', borda: '#17577F', texto: '#60B9F4' },
  verde: { face: '#48C76F', degrau: '#269949', claro: '#17392D', borda: '#20673D', texto: '#6DD28C' },
  amarelo: { face: '#FFC31F', degrau: '#E0A000', claro: '#393923', borda: '#7D6922', texto: '#FFD562' },
  vermelho: { face: '#F4696F', degrau: '#C24349', claro: '#37272D', borda: '#77373D', texto: '#F6878C' },
  roxo: { face: '#B07FF6', degrau: '#8458C4', claro: '#2A2C45', borda: '#554382', texto: '#C09AF8' },
  turquesa: { face: '#38C7B8', degrau: '#17998B', claro: '#15393A', borda: '#186762', texto: '#61D2C6' },
  anil: { face: '#7C94F8', degrau: '#556AC6', claro: '#212F46', borda: '#3A4D83', texto: '#97AAF9' },
  lima: { face: '#9ACD2E', degrau: '#7FB01C', claro: '#293B26', borda: '#506D28', texto: '#B8DC6D' },
  rosa: { face: '#F68CBE', degrau: '#C46391', claro: '#372E3B', borda: '#794965', texto: '#F8A3CB' },
}

/** A onça (tabela 4.3): no máximo 9 cores por pose. */
export const ONCA = {
  pelagem: '#E8732E',
  sombra: '#D75F18',
  realce: '#ED935D',
  creme: '#FDEBDD',
  roseta: '#7A3412',
  pupila: '#16233E',
  olho: '#FFFFFF',
  nariz: '#E5838C',
  lingua: '#FF9FB0',
  /** a sombra do chão vem do cenário (token), não da onça: clara no claro, preta a 35% no escuro */
  chao: 'var(--color-onca-chao)',
  chaoOpacidade: 1,
} as const

/** Neutros usados pelos ícones (tabela 2.1.1 e regra do papel em 2.5). */
export const NEUTRO = {
  branco: '#FFFFFF',
  /** o papel e a linha dos ícones encostados no fundo: tokens, para virarem no escuro */
  papel: 'var(--color-icone-papel)',
  linha: 'var(--color-icone-linha)',
  borda: '#E5E5E5',
  apagado: '#AFAFAF',
  sutil: '#5D5D5D',
  tinta: '#0D0D0D',
} as const

/** O atributo d da pinta da marca (opção A da M08, marca/logo-revisao/A-pinta.svg), sem o transform.
    Raio de cerca de 500 unidades: na escala 0,02 dá uma pinta de 20 px. */
export const PINTA_PATH = 'M-21.3 -136.8 C-47.9 -139.1 -84.9 -131.8 -104.8 -115.4 C-124.8 -98.9 -136.4 -65.0 -140.9 -38.1 C-145.3 -11.1 -145.7 26.1 -131.5 46.3 C-117.3 66.6 -81.8 81.4 -55.6 83.5 C-29.3 85.6 5.6 75.8 25.8 59.0 C46.0 42.2 60.9 9.5 65.7 -17.3 C70.5 -44.1 69.1 -82.1 54.6 -102.0 C40.1 -121.9 5.2 -134.6 -21.3 -136.8Z M305.2 -358.3 C280.8 -356.4 252.6 -334.5 235.5 -314.1 C218.5 -293.7 208.7 -263.1 203.1 -235.9 C197.6 -208.7 205.6 -178.9 202.3 -151.0 C199.0 -123.1 190.7 -95.8 183.6 -68.5 C176.5 -41.3 158.4 -13.8 159.7 12.6 C161.0 39.0 173.8 71.5 191.6 89.7 C209.4 108.0 241.1 122.1 266.6 122.1 C292.2 122.2 321.2 104.8 344.7 89.9 C368.3 75.1 386.7 51.8 407.9 32.9 C429.1 14.1 457.0 -0.8 471.8 -23.2 C486.6 -45.6 498.3 -75.7 496.7 -101.7 C495.2 -127.7 473.4 -153.1 462.5 -179.1 C451.7 -205.2 445.1 -233.9 431.7 -258.2 C418.3 -282.6 403.2 -308.5 382.1 -325.2 C361.0 -341.9 329.6 -360.1 305.2 -358.3Z M-6.0 -450.4 C-31.4 -449.5 -58.2 -432.7 -81.6 -418.9 C-105.0 -405.1 -122.4 -376.9 -146.5 -367.7 C-170.7 -358.5 -199.3 -365.7 -226.3 -363.6 C-253.2 -361.6 -281.3 -360.2 -308.2 -355.3 C-335.2 -350.5 -364.6 -347.1 -388.1 -334.6 C-411.5 -322.1 -434.4 -302.2 -449.2 -280.2 C-463.9 -258.2 -469.4 -228.9 -476.4 -202.5 C-483.4 -176.0 -489.1 -148.8 -491.1 -121.5 C-493.1 -94.2 -488.0 -66.3 -488.6 -38.8 C-489.1 -11.3 -493.2 16.2 -494.4 43.6 C-495.6 71.1 -498.8 98.8 -495.8 125.9 C-492.7 153.0 -482.0 179.4 -476.2 206.3 C-470.4 233.2 -472.1 263.7 -460.9 287.5 C-449.6 311.4 -429.5 332.9 -408.5 349.4 C-387.5 365.9 -360.3 383.2 -334.9 386.5 C-309.5 389.8 -279.9 368.8 -256.1 369.1 C-232.3 369.4 -212.8 376.5 -192.1 388.4 C-171.3 400.3 -155.4 429.9 -131.7 440.5 C-108.0 451.0 -76.9 452.5 -49.9 451.7 C-22.8 450.9 8.2 448.7 30.4 435.9 C52.6 423.0 69.6 397.9 83.1 374.7 C96.6 351.6 104.8 323.3 111.5 297.1 C118.3 270.9 131.0 240.1 123.5 217.4 C116.0 194.8 89.0 167.9 66.6 161.4 C44.1 154.9 12.6 167.3 -11.3 178.4 C-35.3 189.6 -54.7 212.6 -77.2 228.5 C-99.7 244.4 -122.7 262.6 -146.2 274.1 C-169.7 285.6 -197.8 304.5 -218.0 297.5 C-238.3 290.4 -248.9 251.4 -267.9 231.7 C-286.8 212.0 -312.4 198.3 -331.7 179.1 C-351.0 159.9 -370.8 140.3 -383.7 116.7 C-396.6 93.2 -405.4 64.6 -409.0 38.0 C-412.7 11.4 -411.4 -16.5 -405.8 -42.7 C-400.2 -69.0 -387.5 -95.3 -375.4 -119.6 C-363.4 -144.0 -352.4 -170.5 -333.4 -188.8 C-314.3 -207.1 -284.2 -214.4 -261.3 -229.4 C-238.4 -244.5 -218.2 -270.1 -195.7 -279.3 C-173.3 -288.5 -149.2 -291.8 -126.5 -284.7 C-103.7 -277.7 -82.5 -251.6 -59.2 -237.0 C-35.9 -222.5 -12.0 -202.1 13.2 -197.4 C38.4 -192.8 72.7 -195.4 92.2 -209.1 C111.7 -222.9 125.0 -254.6 130.2 -280.0 C135.4 -305.4 133.3 -337.4 123.4 -361.4 C113.5 -385.4 92.3 -409.3 70.7 -424.2 C49.1 -439.0 19.3 -451.3 -6.0 -450.4Z'
