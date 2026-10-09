import { verify } from '@node-rs/argon2'
import { randomUUID } from 'node:crypto'
import { Client } from 'pg'
import { beforeAll, describe, expect, it } from 'vitest'
import { urlDoBancoDeTeste } from '../ci/compose.ts'
import { escolaExiste, montarVitrine, type Vitrine } from './escola.ts'

// A vitrine só serve se os três logins abrem a escola montada: o que se prova aqui é que a senha entregue é a que o
// banco guarda, e que cada pessoa está presa à escola e à turma certas. O segundo fator fica de fora: ativá-lo pede a API
// de pé, e a integração só tem o banco.

async function consultar<T extends object>(instrucao: string, parametros: unknown[]): Promise<T[]> {
  const banco = new Client({ connectionString: urlDoBancoDeTeste() })
  await banco.connect()
  try {
    return (await banco.query<T>(instrucao, parametros)).rows
  } finally {
    await banco.end()
  }
}

describe('a escola da vitrine', () => {
  let vitrine: Vitrine

  beforeAll(async () => {
    vitrine = await montarVitrine({ ativarMfa: false })
  })

  it('a coordenadora entra com a senha entregue, na escola montada', async () => {
    const linhas = await consultar<{ senhaHash: string; escolaId: string; papel: string }>(
      'select c.senha_hash as "senhaHash", u.escola_id as "escolaId", u.papel from conta c join usuario u on u.conta_id = c.id where c.email = $1',
      [vitrine.coordenacao.email],
    )
    expect(linhas).toHaveLength(1)
    expect(linhas[0]?.escolaId).toBe(vitrine.escola.id)
    expect(linhas[0]?.papel).toBe('coordenador')
    expect(await verify(linhas[0]?.senhaHash ?? '', vitrine.coordenacao.senha)).toBe(true)
    expect(vitrine.coordenacao.segredo).toBeNull()
  })

  it('a professora, que a peça da governança cria sem senha, entra com a senha entregue e tem turma confirmada', async () => {
    const linhas = await consultar<{ senhaHash: string | null; turma: string; estado: string }>(
      `select c.senha_hash as "senhaHash", t.nome as turma, v.estado
         from conta c join usuario u on u.conta_id = c.id
         join vinculo v on v.usuario_id = u.id and v.escola_id = u.escola_id and v.papel = 'professor'
         join turma t on t.id = v.turma_id
        where c.email = $1 and u.escola_id = $2`,
      [vitrine.professora.email, vitrine.escola.id],
    )
    expect(linhas).toHaveLength(1)
    expect(linhas[0]?.turma).toBe(vitrine.professora.turma)
    expect(linhas[0]?.estado).toBe('confirmado')
    expect(await verify(linhas[0]?.senhaHash ?? '', vitrine.professora.senha)).toBe(true)
  })

  it('o aluno entra pela matrícula e pela senha entregues, na turma da professora, e não tem conta nem e-mail', async () => {
    const linhas = await consultar<{ senhaHash: string; contaId: string | null; turma: string; estado: string }>(
      `select m.senha_hash as "senhaHash", u.conta_id as "contaId", t.nome as turma, v.estado
         from credencial_matricula m join usuario u on u.id = m.usuario_id
         join vinculo v on v.usuario_id = u.id and v.escola_id = u.escola_id and v.papel = 'aluno'
         join turma t on t.id = v.turma_id
        where m.escola_id = $1 and m.matricula = $2`,
      [vitrine.escola.id, vitrine.aluno.matricula],
    )
    expect(linhas).toHaveLength(1)
    expect(linhas[0]?.turma).toBe(vitrine.aluno.turma)
    expect(linhas[0]?.turma).toBe(vitrine.professora.turma)
    expect(linhas[0]?.estado).toBe('confirmado')
    expect(linhas[0]?.contaId).toBeNull()
    expect(await verify(linhas[0]?.senhaHash ?? '', vitrine.aluno.senha)).toBe(true)
  })

  it('a senha de um papel não abre o outro', async () => {
    const linhas = await consultar<{ senhaHash: string }>('select senha_hash as "senhaHash" from conta where email = $1', [vitrine.professora.email])
    expect(await verify(linhas[0]?.senhaHash ?? '', vitrine.coordenacao.senha)).toBe(false)
  })

  it('só tem e-mail do domínio reservado, que não entrega mensagem a ninguém (regra 20, item 17)', async () => {
    const linhas = await consultar<{ email: string }>('select c.email from conta c join usuario u on u.conta_id = c.id where u.escola_id = $1', [vitrine.escola.id])
    expect(linhas.length).toBeGreaterThanOrEqual(4)
    expect(linhas.filter((linha) => !linha.email.endsWith('@educa.invalid'))).toEqual([])
  })

  it('sabe dizer quando a escola do arquivo já não existe no banco, que o portão recria', async () => {
    expect(await escolaExiste(vitrine.escola.id)).toBe(true)
    expect(await escolaExiste(randomUUID())).toBe(false)
  })
})
