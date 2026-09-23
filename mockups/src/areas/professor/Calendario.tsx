import { EventManager, type Evento } from '@/components/ui/event-manager'
import { NotaMockup, TelaCheia } from '@/components/turmma/tela'
import { TURMAS } from '@/dados/escola'

/* Calendário do professor (F8), montado sobre o template vaib215/event-manager do 21st.dev (escolha do Gabriel,
   19/09/2026) e redesenhado em 20/09/2026 sobre o calendário da Teachy: mês (uma linha por evento), semana (uma coluna
   por dia, com as aulas como cartões empilhados) e dia (os mesmos cartões e o painel "Falta preencher"), com busca e
   filtros por turma e por tipo.
   Deriva da estrutura da escola: a coordenação importa grade e calendário, e o professor só preenche O QUE VAI DAR
   em cada aula — ele não monta a grade (regra 60, item 8). Por isso aqui não se cria nem se arrasta evento. */

/** O "agora" do mockup: segunda-feira, 21 de setembro de 2026, 10h42 (o mesmo de dados/escola). */
const HOJE = new Date(2026, 8, 21, 10, 42)

type Aula = [hora: string, turma: string, escola?: string]

/* A grade da semana, como a coordenação importou. Índice 0 = segunda. */
const GRADE: Aula[][] = [
  [['7:30', '1ºC'], ['8:20', '2ºA'], ['10:30', '2ºB'], ['14:10', '9ºA', 'Rio Cachoeira']],
  [['7:30', '2ºB'], ['9:10', '1ºC'], ['10:30', '2ºA']],
  [['8:20', '2ºA'], ['14:10', '9ºA', 'Rio Cachoeira'], ['15:00', '9ºA', 'Rio Cachoeira']],
  [['7:30', '1ºC'], ['10:30', '2ºB']],
  [['7:30', '2ºA'], ['9:10', '2ºB'], ['10:30', '1ºC']],
]

/* O que a professora já preencheu: "AAAA-M-D hora turma" → conteúdo. O que não está aqui ainda está em branco. */
const CONTEUDO: Record<string, string> = {
  '14 7:30 1ºC': 'Evolução dos modelos atômicos', '14 8:20 2ºA': 'Mol e massa molar: exercícios', '14 10:30 2ºB': 'Proporção em massa',
  '15 7:30 2ºB': 'Cálculos com massa molar', '15 9:10 1ºC': 'Número atômico e de massa', '15 10:30 2ºA': 'Lista de mol em sala',
  '16 8:20 2ºA': 'Revisão de mol', '16 14:10 9ºA': 'Transformações químicas', '17 7:30 1ºC': 'Isótopos', '17 10:30 2ºB': 'Revisão para a prova',
  '18 7:30 2ºA': 'Entrega da lista de mol', '18 10:30 1ºC': 'Exercícios de distribuição',
  '21 7:30 1ºC': 'Modelos atômicos: de Dalton a Bohr', '21 8:20 2ºA': 'Correção da lista de mol', '21 10:30 2ºB': 'Revisão de estequiometria',
  '22 7:30 2ºB': 'Reagente limitante · aula 1 do plano', '22 9:10 1ºC': 'Distribuição eletrônica',
  '23 8:20 2ºA': 'Reagente limitante', '23 14:10 9ºA': 'Reações químicas do dia a dia',
  '24 10:30 2ºB': 'Reagente limitante · aula 2 do plano', '25 7:30 2ºA': 'Rendimento de reação', '25 10:30 1ºC': 'Tabela periódica: famílias',
}

/* O que já foi dado antes de 14/09 (agosto e começo de setembro), turma por turma, na ordem em que as aulas aconteceram. */
const SEGUNDO_ANO = ['Equações químicas', 'Balanceamento por tentativa', 'Exercícios de balanceamento', 'Massa atômica', 'Massa molecular', 'Conceito de mol',
  'Constante de Avogadro', 'Massa molar', 'Exercícios de mol', 'Volume molar', 'Fórmula percentual', 'Fórmula mínima e molecular']
const JA_DADO: Record<string, string[]> = {
  '1ºC': ['Matéria, corpo e objeto', 'Estados físicos da matéria', 'Mudanças de estado', 'Curvas de aquecimento', 'Substâncias puras e misturas', 'Misturas homogêneas e heterogêneas',
    'Separação de misturas: filtração', 'Separação de misturas: destilação', 'Fenômenos físicos e químicos', 'Lei de Lavoisier', 'Lei de Proust', 'Exercícios de leis ponderais'],
  '2ºA': SEGUNDO_ANO, '2ºB': SEGUNDO_ANO,
  '9ºA': ['Propriedades da matéria', 'Densidade: prática', 'Estados físicos e partículas', 'Mudanças de estado', 'Misturas do dia a dia', 'Separação de misturas',
    'Átomos e elementos', 'Tabela periódica: primeiro contato', 'Substâncias simples e compostas', 'Evidências de transformação', 'Exercícios de revisão', 'Correção dos exercícios'],
}

/* Feriados do semestre ("mês-dia", mês a partir de 0): sem aula nas duas escolas. */
const FERIADOS: Record<string, string> = { '8-7': 'Independência', '9-12': 'Nossa Senhora Aparecida', '10-2': 'Finados', '10-20': 'Consciência Negra' }

const em = (dia: number, hm = '0:00', mes = 8) => { const [h, m] = hm.split(':').map(Number); return new Date(2026, mes, dia, h, m) }
const mais = (d: Date, min: number) => new Date(d.getTime() + min * 60000)

