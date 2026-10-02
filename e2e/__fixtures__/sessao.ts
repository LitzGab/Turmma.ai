import { hash, type Algorithm } from '@node-rs/argon2'
import { randomBytes, randomUUID } from 'node:crypto'
import { Secret, TOTP } from 'otpauth'
import { Client } from 'pg'
import { BYTES_DO_TOKEN_DE_CONVITE, hashDoToken } from '../../apps/api/src/sessao/hash-do-token.ts'
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
  /** O nome da rede da escola, único por chamada: é o que o seletor de escola mostra embaixo do nome dela (P30). */
  readonly redeNome: string
  /** O endereço da escola, por onde entram o aluno e quem usa a conta da escola (RF7, RF8). */
  readonly slug: string
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
  readonly redeNome: string
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
export async function criarEquipeComSenha(papel: 'professor' | 'coordenador' = 'professor', opcoes: { readonly semAnoLetivo?: boolean } = {}): Promise<EquipeDeTeste> {
  const marca = randomUUID()
  // Nome de escola e de pessoa únicos: é o que deixa um teste afirmar que a tela não mostra a pessoa do teste ao lado,
  // nem a anterior no mesmo Chromebook.
  const escolaNome = `Colégio sintético ${marca.slice(0, 8)}`
  const redeNome = `Rede sintética do e2e ${marca.slice(0, 8)}`
  const slug = `e2e-${marca}`
  const nome = `${papel === 'professor' ? 'Professora' : 'Coordenadora'} sintética ${marca.slice(0, 8)}`
  const email = `${papel}-${marca}@educa.invalid`
  const senha = `senha-sintetica-${marca}`
  const senhaHash = await hashDaSenha(senha)

  return comBanco(async (banco) => {
    const redeId = await id(banco, "insert into rede (nome, tipo) values ($1, 'independente') returning id", [redeNome])
    const escolaId = await id(banco, 'insert into escola (rede_id, nome, slug) values ($1, $2, $3) returning id', [redeId, escolaNome, slug])
    // Sem ano letivo é a escola como o painel da operação a cria: a coordenação começa por ele (Estrutura, 13.0).
    if (opcoes.semAnoLetivo !== true)
      await banco.query("insert into ano_letivo (escola_id, ano, inicio, fim, situacao) values ($1, 2026, '2026-02-01', '2026-12-18', 'em_curso')", [escolaId])
    const contaId = await id(banco, 'insert into conta (email, senha_hash) values ($1, $2) returning id', [email, senhaHash])
    const usuarioId = await id(banco, 'insert into usuario (escola_id, conta_id, papel, nome) values ($1, $2, $3, $4) returning id', [escolaId, contaId, papel, nome])
    return { escolaId, escolaNome, redeNome, slug, contaId, usuarioId, nome, email, senha }
  })
}

/**
 * Outra escola, com outro usuário ativo da mesma conta: é assim que nasce a professora de rede pública que dá aula
 * em duas escolas (regra 50, item 13; regra 60, item 8a), e é o que leva o login à etapa `escolher`.
 */
