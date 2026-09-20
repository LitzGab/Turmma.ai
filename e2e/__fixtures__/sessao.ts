import { hash, type Algorithm } from '@node-rs/argon2'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { Secret, TOTP } from 'otpauth'
import { Client } from 'pg'
import { lerAmbienteDeTeste, urlDoBancoDeTeste, valorObrigatorio } from '../../tools/ci/compose.ts'

/**
 * As pessoas do e2e, criadas direto no Postgres do compose de teste, pelos mesmos campos do seed sintético
 * (`ops:sessao-sintetica`, tarefa 2.0): rede, escola, ano letivo em curso, conta da equipe e usuário.
 *
 * Tudo é sintético, com nome inventado e e-mail no domínio reservado `.invalid`, que não recebe mensagem: nenhum
 * dado de pessoa de verdade entra em ambiente de teste (regra 20, item 17). A API não tem rota que crie escola
 * (RF1), e por isso o seed é pelo banco, como nos testes de integração.
 */
export interface EquipeDeTeste {
  readonly escolaId: string
  readonly escolaNome: string
  /** A conta é global e vale em todas as escolas da pessoa: é por ela que se cria o segundo vínculo. */
  readonly contaId: string
  readonly usuarioId: string
  readonly nome: string
  readonly email: string
  readonly senha: string
}

export interface UsuarioDeTeste {
  readonly escolaId: string
  readonly escolaNome: string
  readonly usuarioId: string
}

/** `Algorithm.Argon2id`: o enum do pacote é `const` e ambiente, e não se lê com `isolatedModules`. */
const ARGON2ID = 2 as Algorithm

/** O hash guardado leva os próprios parâmetros, e a API confere com eles: aqui vale o mínimo da OWASP, como no `.env.example`. */
async function hashDaSenha(senha: string): Promise<string> {
  const ambiente = lerAmbienteDeTeste()
  return hash(senha, {
    algorithm: ARGON2ID,
    memoryCost: Number(valorObrigatorio(ambiente, 'LOGIN_ARGON2_MEMORIA_KIB')),
    timeCost: Number(valorObrigatorio(ambiente, 'LOGIN_ARGON2_ITERACOES')),
    parallelism: 1,
  })
}

async function comBanco<T>(tarefa: (banco: Client) => Promise<T>): Promise<T> {
  const banco = new Client({ connectionString: urlDoBancoDeTeste() })
  await banco.connect()
  try {
    return await tarefa(banco)
  } finally {
    await banco.end()
  }
}

async function id(banco: Client, instrucao: string, parametros: unknown[]): Promise<string> {
  const { rows } = await banco.query<{ id: string }>(instrucao, parametros)
  const criado = rows[0]?.id
  if (criado === undefined) throw new Error(`o seed do e2e não criou a linha: ${instrucao}`)
  return criado
}

/**
 * Uma escola nova, com ano letivo em curso, e uma pessoa de equipe nela, com senha. É o que a entrada por e-mail
 * precisa (RF6): a conta é global, o usuário é da escola, e a guarda de sessão lê os dois.
 *
 * Cada chamada cria a própria escola, para dois testes em paralelo nunca disputarem a mesma conta.
 */
export async function criarEquipeComSenha(papel: 'professor' | 'coordenador' = 'professor'): Promise<EquipeDeTeste> {
  const marca = randomUUID()
  // Nome de escola e de pessoa únicos: é o que deixa um teste afirmar que a tela não mostra a pessoa do teste ao lado,
  // nem a anterior no mesmo Chromebook.
  const escolaNome = `Colégio sintético ${marca.slice(0, 8)}`
  const nome = `${papel === 'professor' ? 'Professora' : 'Coordenadora'} sintética ${marca.slice(0, 8)}`
  const email = `${papel}-${marca}@educa.invalid`
  const senha = `senha-sintetica-${marca}`
  const senhaHash = await hashDaSenha(senha)

  return comBanco(async (banco) => {
    const redeId = await id(banco, "insert into rede (nome, tipo) values ('Rede sintética do e2e', 'independente') returning id", [])
    const escolaId = await id(banco, 'insert into escola (rede_id, nome, slug) values ($1, $2, $3) returning id', [redeId, escolaNome, `e2e-${marca}`])
    await banco.query("insert into ano_letivo (escola_id, ano, inicio, fim, situacao) values ($1, 2026, '2026-02-01', '2026-12-18', 'em_curso')", [escolaId])
    const contaId = await id(banco, 'insert into conta (email, senha_hash) values ($1, $2) returning id', [email, senhaHash])
    const usuarioId = await id(banco, 'insert into usuario (escola_id, conta_id, papel, nome) values ($1, $2, $3, $4) returning id', [escolaId, contaId, papel, nome])
    return { escolaId, escolaNome, contaId, usuarioId, nome, email, senha }
  })
}