function montar(): Evento[] {
  const lista: Evento[] = []
  // A grade é semanal e vale o semestre inteiro: de 03/08 (volta do recesso) a 11/12, menos os feriados.
  // Antes de 14/09 a professora já registrou o que deu; de 14/09 em diante vale o CONTEUDO; o resto está em branco.
  const dadas: Record<string, number> = { '2ºB': 1 } // o 2ºB anda duas aulas à frente do 2ºA
  const registro = new Date(2026, 8, 14)
  for (let s = 0; s < 19; s++) for (let d = 0; d < 5; d++) {
    const dia = new Date(2026, 7, 3 + s * 7 + d)
    const setembro = dia.getMonth() === 8
    if (FERIADOS[`${dia.getMonth()}-${dia.getDate()}`]) continue
    for (const [hm, turma, escola] of GRADE[d]) {
      if (setembro && dia.getDate() === 18 && hm === '9:10') continue // nesse horário foi a prova
      const inicio = em(dia.getDate(), hm, dia.getMonth())
      const t = TURMAS.find((x) => x.nome === turma)!
      const antes = dia < registro ? JA_DADO[turma]?.[(dadas[turma] = (dadas[turma] ?? -1) + 1) % 12] : undefined
      lista.push({
        id: `aula-${dia.getMonth()}-${dia.getDate()}-${hm}`, tipo: 'aula', titulo: `${turma} · ${t.disciplina}`, turma, escola,
        inicio, fim: mais(inicio, 50), descricao: antes ?? (setembro ? CONTEUDO[`${dia.getDate()} ${hm} ${turma}`] : undefined),
        agora: setembro && dia.getDate() === 21 && hm === '10:30',
      })
    }
  }
  const dia = (id: string, d: number, e: Omit<Evento, 'id' | 'inicio' | 'fim' | 'diaInteiro'>, mes = 8): Evento => ({ id, inicio: em(d, '0:00', mes), fim: em(d, '23:59', mes), diaInteiro: true, ...e })
  for (const [quando, nome] of Object.entries(FERIADOS)) {
    const [m, d] = quando.split('-').map(Number)
    lista.push(dia(`feriado-${quando}`, d, { tipo: 'recado', titulo: `Feriado · ${nome}`, descricao: 'Sem aula nas duas escolas.' }, m))
  }
  lista.push(
    { id: 'prova-18', tipo: 'avaliacao', titulo: 'Prova de estequiometria', turma: '2ºB', inicio: em(18, '9:10'), fim: mais(em(18, '9:10'), 50), descricao: 'Aplicada. O Assistente corrigiu as 30 provas entregues e espera você abrir os 5 destaques.', para: '/professor/aprovar', acao: 'Revisar a correção' },
    dia('semana', 21, { tipo: 'time', titulo: 'Assistente abriu a semana', descricao: '14 aulas, 1 avaliação e 2 entregas. Sexta tem conselho de classe.', para: '/professor/time/assistente', acao: 'Abrir no Assistente' }),
    dia('atraso', 21, { tipo: 'entrega', atraso: true, turma: '2ºA', titulo: 'Lista de mol · 2ºA', descricao: '4 alunos não entregaram a lista de mol e massa molar.', para: '/professor/turmas/2a', acao: 'Ver quem falta' }),
    dia('corrigiu', 21, { tipo: 'time', titulo: 'Correção do 2ºB esperando você', descricao: '30 provas corrigidas. Abra os 5 destaques antes de aprovar.', para: '/professor/aprovar', acao: 'Revisar os destaques' }),
    dia('prazo', 23, { tipo: 'entrega', turma: '2ºB', titulo: 'Atividade de estequiometria · 2ºB', descricao: 'Prazo de entrega da atividade atribuída na semana passada.', para: '/professor/turmas/2b', acao: 'Ver na turma' }),
    { id: 'prova-24', tipo: 'avaliacao', titulo: 'Prova de estequiometria · 2ª chamada', turma: '2ºB', inicio: em(24, '8:20'), fim: mais(em(24, '8:20'), 50), descricao: 'Dez questões, com gabarito e a página de cada uma. A versão adaptada espera a sua aprovação.', para: '/professor/biblioteca/prova-estequiometria', acao: 'Abrir a prova' },
    dia('adaptada', 24, { tipo: 'time', titulo: 'Versão adaptada esperando você', descricao: 'Fonte ampliada e enunciado direto. Só chega aos alunos depois que você aprovar.', para: '/professor/time/assistente', acao: 'Ver e aprovar' }),
    { id: 'conselho', tipo: 'recado', titulo: 'Conselho de classe', inicio: em(25, '13:30'), fim: em(25, '16:00'), descricao: 'Sem aula à tarde no Colégio Aurora.' },
    dia('bimestre', 30, { tipo: 'recado', titulo: 'Fim do 3º bimestre', descricao: 'Último dia para fechar o diagnóstico do bimestre.' }),
  )
  return lista
}

const EVENTOS = montar()

export function Calendario() {
  return (
    <TelaCheia titulo="Calendário">
      <EventManager eventos={EVENTOS} hoje={HOJE} turmas={TURMAS.map((t) => t.nome)} />
      <NotaMockup>
        F8, fora do MVP de apresentação, com o lugar reservado na lateral. Montado sobre o template vaib215/event-manager (21st.dev), no desenho do calendário da Teachy: três visões (mês, semana, dia), busca e filtros.
        Regra 60, item 8: a grade deriva da estrutura importada pela coordenação, então saíram do template o "novo evento" e o arrastar; clicar numa aula abre só o campo "O que vou dar".
        As duas escolas da professora aparecem juntas, com a etiqueta na aula da outra escola. Feriado e conselho de classe entram como recado da escola.
      </NotaMockup>
    </TelaCheia>
  )
}
