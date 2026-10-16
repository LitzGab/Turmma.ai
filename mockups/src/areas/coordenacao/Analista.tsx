import { NOMES_1C, QUIMICA_2_ABAIXO, QUIMICA_2_TOTAL } from '@/dados/numeros-escola'
import { TITULO_NOMES_1C } from '@/dados/analista-escola'

/* O ANALISTA (décima rodada, 04/10/2026; blueprint 5.1). 14ª rodada: voltou a ser lugar, em tela inteira
   (/coordenacao/analista, AnalistaTela.tsx); este arquivo guarda só os alertas e o MES. Daqui saem os alertas, que entram na fila "Esperando você" como hipótese com contexto, nunca veredito
   (D32, D45). Sempre em agregado: um recorte com um professor só é o dado dele, aparece fechado e só abre por "Ver
   dados com nome", com a finalidade registrada. Ele só avisa: nunca contata professor nem família.
   13ª rodada (plano de painéis e introdução, 1.2 e 1.5): o Resumo da semana saiu do Início. O resumo de segunda e
   "o que mudou" viraram respostas do Analista em conversa (dados/analista-escola.ts), em cor neutra. Os números do
   mês e os dados "só com motivo" vêm da fonte única, dados/numeros-escola.ts. */

/** Os números do mês (a casa deles é IA). Reexportados da fonte única. */
export { MES } from '@/dados/numeros-escola'

export type AlertaAnalista = {
  /** o id do item na fila (dados/fila.ts) */
  id: 'alerta-a1' | 'alerta-a2'
  /** o título do painel, de 2 a 4 palavras */
  curto: string
  quando: string
  titulo: string
  /** uma frase: hipótese, nunca veredito */
  texto: string
  /** hipótese (interpretação do Analista) ou contagem (fato registrado pelos professores) */
  natureza: 'hipotese' | 'contagem'
  /** o recorte em agregado, em selos */
  recorte: string[]
  /** o recorte mais fino, que teria um professor só: fica fechado */
  fechado: string
  /** o que "Ver dados com nome" mostra, depois da finalidade */
  comNome: { titulo: string; linhas: { nome: string; valor: string }[] }
}

export const ALERTAS: AlertaAnalista[] = [
  { id: 'alerta-a1', curto: 'Química · 2º ano', quando: 'hoje, 9h20',
    titulo: `Química do 2º ano: ${QUIMICA_2_TOTAL.entraram} alunos entraram abaixo de 6,0 no trimestre`,
    texto: `Eram ${QUIMICA_2_TOTAL.antes} no trimestre anterior; agora são ${QUIMICA_2_TOTAL.agora} de ${QUIMICA_2_ABAIXO.alunos}. Pode ser a troca de capítulo; vale olhar com os professores da série.`,
    natureza: 'hipotese',
    recorte: ['2º ano EM', 'Química', '4 turmas', 'abaixo de 6,0'],
    fechado: 'Por turma, cada recorte tem um professor só.',
    comNome: { titulo: QUIMICA_2_ABAIXO.titulo, linhas: QUIMICA_2_ABAIXO.linhas.map((l) => (
      { nome: `${l.turma} · ${l.alunos} alunos`, valor: `${l.antes} → ${l.agora} abaixo de 6,0` })) } },
  { id: 'alerta-a2', curto: 'Entregas faltando · 1ºC', quando: 'hoje, 8h05', titulo: '1ºC: 5 alunos com três ou mais entregas faltando',
    texto: 'É sinal para um adulto olhar, não decisão sobre nenhum deles.', natureza: 'contagem',
    recorte: ['1ºC', '34 alunos', 'só a contagem'],
    fechado: 'Os nomes ficam com os professores da turma.',
    comNome: { titulo: TITULO_NOMES_1C, linhas: NOMES_1C.linhas.map((l) => ({ nome: l.nome, valor: `${l.faltam} faltando` })) } },
]

export const alertaDe = (id: string | null) => ALERTAS.find((a) => a.id === id)
