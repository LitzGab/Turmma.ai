// A tabela de caminho para guardião (X7, RF15): `tasks/prd-harness/tabela-de-guardioes.md`, seção "O teste da tabela".
// Os literais estão escritos aqui, por extenso, e não lidos da constante: tabela que se confere contra si mesma não vê erro dela.
// A parte do RF16 (as pastas de processo, só em sessão de papel) é da 14.0. Os dois lados pela `decidirCommit` (recusado sem o
// guardião, aceito com ele) ficam em `revisoes.test.ts`.
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EXCECOES_DO_CODIGO, guardioesDoCaminho, type ConteudoDe, type Guardiao } from '../guardioes-por-caminho.ts'

const RAIZ = join(import.meta.dirname, '..', '..', '..')

const T: Guardiao = 'tenancy-guardian'
const P: Guardiao = 'privacy-guardian'
const C: Guardiao = 'conformidade-reviewer'
const I: Guardiao = 'infra-guardian'
const OS_QUATRO = [T, P, C, I]

/** O texto do arquivo no índice e no HEAD. Sem o segundo, o HEAD é igual ao índice; `null` é o arquivo que não existe naquele lado. */
const textos =
  (indice: string | null, head: string | null | undefined = indice): ConteudoDe =>
  (_arquivo, onde) =>
    onde === 'indice' ? indice : head
const SEM_TEXTO = textos('export const a = 1\n')
const pede = (arquivo: string, conteudoDe: ConteudoDe = SEM_TEXTO): Guardiao[] => guardioesDoCaminho([arquivo], conteudoDe)

