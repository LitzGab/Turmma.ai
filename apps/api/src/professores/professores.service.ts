import { estadoDoProfessor, type Banco } from '@educa/nucleo'
import {
  esquemaRespostaConviteDeProfessor,
  esquemaRespostaListaDeProfessores,
  type ConsultaPaginada,
  type PedidoCadastrarProfessor,
  type RespostaConviteDeProfessor,
  type RespostaListaDeProfessores,
} from '@educa/shared'
import { paginarPor } from '../estrutura/entrada.js'
import { cadastrarProfessor, refazerConviteDeProfessor, revogarConviteDeProfessor } from '../sessao/convite-de-professor.service.js'
import { ProfessoresRepository } from './professores.repository.js'

/**
 * Os professores da escola pela coordenação (A1, tarefa 3.0, RF6): cadastrar, listar, e refazer e revogar o convite. A
 * escrita é o caso de uso do convite de professor, em `sessao/convite-de-professor.service.ts` (`cadastrarProfessor`,
 * `refazerConviteDeProfessor`, `revogarConviteDeProfessor`), que é quem alcança a conta global; aqui ficam a lista e os
 * contratos de saída.
 *
 * - O token sai só na resposta do cadastro e do refazer, pelo contrato estrito; a lista não o traz, nem o link, nem o
 *   e-mail, nem nada que diga se a conta do e-mail já existia (E8, E11).
 * - A lista não audita: são professores da escola, não aluno, e o nome é o que a própria coordenação digitou.
 * - Nada disto loga: o nome, o e-mail e o token nunca vão a log, e o erro sai pelo filtro global só com ids.
 */
export class ProfessoresService {
  constructor(private readonly banco: Banco) {}

  async cadastrar(pedido: PedidoCadastrarProfessor): Promise<RespostaConviteDeProfessor> {
    return esquemaRespostaConviteDeProfessor.parse(await cadastrarProfessor(this.banco, pedido))
  }

  async listar(consulta: ConsultaPaginada): Promise<RespostaListaDeProfessores> {
    const lidos = await new ProfessoresRepository(this.banco).pagina(consulta)
    const pagina = paginarPor(lidos, consulta.limite, (lido) => lido.usuarioId)
    return esquemaRespostaListaDeProfessores.parse({
      ...pagina,
      itens: pagina.itens.map((lido) => ({ usuarioId: lido.usuarioId, nome: lido.nome, estado: estadoDoProfessor(lido) })),
    })
  }

  async refazerConvite(usuarioId: string): Promise<RespostaConviteDeProfessor> {
    return esquemaRespostaConviteDeProfessor.parse(await refazerConviteDeProfessor(this.banco, usuarioId))
  }

  async revogarConvite(usuarioId: string): Promise<void> {
    await revogarConviteDeProfessor(this.banco, usuarioId)
  }
}