/**
 * Outra escola, com outro usuário ativo da mesma conta: é assim que nasce a professora de rede pública que dá aula
 * em duas escolas (regra 50, item 13; regra 60, item 8a), e é o que leva o login à etapa `escolher`.
 */
export async function criarUsuarioEmOutraEscola(contaId: string, papel: 'professor' | 'coordenador' = 'professor'): Promise<UsuarioDeTeste> {
  const marca = randomUUID()
  const escolaNome = `Escola sintética da outra rede ${marca.slice(0, 8)}`

  return comBanco(async (banco) => {
    const redeId = await id(banco, "insert into rede (nome, tipo) values ('Outra rede sintética do e2e', 'prefeitura') returning id", [])
    const escolaId = await id(banco, 'insert into escola (rede_id, nome, slug) values ($1, $2, $3) returning id', [redeId, escolaNome, `e2e-outra-${marca}`])
    await banco.query("insert into ano_letivo (escola_id, ano, inicio, fim, situacao) values ($1, 2026, '2026-02-01', '2026-12-18', 'em_curso')", [escolaId])
    const usuarioId = await id(banco, 'insert into usuario (escola_id, conta_id, papel, nome) values ($1, $2, $3, $4) returning id', [
      escolaId,
      contaId,
      papel,
      'Professora sintética na outra escola',
    ])
    return { escolaId, escolaNome, usuarioId }
  })
}

/** Uma escola sintética, com o endereço dela: é o que a tela `/e/:slug` abre. */
export interface EscolaDeTeste {
  readonly escolaId: string
  readonly escolaNome: string
  readonly slug: string
}

/** O aluno do endereço da escola (RF7): matrícula e senha, sem conta e sem e-mail (regra 20, item 2). */
export interface AlunoDeTeste extends EscolaDeTeste {
  readonly usuarioId: string
  readonly nome: string
  readonly matricula: string
  readonly senha: string
}

/** O convite do primeiro coordenador (7.0), como o `ops:convite-coordenador` o cria, mas direto no banco. */
export interface ConviteDeTeste extends EscolaDeTeste {
  /** O token do link, que só existe aqui: o banco guarda o SHA-256 dele. */
  readonly token: string
  readonly usuarioId: string
}

/** Uma escola nova, com rede, ano letivo em curso e endereço próprio. */
export async function criarEscolaSintetica(): Promise<EscolaDeTeste> {
  const marca = randomUUID()
  const escolaNome = `Colégio sintético ${marca.slice(0, 8)}`
  const slug = `e2e-${marca}`
  return comBanco(async (banco) => {
    const redeId = await id(banco, "insert into rede (nome, tipo) values ('Rede sintética do e2e', 'independente') returning id", [])
    const escolaId = await id(banco, 'insert into escola (rede_id, nome, slug) values ($1, $2, $3) returning id', [redeId, escolaNome, slug])
    await banco.query("insert into ano_letivo (escola_id, ano, inicio, fim, situacao) values ($1, 2026, '2026-02-01', '2026-12-18', 'em_curso')", [escolaId])
    return { escolaId, escolaNome, slug }
  })
}

/**
 * Um aluno com matrícula e senha na escola dada (ou numa nova). A matrícula pode repetir entre escolas de propósito:
 * é com isso que o teste de isolamento prova que a senha de uma não abre a outra (RF7, regra 60, item 6).
 */
export async function criarAlunoComMatricula(opcoes: { escola?: EscolaDeTeste; matricula?: string; senha?: string } = {}): Promise<AlunoDeTeste> {
  const marca = randomUUID()
  const escola = opcoes.escola ?? (await criarEscolaSintetica())
  const matricula = opcoes.matricula ?? String(Date.now()).slice(-8)
  const senha = opcoes.senha ?? `senha-sintetica-${marca}`
  const nome = `Aluno sintético ${marca.slice(0, 8)}`
  const senhaHash = await hashDaSenha(senha)
  return comBanco(async (banco) => {
    const usuarioId = await id(banco, "insert into usuario (escola_id, papel, nome) values ($1, 'aluno', $2) returning id", [escola.escolaId, nome])
    await banco.query('insert into credencial_matricula (escola_id, usuario_id, matricula, senha_hash) values ($1, $2, $3, $4)', [escola.escolaId, usuarioId, matricula, senhaHash])
    return { ...escola, usuarioId, nome, matricula, senha }
  })
}