export async function criarUsuarioEmOutraEscola(contaId: string, papel: 'professor' | 'coordenador' = 'professor'): Promise<UsuarioDeTeste> {
  const marca = randomUUID()
  const escolaNome = `Escola sintética da outra rede ${marca.slice(0, 8)}`
  const redeNome = `Outra rede sintética do e2e ${marca.slice(0, 8)}`

  return comBanco(async (banco) => {
    const redeId = await id(banco, "insert into rede (nome, tipo) values ($1, 'prefeitura') returning id", [redeNome])
    const escolaId = await id(banco, 'insert into escola (rede_id, nome, slug) values ($1, $2, $3) returning id', [redeId, escolaNome, `e2e-outra-${marca}`])
    await banco.query("insert into ano_letivo (escola_id, ano, inicio, fim, situacao) values ($1, 2026, '2026-02-01', '2026-12-18', 'em_curso')", [escolaId])
    const usuarioId = await id(banco, 'insert into usuario (escola_id, conta_id, papel, nome) values ($1, $2, $3, $4) returning id', [
      escolaId,
      contaId,
      papel,
      'Professora sintética na outra escola',
    ])
    return { escolaId, escolaNome, redeNome, usuarioId }
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

/**
 * A inatividade que a escola configurou (`PUT /v1/escola/sessao`, Tech Spec, seção 3), gravada direto no banco: é ela
 * que o `/v1/eu` devolve e que o relógio da aba usa. Cada escola escolhe a sua, e é por isso que o teste precisa de
 * uma diferente do padrão para provar que a tela lê o valor do servidor, e não um número fixo.
 */
export async function definirInatividadeDaEscola(escolaId: string, minutos: { equipe?: number; aluno?: number }): Promise<void> {
  await comBanco(async (banco) => {
    await banco.query('update escola set inatividade_equipe_min = coalesce($2, inatividade_equipe_min), inatividade_aluno_min = coalesce($3, inatividade_aluno_min) where id = $1', [
      escolaId,
      minutos.equipe ?? null,
      minutos.aluno ?? null,
    ])
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
  // O token e o hash pelas mesmas peças do `ops:convite-coordenador` e do aceite; o banco guarda só o hash.
  const token = randomBytes(BYTES_DO_TOKEN_DE_CONVITE).toString('base64url')
  const tokenHash = hashDoToken(token)
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
 * O usuário deixa a escola (a coordenação o desativa): a conta continua com a senha, sem usuário ativo nele. É a pessoa
 * que já trabalhou numa escola cliente e recebe o convite de outra.
 */
export async function desativarUsuario(usuarioId: string): Promise<void> {
  await comBanco(async (banco) => {
    await banco.query('update usuario set desativado_em = now() where id = $1', [usuarioId])
  })
}

/**
 * O operador revoga o convite da coordenação, depois do aceite e antes da primeira entrada (A0b, estado `aceito`), como
 * o painel faz: o convite usado ganha `revogado_em`, e o bilhete do aceite deixa de ativar. Só o convite daquele usuário
 * convidado, na escola dele.
 */
export async function revogarConvite(convite: Pick<ConviteDeTeste, 'escolaId' | 'usuarioId'>): Promise<void> {
  await comBanco(async (banco) => {
    await banco.query('update convite set revogado_em = now() where escola_id = $1 and usuario_id = $2 and revogado_em is null', [convite.escolaId, convite.usuarioId])
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

/** A turma com os vínculos que a coordenação alocou para o professor, como a tela "Turmas" do professor os recebe (RF4). */
export interface AlocacaoDeTeste {
  readonly turmaId: string
  readonly turmaNome: string
  /** Os ids dos vínculos criados, um por disciplina: é por eles que o teste procura dado desta escola na resposta de outra. */
  readonly vinculoIds: readonly string[]
  /** Um vínculo por disciplina, todos `pendente`: é o professor com duas disciplinas na mesma turma. */
  readonly disciplinas: readonly string[]
}

/**
 * Uma turma no ano em curso da escola, com um vínculo pendente por disciplina para aquele professor (RF3, RF4).
 *
 * Quem cria vínculo é a coordenação (regra 60, item 8a), e o banco exige que o autor seja usuário da mesma escola:
 * por isso a fixture cria também a coordenadora sintética que assina a alocação, como no onboarding de verdade.
 *
 * O nome da turma leva uma marca única: é com ele que o teste de isolamento afirma que nada da escola A aparece
 * depois da troca para a B.
 */
export async function criarAlocacaoDoProfessor(escolaId: string, usuarioId: string, disciplinas: readonly string[] = ['Matemática']): Promise<AlocacaoDeTeste> {
  const marca = randomUUID().slice(0, 8)
  const turmaNome = `7ºA sintética ${marca}`
  return comBanco(async (banco) => {
    const { rows: anos } = await banco.query<{ id: string }>("select id from ano_letivo where escola_id = $1 and situacao = 'em_curso'", [escolaId])
    const anoLetivoId = anos[0]?.id
    if (anoLetivoId === undefined) throw new Error('a escola do e2e não tem ano letivo em curso')
    const contaDaCoordenacao = await id(banco, 'insert into conta (email) values ($1) returning id', [`coordenacao-${randomUUID()}@educa.invalid`])
    const coordenacaoId = await id(banco, "insert into usuario (escola_id, conta_id, papel, nome) values ($1, $2, 'coordenador', 'Coordenação sintética') returning id", [
      escolaId,
      contaDaCoordenacao,
    ])
    const serieId = await id(banco, "insert into serie (escola_id, etapa, ano) values ($1, 'ef_anos_finais', 7) returning id", [escolaId])
    const turmaId = await id(banco, 'insert into turma (escola_id, ano_letivo_id, serie_id, nome) values ($1, $2, $3, $4) returning id', [escolaId, anoLetivoId, serieId, turmaNome])
    const vinculoIds: string[] = []
    for (const disciplina of disciplinas) {
      const disciplinaId = await id(banco, 'insert into disciplina (escola_id, nome) values ($1, $2) returning id', [escolaId, disciplina])
      vinculoIds.push(
        await id(
          banco,
          "insert into vinculo (escola_id, ano_letivo_id, usuario_id, turma_id, disciplina_id, papel, criado_por) values ($1, $2, $3, $4, $5, 'professor', $6) returning id",
          [escolaId, anoLetivoId, usuarioId, turmaId, disciplinaId, coordenacaoId],
        ),
      )
    }
    return { turmaId, turmaNome, disciplinas, vinculoIds }
  })
}

/** A turma do aluno aprovado, como o `GET /v1/minha-turma` a devolve. */
export interface TurmaDoAlunoDeTeste {
  readonly turmaId: string
  readonly turmaNome: string
  /** A série por extenso, como a tela a escreve ("2º ano do Ensino Médio"). */
  readonly serieNome: string
}

/**
 * Põe o aluno numa turma do ano em curso da escola dele, com o vínculo `confirmado`, como a aprovação da reivindicação o
 * deixa (8.0): é o que a "Minha turma" mostra. Atalho só do e2e: grava direto no banco, sem a decisão humana nem a
 * auditoria dela, e não serve de modelo para seed de demonstração, que monta a escola pela tela (D71).
 *
 * Sem `turma`, cria uma de 2º ano do Ensino Médio, para a série na tela não ser um valor que a tela pudesse ter fixo; com
 * ela, põe o aluno como colega de quem já está lá. O vínculo é assinado por uma coordenadora sintética da mesma escola.
 */
export async function colocarAlunoNaTurma(aluno: Pick<AlunoDeTeste, 'escolaId' | 'usuarioId'>, turma?: TurmaDoAlunoDeTeste): Promise<TurmaDoAlunoDeTeste> {
  return comBanco(async (banco) => {
    const { rows: anos } = await banco.query<{ id: string }>("select id from ano_letivo where escola_id = $1 and situacao = 'em_curso'", [aluno.escolaId])
    const anoLetivoId = anos[0]?.id
    if (anoLetivoId === undefined) throw new Error('a escola do e2e não tem ano letivo em curso')
    const contaDaCoordenacao = await id(banco, 'insert into conta (email) values ($1) returning id', [`coordenacao-${randomUUID()}@educa.invalid`])
    const coordenacaoId = await id(banco, "insert into usuario (escola_id, conta_id, papel, nome) values ($1, $2, 'coordenador', 'Coordenação sintética') returning id", [
      aluno.escolaId,
      contaDaCoordenacao,
    ])
    let destino = turma
    if (destino === undefined) {
      const turmaNome = `2ºB sintética ${randomUUID().slice(0, 8)}`
      // A série é única por escola: o segundo aluno da mesma escola, numa turma nova, usa a mesma 2ª série.
      const serieId = await id(
        banco,
        "insert into serie (escola_id, etapa, ano) values ($1, 'em', 2) on conflict (escola_id, etapa, ano) do update set ano = excluded.ano returning id",
        [aluno.escolaId],
      )
      const turmaId = await id(banco, 'insert into turma (escola_id, ano_letivo_id, serie_id, nome) values ($1, $2, $3, $4) returning id', [aluno.escolaId, anoLetivoId, serieId, turmaNome])
      destino = { turmaId, turmaNome, serieNome: '2º ano do Ensino Médio' }
    }
    await banco.query(
      "insert into vinculo (escola_id, ano_letivo_id, usuario_id, turma_id, papel, estado, decidido_em, criado_por) values ($1, $2, $3, $4, 'aluno', 'confirmado', now(), $5)",
      [aluno.escolaId, anoLetivoId, aluno.usuarioId, destino.turmaId, coordenacaoId],
    )
    return destino
  })
}

/**
 * Encerra as sessões abertas de uma pessoa, como a coordenação faz ao desativar alguém ou como o expurgo faz com a
 * sessão vencida: a requisição seguinte da aba já não vale (RF5, Tech Spec, seção 5, "Requisição").
 */
export async function encerrarSessoesDoUsuario(usuarioId: string): Promise<void> {
  await comBanco(async (banco) => {
    await banco.query("update sessao set encerrada_em = now(), motivo = 'desativacao' where usuario_id = $1 and encerrada_em is null", [usuarioId])
  })
}

/** A estrutura que a coordenação já montou, gravada direto no banco: série, disciplina e turmas do ano em curso. */
export interface EstruturaDeTeste {
  readonly anoLetivoId: string
  readonly disciplina: { readonly id: string; readonly nome: string }
  readonly turmas: ReadonlyArray<{ readonly id: string; readonly nome: string }>
}

/**
 * Uma série de 7º ano, uma disciplina e as turmas dadas, no ano em curso da escola, como a Estrutura (13.0) as criaria.
 * Atalho do e2e para o teste que não é sobre criar: nomes com uma marca única, para o teste de isolamento procurá-los.
 * As turmas nascem na ordem dada, que é a ordem em que a API as lista (o id segue a criação): quem prova a ordem da tela
 * as dá fora da ordem do nome.
 */
export async function montarEstruturaNoBanco(escolaId: string, turmas: readonly string[] = ['7A']): Promise<EstruturaDeTeste> {
  const marca = randomUUID().slice(0, 8)
  return comBanco(async (banco) => {
    const { rows: anos } = await banco.query<{ id: string }>("select id from ano_letivo where escola_id = $1 and situacao = 'em_curso'", [escolaId])
    const anoLetivoId = anos[0]?.id
    if (anoLetivoId === undefined) throw new Error('a escola do e2e não tem ano letivo em curso')
    const serieId = await id(banco, "insert into serie (escola_id, etapa, ano) values ($1, 'ef_anos_finais', 7) on conflict (escola_id, etapa, ano) do update set ano = excluded.ano returning id", [escolaId])
    const disciplinaNome = `Ciências sintética ${marca}`
    const disciplinaId = await id(banco, 'insert into disciplina (escola_id, nome) values ($1, $2) returning id', [escolaId, disciplinaNome])
    const criadas: Array<{ id: string; nome: string }> = []
    for (const turma of turmas) {
      const nome = `${turma} ${marca}`
      criadas.push({ id: await id(banco, 'insert into turma (escola_id, ano_letivo_id, serie_id, nome) values ($1, $2, $3, $4) returning id', [escolaId, anoLetivoId, serieId, nome]), nome })
    }
    return { anoLetivoId, disciplina: { id: disciplinaId, nome: disciplinaNome }, turmas: criadas }
  })
}

/**
 * Nomes na lista da turma, livres como a gravação da lista (2.0) os deixa ou já reivindicados (o aluno pediu o nome, 6.0),
 * na ordem dada. Nome e matrícula inventados pelo teste.
 */
export async function porNaListaDaTurma(
  escolaId: string,
  turmaId: string,
  nomes: ReadonlyArray<{ readonly nome: string; readonly matricula: string; readonly estado?: 'livre' | 'reivindicado' }>,
): Promise<void> {
  await comBanco(async (banco) => {
    const { rows } = await banco.query<{ ano_letivo_id: string }>('select ano_letivo_id from turma where escola_id = $1 and id = $2', [escolaId, turmaId])
    const anoLetivoId = rows[0]?.ano_letivo_id
    if (anoLetivoId === undefined) throw new Error('turma do e2e não encontrada')
    for (const { nome, matricula, estado = 'livre' } of nomes)
      await banco.query('insert into lista_nome (escola_id, ano_letivo_id, turma_id, nome, matricula, estado) values ($1, $2, $3, $4, $5, $6)', [
        escolaId,
        anoLetivoId,
        turmaId,
        nome,
        matricula,
        estado,
      ])
  })
}

/** Uma disciplina a mais na escola, direto no banco: criada depois, vem depois na lista da API. */
export async function criarDisciplinaNoBanco(escolaId: string, nome: string): Promise<string> {
  return comBanco((banco) => id(banco, 'insert into disciplina (escola_id, nome) values ($1, $2) returning id', [escolaId, nome]))
}

/** Apaga a disciplina direto no banco: é a outra pessoa da coordenação que a excluiu enquanto a tela estava aberta. */
export async function apagarDisciplinaNoBanco(escolaId: string, disciplinaId: string): Promise<void> {
  await comBanco(async (banco) => {
    await banco.query('delete from disciplina where escola_id = $1 and id = $2', [escolaId, disciplinaId])
  })
}

/** As sete séries do recorte (D43), do 6º ano ao 3º do Ensino Médio, na escola. */
export async function criarTodasAsSeriesNoBanco(escolaId: string): Promise<void> {
  await comBanco(async (banco) => {
    await banco.query(
      "insert into serie (escola_id, etapa, ano) select $1, etapa, ano from (values ('ef_anos_finais', 6), ('ef_anos_finais', 7), ('ef_anos_finais', 8), ('ef_anos_finais', 9), ('em', 1), ('em', 2), ('em', 3)) as recorte(etapa, ano) on conflict (escola_id, etapa, ano) do nothing",
      [escolaId],
    )
  })
}

/**
 * Um professor cadastrado pela coordenação (3.0), ainda sem entrar: o usuário inativo e o convite de professor, em aberto
 * (`pendente`) ou vencido. É o que a alocação da Estrutura oferece, ou não (13.0). O e-mail é do domínio reservado. O
 * `primeiroNome` é para o teste que prova a ordem da escolha: o nome inteiro continua com a marca única.
 */
export async function convidarProfessorNoBanco(
  escolaId: string,
  estado: 'pendente' | 'vencido',
  primeiroNome = 'Professor',
): Promise<{ readonly usuarioId: string; readonly nome: string }> {
  const marca = randomUUID()
  const nome = `${primeiroNome} ${estado === 'pendente' ? 'convidado' : 'de convite vencido'} ${marca.slice(0, 8)}`
  return comBanco(async (banco) => {
    const contaId = await id(banco, 'insert into conta (email) values ($1) returning id', [`professor-${marca}@educa.invalid`])
    const usuarioId = await id(banco, "insert into usuario (escola_id, conta_id, papel, nome, desativado_em) values ($1, $2, 'professor', $3, now()) returning id", [escolaId, contaId, nome])
    const expiraEm = estado === 'pendente' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000) : new Date(Date.now() - 60_000)
    await banco.query("insert into convite (escola_id, token_hash, tipo, usuario_id, expira_em) values ($1, $2, 'professor', $3, $4)", [
      escolaId,
      hashDoToken(randomBytes(BYTES_DO_TOKEN_DE_CONVITE).toString('base64url')),
      usuarioId,
      expiraEm,
    ])
    return { usuarioId, nome }
  })
}

/** O convite em aberto do professor passa do prazo, com a tela da coordenação aberta: ele deixa de ser alocável (13.0). */
export async function vencerConviteNoBanco(usuarioId: string): Promise<void> {
  await comBanco(async (banco) => {
    await banco.query("update convite set expira_em = now() - interval '1 minute' where usuario_id = $1 and tipo = 'professor' and usado_em is null and revogado_em is null", [usuarioId])
  })
}

/**
 * A turma sai da escola com os vínculos e os nomes da lista dela, direto no banco: outra pessoa da coordenação esvaziou e
 * excluiu a turma com esta tela aberta.
 */
export async function apagarTurmaNoBanco(escolaId: string, turmaId: string): Promise<void> {
  await comBanco(async (banco) => {
    await banco.query('delete from vinculo where escola_id = $1 and turma_id = $2', [escolaId, turmaId])
    await banco.query('delete from lista_nome where escola_id = $1 and turma_id = $2', [escolaId, turmaId])
    await banco.query('delete from turma where escola_id = $1 and id = $2', [escolaId, turmaId])
  })
}

/**
 * Um ano letivo da escola, direto no banco, na situação dada: o encerrado de antes da virada, o planejado ainda por abrir,
 * e o que outra pessoa da coordenação abriu com esta tela aberta.
 */
export async function criarAnoLetivoNoBanco(escolaId: string, ano: number, situacao: 'planejado' | 'em_curso' | 'encerrado'): Promise<void> {
  await comBanco(async (banco) => {
    await banco.query('insert into ano_letivo (escola_id, ano, inicio, fim, situacao) values ($1, $2, $3, $4, $5)', [escolaId, ano, `${String(ano)}-02-01`, `${String(ano)}-12-15`, situacao])
  })
}

/** A série sai da escola direto no banco: outra pessoa da coordenação a excluiu com o diálogo da turma nova aberto. */
export async function apagarSerieNoBanco(escolaId: string, etapa: 'ef_anos_finais' | 'em', ano: number): Promise<void> {
  await comBanco(async (banco) => {
    await banco.query('delete from serie where escola_id = $1 and etapa = $2 and ano = $3', [escolaId, etapa, ano])
  })
}
