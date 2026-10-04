import { consumoIa, type Banco, type ConsumoDeIa, type RegistroDeConsumo, type TransacaoBanco } from '@educa/nucleo'

/**
 * A porta `RegistroDeConsumo` sobre `consumo_ia` (regra 30, item 4). A escola é a do próprio registro, que o provedor
 * preenche com a do pedido (`PedidoDeGeracao.escolaId`, do contexto de quem pediu): não há leitura aqui, só a inserção
 * de uma linha na escola dela.
 *
 * `entrada` e `saida` chegam ausentes nas tarefas que levam texto livre de pessoa e são gravadas nulas; nas funções do
 * Tutor o banco recusa qualquer outra coisa (`consumo_ia_sem_conversa_de_pessoa`). Nada daqui vai a log.
 */
export class ConsumoRepository implements RegistroDeConsumo {
  constructor(private readonly banco: Banco | TransacaoBanco) {}

  async registrar(consumo: ConsumoDeIa): Promise<void> {
    await this.banco.insert(consumoIa).values({
      escolaId: consumo.escolaId,
      alunoId: consumo.alunoId ?? null,
      execucaoId: consumo.execucaoId ?? null,
      tarefa: consumo.tarefa,
      funcao: consumo.funcao,
      perfil: consumo.perfil,
      origem: consumo.origem,
      modelo: consumo.modelo,
      promptVersao: consumo.promptVersao,
      tokensDeEntrada: consumo.tokensDeEntrada,
      tokensDeSaida: consumo.tokensDeSaida,
      duracaoMs: consumo.duracaoMs,
      envioExterno: consumo.envioExterno,
      tentativas: consumo.tentativas,
      estado: consumo.estado,
      codigoDeErro: consumo.codigoDeErro ?? null,
      entrada: consumo.entrada ?? null,
      saida: consumo.saida ?? null,
      em: consumo.em,
    })
  }
}