/** O domínio Google ou o tenant Microsoft que a escola liberou (13.0): é dado da instituição, não de pessoa. */
export async function liberarProvedorDaEscola(escolaId: string, provedor: 'google' | 'microsoft', valor: string): Promise<void> {
  await comBanco(async (banco) => {
    await banco.query('insert into provedor_escola (escola_id, provedor, valor) values ($1, $2, $3)', [escolaId, provedor, valor])
  })
}

/**
 * A ligação entre a conta do provedor e o usuário da escola (RF10): sem ela, o aluno com conta válida do domínio é
 * recusado. Guarda só provedor e identificador estável, nunca e-mail, nome ou foto.
 */
export async function ligarContaExterna(escolaId: string, usuarioId: string, chave: { provedor: 'google' | 'microsoft'; sujeito: string; tenant?: string }): Promise<void> {
  await comBanco(async (banco) => {
    await banco.query('insert into conta_externa (escola_id, usuario_id, provedor, tenant, sujeito) values ($1, $2, $3, $4, $5)', [
      escolaId,
      usuarioId,
      chave.provedor,
      chave.tenant ?? null,
      chave.sujeito,
    ])
  })
}

/**
 * Um convite de coordenador válido por 72 h, na escola dada ou numa nova.
 *
 * - Sem `conta`, a conta nasce sem senha, como a de quem nunca usou o sistema: o aceite define a senha e leva ao
 *   segundo fator.
 * - Com `conta`, o convite é para quem já trabalha em outra escola cliente: o aceite não troca a senha dela e leva ao
 *   login, com o bilhete.
 */
export async function criarConviteDeCoordenador(opcoes: { conta?: EquipeDeTeste; expirado?: boolean; revogado?: boolean } = {}): Promise<ConviteDeTeste> {
  const marca = randomUUID()
  const escola = await criarEscolaSintetica()
  // 32 bytes em base64url, como o `ops:convite-coordenador`; o banco guarda só o SHA-256.
  const token = randomBytes(32).toString('base64url')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const expiraEm = opcoes.expirado ? new Date(Date.now() - 60_000) : new Date(Date.now() + 72 * 60 * 60 * 1_000)
  return comBanco(async (banco) => {
    const contaId =
      opcoes.conta?.contaId ?? (await id(banco, 'insert into conta (email) values ($1) returning id', [`coordenador-${marca}@educa.invalid`]))
    const usuarioId = await id(banco, "insert into usuario (escola_id, conta_id, papel, nome, desativado_em) values ($1, $2, 'coordenador', $3, now()) returning id", [
      escola.escolaId,
      contaId,
      `Coordenadora sintética ${marca.slice(0, 8)}`,
    ])
    await banco.query("insert into convite (escola_id, token_hash, tipo, usuario_id, expira_em, revogado_em) values ($1, $2, 'coordenador', $3, $4, $5)", [
      escola.escolaId,
      tokenHash,
      usuarioId,
      expiraEm,
      opcoes.revogado === true ? new Date() : null,
    ])
    return { ...escola, token, usuarioId }
  })
}

/**
 * O código que um aplicativo autenticador mostraria para aquele segredo. O e2e faz aqui o papel do KeePassXC do
 * computador da coordenadora: o `otpauth` com os valores padrão é o mesmo TOTP que a API confere (SHA1, 6 dígitos,
 * 30 s; Tech Spec, seção 5, "TOTP").
 *
 * `deslocamentoSegundos` pede o código de um passo à frente: a ativação grava o passo usado, e só um passo maior
 * entra depois (`mfa_ultimo_passo`), sem o teste esperar meio minuto de relógio real.
 */
export function codigoDoAutenticador(segredoBase32: string, deslocamentoSegundos = 0): string {
  return new TOTP({ secret: Secret.fromBase32(segredoBase32) }).generate({ timestamp: Date.now() + deslocamentoSegundos * 1_000 })
}
