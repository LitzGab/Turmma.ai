import { ErroDeDominio, executarNoContexto } from '@educa/nucleo'
import { CodigoDeErro, type PapelDeUsuario } from '@educa/shared'
import type { Redis } from 'ioredis'
import { randomBytes, randomUUID } from 'node:crypto'
import { Secret, TOTP } from 'otpauth'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { MedidorDeTeste } from '../../../tools/testes/metricas.ts'
import { CicloDeVidaService } from '../src/sessao/ciclo-de-vida.service.js'
import { CifraDoSegredo } from '../src/sessao/cifra-do-segredo.js'
import { HashDeSenha } from '../src/sessao/hash-de-senha.js'
import { gerarCodigosDeRecuperacao, gerarSegredo, hmacDaRecuperacao } from '../src/sessao/segundo-fator.js'
import { CLIENTE_REDIS_LOGIN } from '../src/sessao/sessao.module.js'
import { chamar, subirApi, type ApiDeTeste } from './api-com-sessao.js'
import { configuracaoDeTeste } from './configuracao-de-teste.js'
import { montarEscolaComTurma, type EscolaComTurma } from './escola-com-turma.js'
import { BancadaDeSessoes, type SessaoDeTeste } from './sessao-de-teste.js'

/** Senha sintética das contas e dos alunos deste teste: nenhuma é de pessoa real. */
const SENHA = 'senha-sintetica-correta-1'
const OPERADOR = 'operador-teste'

interface Resposta {
  status: number
  corpo: Record<string, unknown> & { erro?: { codigo?: string } }
}

/** Uma pessoa da equipe: a conta global (e-mail e senha) e o usuário dela na primeira escola. */
interface Pessoa {
  email: string
  nome: string
  contaId: string
  usuarioId: string
  escolaId: string
}

interface ContaNoBanco {
  email: string | null
  senha: boolean
  mfaAtivo: boolean
  segredo: boolean
  codigos: number
}

async function clientePronto(cliente: Redis): Promise<void> {
  const prazo = performance.now() + 15_000
  while (cliente.status !== 'ready') {
    if (performance.now() > prazo) throw new Error('o cliente do Redis de fila do login não conectou')
    await new Promise((resolver) => setTimeout(resolver, 20))
  }
}

