import type { FuncaoId } from './agentes'

/* A CONVERSA DE CADA AGENTE DO TIME, como dado (20/09/2026). A tela (areas/professor/Time.tsx) só desenha: quem
   fala, a hora, o balão, o anexo embaixo do balão e as ações. Tudo em ordem de conversa — o mais antigo em cima,
   o de HOJE embaixo. O "hoje" do mockup é segunda, 21/09.

   · O que afeta aluno nasce PENDENTE (`pendente`): aparece na faixa "Esperando você" até a professora responder.
   · A resposta dela é mensagem dela, com a linha de registro (quem, quando). O que já foi aprovado ou rejeitado
     no histórico está escrito assim também, como troca de mensagens.
   · No texto, `**assim**` vira negrito. Sobre aluno só aparece trabalho: entrega, acerto, o que escreveu (D57, D66). */

export type TipoSinalMsg = 'travou' | 'pronta' | 'repetiu' | 'atencao'

/** A linha de registro embaixo da resposta da professora: "Aprovado por Camila Souza · 21/09, 10h58". */
/** `ok` (verde) é SÓ para aprovação; "visto", "aviso enviado" e "contestação registrada" são `neutro` (cinza). */
export type Registro = { verbo: string; tom: 'ok' | 'erro' | 'neutro'; quando?: string }

export type AnexoMsg =
  /** três números num contorno só */
  | { tipo: 'resumo'; itens: [valor: string, rotulo: string][] }
  /** lista de alunos em chips de nome */
  | { tipo: 'alunos'; nomes: string[] }
  /** alunos com "Abrir a conversa…", que passa pelo diálogo de auditoria */
  | { tipo: 'conversas'; nomes: string[] }
  /** um interruptor que continua funcionando dentro da conversa */
  | { tipo: 'chave'; titulo: string; ligada: string; desligada: string }

/** O que o agente responde depois que ela fala. */
export type Replica = { texto: string; acoes?: AcaoMsg[] }

/** O que entra na conversa quando ela clica numa ação: a mensagem dela, o registro e a réplica do agente. */
export type RespostaPronta = { texto: string; registro?: Registro; replica?: Replica }

export type AcaoMsg = {
  id: string
  rotulo: string
  variante: 'oficial' | 'secundario' | 'discreto' | 'perigo'
  icone?: 'seta' | 'calendario' | 'sala'
  /** leva a outra tela */
  para?: string
  /** responde na conversa e resolve a mensagem */
  responde?: RespostaPronta
  /** "Rejeitar…": pede o motivo na caixa de resposta antes de registrar */
  pedeMotivo?: boolean
}

export type MensagemTime = {
  id: string
  /** o separador de dia em que ela cai */
  dia: string
  hora: string
  de: 'agente' | 'professora'
  /** a função do Assistente que está falando (é o filtro da conversa) */
  funcao?: FuncaoId
  /** no Tutor, o sinal vem em selo junto da hora */
  sinal?: { tipo: TipoSinalMsg; detalhe?: string }
  texto: string
  /** página do material, em chip no fim do balão */
  fonte?: number
  /** texto pequeno embaixo do anexo: como cheguei a isto, o que não aparece aqui */
  nota?: string
  /** a nota termina com "Contestar este sinal" */
  contestavel?: boolean
  /** não pede nada: só avisa */
  soAviso?: boolean
  anexo?: AnexoMsg
  acoes?: AcaoMsg[]
  /** espera a professora: o texto é o atalho na faixa "Esperando você" */
  pendente?: string
  /** nas mensagens dela */
  registro?: Registro
  /** a mensagem que ela está respondendo, citada no alto do balão */
  cita?: string
}

const SALA_2B = '/professor/turmas/2b?aba=sala'

