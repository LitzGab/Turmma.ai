import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* OS ÍCONES DAS FERRAMENTAS — quarta versão (oitava rodada, 20/09/2026).
   O pedido do Gabriel, vendo a terceira versão (papel branco, cinzas, preto e um ponto de laranja, num ladrilho
   cinza): "não está interessante". Perguntado, escolheu: "ícones coloridos, no estilo dos da Teachy, feitos por nós".
   De onde vem: a 1ª versão era traço preto de 2 px (lia como ícone de sistema); a 2ª, adesivo com volume, degradê e
   ladrilho da cor da categoria (ficou carregada); a 3ª, minimalista e quase sem cor (ficou sem graça). Esta é a
   ilustração CHAPADA e colorida: a linguagem dos ícones do modal "Criar mais com IA" da Teachy, com desenho nosso e
   o laranja da marca no lugar do azul deles.

   A REGRA DA FAMÍLIA
   · chapado: SEM sombra, SEM contorno, SEM degradê, SEM fio. Forma cheia, canto arredondado, peça grande;
   · um objeto por ícone e, no máximo, um detalhe pequeno (brilho de quatro pontas, visto, lupa, cronômetro);
   · desenhado no viewBox 40 × 40 para ser visto a 40 px (o cartão do catálogo): nenhuma peça com menos de 2 px,
     nenhuma linha de 1 px; de 2 a 4 linhas de "texto" por folha, no máximo;
   · cada um diz o que é sem legenda e tem silhueta própria — folha com faixa (prova), prancheta (atividade), folha
     e lupa, cartão de bolinhas e cronômetro, folha com aspas, folha caindo na bandeja (importar), pilha corrigida,
     folha pautada e caneta, pasta com brilho, calendário de espiral, caminho com marcos e bandeira, barras e seta,
     tela no tripé, livro aberto com marcador, nó central e ramos, erlenmeyer, A pequeno e A grande;
   · PALETA. Principal: laranja #E8732E e laranja claro #F6A873 (onde a Teachy usa azul). Papel: cinza quente claro
     #E9E6E2 com linhas #C9C4BE, e branco. Acentos, UM ou DOIS por ícone: verde-água #2BA39A (visto, líquido, seta
     que sobe), amarelo #F5C542 (brilho, cronômetro, marca-texto), rosa #F08A9B (o X, a margem da pauta), roxo
     #8B6FE8 (lupa, marcos, seta), azul #4C7BE8 (a caneta de quem marca, a seta que entra, o gráfico), grafite
     #2F2F2F só em peça miúda (mola, clipe, ponta, haste). O mapa mental é o único com quatro acentos: são os ramos;
   · O LADRILHO SAIU. `LadrilhoFerramenta` continua com a mesma assinatura (outros arquivos usam), mas agora é só
     uma caixa transparente do mesmo tamanho com o ícone centralizado (uns 72% da caixa): sem fundo, sem fio;
   · papel é #E9E6E2 quando encosta no branco do cartão e BRANCO quando está cercado de cor (prancheta, pasta, livro);
   · movimento no hover do cartão (`group`): o ícone sobe 2 px em 200 ms. Só isso. Mora no `IconeFerramenta`,
     porque o cartão do catálogo usa o ícone direto, sem a caixa;
   · conferido a 32 px (listas de Recursos e Mural), 40 px (catálogo), 56 px e 104 px na bancada `/pecas/icones`.
   A prop `acento` continua aceita (contrato antigo) e é ignorada.
   Em tamanho de menu (caixa de pedido) continua o traço do lucide, que vem de dados/ferramentas. */

const LARANJA = '#E8732E', CLARO = '#F6A873'
const PAPEL = '#E9E6E2', LINHA = '#C9C4BE', BRANCO = '#FFFFFF'
const VERDE = '#2BA39A', AMARELO = '#F5C542', ROSA = '#F08A9B', ROXO = '#8B6FE8', AZUL = '#4C7BE8', GRAFITE = '#2F2F2F'

type P = { className?: string }

const Svg = ({ className, children }: P & { children: ReactNode }) => (
  <svg aria-hidden viewBox="0 0 40 40" fill="none" className={className}>{children}</svg>
)

