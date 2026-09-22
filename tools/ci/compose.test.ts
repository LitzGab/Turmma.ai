import { describe, expect, it } from 'vitest'
import { ARGUMENTOS_COMPOSE, etapasDeEncerramento } from './compose.ts'

// O caminho de falha dos scripts da esteira não tinha teste, e é justamente ele que sobra para
// diagnosticar um vermelho que não reproduz na máquina de quem escreveu o teste.

describe('encerramento dos scripts da esteira', () => {
  const argumentosDe = (nome: string, codigo: number, derrubar?: boolean) =>
    etapasDeEncerramento(codigo, derrubar)
      .filter((etapa) => etapa.nome === nome)
      .flatMap((etapa) => etapa.argumentos ?? [])

  it('o despejo da falha carimba a hora e alcança a execução inteira', () => {
    // O argv **inteiro**, não "contém". Três edits plausíveis de quem for enxugar as 24,5 mil linhas
    // passariam por qualquer asserção de presença, e os três matam a correção em silêncio:
    //   `--tail` duplicado, porque o Docker usa o último e `indexOf` acha o primeiro;
    //   lista de serviços no fim, que some com o log dos doze serviços nossos — a justificativa inteira;
    //   projeto trocado, que faz o despejo falar com o compose de desenvolvimento.
    //
    // O 4.000 é medido, não redondo: o maior log de serviço nosso numa execução de `test:infra` de
    // 21/09/2026 foi 3.899 linhas (`api-2`). Ver `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`.
    // Escrito aqui à mão de propósito: lido de `compose.ts`, baixar a régua deixaria tudo verde.
    expect(argumentosDe('logs dos serviços', 1)).toEqual([
      ...ARGUMENTOS_COMPOSE,
      'logs',
      '--no-color',
      '--timestamps',
      '--tail',
      '4000',
    ])
  })

  it('não despeja log nenhum quando passou: log de execução verde é ruído', () => {
    expect(argumentosDe('logs dos serviços', 0)).toEqual([])
  })

  it('despeja ANTES de derrubar: invertido, o `down --volumes` já levou os contêineres e o despejo sai vazio', () => {
    // A ordem é a regra, não um detalhe de escrita. Afirmar só a presença dos dois passos deixaria
    // passar a inversão, e nela a correção inteira vira letra morta sem nenhum vermelho.
    expect(etapasDeEncerramento(1).map((etapa) => etapa.nome)).toEqual(['logs dos serviços', 'derrubar o ambiente'])
    expect(etapasDeEncerramento(1, false).map((etapa) => etapa.nome)).toEqual(['logs dos serviços'])
    expect(etapasDeEncerramento(0).map((etapa) => etapa.nome)).toEqual(['derrubar o ambiente'])
    expect(etapasDeEncerramento(0, false)).toEqual([])
  })

  it('derruba o ambiente nos dois casos, e só não derruba quando quem chamou pede para manter', () => {
    for (const codigo of [0, 1]) {
      expect(argumentosDe('derrubar o ambiente', codigo)).toContain('down')
      expect(argumentosDe('derrubar o ambiente', codigo, false)).toEqual([])
    }
  })

  it('todo passo de encerramento fala com o compose de teste, nunca com o ambiente de desenvolvimento', () => {
    for (const etapa of etapasDeEncerramento(1)) {
      expect(etapa.comando).toBe('docker')
      expect(etapa.argumentos?.slice(0, ARGUMENTOS_COMPOSE.length)).toEqual([...ARGUMENTOS_COMPOSE])
    }
  })
})
