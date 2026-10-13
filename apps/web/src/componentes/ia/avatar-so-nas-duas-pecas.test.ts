import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { arquivosDeCodigoDaWeb } from '../../__fixtures__/perigo-cheio'
import { especificadoresDe, importadoresDe, semComentarios, type ArquivoDaWeb } from '../../__fixtures__/importadores'

/**
 * A cadeia fechada da onça (RF10 da X1; `docs/interface.md` 9.7; regra 70, item 4a): o avatar **só existe com o nome da
 * função e o selo "IA" no mesmo bloco**, e isso é garantido por quem pode desenhá-lo, e não por combinado. A pasta
 * `componentes/onca/` — a cabeça, e a onça de corpo inteiro que vier — só é importada pelo `AvatarAgente` e por arquivo
 * da própria pasta; o `AvatarAgente`, só pela `AssinaturaIA` e pela `MensagemIA`. Tela, galeria e peça nova que queiram
 * a onça passam pela `AssinaturaIA`, que traz junto o nome e o selo.
 */
const RAIZ_DA_WEB = join(import.meta.dirname, '..', '..')

const PASTA_DA_ONCA = 'componentes/onca/'
const AVATAR = 'componentes/ia/AvatarAgente'
const ASSINATURA = 'componentes/ia/AssinaturaIA'
const QUEM_IMPORTA_A_PASTA_DA_ONCA = ['componentes/ia/AvatarAgente.tsx']
const QUEM_IMPORTA_O_AVATAR = ['componentes/ia/AssinaturaIA.tsx', 'componentes/ia/Mensagem.tsx']

function arquivosDaWeb(): ArquivoDaWeb[] {
  return arquivosDeCodigoDaWeb(RAIZ_DA_WEB).map((nome) => ({ nome, conteudo: readFileSync(join(RAIZ_DA_WEB, nome), 'utf8') }))
}

/** Quem importa `alvo` e não está na lista de quem pode: o que o teste reprova. */
function foraDaLista(importadores: readonly string[], permitidos: readonly string[], pasta = ''): string[] {
  return importadores.filter((nome) => !permitidos.includes(nome) && !(pasta !== '' && nome.startsWith(pasta)))
}

describe('a onça só chega à tela pela assinatura', () => {
  it('`componentes/onca/` só é importado pelo `AvatarAgente` e por arquivo da própria pasta', () => {
    const importadores = importadoresDe(arquivosDaWeb(), PASTA_DA_ONCA)
    // Sem isto o caso passaria vazio no dia em que a varredura deixasse de achar o import.
    expect(importadores, 'o `AvatarAgente` desenha a cabeça: a varredura não o achou').toContain('componentes/ia/AvatarAgente.tsx')
    expect(foraDaLista(importadores, QUEM_IMPORTA_A_PASTA_DA_ONCA, PASTA_DA_ONCA), 'a onça só entra na tela pelo `AvatarAgente`, e ele só pela `AssinaturaIA`').toEqual([])
  })

  it('o `AvatarAgente` só é importado pela `AssinaturaIA` e pela `MensagemIA`', () => {
    const importadores = importadoresDe(arquivosDaWeb(), AVATAR)
    expect(importadores, 'a `AssinaturaIA` desenha o avatar: a varredura não a achou').toContain('componentes/ia/AssinaturaIA.tsx')
    expect(foraDaLista(importadores, QUEM_IMPORTA_O_AVATAR), 'avatar sem o nome da função e o selo "IA": use a `AssinaturaIA`').toEqual([])
  })

  it('as telas e a galeria que mostram a onça usam a `AssinaturaIA`, e nenhuma importa o avatar nem a pasta da onça', () => {
    const arquivos = arquivosDaWeb()
    const daAssinatura = importadoresDe(arquivos, ASSINATURA)
    for (const tela of ['areas/coordenacao/Agentes.tsx', 'areas/coordenacao/Analista.tsx', 'galeria/secoes/marca-onca.tsx']) expect(daAssinatura, tela).toContain(tela)
    const doAvatarOuDaOnca = [...importadoresDe(arquivos, AVATAR), ...importadoresDe(arquivos, PASTA_DA_ONCA)]
    expect(doAvatarOuDaOnca.filter((nome) => nome.startsWith('areas/') || nome.startsWith('galeria/') || nome.startsWith('operacao/'))).toEqual([])
  })
})

describe('o atributo do avatar', () => {
  it('`data-agente` é só do avatar: nenhum outro arquivo o escreve, e o cartão do agente usa o dele', () => {
    const arquivos = arquivosDaWeb()
    const queEscrevem = arquivos.filter(({ conteudo }) => /\bdata-agente\b/.test(semComentarios(conteudo))).map(({ nome }) => nome)
    expect(queEscrevem, 'o teste confere cada `data-agente` pelo bloco dele: o cartão da tela não pode levá-lo').toEqual(['componentes/ia/AvatarAgente.tsx'])
    expect(arquivos.find(({ nome }) => nome === 'areas/coordenacao/Agentes.tsx')?.conteudo).toMatch(/data-cartao-do-agente=/)
  })
})

