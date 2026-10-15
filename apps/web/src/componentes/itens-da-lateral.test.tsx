// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'
import { MENU_DA_PESSOA, NAVEGACAO, RODAPE_DA_LATERAL, SEU_TIME } from '../areas/navegacao'
import { classesDo, contraste, corDoToken, TEMAS } from '../__fixtures__/cor-das-classes'
import { ItemDaLateral, ListaDeItens, SecaoDoTime } from './itens-da-lateral'

/**
 * O lugar da lateral (`docs/interface.md` 11.1; D80, 12.0): o ícone de cada item, o aceso e o apagado, o trilho e "Seu time".
 * A cor que o navegador calcula, a medida de 52 px e a dica que aparece são do e2e (`e2e/casca.spec.ts`, `e2e/areas.spec.ts`);
 * aqui está o que o `jsdom` sabe: o nome acessível, o ícone decorativo, a família e as classes que carregam a regra.
 */
afterEach(cleanup)

const PAPEIS = ['professor', 'aluno', 'coordenador'] as const

function noEndereco(caminho: string, filho: React.ReactNode): React.ReactElement {
  return <Router hook={memoryLocation({ path: caminho }).hook}>{filho}</Router>
}

describe('ItemDaLateral', () => {
  it.each(PAPEIS)('todo item de %s tem o ícone decorativo e o rótulo por nome, aberto e no trilho', (papel) => {
    const itens = [...NAVEGACAO[papel], ...RODAPE_DA_LATERAL[papel], ...MENU_DA_PESSOA[papel]]
    for (const trilho of [false, true]) {
      const { unmount } = render(
        noEndereco(
          '/',
          <ul>
            {itens.map((item) => (
              <ItemDaLateral key={item.caminho} item={item} trilho={trilho} />
            ))}
          </ul>,
        ),
      )
      for (const item of itens) {
        const link = screen.getByRole('link', { name: item.rotulo })
        // Um ícone só, que o leitor de tela não lê: o nome é o rótulo, e dizê-lo duas vezes seria ruído.
        const icones = link.querySelectorAll('[data-icone], [data-ladrilho]')
        expect(icones, `${item.rotulo} (trilho: ${String(trilho)})`).toHaveLength(1)
        const [icone] = icones
        const decorativo = icone?.getAttribute('aria-hidden') === 'true' || icone?.closest('[aria-hidden="true"]') !== null
        expect(decorativo, `${item.rotulo}: o ícone é decoração`).toBe(true)
        expect(within(link).queryByRole('img')).toBeNull()
      }
      unmount()
    }
  })

  it('o ícone ilustrado é de Início, Ferramentas, Turmas e Atividades, e o `lucide` num ladrilho é dos outros', () => {
    const ilustrados = new Map<string, string>()
    const ladrilhos = new Map<string, string>()
    const porPapel = new Map<string, string>()
    for (const papel of PAPEIS) {
      for (const item of [...NAVEGACAO[papel], ...RODAPE_DA_LATERAL[papel], ...MENU_DA_PESSOA[papel]]) {
        if ('lugar' in item.icone) ilustrados.set(item.rotulo, item.icone.lugar)
        else {
          ladrilhos.set(item.rotulo, item.icone.familia)
          porPapel.set(`${papel}: ${item.rotulo}`, item.icone.familia)
        }
      }
    }
    expect([...ilustrados]).toEqual([
      ['Início', 'inicio'],
      ['Ferramentas', 'ferramentas'],
      ['Turmas', 'turmas'],
      ['Atividades', 'tarefas'],
    ])
    // A família de cada um (a divergência de `12_task.md`): por função, nunca a cor do estado (`ok`, `erro`, `pendente`).
    expect(Object.fromEntries([...porPapel].sort(([a], [b]) => a.localeCompare(b)))).toEqual({
      'aluno: Minha turma': 'turquesa',
      'aluno: Privacidade': 'verde',
      'aluno: Tutor': 'laranja',
      'coordenador: Agentes': 'anil',
      'coordenador: Analista': 'anil',
      'coordenador: Estrutura': 'azul',
      'coordenador: Governança': 'anil',
      'coordenador: Material': 'azul',
      'coordenador: Privacidade': 'amarelo',
      'coordenador: Professores': 'azul',
      'professor: Meus dados': 'verde',
    })
    // Cada um dos outros tem a família dele, e a do ladrilho chega ao DOM.
    expect([...ladrilhos.keys()].sort()).toEqual(['Agentes', 'Analista', 'Estrutura', 'Governança', 'Material', 'Meus dados', 'Minha turma', 'Privacidade', 'Professores', 'Tutor'].sort())
    const tutor = NAVEGACAO.aluno.find((item) => item.rotulo === 'Tutor')
    if (tutor === undefined) throw new Error('faltou o Tutor')
    render(noEndereco('/', <ul><ItemDaLateral item={tutor} trilho={false} /></ul>))
    expect(screen.getByRole('link', { name: 'Tutor' }).querySelector('[data-ladrilho]')?.getAttribute('data-ladrilho')).toBe('laranja')
    // E o ilustrado chega ao DOM pelo mesmo caminho, sem ladrilho: o ramo do `lugar` é o que desenha o `Icone`.
    cleanup()
    const inicio = NAVEGACAO.professor.find((item) => item.rotulo === 'Início')
    if (inicio === undefined) throw new Error('faltou o Início')
    render(noEndereco('/', <ul><ItemDaLateral item={inicio} trilho={false} /></ul>))
    const link = screen.getByRole('link', { name: 'Início' })
    expect(link.querySelector('svg[data-icone="inicio"]')).not.toBeNull()
    expect(link.querySelector('[data-ladrilho]')).toBeNull()
  })

  it('aceso: `aria-current`, fundo `azul-claro`, borda `azul-borda` e texto `azul-texto`; apagado: nenhuma das três, e a borda transparente', () => {
    const [inicio, ferramentas] = NAVEGACAO.professor
    if (inicio === undefined || ferramentas === undefined) throw new Error('faltou item')
    render(
      noEndereco(
        '/professor/nova-conversa',
        <ul>
          <ItemDaLateral item={inicio} trilho={false} />
          <ItemDaLateral item={ferramentas} trilho={false} />
        </ul>,
      ),
    )
    const aceso = screen.getByRole('link', { name: 'Início' })
    const apagado = screen.getByRole('link', { name: 'Ferramentas' })
    expect(aceso.getAttribute('aria-current')).toBe('page')
    expect(apagado.getAttribute('aria-current')).toBeNull()
    expect([...classesDo(aceso)].filter((classe) => ['bg-azul-claro', 'border-azul-borda', 'text-azul-texto', 'border-2'].includes(classe)).sort()).toEqual(['bg-azul-claro', 'border-2', 'border-azul-borda', 'text-azul-texto'])
    // A negativa (A24): o apagado não tem nenhuma das pistas, e guarda a borda de 2 px, transparente, para acender não mexer em nada.
    const doApagado = classesDo(apagado)
    for (const classe of ['bg-azul-claro', 'border-azul-borda', 'text-azul-texto']) expect(doApagado.has(classe), classe).toBe(false)
    expect(doApagado.has('border-2')).toBe(true)
    expect(doApagado.has('border-transparent')).toBe(true)
    expect(doApagado.has('text-sutil')).toBe(true)
    // O peso não é pista: os dois são `t-rotulo` (700), e o filete de antes saiu.
    expect(classesDo(aceso).has('t-rotulo')).toBe(true)
    expect(doApagado.has('t-rotulo')).toBe(true)
    expect(document.querySelector('[data-filete]')).toBeNull()
  })

  it.each(TEMAS)('o texto do aceso e o do apagado têm 4,5:1 sobre o chão deles no tema %s', (tema) => {
    expect(contraste(corDoToken(tema, 'azul-texto'), corDoToken(tema, 'azul-claro'))).toBeGreaterThanOrEqual(4.5)
    expect(contraste(corDoToken(tema, 'sutil'), corDoToken(tema, 'lateral'))).toBeGreaterThanOrEqual(4.5)
    expect(contraste(corDoToken(tema, 'tinta'), corDoToken(tema, 'fundo-suave'))).toBeGreaterThanOrEqual(4.5)
    // A borda do aceso contra o chão da lateral é o que a distingue sem a cor do fundo: precisa existir no tema.
    expect(corDoToken(tema, 'azul-borda')).not.toBe(corDoToken(tema, 'lateral'))
  })

  it('de 768 a 1023 px o item é um quadrado de 52 px com o rótulo só para o leitor de tela, e aberto tem 52 px de altura', () => {
    const [turmas] = NAVEGACAO.professor.slice(2)
    if (turmas === undefined) throw new Error('faltou Turmas')
    const { unmount } = render(noEndereco('/', <ul><ItemDaLateral item={turmas} trilho /></ul>))
    const noTrilho = screen.getByRole('link', { name: 'Turmas' })
    expect(classesDo(noTrilho).has('size-13')).toBe(true)
    // O texto visível não existe: só o do leitor de tela e o da dica, que é decoração.
    expect(noTrilho.querySelector('.sr-only')?.textContent).toBe('Turmas')
    expect(noTrilho.querySelector('[aria-hidden="true"].shadow-flutua')?.textContent).toBe('Turmas')
    unmount()
    render(noEndereco('/', <ul><ItemDaLateral item={turmas} trilho={false} /></ul>))
    const aberto = screen.getByRole('link', { name: 'Turmas' })
    expect(classesDo(aberto).has('min-h-13')).toBe(true)
    expect(aberto.querySelector('.sr-only')).toBeNull()
  })
})

