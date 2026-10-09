import { hash, type Algorithm } from '@node-rs/argon2'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { Secret, TOTP } from 'otpauth'
import { Client } from 'pg'
import { montarEscolaComEntregas } from '../../e2e/__fixtures__/governanca.ts'
import { lerAmbienteDeTeste, urlDoBancoDeTeste, valorObrigatorio } from '../ci/compose.ts'
import { raizRepositorio } from '../ci/executar.ts'

// A vitrine: uma escola sintética montada no ambiente de teste (`educa-teste`), com um login de cada papel, para um
// agente abrir a tela de verdade numa página do Maestri e olhar o que a tarefa fez (D78). Não é seed do produto nem da
// demonstração (D71): mora só no banco de teste, que o portão recria, e some com ele.
//
// Os comandos estão em `tools/vitrine/vitrine.ts`.
//
// O miolo da escola vem da peça da governança do e2e (`e2e/__fixtures__/governanca.ts`): o que ela grava é o que os
// testes de tela já provam que a tela sabe mostrar. Aqui entram a escola com a coordenadora e os logins que a peça não
// dá (a professora e o aluno dela nascem sem senha). A escola não vem de `e2e/__fixtures__/sessao.ts` porque aquele
// arquivo só carrega pelo Playwright: ele importa `packages/shared` pelo fonte, e o `node` não resolve o `.js` de lá.
// Tudo sintético, com e-mail no domínio reservado `.invalid` (regra 20, item 17).

export const ARQUIVO_DA_VITRINE = '.processo/vitrine.json'

/** O período do TOTP da API (`apps/api/src/sessao/segundo-fator.ts`): 30 s, com um passo de janela para cada lado. */
const PERIODO_TOTP_MS = 30_000
const JANELA_TOTP = 1

export interface Vitrine {
  readonly montadaEm: string
  /** A web do ambiente de teste, vista da máquina: é o endereço que a página do Maestri abre. */
  readonly url: string
  readonly escola: { readonly id: string; readonly nome: string; readonly slug: string }
  readonly coordenacao: {
    readonly nome: string
    readonly email: string
    readonly senha: string
    /** O segredo do segundo fator em base32, ou `null` quando a API não estava de pé: aí a tela o configura na entrada. */
    readonly segredo: string | null
    /** O último passo do TOTP já usado: a API só aceita um passo maior (`mfa_ultimo_passo`). */
    readonly ultimoPasso: number
  }
  readonly professora: { readonly nome: string; readonly email: string; readonly senha: string; readonly turma: string; readonly disciplina: string }
  readonly aluno: { readonly nome: string; readonly matricula: string; readonly senha: string; readonly turma: string }
}

/** `Algorithm.Argon2id`: o enum do pacote é `const` e ambiente, e não se lê com `isolatedModules`. */
const ARGON2ID = 2 as Algorithm

/** O hash com os parâmetros do ambiente de teste, como o das peças do e2e: é com eles que a API confere a senha. */
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
  if (criado === undefined) throw new Error(`a vitrine não criou a linha: ${instrucao}`)
  return criado
}

interface Coordenadora {
  readonly escolaId: string
  readonly escolaNome: string
  readonly slug: string
  readonly usuarioId: string
  readonly nome: string
  readonly email: string
  readonly senha: string
}

/** A rede, a escola com ano letivo em curso e a coordenadora com senha: os mesmos campos de `criarEquipeComSenha`, do e2e. */
async function criarEscolaComCoordenadora(): Promise<Coordenadora> {
  const marca = randomUUID()
  const escolaNome = `Colégio sintético da vitrine ${marca.slice(0, 8)}`
  const slug = `vitrine-${marca}`
  const nome = `Coordenadora sintética ${marca.slice(0, 8)}`
  const email = `coordenador-${marca}@educa.invalid`
  const senha = `senha-sintetica-${marca}`
  const senhaHash = await hashDaSenha(senha)
  return comBanco(async (banco) => {
    const redeId = await id(banco, "insert into rede (nome, tipo) values ($1, 'independente') returning id", [`Rede sintética da vitrine ${marca.slice(0, 8)}`])
    const escolaId = await id(banco, 'insert into escola (rede_id, nome, slug) values ($1, $2, $3) returning id', [redeId, escolaNome, slug])
    await banco.query("insert into ano_letivo (escola_id, ano, inicio, fim, situacao) values ($1, 2026, '2026-02-01', '2026-12-18', 'em_curso')", [escolaId])
    const contaId = await id(banco, 'insert into conta (email, senha_hash) values ($1, $2) returning id', [email, senhaHash])
    const usuarioId = await id(banco, "insert into usuario (escola_id, conta_id, papel, nome) values ($1, $2, 'coordenador', $3) returning id", [escolaId, contaId, nome])
    return { escolaId, escolaNome, slug, usuarioId, nome, email, senha }
  })
}