describe('ciclo de vida da conta: desativação, limpeza da conta global e eliminação por escola (17.1)', () => {
  const bancada = new BancadaDeSessoes()
  const medidor = new MedidorDeTeste()
  const configuracao = configuracaoDeTeste()
  const cifra = new CifraDoSegredo(configuracao.login.mfa.versaoCifra, configuracao.login.mfa.chavesCifra)
  const servico = new CicloDeVidaService(bancada.banco)
  let api: ApiDeTeste
  let hashDaSenha: string

  beforeAll(async () => {
    api = await subirApi(medidor.medidor)
    const hash = api.app.get(HashDeSenha)
    await clientePronto(api.app.get<Redis>(CLIENTE_REDIS_LOGIN, { strict: false }))
    hashDaSenha = await hash.gerar(SENHA)
  })

  afterAll(async () => {
    await api.app.close()
    await bancada.fechar()
    await medidor.encerrar()
  })

  /** Como a coordenação chamaria pela tela do F2: no contexto da sessão dela, com a escola e o autor. */
  const pela = <T>(coordenacao: SessaoDeTeste, acao: () => Promise<T>): Promise<T> =>
    executarNoContexto({ requisicaoId: randomUUID(), escolaId: coordenacao.escolaId, usuarioId: coordenacao.usuarioId, papel: 'coordenador' }, acao)

  /** Como o operador chamaria por comando, a pedido formal da escola: sem usuário no contexto. */
  const peloOperador = <T>(escolaId: string, acao: () => Promise<T>): Promise<T> => executarNoContexto({ requisicaoId: randomUUID(), escolaId }, acao)

  async function esperarNaoEncontrado(acao: Promise<unknown>): Promise<void> {
    const erro: unknown = await acao.then(
      () => undefined,
      (motivo: unknown) => motivo,
    )
    expect(erro).toBeInstanceOf(ErroDeDominio)
    expect((erro as ErroDeDominio).codigo).toBe(CodigoDeErro.NAO_ENCONTRADO)
  }

  async function pessoa(escolaId: string, papel: PapelDeUsuario = 'professor'): Promise<Pessoa> {
    const email = `equipe-${randomUUID()}@escola.invalid`
    const nome = `Pessoa sintética ${randomUUID().slice(0, 8)}`
    const { rows: contas } = await bancada.pool.query<{ id: string }>('insert into conta (email, senha_hash) values ($1, $2) returning id', [email, hashDaSenha])
    const contaId = contas[0]?.id ?? ''
    const { rows } = await bancada.pool.query<{ id: string }>('insert into usuario (escola_id, conta_id, papel, nome) values ($1, $2, $3, $4) returning id', [escolaId, contaId, papel, nome])
    return { email, nome, contaId, usuarioId: rows[0]?.id ?? '', escolaId }
  }

  /** O usuário da mesma conta em outra escola: a professora que dá aula em duas. */
  async function naOutraEscola(quem: Pessoa, escolaId: string, papel: PapelDeUsuario = 'professor'): Promise<string> {
    const { rows } = await bancada.pool.query<{ id: string }>('insert into usuario (escola_id, conta_id, papel, nome) values ($1, $2, $3, $4) returning id', [escolaId, quem.contaId, papel, quem.nome])
    return rows[0]?.id ?? ''
  }

  async function alunoComMatricula(escolaId: string, matricula: string): Promise<string> {
    const [usuarioId] = await bancada.alunosComMatricula(escolaId, [{ matricula, senhaHash: hashDaSenha }])
    if (usuarioId === undefined) throw new Error('aluno não criado')
    return usuarioId
  }

  async function ligarContaExterna(escolaId: string, usuarioId: string): Promise<string> {
    const { rows } = await bancada.pool.query<{ id: string }>("insert into conta_externa (escola_id, usuario_id, provedor, sujeito) values ($1, $2, 'google', $3) returning id", [
      escolaId,
      usuarioId,
      `sujeito-${randomUUID()}`,
    ])
    return rows[0]?.id ?? ''
  }

  async function comMfaAtivo(quem: Pessoa): Promise<string> {
    const novo = gerarSegredo()
    const { cifrado, versao } = cifra.cifrar(novo.bytes, quem.contaId)
    await bancada.pool.query('update conta set mfa_segredo_cifrado = $1, mfa_chave_versao = $2, mfa_ativado_em = now(), mfa_ultimo_passo = null where id = $3', [cifrado, versao, quem.contaId])
    for (const codigo of gerarCodigosDeRecuperacao()) {
      await bancada.pool.query('insert into codigo_recuperacao (conta_id, hmac) values ($1, $2)', [quem.contaId, hmacDaRecuperacao(configuracao.login.mfa.chaveRecuperacao, codigo)])
    }
    return novo.base32
  }

  async function postar(caminho: string, corpo: unknown, autorizacao?: string): Promise<Resposta> {
    const resposta = await fetch(`${api.url}${caminho}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(autorizacao === undefined ? {} : { Authorization: `Bearer ${autorizacao}` }) },
      body: JSON.stringify(corpo),
    })
    const texto = await resposta.text()
    return { status: resposta.status, corpo: texto === '' ? {} : (JSON.parse(texto) as Resposta['corpo']) }
  }

  const entrarPorEmail = (email: string) => postar('/v1/sessao/email', { email, senha: SENHA })
  const entrarPorMatricula = async (escolaId: string, matricula: string) => postar('/v1/sessao/matricula', { slug: await bancada.slugDe(escolaId), matricula, senha: SENHA })

  /** A pessoa entra por e-mail e, com mais de uma escola, escolhe o usuário: devolve o token de acesso. */
  async function entrarComo(quem: Pessoa, usuarioId: string): Promise<string> {
    const login = await entrarPorEmail(quem.email)
    expect(login.status).toBe(200)
    if (login.corpo['etapa'] === 'pronta') return String(login.corpo['token'])
    expect(login.corpo['etapa']).toBe('escolher')
    const escolhido = await postar('/v1/sessao/escola', { usuarioId }, String(login.corpo['desafio']))
    expect(escolhido.corpo['etapa']).toBe('pronta')
    return String(escolhido.corpo['token'])
  }

  async function tokenDoAluno(escolaId: string, matricula: string): Promise<string> {
    const login = await entrarPorMatricula(escolaId, matricula)
    expect(login.corpo['etapa']).toBe('pronta')
    return String(login.corpo['token'])
  }

  const statusDoEu = async (token: string) => (await chamar(api.url, 'GET', '/v1/eu', token)).status

  async function contaNoBanco(contaId: string): Promise<ContaNoBanco> {
    const { rows } = await bancada.pool.query<{ email: string | null; senha: boolean; mfa_ativo: boolean; segredo: boolean; codigos: string }>(
      `select email, senha_hash is not null as senha, mfa_ativado_em is not null as mfa_ativo, mfa_segredo_cifrado is not null as segredo,
              (select count(*) from codigo_recuperacao c where c.conta_id = conta.id) as codigos
       from conta where id = $1`,
      [contaId],
    )
    const [linha] = rows
    if (linha === undefined) throw new Error('conta não encontrada')
    return { email: linha.email, senha: linha.senha, mfaAtivo: linha.mfa_ativo, segredo: linha.segredo, codigos: Number(linha.codigos) }
  }

  async function sessoesDe(escolaId: string, usuarioId: string): Promise<Array<{ encerrada: boolean; motivo: string | null }>> {
    const { rows } = await bancada.pool.query<{ encerrada: boolean; motivo: string | null }>(
      'select encerrada_em is not null as encerrada, motivo from sessao where escola_id = $1 and usuario_id = $2 order by id',
      [escolaId, usuarioId],
    )
    return rows
  }

  async function contar(tabela: 'usuario' | 'credencial_matricula' | 'conta_externa' | 'vinculo' | 'sessao' | 'registro_acesso', escolaId: string, usuarioId: string): Promise<number> {
    const coluna = tabela === 'usuario' ? 'id' : 'usuario_id'
    const { rows } = await bancada.pool.query<{ total: string }>(`select count(*) as total from ${tabela} where escola_id = $1 and ${coluna} = $2`, [escolaId, usuarioId])
    return Number(rows[0]?.total)
  }

  async function auditoriaDoCiclo(escolaId: string): Promise<Array<Record<string, unknown>>> {
    const { rows } = await bancada.pool.query(
      `select acao, entidade, entidade_id, autor_usuario_id, autor_operador, antes, depois, finalidade, em from auditoria
       where escola_id = $1 and acao in ('usuario.desativado', 'usuario.eliminado', 'conta_externa.desligada') order by em, id`,
      [escolaId],
    )
    return rows
  }

  /** O vínculo de professor pela API: a coordenação cria, e o professor confirma com o token dele. */
  async function vinculoConfirmado(escola: EscolaComTurma, usuarioId: string, tokenDoProfessor: string, coordenacao = escola.coordenacao): Promise<string> {
    const criado = await chamar(api.url, 'POST', '/v1/vinculos', coordenacao.token, { usuarioId, turmaId: escola.turma, disciplinaId: escola.quimica, papel: 'professor' })
    expect(criado.status).toBe(201)
    const id = String(criado.corpo['id'])
    expect((await chamar(api.url, 'POST', `/v1/vinculos/${id}/confirmar`, tokenDoProfessor)).status).toBe(200)
    return id
  }

  it('caminho feliz (RF5; regra 20, item 18): o aluno desativado tem o hash da senha apagado, a sessão aberta dá 401 na requisição seguinte, e o colega segue entrando', async () => {
    const escolaId = await bancada.escola()
    const coordenacao = await bancada.sessao(escolaId, 'coordenador')
    const matricula = `RA${randomBytes(4).toString('hex')}`
    const enzo = await alunoComMatricula(escolaId, matricula)
    const matriculaDoColega = `RA${randomBytes(4).toString('hex')}`
    await alunoComMatricula(escolaId, matriculaDoColega)
    const contaExterna = await ligarContaExterna(escolaId, enzo)
    const tokenDoEnzo = await tokenDoAluno(escolaId, matricula)
    const tokenDoColega = await tokenDoAluno(escolaId, matriculaDoColega)
    expect(await statusDoEu(tokenDoEnzo)).toBe(200)

    await pela(coordenacao, () => servico.desativar(enzo))

    expect(await statusDoEu(tokenDoEnzo)).toBe(401)
    expect(await statusDoEu(tokenDoColega)).toBe(200)
    expect(await sessoesDe(escolaId, enzo)).toEqual([{ encerrada: true, motivo: 'desativacao' }])
    // A matrícula fica (registro escolar); o hash sai, e a conta Google ligada também.
    const { rows: credencial } = await bancada.pool.query('select matricula, senha_hash from credencial_matricula where escola_id = $1 and usuario_id = $2', [escolaId, enzo])
    expect(credencial).toEqual([{ matricula, senha_hash: null }])
    expect(await contar('conta_externa', escolaId, enzo)).toBe(0)
    expect((await bancada.pool.query('select 1 from conta_externa where id = $1', [contaExterna])).rowCount).toBe(0)
    // A senha certa não entra mais: a mesma resposta da senha errada.
    const deNovo = await entrarPorMatricula(escolaId, matricula)
    expect(deNovo.status).toBe(401)
    expect(deNovo.corpo.erro?.codigo).toBe(CodigoDeErro.NAO_AUTENTICADO)
    expect((await entrarPorMatricula(escolaId, matriculaDoColega)).corpo['etapa']).toBe('pronta')
    // Desativar de novo não acha ninguém, e não grava outro registro.
    await esperarNaoEncontrado(pela(coordenacao, () => servico.desativar(enzo)))
    expect(await auditoriaDoCiclo(escolaId)).toHaveLength(1)
  })

  it('borda: o aluno transferido é desativado em A, e a conta nova dele em B, com a mesma matrícula, entra normalmente', async () => {
    const escolaA = await bancada.escola()
    const escolaB = await bancada.escola()
    const coordenacaoDeA = await bancada.sessao(escolaA, 'coordenador')
    const matricula = `RA${randomBytes(4).toString('hex')}`
    const emA = await alunoComMatricula(escolaA, matricula)
    const emB = await alunoComMatricula(escolaB, matricula)
    const tokenEmB = await tokenDoAluno(escolaB, matricula)

    await pela(coordenacaoDeA, () => servico.desativar(emA))

    expect((await entrarPorMatricula(escolaA, matricula)).status).toBe(401)
    expect((await entrarPorMatricula(escolaB, matricula)).corpo['etapa']).toBe('pronta')
    expect(await statusDoEu(tokenEmB)).toBe(200)
    const { rows } = await bancada.pool.query<{ senha: boolean }>('select senha_hash is not null as senha from credencial_matricula where escola_id = $1 and usuario_id = $2', [escolaB, emB])
    expect(rows).toEqual([{ senha: true }])
  })

  it('isolamento: a professora desativada em A, com usuário ativo em B, mantém e-mail e senha e continua entrando em B; desativada também em B, a conta perde e-mail, senha, segredo, códigos e as sessões abertas', async () => {
    const escolaA = await bancada.escola()
    const escolaB = await bancada.escola()
    const coordenacaoDeA = await bancada.sessao(escolaA, 'coordenador')
    const coordenacaoDeB = await bancada.sessao(escolaB, 'coordenador')
    const camila = await pessoa(escolaA)
    const camilaEmB = await naOutraEscola(camila, escolaB)
    const tokenEmA = await entrarComo(camila, camila.usuarioId)
    const tokenAbertoEmB = await entrarComo(camila, camilaEmB)

    // O usuário dela em B, pedido pela coordenação de A: a mesma resposta do id de ninguém, e B segue ativo.
    await esperarNaoEncontrado(pela(coordenacaoDeA, () => servico.desativar(camilaEmB)))
    expect((await bancada.pool.query('select 1 from usuario where id = $1 and desativado_em is null', [camilaEmB])).rowCount).toBe(1)
    await pela(coordenacaoDeA, () => servico.desativar(camila.usuarioId))

    expect(await statusDoEu(tokenEmA)).toBe(401)
    expect(await sessoesDe(escolaA, camila.usuarioId)).toEqual([{ encerrada: true, motivo: 'desativacao' }])
    // A sessão que ela já tinha aberta em B não cai: a conta ainda serve a B.
    expect(await statusDoEu(tokenAbertoEmB)).toBe(200)
    expect(await contaNoBanco(camila.contaId)).toEqual({ email: camila.email, senha: true, mfaAtivo: false, segredo: false, codigos: 0 })
    // Com um usuário ativo só, o login vai direto a B.
    const tokenEmB = await entrarComo(camila, camilaEmB)
    expect((await chamar(api.url, 'GET', '/v1/eu', tokenEmB)).corpo).toMatchObject({ usuarioId: camilaEmB, escola: { id: escolaB } })

    // Em B ela é da coordenação agora, com o MFA e os códigos: tudo isso sai quando a conta não serve a mais ninguém.
    await comMfaAtivo(camila)
    expect(await contaNoBanco(camila.contaId)).toMatchObject({ mfaAtivo: true, segredo: true, codigos: 10 })
    await pela(coordenacaoDeB, () => servico.desativar(camilaEmB))

    expect(await contaNoBanco(camila.contaId)).toEqual({ email: null, senha: false, mfaAtivo: false, segredo: false, codigos: 0 })
    for (const token of [tokenEmB, tokenAbertoEmB]) expect(await statusDoEu(token)).toBe(401)
    const { rows: abertas } = await bancada.pool.query('select 1 from sessao where conta_id = $1 and encerrada_em is null', [camila.contaId])
    expect(abertas).toEqual([])
    expect((await entrarPorEmail(camila.email)).status).toBe(401)
    // Cada escola só diz se a conta foi limpa no registro dela, sem nada da outra.
    expect((await auditoriaDoCiclo(escolaA)).map((linha) => (linha['depois'] as Record<string, unknown>)['contaLimpa'])).toEqual([false])
    expect((await auditoriaDoCiclo(escolaB)).map((linha) => (linha['depois'] as Record<string, unknown>)['contaLimpa'])).toEqual([true])
  })

  it('concorrência: a mesma conta desativada em A e em B ao mesmo tempo termina limpa, uma vez só, em cada uma de cinco contas', async () => {
    const escolaA = await bancada.escola()
    const escolaB = await bancada.escola()
    const coordenacaoDeA = await bancada.sessao(escolaA, 'coordenador')
    const coordenacaoDeB = await bancada.sessao(escolaB, 'coordenador')
    const pessoas = await Promise.all(Array.from({ length: 5 }, async () => {
      const quem = await pessoa(escolaA)
      return { quem, emB: await naOutraEscola(quem, escolaB) }
    }))

    await Promise.all(pessoas.flatMap(({ quem, emB }) => [pela(coordenacaoDeA, () => servico.desativar(quem.usuarioId)), pela(coordenacaoDeB, () => servico.desativar(emB))]))

    const limpas = [...(await auditoriaDoCiclo(escolaA)), ...(await auditoriaDoCiclo(escolaB))].filter((linha) => (linha['depois'] as Record<string, unknown>)['contaLimpa'] === true)
    expect(limpas).toHaveLength(5)
    for (const { quem } of pessoas) expect((await contaNoBanco(quem.contaId)).email).toBeNull()
  })

  it('borda: a conta com um convite ainda válido em outra escola não é limpa quando o último usuário ativo sai; com o convite revogado, expirado ou já usado, é', async () => {
    const escolaA = await bancada.escola()
    const escolaB = await bancada.escola()
    const coordenacaoDeA = await bancada.sessao(escolaA, 'coordenador')
    /** O coordenador convidado em B, inativo, com um convite no estado pedido. O usado é o aceito de quem foi desativado depois. */
    const convidar = async (quem: Pessoa, estado: 'valido' | 'revogado' | 'expirado' | 'usado') => {
      const { rows } = await bancada.pool.query<{ id: string }>(
        "insert into usuario (escola_id, conta_id, papel, nome, desativado_em) values ($1, $2, 'coordenador', $3, now()) returning id",
        [escolaB, quem.contaId, quem.nome],
      )
      await bancada.pool.query(
        `insert into convite (escola_id, token_hash, tipo, usuario_id, expira_em, revogado_em, usado_em)
         values ($1, $2, 'coordenador', $3, now() + $4::interval, $5, $6)`,
        [
          escolaB,
          randomBytes(32).toString('hex'),
          rows[0]?.id,
          estado === 'expirado' ? '-1 hour' : '72 hours',
          estado === 'revogado' ? new Date() : null,
          estado === 'usado' ? new Date(Date.now() - 60 * 60 * 1000) : null,
        ],
      )
    }
    const pessoas = { valido: await pessoa(escolaA), revogado: await pessoa(escolaA), expirado: await pessoa(escolaA), usado: await pessoa(escolaA) }
    for (const [estado, quem] of Object.entries(pessoas) as Array<[keyof typeof pessoas, Pessoa]>) await convidar(quem, estado)

    for (const quem of Object.values(pessoas)) await pela(coordenacaoDeA, () => servico.desativar(quem.usuarioId))

    expect(await contaNoBanco(pessoas.valido.contaId)).toMatchObject({ email: pessoas.valido.email, senha: true })
    for (const estado of ['revogado', 'expirado', 'usado'] as const) expect(await contaNoBanco(pessoas[estado].contaId), estado).toMatchObject({ email: null, senha: false })
  })

  it('concorrência: dois cliques em desativar o mesmo usuário desativam uma vez, com um registro só; o outro recebe NAO_ENCONTRADO', async () => {
    const escolaId = await bancada.escola()
    const coordenacao = await bancada.sessao(escolaId, 'coordenador')
    const professor = await pessoa(escolaId)
    const resultados = await Promise.allSettled([pela(coordenacao, () => servico.desativar(professor.usuarioId)), pela(coordenacao, () => servico.desativar(professor.usuarioId))])
    expect(resultados.map((resultado) => resultado.status).sort()).toEqual(['fulfilled', 'rejected'])
    const recusa = resultados.find((resultado) => resultado.status === 'rejected')
    await esperarNaoEncontrado(Promise.reject(recusa?.reason))
    expect(await auditoriaDoCiclo(escolaId)).toHaveLength(1)
  })

  it('borda: o coordenador desativado enquanto tinha o desafio do MFA na mão não entra com o código certo, e nenhuma sessão nasce', async () => {
    const escolaId = await bancada.escola()
    const outraCoordenacao = await bancada.sessao(escolaId, 'coordenador')
    const renata = await pessoa(escolaId, 'coordenador')
    const segredo = await comMfaAtivo(renata)
    const login = await entrarPorEmail(renata.email)
    expect(login.corpo['etapa']).toBe('mfa')

    await pela(outraCoordenacao, () => servico.desativar(renata.usuarioId))

    const codigo = TOTP.generate({ secret: Secret.fromBase32(segredo), algorithm: 'SHA1', digits: 6, period: 30 })
    const comCodigo = await postar('/v1/sessao/mfa', { codigo }, String(login.corpo['desafio']))
    expect(comCodigo.status).toBe(401)
    expect(comCodigo.corpo.erro?.codigo).toBe(CodigoDeErro.NAO_AUTENTICADO)
    expect(await sessoesDe(escolaId, renata.usuarioId)).toEqual([])
  })

  it('isolamento: a eliminação pedida por A apaga usuário, credencial, conta externa, vínculos e sessões de A, preserva tudo de B e o login em B, e mantém o registro de acesso e a auditoria de A', async () => {
    const a = await montarEscolaComTurma(api, bancada)
    const b = await montarEscolaComTurma(api, bancada)
    const escolaA = a.coordenacao.escolaId
    const escolaB = b.coordenacao.escolaId
    const camila = await pessoa(escolaA)
    const camilaEmB = await naOutraEscola(camila, escolaB)
    const vinculoEmA = await vinculoConfirmado(a, camila.usuarioId, await entrarComo(camila, camila.usuarioId))
    const tokenEmB = await entrarComo(camila, camilaEmB)
    const vinculoEmB = await vinculoConfirmado(b, camilaEmB, tokenEmB)
    const externaEmA = await ligarContaExterna(escolaA, camila.usuarioId)
    const externaEmB = await ligarContaExterna(escolaB, camilaEmB)
    // O aluno de A, com matrícula, conta Google, vínculo na turma e sessão aberta.
    const matricula = `RA${randomBytes(4).toString('hex')}`
    const enzo = await alunoComMatricula(escolaA, matricula)
    await ligarContaExterna(escolaA, enzo)
    await bancada.pool.query("insert into vinculo (escola_id, ano_letivo_id, usuario_id, turma_id, papel, estado, criado_por, decidido_em) values ($1, $2, $3, $4, 'aluno', 'confirmado', $5, now())", [
      escolaA,
      a.anoLetivoId,
      enzo,
      a.turma,
      a.coordenacao.usuarioId,
    ])
    const tokenDoEnzo = await tokenDoAluno(escolaA, matricula)
    const registrosAntes = { camila: await contar('registro_acesso', escolaA, camila.usuarioId), enzo: await contar('registro_acesso', escolaA, enzo) }
    expect(registrosAntes.camila).toBeGreaterThan(0)
    expect(registrosAntes.enzo).toBeGreaterThan(0)

    // Id de B pedido por A: a mesma resposta do id de ninguém, e nada muda em B.
    await esperarNaoEncontrado(pela(a.coordenacao, () => servico.eliminar(camilaEmB)))
    await esperarNaoEncontrado(pela(a.coordenacao, () => servico.eliminar(randomUUID())))
    await pela(a.coordenacao, () => servico.eliminar(camila.usuarioId))
    await pela(a.coordenacao, () => servico.eliminar(enzo))

    for (const [usuarioId, nome] of [
      [camila.usuarioId, 'camila'],
      [enzo, 'enzo'],
    ] as const) {
      for (const tabela of ['usuario', 'credencial_matricula', 'conta_externa', 'vinculo', 'sessao'] as const) expect(await contar(tabela, escolaA, usuarioId), `${nome}: ${tabela}`).toBe(0)
      // O registro de acesso fica pela retenção legal (Marco Civil), com o id.
      expect(await contar('registro_acesso', escolaA, usuarioId), `${nome}: registro_acesso`).toBe(registrosAntes[nome])
    }
    expect(await statusDoEu(tokenDoEnzo)).toBe(401)
    expect((await bancada.pool.query('select 1 from vinculo where id = $1', [vinculoEmA])).rowCount).toBe(0)
    expect((await bancada.pool.query('select 1 from conta_externa where id = $1', [externaEmA])).rowCount).toBe(0)
    // A auditoria de A fica, inclusive o que a professora eliminada fez: confirmar o vínculo.
    const { rows: feitoPorCamila } = await bancada.pool.query('select acao from auditoria where escola_id = $1 and autor_usuario_id = $2', [escolaA, camila.usuarioId])
    expect(feitoPorCamila).toEqual([{ acao: 'vinculo.confirmado' }])

    // Em B, tudo continua: o usuário ativo, o vínculo, a conta Google, a sessão aberta e o login.
    expect(await contar('usuario', escolaB, camilaEmB)).toBe(1)
    expect((await bancada.pool.query("select 1 from vinculo where id = $1 and estado = 'confirmado'", [vinculoEmB])).rowCount).toBe(1)
    expect((await bancada.pool.query('select 1 from conta_externa where id = $1', [externaEmB])).rowCount).toBe(1)
    expect(await statusDoEu(tokenEmB)).toBe(200)
    expect(await contaNoBanco(camila.contaId)).toMatchObject({ email: camila.email, senha: true })
    const loginEmB = await entrarPorEmail(camila.email)
    expect(loginEmB.corpo['etapa']).toBe('pronta')
    expect((await chamar(api.url, 'GET', '/v1/eu', String(loginEmB.corpo['token']))).corpo).toMatchObject({ usuarioId: camilaEmB, escola: { id: escolaB } })
    expect(await auditoriaDoCiclo(escolaB)).toEqual([])

    // O último usuário da conta eliminado, agora em B: a mesma limpeza da desativação.
    await pela(b.coordenacao, () => servico.eliminar(camilaEmB))
    expect(await contaNoBanco(camila.contaId)).toEqual({ email: null, senha: false, mfaAtivo: false, segredo: false, codigos: 0 })
    expect((await auditoriaDoCiclo(escolaB)).map((linha) => linha['depois'])).toEqual([
      { sessoesApagadas: 2, vinculosApagados: 1, credencialApagada: false, contaExternaApagada: true, contaLimpa: true },
    ])
  })

  it('borda: a eliminação do coordenador que criou o vínculo de outra pessoa mantém o vínculo e a auditoria dele, e o banco continua recusando autor de outra escola na escrita', async () => {
    const a = await montarEscolaComTurma(api, bancada)
    const escolaA = a.coordenacao.escolaId
    const b = await bancada.escola()
    const segundaCoordenacao = await bancada.sessao(escolaA, 'coordenador')
    const professora = await pessoa(escolaA)
    const vinculo = await vinculoConfirmado(a, professora.usuarioId, await entrarComo(professora, professora.usuarioId), segundaCoordenacao)

    await pela(a.coordenacao, () => servico.eliminar(segundaCoordenacao.usuarioId))

    expect(await contar('usuario', escolaA, segundaCoordenacao.usuarioId)).toBe(0)
    const { rows: vinculos } = await bancada.pool.query('select estado, criado_por from vinculo where id = $1', [vinculo])
    expect(vinculos).toEqual([{ estado: 'confirmado', criado_por: segundaCoordenacao.usuarioId }])
    const { rows: feitos } = await bancada.pool.query('select acao from auditoria where escola_id = $1 and autor_usuario_id = $2', [escolaA, segundaCoordenacao.usuarioId])
    expect(feitos).toEqual([{ acao: 'vinculo.criado' }])

    // Na escrita, o gatilho guarda o que a FK guardava: autor de outra escola, ou que não existe mais, é recusado.
    const deOutraEscola = (await bancada.sessao(b, 'coordenador')).usuarioId
    const inserirVinculo = (criadoPor: string) =>
      bancada.pool.query("insert into vinculo (escola_id, ano_letivo_id, usuario_id, turma_id, papel, estado, criado_por) values ($1, $2, $3, $4, 'professor', 'pendente', $5)", [
        escolaA,
        a.anoLetivoId,
        professora.usuarioId,
        a.outraTurma,
        criadoPor,
      ])
    const inserirAuditoria = (autor: string) =>
      bancada.pool.query("insert into auditoria (escola_id, autor_usuario_id, acao, entidade, entidade_id, requisicao_id) values ($1, $2, 'teste.gatilho', 'escola', $1, $3)", [escolaA, autor, randomUUID()])
    for (const autor of [deOutraEscola, segundaCoordenacao.usuarioId]) {
      await expect(inserirVinculo(autor)).rejects.toMatchObject({ code: '23503', constraint: 'vinculo_criado_por_da_escola_fk' })
      await expect(inserirAuditoria(autor)).rejects.toMatchObject({ code: '23503', constraint: 'auditoria_autor_da_escola_fk' })
    }
    await expect(inserirVinculo(a.coordenacao.usuarioId)).resolves.toMatchObject({ rowCount: 1 })
    // Na troca do autor de um registro que já existe, também.
    const trocarAutor = (autor: string) =>
      bancada.pool.query('update auditoria set autor_usuario_id = $1 where id = (select id from auditoria where escola_id = $2 and autor_usuario_id = $3 limit 1)', [autor, escolaA, a.coordenacao.usuarioId])
    await expect(trocarAutor(deOutraEscola)).rejects.toMatchObject({ code: '23503', constraint: 'auditoria_autor_da_escola_fk' })
  })

  it('auditoria (RF19): desativação e eliminação gravam registro com autor e data, pela coordenação ou pelo operador, sem e-mail, nome nem matrícula em antes e depois', async () => {
    const escolaId = await bancada.escola()
    const coordenacao = await bancada.sessao(escolaId, 'coordenador')
    const matricula = `RA${randomBytes(4).toString('hex')}`
    const lara = await alunoComMatricula(escolaId, matricula)
    await bancada.pool.query('update usuario set nome = $1 where id = $2', ['Lara Sintética', lara])
    await ligarContaExterna(escolaId, lara)
    await tokenDoAluno(escolaId, matricula)
    const professor = await pessoa(escolaId)
    const inicio = new Date(Date.now() - 1_000)

    await pela(coordenacao, () => servico.desativar(lara))
    await peloOperador(escolaId, () => servico.eliminar(professor.usuarioId, { autorOperador: OPERADOR }))

    const linhas = await auditoriaDoCiclo(escolaId)
    expect(linhas.map(({ em: _em, ...resto }) => resto)).toEqual([
      {
        acao: 'usuario.desativado',
        entidade: 'usuario',
        entidade_id: lara,
        autor_usuario_id: coordenacao.usuarioId,
        autor_operador: null,
        antes: { papel: 'aluno' },
        depois: { desativadoEm: expect.any(String), sessoesEncerradas: 1, credencialApagada: true, contaExternaDesligada: true, contaLimpa: false },
        finalidade: null,
      },
      {
        acao: 'usuario.eliminado',
        entidade: 'usuario',
        entidade_id: professor.usuarioId,
        autor_usuario_id: null,
        autor_operador: OPERADOR,
        antes: { papel: 'professor', desativadoEm: null },
        depois: { sessoesApagadas: 0, vinculosApagados: 0, credencialApagada: false, contaExternaApagada: false, contaLimpa: true },
        finalidade: null,
      },
    ])
    for (const { em } of linhas) expect((em as Date).getTime()).toBeGreaterThanOrEqual(inicio.getTime())
    const texto = JSON.stringify(linhas)
    for (const proibido of [matricula, 'Lara Sintética', professor.email, professor.nome]) expect(texto.includes(proibido), proibido).toBe(false)
  })

  it('borda: a coordenação desliga a conta Google de uma professora ativa, que continua ativa; o próprio usuário, id inválido, sem ligação ou de outra escola dão NAO_ENCONTRADO', async () => {
    const escolaA = await bancada.escola()
    const escolaB = await bancada.escola()
    const coordenacao = await bancada.sessao(escolaA, 'coordenador')
    const camila = await pessoa(escolaA)
    const ligacao = await ligarContaExterna(escolaA, camila.usuarioId)
    const deB = await pessoa(escolaB)
    await ligarContaExterna(escolaB, deB.usuarioId)

    await pela(coordenacao, () => servico.desligarContaExterna(camila.usuarioId))

    expect(await contar('conta_externa', escolaA, camila.usuarioId)).toBe(0)
    const { rows: ativa } = await bancada.pool.query('select desativado_em from usuario where id = $1', [camila.usuarioId])
    expect(ativa).toEqual([{ desativado_em: null }])
    expect(await auditoriaDoCiclo(escolaA)).toEqual([
      expect.objectContaining({ acao: 'conta_externa.desligada', entidade_id: ligacao, antes: { usuarioId: camila.usuarioId, provedor: 'google' }, depois: null }),
    ])
    await esperarNaoEncontrado(pela(coordenacao, () => servico.desligarContaExterna(camila.usuarioId)))
    await esperarNaoEncontrado(pela(coordenacao, () => servico.desligarContaExterna(deB.usuarioId)))
    await esperarNaoEncontrado(pela(coordenacao, () => servico.desligarContaExterna('1837')))
    await esperarNaoEncontrado(pela(coordenacao, () => servico.desativar(coordenacao.usuarioId)))
    await esperarNaoEncontrado(pela(coordenacao, () => servico.eliminar(coordenacao.usuarioId)))
    expect(await contar('conta_externa', escolaB, deB.usuarioId)).toBe(1)
    expect(await contar('usuario', escolaA, coordenacao.usuarioId)).toBe(1)
  })
})
