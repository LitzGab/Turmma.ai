// Violações de propósito. Toda linha marcada com "reprova:" precisa sair com as regras citadas,
// uma vez cada; linha sem marca não pode sair com nenhuma guarda.
declare const logger: Record<'info' | 'warn' | 'error' | 'verbose', (...argumentos: unknown[]) => void>
declare const aluno: { id: string; turmaId: string }
declare const alunos: { id: string }[]
declare const avaliacaoId: string
declare const err: Error
declare const texto: string

logger.info({ ...aluno }) // reprova: guardas/log-sem-conteudo-montado
logger.info({ evento: 'teste', aluno: { ...aluno } }) // reprova: guardas/log-sem-conteudo-montado
logger.info(`correção da avaliação ${avaliacaoId}`) // reprova: guardas/log-sem-conteudo-montado
logger.verbose(`correção da avaliação ${avaliacaoId}`) // reprova: guardas/log-sem-conteudo-montado
logger.warn({ evento: 'teste', tipo: `avaliação ${avaliacaoId}` }) // reprova: guardas/log-sem-conteudo-montado, guardas/log-sem-dado-pessoal
logger.error('correção da avaliação ' + avaliacaoId) // reprova: guardas/log-sem-conteudo-montado
logger.info('avaliação %s corrigida', avaliacaoId) // reprova: guardas/log-sem-conteudo-montado
logger.info({ evento: 'teste', tipo: JSON.stringify(aluno) }) // reprova: guardas/log-sem-conteudo-montado, guardas/log-sem-dado-pessoal
logger.info({ evento: 'teste', tipo: String.raw`${avaliacaoId}` }) // reprova: guardas/log-sem-conteudo-montado, guardas/log-sem-dado-pessoal
logger.info({ evento: 'teste', tipo: alunos.map((item) => item.id) }) // reprova: guardas/log-sem-conteudo-montado, guardas/log-sem-dado-pessoal
logger.info(...[aluno]) // reprova: guardas/log-sem-conteudo-montado
logger.info(aluno) // reprova: guardas/log-sem-conteudo-montado
logger.warn(texto) // reprova: guardas/log-sem-conteudo-montado
logger.error({ evento: 'teste' }, err.message) // reprova: guardas/log-sem-conteudo-montado
const { info } = logger // reprova: guardas/log-sem-conteudo-montado
info({ evento: 'solto' })
