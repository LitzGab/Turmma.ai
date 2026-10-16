import { ESCOLAS, escolaDe } from './escola'
import { criarFatia } from './demo/nucleo'

/* A ESCOLA ATIVA (20/09/2026) — a professora que dá aula em duas escolas escolhe uma no alto da lateral, e a escolha
   vale para o app inteiro: a lateral, a barra do celular e a ordem dos grupos no menu "Para qual turma" da caixa de
   pedido leem daqui. Aluno e coordenação têm uma escola só e não passam por este arquivo.

   12ª rodada: mora numa fatia do estado da demonstração (dados/demo/nucleo.ts): sobrevive a recarregar, anda junto
   nas duas abas e zera em "Recomeçar a demonstração". No PRODUTO a escola ativa é escopo de sessão no servidor
   (regra 10): cada escola tem o seu material e as suas turmas, e nada passa de uma para a outra. */

const fatia = criarFatia<string>('escola-ativa', ESCOLAS[0].id)

/** A escola escolhida no alto da lateral (o objeto de ESCOLAS, não só o id). */
export function useEscolaAtiva() {
  return escolaDe(fatia.useValor())
}

export function definirEscolaAtiva(id: string) {
  if (!ESCOLAS.some((e) => e.id === id)) return
  fatia.mudar((atual) => (atual === id ? atual : id))
}