export const MENSAGENS_ASSISTENTE: MensagemTime[] = [
  { id: 'a-balanceamento', dia: '10 de setembro', hora: '11h20', de: 'agente', funcao: 'correcao',
    texto: 'Corrigi a atividade de balanceamento do 1ºC. O diagnóstico espera a sua aprovação.' },
  { id: 'p-balanceamento-rejeita', dia: '10 de setembro', hora: '11h32', de: 'professora', funcao: 'correcao',
    texto: 'Rejeitei: o gabarito da questão 3 estava trocado.', registro: { verbo: 'Rejeitado por', tom: 'erro', quando: '10/09, 11h32' } },
  { id: 'a-balanceamento-refeito', dia: '10 de setembro', hora: '11h41', de: 'agente', funcao: 'correcao',
    texto: 'Refiz com o gabarito corrigido. A correção nova espera a sua aprovação.' },
  { id: 'p-balanceamento-aprova', dia: '10 de setembro', hora: '11h50', de: 'professora', funcao: 'correcao',
    texto: 'Aprovei a correção.', registro: { verbo: 'Aprovado por', tom: 'ok', quando: '10/09, 11h50' } },

  { id: 'a-lista-adaptada', dia: '17 de setembro', hora: '14h10', de: 'agente', funcao: 'adaptacao',
    texto: 'Preparei a versão adaptada da lista de mol do 2ºB, com tempo adicional indicado no cabeçalho.' },
  { id: 'p-lista-adaptada', dia: '17 de setembro', hora: '14h32', de: 'professora', funcao: 'adaptacao',
    texto: 'Aprovei a versão adaptada.', registro: { verbo: 'Aprovado por', tom: 'ok', quando: '17/09, 14h32' } },
  { id: 'a-lista-2a', dia: '17 de setembro', hora: '15h40', de: 'agente', funcao: 'correcao',
    texto: 'Corrigi a lista de mol do 2ºA: 26 entregas de 30. O diagnóstico por habilidade está na sala do 2ºA.' },
  { id: 'p-lista-2a', dia: '17 de setembro', hora: '16h05', de: 'professora', funcao: 'correcao',
    texto: 'Aprovei a correção.', registro: { verbo: 'Aprovado por', tom: 'ok', quando: '17/09, 16h05' } },

  { id: 'a-semana', dia: 'Hoje', hora: '7h05', de: 'agente', funcao: 'dia', soAviso: true,
    texto: 'Abri a semana: 14 aulas, 1 avaliação e 2 entregas. Sexta tem conselho de classe às 13h30, sem aula à tarde.' },
  { id: 'a-semana-2b', dia: 'Hoje', hora: '7h06', de: 'agente', funcao: 'dia',
    texto: 'Preparei a semana do 2ºB, como toda segunda. Desligado, só gero plano quando você pede: não gero plano que ninguém pediu.',
    anexo: { tipo: 'chave', titulo: 'Preparar a semana do 2ºB toda segunda', ligada: 'Ligado · toda segunda, 7h', desligada: 'Desligado · só quando você pedir' } },
  { id: 'a-dia', dia: 'Hoje', hora: '7h10', de: 'agente', funcao: 'dia', soAviso: true,
    texto: 'Abri seu dia. Três aulas no Colégio Aurora (1ºC, 2ºA e 2ºB) e uma na Rio Cachoeira, à tarde. A lista de mol do 2ºA tem 4 entregas em atraso. A prova de estequiometria do 2ºB é quinta.',
    acoes: [{ id: 'calendario', rotulo: 'Ver no calendário', variante: 'secundario', icone: 'calendario', para: '/professor/calendario' }] },
  { id: 'correcao-2b', dia: 'Hoje', hora: '9h50', de: 'agente', funcao: 'correcao', pendente: 'Correção da prova · 2ºB',
    texto: 'Corrigi as provas de estequiometria do 2ºB e separei os casos fora da curva para você abrir antes de aprovar. O diagnóstico só chega aos alunos depois da sua aprovação.',
    anexo: { tipo: 'resumo', itens: [['30', 'provas corrigidas'], ['64%', 'de acerto médio'], ['5', 'destaques para abrir']] },
    acoes: [
      { id: 'revisar', rotulo: 'Revisar os destaques', variante: 'oficial', icone: 'seta', para: '/professor/aprovar' },
      { id: 'sala', rotulo: 'Ver na sala', variante: 'secundario', para: SALA_2B },
    ] },
  { id: 'adaptada-2b', dia: 'Hoje', hora: '10h44', de: 'agente', funcao: 'adaptacao', pendente: 'Versão adaptada · 2ºB',
    texto: 'Preparei a versão adaptada da Prova de estequiometria do 2ºB: fonte ampliada e enunciado direto. As mesmas dez questões; mudou a forma, não o que é cobrado. Só chega aos alunos com adaptação registrada depois que você aprovar.',
    acoes: [
      { id: 'aprovar', rotulo: 'Aprovar versão adaptada', variante: 'oficial',
        responde: { texto: 'Aprovei a versão adaptada.', registro: { verbo: 'Aprovado por', tom: 'ok' },
          replica: { texto: 'Feito. A versão adaptada vai na quinta para os alunos do 2ºB com adaptação registrada; os outros recebem a prova original.' } } },
      { id: 'ver', rotulo: 'Ver a prova', variante: 'secundario', para: '/professor/biblioteca/prova-estequiometria' },
      { id: 'rejeitar', rotulo: 'Rejeitar…', variante: 'perigo', pedeMotivo: true },
    ] },
]

