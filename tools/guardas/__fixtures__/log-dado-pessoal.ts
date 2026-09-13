// Violações de propósito. Toda linha marcada com "reprova:" precisa sair com as regras citadas,
// uma vez cada; linha sem marca não pode sair com nenhuma guarda. Sob a chave `tipo`, o campo
// pessoal sai duas vezes: pelo nome e por não ser valor operacional.
declare const logger: Record<'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'log' | 'verbose' | 'child', (...argumentos: unknown[]) => void>
declare const aluno: { id: string; nome: string; turmaId: string; adaptacao: string }
declare const nome: string
declare const nota: { id: string; valor: number }
declare const mensagem: { id: string; conteudo: string }
declare const campo: 'x'
declare const condicao: boolean
declare const nivel: 'info'
declare const err: Error
declare const dados: object
declare const x: string

logger.info({ nome }) // reprova: guardas/log-sem-dado-pessoal
logger.info({ aluno: { matricula: '2026001' } }) // reprova: guardas/log-sem-dado-pessoal
logger.warn({ evento: 'teste', dados: { lista: [{ contato: { email: 'sintetico@exemplo.test' } }] } }) // reprova: guardas/log-sem-dado-pessoal
logger.debug({ nomeDoAluno: 'Enzo Martins' }) // reprova: guardas/log-sem-dado-pessoal
logger.info({ 'telefone': '0000-0000' }) // reprova: guardas/log-sem-dado-pessoal
logger.trace({ RESPOSTAS_DO_ALUNO: [] }) // reprova: guardas/log-sem-dado-pessoal
logger.info({ evento: 'teste', conversa: [], prompt: '' }) // reprova: guardas/log-sem-dado-pessoal, guardas/log-sem-dado-pessoal
logger.info({ diagnostico: 'x', laudo: 'y' }) // reprova: guardas/log-sem-dado-pessoal, guardas/log-sem-dado-pessoal
logger.error({ tipo: aluno.nome }) // reprova: guardas/log-sem-dado-pessoal, guardas/log-sem-dado-pessoal
logger.fatal({ tipo: nota.valor }) // reprova: guardas/log-sem-dado-pessoal, guardas/log-sem-dado-pessoal
logger.info({ tipo: mensagem.conteudo }) // reprova: guardas/log-sem-dado-pessoal, guardas/log-sem-dado-pessoal
logger.info({ tipo: aluno.adaptacao }) // reprova: guardas/log-sem-dado-pessoal, guardas/log-sem-dado-pessoal
logger.info({ tipo: nota.valor.toFixed(1) }) // reprova: guardas/log-sem-dado-pessoal, guardas/log-sem-dado-pessoal
logger.info({ tipo: aluno.nome.trim() }) // reprova: guardas/log-sem-dado-pessoal, guardas/log-sem-dado-pessoal
logger.info({ tipo: [aluno.nome].join() }) // reprova: guardas/log-sem-dado-pessoal, guardas/log-sem-dado-pessoal
logger.info({ tipo: -nota.valor }) // reprova: guardas/log-sem-dado-pessoal, guardas/log-sem-dado-pessoal
logger.info({ tipo: new Set([aluno.nome]) }) // reprova: guardas/log-sem-dado-pessoal, guardas/log-sem-dado-pessoal
logger.info({ tipo: condicao ? aluno.nome : '' }) // reprova: guardas/log-sem-dado-pessoal, guardas/log-sem-dado-pessoal
logger.info({ tipo: aluno.nome ?? '' }) // reprova: guardas/log-sem-dado-pessoal, guardas/log-sem-dado-pessoal
logger.info({ tipo: aluno.nome as string }) // reprova: guardas/log-sem-dado-pessoal, guardas/log-sem-dado-pessoal
logger.info({ tipo: aluno!.nome }) // reprova: guardas/log-sem-dado-pessoal, guardas/log-sem-dado-pessoal
logger.info({ tipo: aluno?.nome }) // reprova: guardas/log-sem-dado-pessoal, guardas/log-sem-dado-pessoal
logger.info({ tipo: String(aluno.nome) }) // reprova: guardas/log-sem-dado-pessoal, guardas/log-sem-dado-pessoal
logger.info({ tipo: 'turma '.concat(aluno.nome).trim() }) // reprova: guardas/log-sem-dado-pessoal, guardas/log-sem-dado-pessoal
logger.info({ tipo: aluno[campo].nome }) // reprova: guardas/log-sem-dado-pessoal, guardas/log-sem-dado-pessoal
logger.log({ nome }) // reprova: guardas/log-sem-dado-pessoal
logger['info']({ nome }) // reprova: guardas/log-sem-dado-pessoal
logger[nivel]({ nome }) // reprova: guardas/log-sem-dado-pessoal
logger.child({ nomeDoAluno: aluno.nome }) // reprova: guardas/log-sem-dado-pessoal, guardas/log-sem-dado-pessoal
console.dir({ nome }) // reprova: guardas/log-sem-dado-pessoal
console.table([{ nome }]) // reprova: guardas/log-sem-dado-pessoal

export class Servico {
  constructor(private readonly logger: { error(...argumentos: unknown[]): void }) {}

  falhar(): void {
    this.logger.error({ nome }) // reprova: guardas/log-sem-dado-pessoal
  }
}

logger.info({ evento: 'teste', aluno }) // reprova: guardas/log-sem-dado-pessoal
logger.info({ evento: 'teste', turma: { id: aluno.turmaId, alunos: [aluno] } }) // reprova: guardas/log-sem-dado-pessoal
logger.info({ evento: 'teste', valor: aluno.id }) // reprova: guardas/log-sem-dado-pessoal
logger.error({ evento: 'teste', erro: err.message }) // reprova: guardas/log-sem-dado-pessoal
logger.error({ evento: 'teste', erro: err.stack }) // reprova: guardas/log-sem-dado-pessoal
logger.error({ evento: 'teste', causa: dados }) // reprova: guardas/log-sem-dado-pessoal
logger.warn({ evento: 'teste', status: err.message }) // reprova: guardas/log-sem-dado-pessoal
logger.info({ evento: 'teste', alunoId: aluno }) // reprova: guardas/log-sem-dado-pessoal
logger.info({ evento: 'teste', alunoIds: [aluno] }) // reprova: guardas/log-sem-dado-pessoal
logger.info({ evento: 'teste', tipo: mensagem.id ? dados : 'x' }) // reprova: guardas/log-sem-dado-pessoal
logger.info({ evento: x }) // reprova: guardas/log-sem-dado-pessoal
logger.info({ evento: 'teste', criadoEm: aluno }) // reprova: guardas/log-sem-dado-pessoal
logger.info({ evento: 'teste', promptVersao: dados }) // reprova: guardas/log-sem-dado-pessoal
logger.info({ evento: 'teste', duracaoMs: Date.now() - aluno.turmaId.length }) // reprova: guardas/log-sem-dado-pessoal
logger.setBindings({ nome }) // reprova: guardas/log-sem-dado-pessoal
logger.info({ evento: 'teste', [aluno.nome]: 'presente' }) // reprova: guardas/log-sem-dado-pessoal
logger.warn(nome) // reprova: guardas/log-sem-dado-pessoal, guardas/log-sem-conteudo-montado