/** A folha em pé: canto 4. Com `dobra`, o canto de cima à direita vem dobrado. */
function Folha({ x = 8, y = 3, w = 24, h = 34, dobra = 0, cor = PAPEL }: { x?: number; y?: number; w?: number; h?: number; dobra?: number; cor?: string }) {
  const r = 4, d = dobra
  if (!d) return <rect x={x} y={y} width={w} height={h} rx={r} fill={cor} />
  return (
    <>
      <path fill={cor} d={`M${x + r} ${y}H${x + w - d}L${x + w} ${y + d}V${y + h - r}a${r} ${r} 0 0 1 ${-r} ${r}H${x + r}a${r} ${r} 0 0 1 ${-r} ${-r}V${y + r}a${r} ${r} 0 0 1 ${r} ${-r}Z`} />
      <path fill={LINHA} d={`M${x + w - d} ${y}V${y + d - 2}a2 2 0 0 0 2 2H${x + w}Z`} />
    </>
  )
}

/** A linha de "texto": 2,5 px, ponta redonda. */
const Lin = ({ x, y, w, cor = LINHA }: { x: number; y: number; w: number; cor?: string }) => <rect x={x} y={y} width={w} height={2.5} rx={1.25} fill={cor} />

/** O visto: cabe numa caixa de 6,4 × 5. */
const Visto = ({ x, y, cor = VERDE, e = 2.4 }: { x: number; y: number; cor?: string; e?: number }) => (
  <path d={`M${x} ${y + 2.6}l2.2 2.3 4.2-4.9`} stroke={cor} strokeWidth={e} strokeLinecap="round" strokeLinejoin="round" />
)

/** O brilho de quatro pontas. */
function Brilho({ cx, cy, r, cor = AMARELO }: { cx: number; cy: number; r: number; cor?: string }) {
  const k = r * .2
  return <path fill={cor} d={`M${cx} ${cy - r}Q${cx + k} ${cy - k} ${cx + r} ${cy}Q${cx + k} ${cy + k} ${cx} ${cy + r}Q${cx - k} ${cy + k} ${cx - r} ${cy}Q${cx - k} ${cy - k} ${cx} ${cy - r}Z`} />
}

/** Prova: a folha com o cabeçalho e três alternativas, uma marcada a caneta azul. */
function Prova(p: P) {
  return (
    <Svg {...p}>
      <Folha />
      <path d="M8 7a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v5H8Z" fill={LARANJA} />
      <rect x={12} y={6.2} width={10} height={2.6} rx={1.3} fill={BRANCO} />
      <rect x={10.5} y={20} width={19} height={8} rx={4} fill={BRANCO} />
      {[17, 24, 31].map((cy, i) => (
        <g key={cy}>
          <circle cx={14.5} cy={cy} r={i === 1 ? 2.8 : 2.4} fill={i === 1 ? AZUL : LINHA} />
          <Lin x={19.5} y={cy - 1.25} w={[8.5, 7, 8.5][i]} />
        </g>
      ))}
    </Svg>
  )
}

/** Atividade e lista: a prancheta com os itens e os vistos. */
function Atividade(p: P) {
  return (
    <Svg {...p}>
      <rect x={7} y={6} width={26} height={31} rx={5} fill={LARANJA} />
      <rect x={10.5} y={11} width={19} height={22.5} rx={2.5} fill={BRANCO} />
      <rect x={15} y={3.5} width={10} height={6} rx={2.6} fill={GRAFITE} />
      {[14.2, 20, 25.8].map((y, i) => (
        <g key={y}>
          {i < 2 ? <Visto x={13} y={y} /> : <rect x={13.4} y={y} width={5} height={5} rx={1.6} fill={PAPEL} />}
          <Lin x={21} y={y + 1.3} w={[6, 5, 6][i]} />
        </g>
      ))}
    </Svg>
  )
}

/** Avaliação diagnóstica: a folha sob a lupa. */
function Diagnostica(p: P) {
  return (
    <Svg {...p}>
      <Folha x={5} y={3} w={24} h={33} />
      <Lin x={9.5} y={8.5} w={9} cor={LARANJA} />
      <Lin x={9.5} y={14.5} w={15} /><Lin x={9.5} y={20} w={7} /><Lin x={9.5} y={25.5} w={5} />
      <path d="M31.2 30.2 36 35" stroke={ROXO} strokeWidth={4} strokeLinecap="round" />
      <circle cx={26} cy={25} r={7} fill={BRANCO} stroke={ROXO} strokeWidth={3} />
      <Lin x={22.5} y={23.75} w={7} cor={CLARO} />
    </Svg>
  )
}