export const MENSAGENS_TUTOR: MensagemTime[] = [
  { id: 'atencao', dia: 'Hoje · 2ºB', hora: '8h55', de: 'agente', sinal: { tipo: 'atencao' }, pendente: 'Atenção humana · 2ºB',
    texto: '**Olívia Ramos** escreveu sobre um assunto pessoal delicado. Não aconselhei: respondi com a mensagem combinada com a escola e indiquei procurar você ou a orientação educacional.',
    nota: 'O conteúdo não aparece aqui. O sinal vem do que foi escrito, nunca de inferência de humor.',
    acoes: [
      { id: 'visto', rotulo: 'Marcar como visto', variante: 'secundario',
        responde: { texto: 'Vi o sinal.', registro: { verbo: 'Visto por', tom: 'neutro' } } },
      { id: 'orientacao', rotulo: 'Avisar a orientação educacional', variante: 'discreto',
        responde: { texto: 'Avisei a orientação educacional.', registro: { verbo: 'Aviso enviado por', tom: 'neutro' },
          replica: { texto: 'A orientação educacional recebeu o sinal, sem o conteúdo da conversa.' } } },
    ] },
  { id: 'repetiu', dia: 'Hoje · 2ºB', hora: '9h20', de: 'agente', sinal: { tipo: 'repetiu', detalhe: '11 vezes' },
    texto: 'A dúvida que mais se repetiu: "por que eu divido pela massa molar?". Apareceu em 11 conversas, de 9 alunos.' },
  { id: 'pronta', dia: 'Hoje · 2ºB', hora: '9h40', de: 'agente', sinal: { tipo: 'pronta', detalhe: '2 alunos' },
    texto: 'Dois alunos pediram a resposta pronta mais de três vezes. Não entreguei: conduzi por perguntas e citei a página.',
    anexo: { tipo: 'conversas', nomes: ['Caio Mendes', 'Pedro Henrique'] } },
  { id: 'travou', dia: 'Hoje · 2ºB', hora: '10h15', de: 'agente', sinal: { tipo: 'travou', detalhe: '8 alunos' }, fonte: 145,
    texto: 'Oito alunos travaram no mesmo passo: converter massa em mol antes de usar a proporção da equação.',
    anexo: { tipo: 'alunos', nomes: ['Ana Beatriz', 'Bruno Tavares', 'Caio Mendes', 'Eduarda Lima', 'Heitor Alves', 'Larissa Melo', 'Nicolas Dias', 'Pedro Henrique'] },
    nota: 'Como cheguei a isto: errou o mesmo passo duas vezes ou mais na atividade de hoje. É um sinal para você olhar, não uma conclusão sobre o aluno.',
    contestavel: true,
    acoes: [
      { id: 'reforco', rotulo: 'Pedir uma atividade de reforço', variante: 'secundario', para: '/professor/ferramentas/atividade' },
      { id: 'modo-sala', rotulo: 'Abrir modo sala', variante: 'discreto', icone: 'sala', para: '/professor/sala' },
    ] },
]