/** Nomes na lista da turma, livres ou já pedidos por um aluno: é o que a aba "Alunos" da professora mostra para aprovar. */
async function porNaListaDaTurma(escolaId: string, turmaId: string, nomes: readonly { readonly nome: string; readonly matricula: string; readonly estado: 'livre' | 'reivindicado' }[]): Promise<void> {
  await comBanco(async (banco) => {
    for (const { nome, matricula, estado } of nomes)
      await banco.query(
        'insert into lista_nome (escola_id, ano_letivo_id, turma_id, nome, matricula, estado) select $1, ano_letivo_id, id, $3, $4, $5 from turma where escola_id = $1 and id = $2',
        [escolaId, turmaId, nome, matricula, estado],
      )
  })
}

/** A senha da professora que a governança criou sem senha: devolve o e-mail da conta dela, que é com o que ela entra. */
async function darSenhaAProfessora(escolaId: string, nome: string, senha: string): Promise<string> {
  const senhaHash = await hashDaSenha(senha)
  return comBanco(async (banco) => {
    const { rows } = await banco.query<{ email: string }>(
      "update conta set senha_hash = $3 where id = (select conta_id from usuario where escola_id = $1 and nome = $2 and papel = 'professor') returning email",
      [escolaId, nome, senhaHash],
    )
    const email = rows[0]?.email
    if (email === undefined) throw new Error(`a vitrine não achou a conta da professora "${nome}"`)
    return email
  })
}

/** A matrícula e a senha do aluno que a governança criou sem credencial (o aluno não tem conta nem e-mail; regra 20, item 2). */
async function darMatriculaAoAluno(escolaId: string, nome: string, matricula: string, senha: string): Promise<void> {
  const senhaHash = await hashDaSenha(senha)
  await comBanco(async (banco) => {
    const { rowCount } = await banco.query(
      "insert into credencial_matricula (escola_id, usuario_id, matricula, senha_hash) select $1, id, $3, $4 from usuario where escola_id = $1 and nome = $2 and papel = 'aluno'",
      [escolaId, nome, matricula, senhaHash],
    )
    if (rowCount !== 1) throw new Error(`a vitrine não achou o aluno "${nome}"`)
  })
}

export function passoDeAgora(agoraMs: number): number {
  return Math.floor(agoraMs / PERIODO_TOTP_MS)
}

/**
 * O passo do próximo código que a API aceita: o de agora, ou o seguinte ao último usado, porque o mesmo passo não entra
 * duas vezes. `esperarSegundos` é quanto falta para esse passo caber na janela de um passo à frente; zero na entrada
 * comum, e maior que zero só para quem pede três códigos no mesmo meio minuto.
 */
export function proximoPasso(agoraMs: number, ultimoPasso: number): { readonly passo: number; readonly esperarSegundos: number } {
  const agora = passoDeAgora(agoraMs)
  const passo = Math.max(agora, ultimoPasso + 1)
  const abreEm = (passo - JANELA_TOTP) * PERIODO_TOTP_MS
  return { passo, esperarSegundos: Math.max(0, Math.ceil((abreEm - agoraMs) / 1_000)) }
}

/** O código que o aplicativo autenticador mostraria naquele passo (SHA1, 6 dígitos, 30 s: os padrões do `otpauth`). */
export function codigoDoPasso(segredoBase32: string, passo: number): string {
  return new TOTP({ secret: Secret.fromBase32(segredoBase32) }).generate({ timestamp: passo * PERIODO_TOTP_MS })
}

async function pedir<T>(url: string, corpo: unknown, desafio?: string): Promise<T> {
  const resposta = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(desafio === undefined ? {} : { authorization: `Bearer ${desafio}` }) },
    body: JSON.stringify(corpo),
    signal: AbortSignal.timeout(20_000),
  })
  if (!resposta.ok) throw new Error(`POST ${new URL(url).pathname} respondeu ${String(resposta.status)}`)
  return (await resposta.json()) as T
}

/**
 * Ativa o segundo fator da coordenadora pelas rotas de verdade (entrar, configurar, ativar), como a tela faria no
 * primeiro acesso. Sem isso o agente teria de configurar pela tela toda vez que a vitrine é montada. Devolve o segredo
 * e o passo que a ativação gastou.
 */
export async function ativarSegundoFator(url: string, email: string, senha: string, agoraMs = Date.now()): Promise<{ segredo: string; passo: number }> {
  const entrada = await pedir<{ etapa: string; desafio?: string }>(`${url}/v1/sessao/email`, { email, senha })
  if (entrada.etapa !== 'configurar_mfa' || entrada.desafio === undefined) throw new Error(`a entrada da coordenação parou na etapa "${entrada.etapa}", e não em "configurar_mfa"`)
  const { segredo } = await pedir<{ segredo: string }>(`${url}/v1/conta/mfa/configurar`, {}, entrada.desafio)
  const passo = passoDeAgora(agoraMs)
  await pedir<unknown>(`${url}/v1/conta/mfa/ativar`, { codigo: codigoDoPasso(segredo, passo) }, entrada.desafio)
  return { segredo, passo }
}

export function urlDaWebDeTeste(): string {
  return `http://127.0.0.1:${valorObrigatorio(lerAmbienteDeTeste(), 'WEB_PORTA_HOST')}`
}