describe('ListaDeItens', () => {
  it('sem item não desenha nem a região', () => {
    const { container } = render(noEndereco('/', <ListaDeItens itens={[]} rotulo="Rodapé" trilho={false} />))
    expect(container.innerHTML).toBe('')
  })
})

describe('SecaoDoTime', () => {
  const ESPERANDO = { quantidade: 3, haMais: false } as const

  it('cada agente tem o ícone da função num ladrilho na família dele, e nenhum avatar da onça', () => {
    const { container } = render(noEndereco('/', <SecaoDoTime agentes={SEU_TIME.professor} esperando={ESPERANDO} trilho={false} />))
    // A casca é da entrada, e a onça mora fora dela: nenhum nó do avatar do agente (A80).
    expect(container.querySelector('[data-agente]')).toBeNull()
    expect(container.querySelector('[data-assinatura]')).toBeNull()
    const nav = screen.getByRole('navigation', { name: 'Seu time' })
    const familias = [...nav.querySelectorAll('[data-ladrilho]')].map((ladrilho) => ladrilho.getAttribute('data-ladrilho'))
    expect(familias).toEqual(['azul', 'laranja'])
    // O ladrilho é decoração: o nome do link é o da função.
    expect(screen.getByRole('link', { name: /^Assistente de ensino/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Tutor' })).toBeTruthy()
    expect(within(nav).queryByRole('img')).toBeNull()
  })

  it('o contador é só do agente que deixa entrega, diz o que conta em texto e não leva nada que se mexa', () => {
    const { container } = render(noEndereco('/', <SecaoDoTime agentes={SEU_TIME.professor} esperando={ESPERANDO} trilho={false} />))
    const contadores = container.querySelectorAll('[data-contador-do-time]')
    expect(contadores).toHaveLength(1)
    expect(contadores[0]?.textContent).toBe('3 esperando você')
    expect(screen.getByRole('link', { name: 'Tutor' }).querySelector('[data-contador-do-time]')).toBeNull()
    // D59: o contador não anima, nem o ponto do trilho.
    expect(contadores[0]?.className).not.toMatch(/animate|transition/)
  })

  it('no trilho o ponto de espera é só do agente que espera, e o nome do link o diz', () => {
    const { container } = render(noEndereco('/', <SecaoDoTime agentes={SEU_TIME.professor} esperando={ESPERANDO} trilho />))
    expect(container.querySelectorAll('[data-ponto-de-espera]')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Assistente de ensino, 3 esperando você' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Tutor' })).toBeTruthy()
    // O rótulo do grupo só existe aberto.
    expect(screen.queryByText('Seu time')).toBeNull()
  })

  it('sem pendência, nada de contador nem de ponto', () => {
    const { container } = render(noEndereco('/', <SecaoDoTime agentes={SEU_TIME.professor} esperando={{ quantidade: 0, haMais: false }} trilho />))
    expect(container.querySelector('[data-ponto-de-espera]')).toBeNull()
    expect(container.querySelector('[data-contador-do-time]')).toBeNull()
  })

  it('sem agente, não desenha o grupo', () => {
    const { container } = render(noEndereco('/', <SecaoDoTime agentes={[]} esperando={ESPERANDO} trilho={false} />))
    expect(container.innerHTML).toBe('')
  })
})
