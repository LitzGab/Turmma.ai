import type { Etapa } from '../estrutura/serie.js'
import type { Habilidade } from './conteudo.js'

/**
 * O catálogo curto de habilidades por disciplina, em código (`docs/mvp-rapido.md`, seção 2): é contra ele que a questão
 * gerada é classificada, e é por ele que o diagnóstico soma os acertos (D46).
 *
 * **Não é a BNCC.** Os códigos são nossos (`QUI.EM.05`), curtos e estáveis, e nenhum afirma correspondência com um
 * código oficial: o catálogo da BNCC, com a tabela pública e o rastreio da D6, entra na fase própria. Trocar um código
 * daqui muda o diagnóstico já gravado, então código não se reaproveita: habilidade que sai fica, e a nova ganha número novo.
 */
export interface HabilidadeDoCatalogo extends Habilidade {
  /** O assunto, para agrupar na tela ("Estequiometria"). */
  readonly tema: string
}

export interface DisciplinaDoCatalogo {
  /** O nome como a escola costuma cadastrar a disciplina; a comparação ignora acento e maiúscula. */
  readonly nomes: readonly string[]
  readonly etapa: Etapa
  readonly habilidades: readonly HabilidadeDoCatalogo[]
}

export const CATALOGO_DE_HABILIDADES = {
  quimica_em: {
    nomes: ['Química'],
    etapa: 'em',
    habilidades: [
      { codigo: 'QUI.EM.01', tema: 'Transformações químicas', descricao: 'Representar uma transformação química por equação e balanceá-la.' },
      { codigo: 'QUI.EM.02', tema: 'Estequiometria', descricao: 'Aplicar a conservação da massa e as proporções fixas entre reagentes e produtos.' },
      { codigo: 'QUI.EM.03', tema: 'Estequiometria', descricao: 'Calcular quantidade de matéria, massa molar e número de partículas.' },
      { codigo: 'QUI.EM.04', tema: 'Estequiometria', descricao: 'Usar a proporção da equação balanceada para calcular massa, volume ou quantidade de matéria.' },
      { codigo: 'QUI.EM.05', tema: 'Estequiometria', descricao: 'Identificar o reagente limitante e o reagente em excesso.' },
      { codigo: 'QUI.EM.06', tema: 'Estequiometria', descricao: 'Calcular o rendimento de uma reação e considerar a pureza dos reagentes.' },
      { codigo: 'QUI.EM.07', tema: 'Soluções', descricao: 'Calcular e interpretar a concentração de uma solução.' },
      { codigo: 'QUI.EM.08', tema: 'Transformações químicas', descricao: 'Interpretar uma situação do cotidiano ou da indústria a partir das quantidades envolvidas na reação.' },
    ],
  },
  ciencias_ef: {
    nomes: ['Ciências'],
    etapa: 'ef_anos_finais',
    habilidades: [
      { codigo: 'CIE.EF.01', tema: 'Matéria', descricao: 'Diferenciar substância e mistura e reconhecer métodos de separação.' },
      { codigo: 'CIE.EF.02', tema: 'Transformações químicas', descricao: 'Reconhecer que houve transformação química pelas evidências observadas.' },
      { codigo: 'CIE.EF.03', tema: 'Transformações químicas', descricao: 'Comparar a quantidade de reagentes e de produtos e relacioná-la à conservação da massa.' },
      { codigo: 'CIE.EF.04', tema: 'Matéria', descricao: 'Explicar os estados físicos e as mudanças de estado pelo modelo de partículas.' },
    ],
  },
  matematica_ef: {
    nomes: ['Matemática'],
    etapa: 'ef_anos_finais',
    habilidades: [
      { codigo: 'MAT.EF.01', tema: 'Proporcionalidade', descricao: 'Resolver problemas com grandezas direta e inversamente proporcionais.' },
      { codigo: 'MAT.EF.02', tema: 'Proporcionalidade', descricao: 'Calcular porcentagem, acréscimo e desconto.' },
      { codigo: 'MAT.EF.03', tema: 'Álgebra', descricao: 'Resolver equação do primeiro grau e interpretar o resultado no problema.' },
      { codigo: 'MAT.EF.04', tema: 'Grandezas e medidas', descricao: 'Converter unidades de medida e usar notação científica.' },
    ],
  },
} as const satisfies Record<string, DisciplinaDoCatalogo>

/**
 * A habilidade de quem não tem catálogo: a disciplina que a escola cadastrou com outro nome, ou de etapa que o catálogo
 * curto não cobre. A geração nunca fica sem habilidade, e o diagnóstico soma tudo nela.
 */
export const HABILIDADE_GERAL: HabilidadeDoCatalogo = { codigo: 'GERAL.01', tema: 'Conteúdo do material', descricao: 'Compreender e aplicar o conteúdo estudado no material da turma.' }

/** "Química", "QUIMICA" e " química " são a mesma disciplina para o catálogo. */
function semAcentoNemCaixa(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()
}

/**
 * As habilidades do catálogo para uma disciplina da escola, pelo nome e pela etapa da série. Sem catálogo para o par,
 * devolve só a `HABILIDADE_GERAL`: nunca uma lista vazia.
 */
export function habilidadesDaDisciplina(nomeDaDisciplina: string, etapa: Etapa): readonly HabilidadeDoCatalogo[] {
  const nome = semAcentoNemCaixa(nomeDaDisciplina)
  const achada = (Object.values(CATALOGO_DE_HABILIDADES) as readonly DisciplinaDoCatalogo[]).find(
    (disciplina) => disciplina.etapa === etapa && disciplina.nomes.some((candidato) => semAcentoNemCaixa(candidato) === nome),
  )
  return achada?.habilidades ?? [HABILIDADE_GERAL]
}

const TODAS_AS_HABILIDADES: ReadonlyMap<string, HabilidadeDoCatalogo> = new Map(
  [...(Object.values(CATALOGO_DE_HABILIDADES) as readonly DisciplinaDoCatalogo[]).flatMap((disciplina) => disciplina.habilidades), HABILIDADE_GERAL].map((habilidade) => [habilidade.codigo, habilidade]),
)

/** A habilidade pelo código, para dar nome ao diagnóstico, que só guarda o código. Código fora do catálogo dá `undefined`. */
export function habilidadeDoCatalogo(codigo: string): HabilidadeDoCatalogo | undefined {
  return TODAS_AS_HABILIDADES.get(codigo)
}