describe('como o importador é reconhecido', () => {
  const arquivo = (nome: string, conteudo: string): ArquivoDaWeb => ({ nome, conteudo })
  const AMOSTRA = [
    arquivo('componentes/ia/AvatarAgente.tsx', "import { CabecaOnca } from '../onca/CabecaOnca'"),
    arquivo('componentes/onca/OncaInteira.tsx', "import { CabecaOnca } from './CabecaOnca'"),
    arquivo('componentes/ia/AssinaturaIA.tsx', "import { AvatarAgente, type TamanhoDoAvatar } from './AvatarAgente'"),
    arquivo('areas/professor/Painel.tsx', "import { AvatarAgente } from '../../componentes/ia/AvatarAgente'"),
    arquivo('areas/aluno/Saudacao.tsx', "import { CabecaOnca } from '../../componentes/onca/CabecaOnca'"),
    arquivo('galeria/secoes/solta.tsx', "import type { TamanhoDoAvatar } from '../../componentes/ia/AvatarAgente'"),
    arquivo('areas/aluno/Tardia.tsx', "const Peca = lazy(() => import('../../componentes/ia/AvatarAgente'))"),
    arquivo('areas/aluno/Reexporta.tsx', "export { AvatarAgente } from '../../componentes/ia/AvatarAgente'"),
    arquivo('areas/aluno/PorIndice.tsx', "import { Qualquer } from '../../componentes/onca'"),
    arquivo('areas/aluno/Comentada.tsx', "// import { AvatarAgente } from '../../componentes/ia/AvatarAgente'\n/* import { CabecaOnca } from '../../componentes/onca/CabecaOnca' */\nexport const x = 1"),
    arquivo('areas/aluno/Vizinha.tsx', "import { AvatarDoAluno } from '../../componentes/ia/AvatarAgenteDoAluno'\nimport { Outra } from '../../componentes/oncas/Outra'"),
    arquivo('areas/aluno/ComExtensao.tsx', "import { AvatarAgente } from '../../componentes/ia/AvatarAgente.tsx'"),
    arquivo('areas/aluno/Pasta.tsx', "import { AvatarAgente } from '../../componentes/ia/AvatarAgente/index'"),
    arquivo('areas/aluno/Pacote.tsx', "import { useQuery } from '@tanstack/react-query'\nimport { x } from 'react'"),
  ]

  it('acha o import estático, o de tipo, o dinâmico e a reexportação, e a pasta pelo arquivo e pelo `index`', () => {
    expect(importadoresDe(AMOSTRA, AVATAR)).toEqual([
      'componentes/ia/AssinaturaIA.tsx',
      'areas/professor/Painel.tsx',
      'galeria/secoes/solta.tsx',
      'areas/aluno/Tardia.tsx',
      'areas/aluno/Reexporta.tsx',
      'areas/aluno/ComExtensao.tsx',
      'areas/aluno/Pasta.tsx',
    ])
    expect(importadoresDe(AMOSTRA, PASTA_DA_ONCA)).toEqual([
      'componentes/ia/AvatarAgente.tsx',
      'componentes/onca/OncaInteira.tsx',
      'areas/aluno/Saudacao.tsx',
      'areas/aluno/PorIndice.tsx',
    ])
  })

  it('a amostra com outro importador reprova, e a lista de quem pode não a deixa passar', () => {
    expect(foraDaLista(importadoresDe(AMOSTRA, AVATAR), QUEM_IMPORTA_O_AVATAR)).toEqual([
      'areas/professor/Painel.tsx',
      'galeria/secoes/solta.tsx',
      'areas/aluno/Tardia.tsx',
      'areas/aluno/Reexporta.tsx',
      'areas/aluno/ComExtensao.tsx',
      'areas/aluno/Pasta.tsx',
    ])
    expect(foraDaLista(importadoresDe(AMOSTRA, PASTA_DA_ONCA), QUEM_IMPORTA_A_PASTA_DA_ONCA, PASTA_DA_ONCA)).toEqual(['areas/aluno/Saudacao.tsx', 'areas/aluno/PorIndice.tsx'])
  })

  it('não confunde comentário, nome parecido nem pacote com o import', () => {
    const importadores = [...importadoresDe(AMOSTRA, AVATAR), ...importadoresDe(AMOSTRA, PASTA_DA_ONCA)]
    for (const sem of ['areas/aluno/Comentada.tsx', 'areas/aluno/Vizinha.tsx', 'areas/aluno/Pacote.tsx']) expect(importadores, sem).not.toContain(sem)
    // O `//` de um endereço não come o resto da linha: o import depois dele continua sendo lido.
    expect(especificadoresDe("const u = 'https://exemplo.test'; import { A } from './A'")).toEqual(['./A'])
  })
})
