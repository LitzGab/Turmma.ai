/**
 * O que nenhum agente faz: o nível 4 da autonomia (`docs/agentes.md`, "O que nenhum agente faz (nível 4)"; D55, D57,
 * D64, D66, D68, D69, D70; regra 70).
 *
 * **Não há fonte em código para esta lista**: o catálogo `FUNCOES`, de `@educa/shared`, declara o que cada função faz
 * sozinha e o que espera aprovação, e não o que é proibido a todas. As frases daqui são as de `docs/agentes.md`, sem a
 * referência à decisão, que a coordenação não precisa ler. Quando o catálogo ganhar o nível 4, esta lista sai daqui.
 */
export const O_QUE_A_IA_NUNCA_FAZ: readonly string[] = [
  'Decidir aprovação, reprovação ou encaminhamento de aluno, nem como sugestão aplicada sozinha.',
  'Corrigir, avaliar, dar nota ou conceito, pré-corrigir ou sugerir nota em redação e discursiva.',
  'Publicar nota ou falar com a família sem aprovação humana registrada.',
  'Inferir emoção, humor, atenção ou comportamento, ou ranquear alunos por isso.',
  'Medir tempo ocioso do aluno, ou acompanhar a navegação dele fora de uma avaliação.',
  'Guardar texto sobre o jeito, o humor ou o comportamento de um aluno: a memória é sobre o trabalho dele, não sobre ele.',
  'Criar perfil comportamental ou psicológico de aluno, ou pontuar pessoa por comportamento.',
  'Ranquear professores, medir adoção nominal por professor ou recomendar qualquer decisão sobre um professor.',
  'Buscar na web aberta para o aluno, ou fora das fontes aprovadas pela escola.',
  'Falar de assunto fora do conteúdo escolar da turma.',
  'Usar dado educacional para publicidade ou qualquer fim comercial.',
]
