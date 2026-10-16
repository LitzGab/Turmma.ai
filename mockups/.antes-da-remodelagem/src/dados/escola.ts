/* Escola 100% sintética (D71, regra 20 item 17). Nenhum nome aqui é de gente de verdade.
   Aluno não tem e-mail, foto nem data de nascimento — nem no mockup. */

export const ESCOLAS = [
  { id: 'aurora', nome: 'Colégio Aurora', curto: 'Aurora', sigla: 'A', cidade: 'Joinville · SC', rede: 'Particular', turno: 'Manhã' },
  { id: 'cachoeira', nome: 'E. M. Rio Cachoeira', curto: 'Rio Cachoeira', sigla: 'RC', cidade: 'Joinville · SC', rede: 'Municipal', turno: 'Tarde' },
]
export const escolaDe = (id: string) => ESCOLAS.find((e) => e.id === id) ?? ESCOLAS[0]

export const PROFESSORA = { nome: 'Camila Souza', primeiro: 'Camila', iniciais: 'CS', papel: 'Professora · Química' }
export const COORDENADORA = { nome: 'Helena Martins', primeiro: 'Helena', iniciais: 'HM', papel: 'Coordenação pedagógica' }
export const ALUNO = { nome: 'Lucas Pereira', primeiro: 'Lucas', iniciais: 'LP', papel: 'Aluno · 2ºB', turma: '2ºB' }

export const TURMAS = [
  { id: '2b', nome: '2ºB', serie: '2º ano EM', disciplina: 'Química', alunos: 32, turno: 'Manhã', escolaId: 'aurora' },
  { id: '2a', nome: '2ºA', serie: '2º ano EM', disciplina: 'Química', alunos: 30, turno: 'Manhã', escolaId: 'aurora' },
  { id: '1c', nome: '1ºC', serie: '1º ano EM', disciplina: 'Química', alunos: 34, turno: 'Manhã', escolaId: 'aurora' },
  { id: '9a', nome: '9ºA', serie: '9º ano EF', disciplina: 'Ciências', alunos: 28, turno: 'Tarde', escolaId: 'cachoeira' },
]
export const turmaDe = (id: string) => TURMAS.find((t) => t.id === id) ?? TURMAS[0]

export const MATERIAIS = [
  { id: 'q2', titulo: 'Química 2 — Material próprio do Colégio Aurora', capitulo: 'cap. 7 · Estequiometria', paginas: 212,
    titular: 'Colégio Aurora', licenca: 'Material próprio da escola', estado: 'pronto' as const, trechos: 1840 },
  { id: 'c9', titulo: 'Ciências 9 — Caderno de atividades', capitulo: 'cap. 3 · Reações químicas', paginas: 148,
    titular: 'Colégio Aurora', licenca: 'Material próprio da escola', estado: 'pronto' as const, trechos: 1212 },
  { id: 'rea', titulo: 'Química Geral — Recurso educacional aberto', capitulo: 'unid. 4 · Mol e massa molar', paginas: 96,
    titular: 'Domínio aberto', licenca: 'CC BY 4.0', estado: 'processando' as const, trechos: 0 },
  { id: 'ap', titulo: 'Apostila Sistema X — 2º ano', capitulo: '—', paginas: 0,
    titular: 'Terceiro', licenca: 'Sem licença declarada', estado: 'recusado' as const, trechos: 0 },
]

/* Habilidades da BNCC usadas nos painéis (códigos reais da BNCC do Ensino Médio, texto resumido). */
export const HABILIDADES = [
  { codigo: 'EM13CNT101', nome: 'Conservação da massa e proporções', acerto: 78 },
  { codigo: 'EM13CNT104', nome: 'Cálculo com mol e massa molar', acerto: 46 },
  { codigo: 'EM13CNT205', nome: 'Interpretar equação balanceada', acerto: 64 },
  { codigo: 'EM13CNT301', nome: 'Reagente limitante e excesso', acerto: 39 },
  { codigo: 'EM13CNT302', nome: 'Rendimento de reação', acerto: 57 },
]

/* Alunos sintéticos do 2ºB — o professor da turma vê nomeado (D34); a coordenação, só agregado. */
export const ALUNOS_2B = [
  'Ana Beatriz', 'Bruno Tavares', 'Caio Mendes', 'Daniela Rocha', 'Eduarda Lima', 'Felipe Nunes',
  'Gabriela Reis', 'Heitor Alves', 'Isabela Pinto', 'João Vitor', 'Larissa Melo', 'Lucas Pereira',
  'Marina Costa', 'Nicolas Dias', 'Olívia Ramos', 'Pedro Henrique',
]

export const hoje = { longa: 'segunda-feira, 21 de setembro', curta: '21/09', hora: '10h42' }