const versionados = (...pastas: string[]): string[] =>
  execFileSync('git', ['ls-files', '-z', '--', ...pastas], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\0').filter(Boolean)

/** As exceções do código, com o conjunto exato que cada uma pede. O arquivo é um que existe no repositório. */
const EXCECOES: { prefixo: string; arquivo: string; guardioes: Guardiao[] }[] = [
  { prefixo: 'apps/web/src/componentes/ui/', arquivo: 'apps/web/src/componentes/ui/Abas.tsx', guardioes: [C, I] },
  { prefixo: 'apps/web/src/componentes/ui/ia/', arquivo: 'apps/web/src/componentes/ui/ia/AssinaturaIA.tsx', guardioes: [P, C, I] },
  { prefixo: 'apps/web/src/estilos.css', arquivo: 'apps/web/src/estilos.css', guardioes: [C] },
  { prefixo: 'apps/web/src/tema.ts', arquivo: 'apps/web/src/tema.ts', guardioes: [] },
  { prefixo: 'apps/web/src/estilos.test.ts', arquivo: 'apps/web/src/estilos.test.ts', guardioes: [] },
  { prefixo: 'apps/web/src/tema.test.ts', arquivo: 'apps/web/src/tema.test.ts', guardioes: [] },
  { prefixo: 'apps/web/src/contraste.test.ts', arquivo: 'apps/web/src/contraste.test.ts', guardioes: [] },
  { prefixo: 'apps/web/src/galeria/', arquivo: 'apps/web/src/galeria/Secao.tsx', guardioes: [P, C] },
  { prefixo: 'apps/web/vite.config.ts', arquivo: 'apps/web/vite.config.ts', guardioes: [I] },
  { prefixo: 'apps/web/nome-dos-chunks.ts', arquivo: 'apps/web/nome-dos-chunks.ts', guardioes: [I] },
  { prefixo: 'apps/web/nome-dos-chunks.test.ts', arquivo: 'apps/web/nome-dos-chunks.test.ts', guardioes: [I] },
  { prefixo: 'apps/web/rebaixar-cor.ts', arquivo: 'apps/web/rebaixar-cor.ts', guardioes: [I] },
  { prefixo: 'apps/web/rebaixar-cor.test.ts', arquivo: 'apps/web/rebaixar-cor.test.ts', guardioes: [I] },
  { prefixo: 'apps/despachante/', arquivo: 'apps/despachante/src/app.module.ts', guardioes: [T, P, I] },
  { prefixo: 'infra/', arquivo: 'infra/Caddyfile', guardioes: [P, I] },
]

describe('o padrão: os quatro guardiões', () => {
  it('todo arquivo versionado nas cinco pastas pede os quatro, salvo os que casam uma exceção', () => {
    const arquivos = versionados('apps', 'packages', 'e2e', 'tools/guardas', 'tools/testes')
    const deExcecao = (arquivo: string): boolean => EXCECOES.some((excecao) => arquivo.startsWith(excecao.prefixo))
    const comPadrao = arquivos.filter((arquivo) => !deExcecao(arquivo))
    // Pastas lidas vazias deixariam o teste verde sem olhar nada.
    expect(comPadrao.length).toBeGreaterThan(300)
    const fora = comPadrao.filter((arquivo) => pede(arquivo).join() !== OS_QUATRO.join())
    expect(fora).toEqual([])
  })

  it('as cinco pastas pedem os quatro, uma a uma, e o resto de tools/ e de docs/ não é código aqui', () => {
    for (const arquivo of ['apps/api/src/x.ts', 'packages/nucleo/src/x.ts', 'e2e/x.spec.ts', 'tools/guardas/x.mjs', 'tools/testes/x.ts']) {
      expect(pede(arquivo)).toEqual(OS_QUATRO)
    }
    // O RF16 (14.0) trata as pastas de processo; até lá elas e os documentos não pedem guardião, nem citando a regra.
    const cita = textos('regra 10 regra 20 regra 70 regra 80 LGPD')
    for (const arquivo of ['tools/processo/x.ts', 'tools/vitrine/x.ts', 'docs/lgpd.md', 'tasks/prd-x/1_task.md', '.claude/rules/10-multitenancy.md', 'package.json']) {
      expect(pede(arquivo, cita)).toEqual([])
    }
  })

  it('pasta inventada dentro de uma das cinco pede os quatro; os quatro nomes que a tabela cita também', () => {
    expect(pede('apps/api/src/pasta-nova-que-ninguem-previu/x.ts')).toEqual(OS_QUATRO)
    expect(pede('packages/nucleo/src/titular/leitura-do-titular.ts')).toEqual(OS_QUATRO)
    expect(pede('apps/api/test/estrutura-isolamento.int.test.ts')).toEqual(OS_QUATRO)
    expect(pede('e2e/aluno-tutor.spec.ts')).toEqual(OS_QUATRO)
  })

  it('o padrão não lê o conteúdo do arquivo: não há o que a citação acrescentar', () => {
    const lidos: string[] = []
    const espia: ConteudoDe = (arquivo) => (lidos.push(arquivo), null)
    expect(pede('apps/api/src/x.ts', espia)).toEqual(OS_QUATRO)
    expect(lidos).toEqual([])
    // A exceção lê, nos dois lados.
    pede('apps/web/src/tema.ts', espia)
    expect(lidos).toEqual(['apps/web/src/tema.ts', 'apps/web/src/tema.ts'])
  })
})

describe('as exceções do código', () => {
  it.each(EXCECOES)('$prefixo pede exatamente $guardioes', ({ arquivo, guardioes }) => {
    expect(pede(arquivo)).toEqual(guardioes)
  })

  it('cada exceção casa ao menos um arquivo versionado: exceção morta é vermelha', () => {
    const arquivos = versionados('apps', 'infra')
    const mortas = EXCECOES.filter((excecao) => !arquivos.some((arquivo) => arquivo.startsWith(excecao.prefixo))).map((excecao) => excecao.prefixo)
    expect(mortas).toEqual([])
    // O arquivo que o caso usa existe, e a constante do código é a mesma tabela escrita aqui.
    expect(EXCECOES.filter((excecao) => !arquivos.includes(excecao.arquivo)).map((excecao) => excecao.arquivo)).toEqual([])
    expect(EXCECOES_DO_CODIGO.map((excecao) => [excecao.prefixo, OS_QUATRO.filter((g) => excecao.guardioes.includes(g))])).toEqual(EXCECOES.map((excecao) => [excecao.prefixo, excecao.guardioes]))
  })

  it('vale o prefixo mais longo: ui/ia/ pede P C I e o resto de ui/ pede C I', () => {
    expect(pede('apps/web/src/componentes/ui/ia/AvisoFila.tsx')).toEqual([P, C, I])
    expect(pede('apps/web/src/componentes/ui/sobrepostos/DialogoDeConfirmacao.tsx')).toEqual([C, I])
    // O mais longo vence também quando a exceção é mais curta que o padrão: a exceção está dentro de apps/.
    expect(pede('apps/web/src/galeria/Galeria.tsx')).toEqual([P, C])
  })

  it('um prefixo que é arquivo não casa o vizinho de nome parecido: tema.ts não é tema-novo.ts', () => {
    expect(pede('apps/web/src/tema.ts')).toEqual([])
    expect(pede('apps/web/src/tema-novo.ts')).toEqual(OS_QUATRO)
    expect(pede('apps/web/vite.config.test.ts')).toEqual(OS_QUATRO)
  })

  it.each(['x.repository.ts', 'x.controller.ts', 'x.gateway.ts', 'x.service.ts'])('%s nunca cai em exceção: pede os quatro em ui/, galeria/, despachante/ e infra/', (nome) => {
    for (const pasta of ['apps/web/src/componentes/ui/', 'apps/web/src/galeria/', 'apps/despachante/src/', 'infra/']) {
      expect(pede(`${pasta}${nome}`)).toEqual(OS_QUATRO)
    }
  })

  it('o sufixo é o do fim do nome: x.service.test.ts, x.servico.ts e x.service.ts.orig ficam na exceção', () => {
    expect(pede('apps/web/src/componentes/ui/x.service.test.ts')).toEqual([C, I])
    expect(pede('apps/web/src/componentes/ui/x.servico.ts')).toEqual([C, I])
    expect(pede('apps/web/src/componentes/ui/x.service.ts.orig')).toEqual([C, I])
  })

  it('@SemEscopo( no índice, só no HEAD ou em nenhum: quatro, quatro, e C I (componentes/ui/)', () => {
    const arquivo = 'apps/web/src/componentes/ui/Aviso.tsx'
    const marca = '@SemEscopo() // rotina administrativa nossa\n'
    expect(pede(arquivo, textos(marca, 'export const a = 1\n'))).toEqual(OS_QUATRO)
    expect(pede(arquivo, textos('export const a = 1\n', marca))).toEqual(OS_QUATRO)
    expect(pede(arquivo, textos('export const a = 1\n'))).toEqual([C, I])
    // O arquivo que não existe num dos lados vale pelo outro.
    expect(pede(arquivo, textos(null, marca))).toEqual(OS_QUATRO)
    expect(pede(arquivo, textos(marca, null))).toEqual(OS_QUATRO)
  })
})

describe('a citação soma o guardião da regra', () => {
  it.each([
    ['apps/web/src/galeria/x.tsx', 'regra 70', [P, C]],
    ['apps/web/src/galeria/x.tsx', 'regra 10', [T, P, C]],
    ['apps/web/src/galeria/x.tsx', 'LGPD', [P, C]],
    ['apps/web/src/galeria/x.tsx', 'regra 80', [P, C, I]],
    ['apps/web/vite.config.ts', 'regra 20', [P, I]],
    ['apps/web/vite.config.ts', 'regra 80', [I]],
    ['apps/web/vite.config.ts', 'regra 10', [T, I]],
    ['apps/web/vite.config.ts', 'regra 70', [C, I]],
    ['apps/web/src/tema.ts', 'regra 70', [C]],
    ['apps/web/src/tema.ts', 'LGPD', [P]],
    ['apps/web/src/tema.ts', 'Regra 80', [I]],
    ['apps/web/src/tema.ts', 'regra 10', [T]],
    ['apps/web/src/tema.ts', 'regra 20', [P]],
  ] as [string, string, Guardiao[]][])('%s citando "%s" pede %j', (arquivo, termo, esperado) => {
    expect(pede(arquivo, textos(`// ${termo}\nexport const a = 1\n`))).toEqual(esperado)
  })

  it('sem citação, não soma', () => {
    expect(pede('apps/web/src/tema.ts', textos('export const a = 1\n'))).toEqual([])
    expect(pede('apps/web/vite.config.ts', textos('export const a = 1\n'))).toEqual([I])
  })

  it('sem diferença de maiúscula, com espaço duplo, e o número não pode ser prefixo de outro', () => {
    const tema = 'apps/web/src/tema.ts'
    expect(pede(tema, textos('// REGRA 10'))).toEqual([T])
    expect(pede(tema, textos('// Regra 20'))).toEqual([P])
    expect(pede(tema, textos('// lgpd'))).toEqual([P])
    expect(pede(tema, textos('// REGRA 70'))).toEqual([C])
    expect(pede(tema, textos('// rEGRA 80'))).toEqual([I])
    expect(pede(tema, textos('// regra  10'))).toEqual([T])
    expect(pede(tema, textos('// regra  20'))).toEqual([P])
    expect(pede(tema, textos('// regra  70'))).toEqual([C])
    expect(pede(tema, textos('// regra\t80'))).toEqual([I])
    for (const cem of ['regra 100', 'regra 200', 'regra 700', 'regra 800']) expect(pede(tema, textos(`// ${cem}`))).toEqual([])
    expect(pede(tema, textos('// regra 40, regra 50'))).toEqual([])
  })

  it('citava "regra 20" no HEAD e não cita no índice: soma P; citando só no índice, também', () => {
    expect(pede('apps/web/src/tema.ts', textos('export const a = 1\n', '// regra 20\n'))).toEqual([P])
    expect(pede('apps/web/src/tema.ts', textos('// regra 20\n', 'export const a = 1\n'))).toEqual([P])
    // Arquivo apagado do índice: o HEAD ainda diz o que ele citava.
    expect(pede('apps/web/src/tema.ts', textos(null, '// regra 70\n'))).toEqual([C])
    expect(pede('apps/web/src/tema.ts', textos(null, null))).toEqual([])
  })

  it('várias citações somam todas, na ordem dos quatro', () => {
    expect(pede('apps/web/src/tema.ts', textos('// regra 80\n// regra 70\n// regra 20\n// regra 10\n'))).toEqual(OS_QUATRO)
  })
})

describe('a união de vários arquivos', () => {
  it('soma o que cada um pede, sem repetir, na ordem dos quatro', () => {
    expect(guardioesDoCaminho(['infra/Caddyfile', 'apps/web/src/estilos.css'], SEM_TEXTO)).toEqual([P, C, I])
    expect(guardioesDoCaminho(['apps/web/src/tema.ts', 'apps/web/src/estilos.css', 'apps/web/src/estilos.css'], SEM_TEXTO)).toEqual([C])
    expect(guardioesDoCaminho(['apps/despachante/src/x.ts', 'apps/web/vite.config.ts'], SEM_TEXTO)).toEqual([T, P, I])
    expect(guardioesDoCaminho(['apps/web/src/tema.ts', 'apps/api/src/x.ts'], SEM_TEXTO)).toEqual(OS_QUATRO)
  })

  it('sem arquivo, ou só com arquivo que não é código, não pede ninguém', () => {
    expect(guardioesDoCaminho([], SEM_TEXTO)).toEqual([])
    expect(guardioesDoCaminho(['docs/x.md', 'tasks/prd-x/1_task.md'], SEM_TEXTO)).toEqual([])
  })
})