/**
 * Monta a escola: a coordenadora com senha, a governança inteira (duas turmas do 2º ano, três professoras, alunos,
 * listas corrigidas com o lote aprovado, uma versão adaptada esperando e o consumo de IA do mês), nomes livres na lista
 * da turma, e a senha da professora de Química do 2ºB e do aluno dela.
 *
 * `ativarMfa: false` é para quem só tem o banco de pé (o teste de integração): a coordenação fica sem segundo fator, e
 * a tela pede a configuração na entrada.
 */
export async function montarVitrine(opcoes: { readonly ativarMfa?: boolean; readonly url?: string } = {}): Promise<Vitrine> {
  const url = opcoes.url ?? urlDaWebDeTeste()
  const marca = randomUUID()
  const coordenadora = await criarEscolaComCoordenadora()
  const escola = await montarEscolaComEntregas(coordenadora.escolaId, coordenadora.usuarioId)
  await porNaListaDaTurma(coordenadora.escolaId, escola.turmas.doB.id, [
    { nome: 'Aluna Sintética Bia Vitrine', matricula: '90000001', estado: 'livre' },
    { nome: 'Aluno Sintético Davi Vitrine', matricula: '90000002', estado: 'livre' },
    { nome: 'Aluna Sintética Nina Vitrine', matricula: '90000003', estado: 'reivindicado' },
  ])

  const senhaDaProfessora = `senha-sintetica-${marca}`
  const emailDaProfessora = await darSenhaAProfessora(coordenadora.escolaId, escola.professoras.quimicaDoB, senhaDaProfessora)
  const matricula = String(Date.now()).slice(-8)
  const senhaDoAluno = `senha-sintetica-${randomUUID()}`
  await darMatriculaAoAluno(coordenadora.escolaId, escola.aluno, matricula, senhaDoAluno)

  const segundoFator = opcoes.ativarMfa === false ? null : await ativarSegundoFator(url, coordenadora.email, coordenadora.senha)

  return {
    montadaEm: new Date().toISOString(),
    url,
    escola: { id: coordenadora.escolaId, nome: coordenadora.escolaNome, slug: coordenadora.slug },
    coordenacao: { nome: coordenadora.nome, email: coordenadora.email, senha: coordenadora.senha, segredo: segundoFator?.segredo ?? null, ultimoPasso: segundoFator?.passo ?? 0 },
    professora: { nome: escola.professoras.quimicaDoB, email: emailDaProfessora, senha: senhaDaProfessora, turma: escola.turmas.doB.nome, disciplina: 'Química' },
    aluno: { nome: escola.aluno, matricula, senha: senhaDoAluno, turma: escola.turmas.doB.nome },
  }
}

/** O que o agente lê para entrar: um bloco por papel, com o endereço da entrada e o que digitar. */
export function resumo(vitrine: Vitrine): string {
  const { url, escola, coordenacao, professora, aluno } = vitrine
  const segundoFator =
    coordenacao.segredo === null
      ? 'segundo fator: ainda não configurado; a tela pede no primeiro acesso'
      : `segundo fator: node tools/vitrine/vitrine.ts codigo   (um código por entrada)`
  return [
    `Vitrine: escola sintética "${escola.nome}", montada em ${vitrine.montadaEm}`,
    `Web do ambiente de teste: ${url}`,
    '',
    `Coordenação — ${coordenacao.nome}`,
    `  entrada: ${url}/entrar`,
    `  e-mail: ${coordenacao.email}`,
    `  senha: ${coordenacao.senha}`,
    `  ${segundoFator}`,
    '',
    `Professora — ${professora.nome} (${professora.disciplina}, turma ${professora.turma})`,
    `  entrada: ${url}/entrar`,
    `  e-mail: ${professora.email}`,
    `  senha: ${professora.senha}`,
    '',
    `Aluno — ${aluno.nome} (turma ${aluno.turma})`,
    `  entrada: ${url}/e/${escola.slug}`,
    `  matrícula: ${aluno.matricula}`,
    `  senha: ${aluno.senha}`,
    '',
    'Tudo aqui é sintético e vive só no banco de teste: o portão que recria o banco apaga a escola, e aí é montar de novo.',
  ].join('\n')
}

function caminhoDoArquivo(raiz: string): string {
  return join(raiz, ARQUIVO_DA_VITRINE)
}

export function gravarVitrine(vitrine: Vitrine, raiz = raizRepositorio): void {
  const caminho = caminhoDoArquivo(raiz)
  mkdirSync(dirname(caminho), { recursive: true })
  writeFileSync(caminho, `${JSON.stringify(vitrine, null, 2)}\n`)
}

export function lerVitrine(raiz = raizRepositorio): Vitrine | null {
  const caminho = caminhoDoArquivo(raiz)
  return existsSync(caminho) ? (JSON.parse(readFileSync(caminho, 'utf8')) as Vitrine) : null
}

/** O portão da tarefa seguinte recria o banco: a escola do arquivo pode não existir mais. */
export async function escolaExiste(escolaId: string): Promise<boolean> {
  return comBanco(async (banco) => {
    const { rowCount } = await banco.query('select 1 from escola where id = $1', [escolaId])
    return rowCount === 1
  })
}