/** A mensagem fixa do sistema, no alto do registro do Tutor. */
export const AVISO_TUTOR = 'Aqui chega **sinal, não conversa**. O sinal vem do que o aluno fez e escreveu na atividade. O Tutor não mede tempo parado, não lê humor e não acompanha a navegação.'

/** Respostas rápidas, em chip em cima da caixa de resposta. */
export type RespostaRapida = {
  id: string
  rotulo: string
  /** só aparece enquanto esta mensagem estiver esperando */
  enquanto?: string
  /** vale como clicar na ação da mensagem */
  aciona?: { msg: string; acao: string }
  /** ou manda este texto, e o agente responde */
  texto?: string
  replica?: Replica
  /** depois dela os chips somem: ela já disse que vê depois */
  encerra?: boolean
}

const DESTAQUES: Replica = {
  texto: 'São cinco provas fora da curva: duas com acerto abaixo de 30%, duas com a questão 7 em branco e uma com duas alternativas marcadas na mesma questão. Abra uma a uma antes de aprovar.',
  acoes: [{ id: 'revisar', rotulo: 'Revisar os destaques', variante: 'oficial', icone: 'seta', para: '/professor/aprovar' }],
}

export const RESPOSTAS_RAPIDAS: Record<'assistente' | 'tutor', RespostaRapida[]> = {
  assistente: [
    { id: 'aprovar', rotulo: 'Aprovar a versão adaptada', enquanto: 'adaptada-2b', aciona: { msg: 'adaptada-2b', acao: 'aprovar' } },
    { id: 'destaques', rotulo: 'Me mostra os 5 destaques', enquanto: 'correcao-2b', texto: 'Me mostra os 5 destaques.', replica: DESTAQUES },
    { id: 'depois', rotulo: 'Depois eu vejo', texto: 'Depois eu vejo.', encerra: true,
      replica: { texto: 'Combinado. Fica preso aqui em cima, em "Esperando você". Nada chega aos alunos antes da sua aprovação.' } },
  ],
  tutor: [
    { id: 'visto', rotulo: 'Vi o sinal de atenção humana', enquanto: 'atencao', aciona: { msg: 'atencao', acao: 'visto' } },
    { id: 'onde', rotulo: 'Onde o 2ºB mais travou?', texto: 'Onde o 2ºB mais travou?',
      replica: { texto: 'Hoje, em converter massa em mol antes de usar a proporção: 8 de 32 alunos erraram esse passo duas vezes ou mais. Na semana passada o passo mais errado foi balancear a equação.' } },
  ],
}

/** O que o agente responde quando ela escreve livre. Curto e plausível: é mockup. */
export function respostaLivre(id: 'assistente' | 'tutor', texto: string): Replica {
  if (id === 'assistente' && /destaque/i.test(texto)) return DESTAQUES
  return id === 'assistente'
    ? { texto: 'Anotado. Levo isso em conta na próxima entrega e aviso por aqui quando estiver pronto.' }
    : { texto: 'Sobre a turma eu respondo com o que os alunos fizeram e escreveram nas atividades. Hoje, no 2ºB, o passo que mais travou foi converter massa em mol, e a dúvida mais repetida foi por que dividir pela massa molar.' }
}

export const REPLICA_REJEICAO: Replica = { texto: 'Entendi. Refaço com isso e aviso aqui quando estiver pronto. Nada chega aos alunos até você aprovar.' }

export const REPLICA_CONTESTACAO: Record<'assistente' | 'tutor', Replica> = {
  assistente: { texto: 'Registrei a sua contestação. Revejo esta entrega com o que você escreveu e aviso aqui.' },
  tutor: { texto: 'Registrei a sua contestação. O sinal fica marcado como contestado e eu revejo o critério com o que você escreveu.' },
}