/** Simulado ENEM: o cartão-resposta de bolinhas e o cronômetro. */
function Simulado(p: P) {
  const marcadas = [1, 0, 2, 1]
  return (
    <Svg {...p}>
      <rect x={4} y={4} width={23} height={32} rx={4} fill={PAPEL} />
      {[10.5, 17, 23.5, 30].map((cy, l) => [9.5, 15.5, 21.5].map((cx, c) => (
        <circle key={`${l}-${c}`} cx={cx} cy={cy} r={2.2} fill={marcadas[l] === c ? LARANJA : BRANCO} />
      )))}
      <circle cx={28.5} cy={27} r={10} fill={BRANCO} />
      <rect x={26.6} y={16.6} width={3.8} height={4} rx={1.2} fill={GRAFITE} />
      <circle cx={28.5} cy={27.5} r={8} fill={AMARELO} />
      <circle cx={28.5} cy={27.5} r={5.2} fill={BRANCO} />
      <path d="M28.5 24.2v3.3l2.3 1.5" stroke={GRAFITE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

/** Proposta de redação: a folha que abre com as aspas e o tema passado a marca-texto. */
function Proposta(p: P) {
  const aspa = 'M0 6.2C0 2.9 1.6.9 4.6 0l.9 1.9C4 2.5 3.3 3.3 3.1 4.4h2.6v4.4H0Z'
  return (
    <Svg {...p}>
      <Folha dobra={7} />
      <g fill={LARANJA} transform="translate(11.5 8) scale(1.12)"><path d={aspa} /><path d={aspa} transform="translate(7.4 0)" /></g>
      <rect x={11.5} y={21} width={17} height={4.6} rx={2.3} fill={AMARELO} />
      <Lin x={11.5} y={28.4} w={17} /><Lin x={11.5} y={32.4} w={10} />
    </Svg>
  )
}

/** Importar prova: a folha que já existe caindo na bandeja. */
function Importar(p: P) {
  return (
    <Svg {...p}>
      <Folha x={10} y={2} w={20} h={27} dobra={6} />
      <rect x={18} y={6.5} width={4} height={8.5} rx={1} fill={AZUL} />
      <path d="M14.2 14h11.6L20 20.8Z" fill={AZUL} stroke={AZUL} strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M6 22h7l2.5 4.5h9L27 22h7a2 2 0 0 1 2 2v9a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-9a2 2 0 0 1 2-2Z" fill={LARANJA} />
    </Svg>
  )
}

/** Correção de objetiva: a pilha de provas e a de cima corrigida — dois vistos e um X. */
function Correcao(p: P) {
  return (
    <Svg {...p}>
      <rect x={12} y={3} width={23} height={30} rx={4} fill={CLARO} />
      <Folha x={5} y={7} w={24} h={30} />
      <Visto x={9} y={11} e={2.6} /><Lin x={19} y={12.4} w={6.5} />
      <Visto x={9} y={19.5} e={2.6} /><Lin x={19} y={20.9} w={5} />
      <path d="M9.6 28.2l5 5M14.6 28.2l-5 5" stroke={ROSA} strokeWidth={2.6} strokeLinecap="round" />
      <Lin x={19} y={29.4} w={6.5} />
    </Svg>
  )
}

/** Redação e discursiva: a folha pautada, com a margem, e a caneta de quem corrige. */
function Redacao(p: P) {
  return (
    <Svg {...p}>
      <Folha x={4} y={3} w={24} h={34} />
      <rect x={9} y={3} width={1.8} height={34} fill={ROSA} />
      <Lin x={13.5} y={8.5} w={11} /><Lin x={13.5} y={14} w={11} /><Lin x={13.5} y={19.5} w={11} /><Lin x={13.5} y={25} w={6} />
      <g transform="translate(20.5 33.5) rotate(40)">
        <path d="M-3.2-8h6.4L1-1.3a1.1 1.1 0 0 1-2 0Z" fill={CLARO} />
        <path d="M-1.5-4h3L1-1.3a1.1 1.1 0 0 1-2 0Z" fill={GRAFITE} />
        <rect x={-3.2} y={-21} width={6.4} height={13} fill={LARANJA} />
        <path d="M-3.2-21v-1.3A2.7 2.7 0 0 1-.5-25h1a2.7 2.7 0 0 1 2.7 2.7V-21Z" fill={GRAFITE} />
      </g>
    </Svg>
  )
}

/** Plano de aula: a pasta com as folhas e o brilho. */
function Plano(p: P) {
  return (
    <Svg {...p}>
      <path d="M3 12a3 3 0 0 1 3-3h8a3 3 0 0 1 2.3 1.1l1.9 2.2H31a3 3 0 0 1 3 3V33a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Z" fill={CLARO} />
      <rect x={8} y={11} width={21} height={12} rx={2} fill={PAPEL} />
      <rect x={6} y={15} width={25} height={12} rx={2} fill={BRANCO} />
      <path d="M3 24a3 3 0 0 1 3-3h25a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Z" fill={LARANJA} />
      <rect x={7.5} y={27} width={9} height={3} rx={1.5} fill={CLARO} />
      <g stroke={BRANCO} strokeWidth={2.4} strokeLinejoin="round" style={{ paintOrder: 'stroke' }}>
        <Brilho cx={31} cy={10} r={7} />
      </g>
      <Brilho cx={21.5} cy={4.5} r={2.8} />
    </Svg>
  )
}

/** Planejamento do período: o calendário de espiral com o trecho planejado. */
function Periodo(p: P) {
  return (
    <Svg {...p}>
      <rect x={4} y={7} width={32} height={30} rx={5} fill={PAPEL} />
      <path d="M4 12a5 5 0 0 1 5-5h22a5 5 0 0 1 5 5v4.5H4Z" fill={LARANJA} />
      {[10, 16.2, 22.4, 28.6].map((x) => <rect key={x} x={x - 1.4} y={3} width={2.8} height={8} rx={1.4} fill={GRAFITE} />)}
      {Array.from({ length: 12 }, (_, i) => <rect key={i} x={8 + (i % 4) * 6.5} y={20 + Math.floor(i / 4) * 5.2} width={4.5} height={3.4} rx={1.2} fill={LINHA} />)}
      <rect x={14.5} y={25.2} width={17.5} height={3.4} rx={1.7} fill={VERDE} />
    </Svg>
  )
}

/** Projeto: o caminho com os marcos e a bandeira da entrega. */
function Projeto(p: P) {
  return (
    <Svg {...p}>
      <rect x={3} y={11} width={34} height={26} rx={5} fill={PAPEL} />
      <path d="M9.5 31C16.5 31 13.5 23 19.5 23S22 16.5 28.5 16.5" stroke={CLARO} strokeWidth={3.6} strokeLinecap="round" />
      <circle cx={9.5} cy={31} r={3.4} fill={ROXO} /><circle cx={19.5} cy={23} r={3.4} fill={ROXO} />
      <path d="M28.5 16.5V3.5" stroke={GRAFITE} strokeWidth={2.6} strokeLinecap="round" />
      <path d="M30.1 3.4 37.6 6.9 30.1 10.4Z" fill={LARANJA} stroke={LARANJA} strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx={28.5} cy={16.5} r={3.4} fill={LARANJA} />
    </Svg>
  )
}

/** Plano de recuperação: as barras que caem e voltam a subir, e a seta da retomada. */
function Recuperacao(p: P) {
  return (
    <Svg {...p}>
      {[[4, 12, LINHA], [12.5, 7, PAPEL], [21, 14, CLARO], [29.5, 21, LARANJA]].map(([x, h, cor]) => (
        <rect key={x as number} x={x as number} y={37 - (h as number)} width={6.5} height={h as number} rx={2} fill={cor as string} />
      ))}
      <path d="M5 16.5 14 23 32.5 5.5M25 4.5h8.5V13" stroke={VERDE} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

/** Apresentação: a tela de projeção no tripé, com o gráfico do slide. */
function Apresentacao(p: P) {
  return (
    <Svg {...p}>
      <path d="M20 27v6M20 32.5 13.5 37M20 32.5 26.5 37" stroke={LINHA} strokeWidth={2.6} strokeLinecap="round" />
      <path d="M5 7h30v18a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3Z" fill={PAPEL} />
      <rect x={3} y={3.5} width={34} height={5} rx={2.5} fill={LARANJA} />
      <circle cx={13.5} cy={18} r={5} fill={CLARO} />
      <path d="M13.5 18V13a5 5 0 0 1 5 5Z" fill={LARANJA} />
      {[[21.5, 5], [26, 8.5], [30.5, 12]].map(([x, h]) => <rect key={x} x={x - 1.6} y={24 - h} width={3.2} height={h} rx={1.2} fill={AZUL} />)}
    </Svg>
  )
}

/** Material didático: o livro aberto com o marcador. */
function Material(p: P) {
  return (
    <Svg {...p}>
      <rect x={3} y={8} width={34} height={27} rx={4} fill={LARANJA} />
      <path d="M6.5 12c4-1.8 9.5-1.6 13.5 1v18.8c-4-2.5-9.5-2.7-13.5-.9Z" fill={BRANCO} />
      <path d="M33.5 12c-4-1.8-9.5-1.6-13.5 1v18.8c4-2.5 9.5-2.7 13.5-.9Z" fill={BRANCO} />
      <rect x={19.2} y={12.5} width={1.6} height={19} fill={PAPEL} />
      <Lin x={9} y={15.5} w={8} /><Lin x={9} y={20} w={8} /><Lin x={9} y={24.5} w={5} />
      <Lin x={23} y={22.5} w={8} /><Lin x={23} y={26.5} w={5} />
      <path d="M25.5 4h6v15l-3-2.8-3 2.8Z" fill={AZUL} />
    </Svg>
  )
}

/** Mapa mental: o conceito no centro e os ramos, um de cada cor. */
function Mapa(p: P) {
  return (
    <Svg {...p}>
      <path d="M20 20 8 8.5M20 20 32.5 9.5M20 20 7.5 31M20 20 32 32" stroke={LINHA} strokeWidth={2.6} strokeLinecap="round" />
      <circle cx={8} cy={8.5} r={4.5} fill={VERDE} />
      <circle cx={32.5} cy={9.5} r={4} fill={ROSA} />
      <circle cx={7.5} cy={31} r={4} fill={AMARELO} />
      <circle cx={32} cy={32} r={4.5} fill={ROXO} />
      <circle cx={20} cy={20} r={7} fill={LARANJA} />
    </Svg>
  )
}

/** Roteiro de experimento: o erlenmeyer com o líquido e as bolhas. */
function Experimento(p: P) {
  return (
    <Svg {...p}>
      <path d="M16 5h8v9.5l9.3 15.8A3.8 3.8 0 0 1 30 36H10a3.8 3.8 0 0 1-3.3-5.7L16 14.5Z" fill={PAPEL} />
      <path d="M11 23h18l4.3 7.3A3.8 3.8 0 0 1 30 36H10a3.8 3.8 0 0 1-3.3-5.7Z" fill={VERDE} />
      <rect x={13.5} y={3} width={13} height={4} rx={2} fill={LARANJA} />
      <circle cx={16} cy={30} r={1.8} fill={BRANCO} /><circle cx={23.5} cy={28.5} r={2.3} fill={BRANCO} />
      <circle cx={20.5} cy={18} r={2} fill={AMARELO} /><circle cx={18.5} cy={11.5} r={1.5} fill={AMARELO} />
    </Svg>
  )
}

/** Adaptação: a mesma letra, pequena e grande — o conteúdo é o mesmo, a forma muda. */
function Adaptacao(p: P) {
  return (
    <Svg {...p}>
      <path d="M4.5 35 9 23.5 13.5 35M6.2 31h5.6" stroke={CLARO} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 35 26.5 10 36 35M20.3 27h12.4" stroke={LARANJA} strokeWidth={4.4} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 17.5C6 11 10 7.5 16 7.5M12.5 3.8 16.5 7.5l-4 3.7" stroke={ROXO} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

const ICONES: Record<string, (p: P) => ReactNode> = {
  prova: Prova, atividade: Atividade, diagnostica: Diagnostica, simulado: Simulado, proposta: Proposta, importar: Importar,
  correcao: Correcao, redacao: Redacao, plano: Plano, periodo: Periodo, projeto: Projeto, recuperacao: Recuperacao,
  apresentacao: Apresentacao, material: Material, mapa: Mapa, experimento: Experimento, adaptacao: Adaptacao,
}

/** O desenho solto sobre o branco. `acento` é do contrato antigo e não muda nada.
    O movimento mora aqui (e não na caixa) porque o cartão do catálogo usa o ícone direto: dentro de um `group`,
    sobe 2 px em 200 ms. Fora de um `group`, não acontece nada. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function IconeFerramenta({ id, className = 'size-10', acento: _acento }: { id: string; className?: string; acento?: 'laranja' | 'preto' }) {
  const Icone = ICONES[id] ?? Prova
  return <Icone className={cn('transition-transform duration-200 ease-estado group-hover:-translate-y-0.5 motion-reduce:transform-none', className)} />
}

/* A caixa que sobrou do ladrilho: transparente, do tamanho antigo (56 · 76 · 132 · faixa de 148), com o ícone
   centralizado a uns 72%. Sem fundo, sem fio, sem brilho. */
const TAMANHO = {
  sm: ['size-14', 'size-10'],
  md: ['size-[76px]', 'size-[55px]'],
  lg: ['size-[132px]', 'size-[95px]'],
  faixa: ['h-[148px] w-full', 'size-[106px]'],
}

export function LadrilhoFerramenta({ id, tamanho = 'md', className }: { id: string; tamanho?: keyof typeof TAMANHO; className?: string }) {
  return (
    <span className={cn('grid shrink-0 place-items-center', TAMANHO[tamanho][0], className)}>
      <IconeFerramenta id={id} className={TAMANHO[tamanho][1]} />
    </span>
  )
}
