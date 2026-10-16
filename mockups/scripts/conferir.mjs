#!/usr/bin/env node
/* CONFERÊNCIA INTEGRADA. Não edita nada em src/: só mede e devolve o que falhou, com a tarefa dona da tela.

   Uso (o servidor tem de estar em 127.0.0.1:5190; o puppeteer-core já está em node_modules):
     node scripts/conferir.mjs                 tudo: rotas (claro e escuro), redirecionamentos, links, roteiros, tsc, oxlint
     node scripts/conferir.mjs --so rotas      só uma parte (rotas | redirecionamentos | links | roteiros | codigo | lado)
     node scripts/conferir.mjs --filtro /aluno só as rotas cujo endereço contém isto
     node scripts/conferir.mjs --tema claro    só um tema nas rotas (claro | escuro; sem ele, os dois)

   O que mede em cada rota, a 1440 × 780 e a 375 × 780, no claro e no escuro (?tema=escuro):
     (a) a página rola a 1440 (só pode no Mapa e em /aluno/eu/privacidade)
     (b) rola para o lado a 375
     (c) erros de console
     (d) R3 abas visíveis (até 3, nunca uma dentro da outra)
     (e) R4 botões cheios visíveis (até 1, sem o enviar da caixa; laranja e oficial nunca juntos)
     (f) glossário e palavras de bastidor ("mockup", "fase", "D12", "LLM", "token", "dataset") na tela
     (g) R6 título com descrição embaixo
     (h) R1 lateral e barra de baixo com os lugares do papel
     (i) R9 número laranja só no sino
   14ª rodada (05/10/2026; plano ux-composicao, seção 8):
     (j) no escuro: o fundo do body é rgb(19, 31, 36); nenhum bloco visível de 40 × 40 ou mais com fundo branco puro; o
         contraste de cada texto visível contra o fundo efetivo é de 4,5:1 (3:1 a partir de 19 px em negrito ou 24 px)
     (k) os lugares de cada papel (aluno 4, professor 4, coordenação 4, secretaria 3) e a barra de baixo a 375
     (l) o sino nas telas do professor e da coordenação, e "Esperando você" fora do Início
     (m) nenhum "Pra fazer" no Início do aluno
     (n) h1 visível nas telas da lateral (fora as conversas)
     (o) o document.title sem "mockup"
     (p) os redirecionamentos da seção 1.8 (e o ?tema= que sai do endereço)
   Fotos em scripts/shots/ux/conferencia/<papel>/<nome>[-escuro][-375].png; resultado em resultado.json da mesma pasta.
   Donos: B (base), AL (aluno), PI (professor: Início, Ferramentas, notas, itens do sino), DOC (documentos, Criados,
   conversa), PT (Turmas, Semana, turma, aula), CP (Painel e Analista da coordenação), CE (Escola, Registros,
   Configurações), RP (secretaria), PX (públicas, entrada, introduções, família, operação). */
import puppeteer from 'puppeteer-core'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const aqui = dirname(fileURLToPath(import.meta.url))
const raizMockups = join(aqui, '..')
const PASTA = join(aqui, 'shots', 'ux', 'conferencia')
const BASE = 'http://127.0.0.1:5190'
const BLUEPRINT = join(raizMockups, '..', 'pesquisa', 'remodelagem', 'blueprint.md')

const args = process.argv.slice(2)
const opc = { so: null, filtro: null, tema: null }
for (let i = 0; i < args.length; i++) if (args[i].startsWith('--')) opc[args[i].slice(2)] = args[++i]
const faz = (parte) => !opc.so || opc.so.split(',').includes(parte)
const TEMAS = opc.tema ? [opc.tema] : ['claro', 'escuro']

/* ── As rotas, com a TAREFA dona de cada tela. `inicio`: o Início do papel (sem "Esperando você" na tela);
   `conversa`: tela de conversa (sem h1 visível obrigatório). ── */
const R = (papel, nome, url, dono, extra = {}) => ({ papel, nome, url, dono, ...extra })
const ROTAS = [
  R('mapa', 'mapa', '/', 'B', { rolaPode: true, casca: false }),
  R('mapa', 'fundamentos', '/fundamentos', 'B', { rolaPode: true, casca: false }),
  R('mapa', 'fundamentos-onca', '/fundamentos/onca', 'B', { rolaPode: true, casca: false }),

  R('aluno', 'inicio', '/aluno', 'AL', { inicio: true, conversa: true }),
  R('aluno', 'inicio-prova', '/aluno?estado=prova', 'AL', { inicio: true, conversa: true }),
  R('aluno', 'inicio-fora', '/aluno?estado=fora', 'AL', { inicio: true, conversa: true }),
  R('aluno', 'inicio-limite', '/aluno?estado=limite', 'AL', { inicio: true, conversa: true }),
  R('aluno', 'conversa-fracoes', '/aluno/c/fracoes', 'AL', { conversa: true }),
  R('aluno', 'bem-vindo', '/aluno/bem-vindo', 'PX', { casca: false }),
  R('aluno', 'bem-vindo-rever', '/aluno/bem-vindo?rever=1', 'PX', { casca: false }),
  R('aluno', 'eu', '/aluno/eu', 'AL'),
  R('aluno', 'eu-ajustes', '/aluno/eu?config=geral', 'AL'),
  R('aluno', 'privacidade', '/aluno/eu/privacidade', 'AL', { rolaPode: true }),
  R('aluno', 'avisar', '/aluno/avisar', 'AL'),
  R('aluno', 'tarefas', '/aluno/tarefas', 'AL'),
  R('aluno', 'tarefa-estequiometria', '/aluno/tarefas/estequiometria', 'AL'),
  R('aluno', 'tarefa-balanceamento', '/aluno/tarefas/balanceamento', 'AL'),
  R('aluno', 'tarefa-prova-mol', '/aluno/tarefas/prova-mol', 'AL'),
  R('aluno', 'prova', '/aluno/prova/prova-estequiometria', 'AL', { casca: false }),
  R('aluno', 'prova-sem-rede', '/aluno/prova/prova-estequiometria?rede=caiu', 'AL', { casca: false }),

  R('professor', 'inicio', '/professor', 'PI', { inicio: true, conversa: true }),
  R('professor', 'sino', '/professor?sino=1', 'PI', { inicio: true, conversa: true, sinoAberto: true }),
  R('professor', 'sino-2b', '/professor?sino=2b', 'PI', { inicio: true, conversa: true, sinoAberto: true }),
  R('professor', 'item-atencao', '/professor?item=atencao-2b', 'PI', { inicio: true, conversa: true }),
  R('professor', 'item-sinal', '/professor?item=sinal-2b', 'PI', { inicio: true, conversa: true }),
  R('professor', 'item-pedidos', '/professor?item=pedidos', 'PI', { inicio: true, conversa: true }),
  R('professor', 'item-turma-3a', '/professor?item=turma-3a', 'PI', { inicio: true, conversa: true }),
  R('professor', 'item-em-criados', '/professor/criados?item=sinal-2b', 'B'),
  R('professor', 'ferramentas', '/professor/ferramentas', 'PI'),
  R('professor', 'ferramentas-corrigir', '/professor/ferramentas?corrigir=1', 'PI'),
  R('professor', 'aprovar-notas', '/professor/aprovar/prova-2b', 'PI'),
  R('professor', 'redacao', '/professor/ferramentas/redacao', 'PI'),
  R('professor', 'bem-vindo', '/professor/bem-vindo?rever=1', 'PX', { casca: false }),
  R('professor', 'adaptar', '/professor?adaptar=1', 'DOC', { inicio: true, conversa: true }),
  R('professor', 'conversa-nova-prova', '/professor/conversa/nova?ferramenta=prova&turma=2b', 'DOC', { conversa: true }),
  R('professor', 'conversa-prova', '/professor/conversa/prova-estequiometria', 'DOC', { conversa: true }),
  R('professor', 'criados', '/professor/criados', 'DOC'),
  R('professor', 'doc-prova', '/professor/criados/prova-estequiometria', 'DOC'),
  R('professor', 'doc-adaptada', '/professor/criados/prova-estequiometria?versao=adaptada', 'DOC'),
  R('professor', 'doc-lista-resultados', '/professor/criados/lista-mol-massa-molar?aba=resultados', 'DOC'),
  R('professor', 'doc-simulado', '/professor/criados/simulado-enem-estequiometria', 'DOC'),
  R('professor', 'doc-plano', '/professor/criados/plano-reagente-limitante', 'DOC'),
  R('professor', 'doc-bimestre', '/professor/criados/planejamento-do-bimestre', 'DOC'),
  R('professor', 'doc-resumo', '/professor/criados/resumo-balanceamento', 'DOC'),
  R('professor', 'doc-mapa', '/professor/criados/mapa-estequiometria', 'DOC'),
  R('professor', 'doc-slides', '/professor/criados/rendimento-de-reacao', 'DOC'),
  R('professor', 'doc-rubrica', '/professor/criados/rubrica-lavoisier', 'DOC'),
  R('professor', 'turmas', '/professor/turmas', 'PT'),
  R('professor', 'semana', '/professor/turmas?ver=semana', 'PT'),
  R('professor', 'turma-hoje', '/professor/turmas/2b', 'PT'),
  R('professor', 'turma-atividades', '/professor/turmas/2b?aba=atividades', 'PT'),
  R('professor', 'turma-1c', '/professor/turmas/1c', 'PT'),
  R('professor', 'turma-9a', '/professor/turmas/9a', 'PT'),
  R('professor', 'turma-alunos', '/professor/turmas/2b?aba=alunos', 'PT'),
  R('professor', 'turma-alunos-notas', '/professor/turmas/2b?aba=alunos&ver=notas', 'PT'),
  R('professor', 'turma-convidar', '/professor/turmas/2b?aba=alunos&convidar=1', 'PT'),
  R('professor', 'aula', '/professor/turmas/2b/aula', 'PT', { casca: false }),
  R('professor', 'configuracoes', '/professor?config=geral', 'B', { inicio: true, conversa: true }),

  R('coordenacao', 'painel', '/coordenacao', 'CP', { inicio: true }),
  R('coordenacao', 'sino', '/coordenacao?sino=1', 'CP', { inicio: true, sinoAberto: true }),
  R('coordenacao', 'item-alerta', '/coordenacao?item=alerta-a1', 'CP', { inicio: true }),
  R('coordenacao', 'analista', '/coordenacao/analista', 'CP', { conversa: true }),
  R('coordenacao', 'bem-vindo', '/coordenacao/bem-vindo?rever=1', 'PX', { casca: false }),
  R('coordenacao', 'registros', '/coordenacao/registros', 'CE'),
  R('coordenacao', 'registros-ia', '/coordenacao/registros?aba=ia', 'CE'),
  R('coordenacao', 'registros-ia-como', '/coordenacao/registros?aba=ia&ver=como', 'CE'),
  R('coordenacao', 'registros-avisos', '/coordenacao/registros?aba=avisos', 'CE'),
  R('coordenacao', 'registros-aviso', '/coordenacao/registros?aba=avisos&aviso=N-2026-0031', 'CE'),
  R('coordenacao', 'registros-risco', '/coordenacao/registros?aba=avisos&aviso=N-2026-0032', 'CE'),
  R('coordenacao', 'registros-titular', '/coordenacao/registros?aba=avisos&aviso=N-2026-0033', 'CE'),
  R('coordenacao', 'registros-auditoria', '/coordenacao/registros?aba=auditoria', 'CE'),
  R('coordenacao', 'registros-dossie', '/coordenacao/registros?dossie=1', 'CE'),
  R('coordenacao', 'registros-exportar', '/coordenacao/registros?exportar=1', 'CE'),
  R('coordenacao', 'configuracoes', '/coordenacao/configuracoes', 'CE'),
  R('coordenacao', 'minha-conta', '/coordenacao?config=geral', 'CP', { inicio: true }),
  R('coordenacao', 'escola', '/coordenacao/escola', 'CE'),
  R('coordenacao', 'escola-professores', '/coordenacao/escola?aba=professores', 'CE'),
  R('coordenacao', 'escola-professor-paulo', '/coordenacao/escola?aba=professores&prof=p-paulo', 'CE'),
  R('coordenacao', 'escola-material', '/coordenacao/escola?aba=material', 'CE'),
  R('coordenacao', 'escola-turma-2b', '/coordenacao/escola/turmas/2b', 'CE'),
  R('coordenacao', 'escola-turma-3a', '/coordenacao/escola/turmas/au-3a', 'CE'),
  R('coordenacao', 'escola-turma-6b', '/coordenacao/escola/turmas/au-6b', 'CE'),

  R('rede', 'painel', '/rede', 'RP', { inicio: true }),
  R('rede', 'protecao', '/rede?protecao=1', 'RP', { inicio: true }),
  R('rede', 'analista', '/rede/analista', 'RP', { conversa: true }),
  R('rede', 'escolas', '/rede/escolas', 'RP'),
  R('rede', 'configuracoes', '/rede?config=geral', 'RP', { inicio: true }),
  R('rede', 'bem-vindo', '/rede/bem-vindo?rever=1', 'PX', { casca: false }),

  R('fora', 'entrar', '/entrar', 'PX', { casca: false }),
  R('fora', 'entrar-verificacao', '/entrar/verificacao', 'PX', { casca: false }),
  R('fora', 'escola', '/e/colegio-aurora', 'PX', { casca: false }),
  R('fora', 'escola-turma', '/e/colegio-aurora/turma', 'PX', { casca: false }),
  R('fora', 'escola-avisar', '/e/colegio-aurora/avisar', 'PX', { casca: false }),
  R('fora', 'escola-dados', '/e/colegio-aurora/dados', 'PX', { casca: false }),
  R('fora', 'convite', '/convite#t9KQ2xLmP4aR', 'PX', { casca: false }),
  R('fora', 'convite-coordenacao', '/convite?papel=coordenacao#hm-aurora', 'PX', { casca: false }),
  R('fora', 'operacao', '/operacao', 'PX', { casca: false }),
  R('fora', 'operacao-bem-vindo', '/operacao/bem-vindo?rever=1', 'PX', { casca: false }),
  R('fora', 'familia', '/familia', 'PX', { casca: false }),
].map((r) => ({ casca: ['aluno', 'professor', 'coordenacao', 'rede'].includes(r.papel), ...r }))

/* Endereços antigos que têm de chegar ao lugar novo (rotas.tsx e App.tsx, dono B; o ?mais= é da Home, PI; os ?aba= da
   turma, PT). Seção 1.8: o Redireciona SOMA a consulta de quem chegou à do destino. */
const REDIRECIONA = [
  ['/aluno/atividades', '/aluno/tarefas'], ['/aluno/atividades/estequiometria', '/aluno/tarefas/estequiometria'],
  // a prova só existe para o aluno depois que a professora envia; sem ela, a tela da prova manda para Tarefas
  ['/aluno/prova', ['/aluno/prova/prova-estequiometria', '/aluno/tarefas']], ['/aluno/prova/estequiometria', ['/aluno/prova/prova-estequiometria', '/aluno/tarefas']],
  ['/aluno/desempenho', '/aluno/eu'], ['/aluno/memoria', '/aluno/eu/privacidade'], ['/aluno/eu/memoria', '/aluno/eu/privacidade'],
  ['/aluno/privacidade', '/aluno/eu/privacidade'],
  ['/aluno?tema=escuro', '/aluno'], ['/professor/criados?tema=claro', '/professor/criados'],
  ['/professor/agenda', '/professor/turmas?ver=semana'], ['/professor/calendario', '/professor/turmas?ver=semana'],
  ['/professor/projetos', '/professor'], ['/professor/projetos/bimestre-2b', '/professor'],
  ['/professor/meu-uso', '/professor?config=privacidade'],
  ['/professor?mais=1', '/professor/ferramentas', 'PI'], ['/professor?mais=1&corrigir=1', '/professor/ferramentas?corrigir=1', 'PI'],
  ['/professor/biblioteca/prova-estequiometria', '/professor/criados/prova-estequiometria'],
  ['/professor/aprovar', '/professor/aprovar/prova-2b'], ['/professor/time', '/professor'], ['/professor/time/tutor', '/professor'],
  ['/professor/sala', '/professor/turmas/2b/aula'], ['/professor/painel', '/professor/turmas'],
  ['/professor/turmas/2b?aba=mural', '/professor/turmas/2b?aba=atividades', 'PT'], ['/professor/turmas/2b?aba=notas', '/professor/turmas/2b?aba=alunos&ver=notas', 'PT'],
  ['/professor/turmas/2b?aba=ranking', '/professor/turmas/2b?aba=alunos', 'PT'], ['/professor/turmas/2b?aba=visao', '/professor/turmas/2b', 'PT'],
  ['/professor/turmas/2b?aba=frequencia', '/professor/turmas/2b?aba=alunos', 'PT'], ['/professor/turmas/2b?aba=recursos', '/professor/turmas/2b?aba=atividades', 'PT'],
  ['/coordenacao/estrutura', '/coordenacao/escola'], ['/coordenacao/estrutura/turmas/2b', '/coordenacao/escola/turmas/2b'],
  ['/coordenacao/professores', '/coordenacao/escola?aba=professores'], ['/coordenacao/material', '/coordenacao/escola?aba=material'],
  ['/coordenacao/adaptacoes', '/coordenacao/escola?aba=turmas&filtro=adaptacao'],
  ['/coordenacao/ia', '/coordenacao/registros?aba=ia'], ['/coordenacao/ia?ver=como', '/coordenacao/registros?aba=ia&ver=como'],
  ['/coordenacao/ia?ver=como&ia=tutor', '/coordenacao/registros?aba=ia&ver=como&ia=tutor'],
  ['/coordenacao/agentes', '/coordenacao/registros?aba=ia&ver=como'],
  ['/coordenacao/conformidade', '/coordenacao/registros?dossie=1'], ['/coordenacao/conformidade?aba=dossie', '/coordenacao/registros?dossie=1'],
  ['/coordenacao/denuncias', '/coordenacao/registros?aba=avisos'], ['/coordenacao/auditoria', '/coordenacao/registros?aba=auditoria'],
  ['/coordenacao/exportar', '/coordenacao/registros?exportar=1'],
]

/* Os lugares de cada papel (14ª rodada): aluno 4, professor 4, coordenação 4, secretaria 3. */
const LUGARES = {
  aluno: ['Início', 'Tarefas', 'Eu', 'Avisar um adulto'],
  professor: ['Início', 'Turmas', 'Ferramentas', 'Criados'],
  coordenacao: ['Painel', 'Analista', 'Escola', 'Registros'],
  rede: ['Painel', 'Analista', 'Escolas'],
}
const BARRA = { aluno: ['Início', 'Tarefas', 'Eu', 'Avisar'], professor: LUGARES.professor, coordenacao: LUGARES.coordenacao, rede: LUGARES.rede }
const COM_SINO = ['professor', 'coordenacao']

/* Glossário (seção 2): proibidas na navegação e nos títulos. Agenda e Projetos saíram da navegação (12ª rodada). */
const PROIBIDAS = ['Governança', 'Artefato', 'Thread', 'Alocação', 'Conformidade', 'Dado nominal', 'Seu time', 'Atribuir',
  'Criar com IA', 'Meu desempenho', 'Atividades e provas', 'Biblioteca', 'Calendário', 'Modo sala', 'Denúncias', 'Devolutiva',
  'Rejeitar', 'Suspender agente', 'Web: desligada', 'Ranking', 'Agenda', 'Projetos']

/* ── Medida dentro da página ─────────────────────────────────────────────────────────────────────────────── */
function medirNaPagina({ proibidas, escuro }) {
  const W = innerWidth, H = innerHeight
  const caixa = (el) => el.getBoundingClientRect()
  const escondido = (el, contaAria = true) => {
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e)
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return true
      if (contaAria && e.getAttribute && e.getAttribute('aria-hidden') === 'true') return true
      if (e.classList && e.classList.contains('sr-only')) return true
    }
    return false
  }
  const visivel = (el, contaAria = true) => {
    const r = caixa(el)
    if (r.width < 2 || r.height < 2) return false
    if (r.bottom <= 0 || r.top >= H || r.right <= 0 || r.left >= W) return false
    return !escondido(el, contaAria)
  }
  const texto = (el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim()
  const rgb = (c) => (c.match(/[\d.]+/g) || []).map(Number)

  const corpo = texto(document.body)
  const erroRota = /Unexpected Application Error|404 Not Found|Hey developer/.test(corpo)

  // (d) abas
  const abas = [...document.querySelectorAll('[role="tab"]')].filter(visivel)
  const listas = [...document.querySelectorAll('[role="tablist"]')].filter(visivel)
  const abaDentro = listas.some((l) => l.parentElement && l.parentElement.closest('[role="tabpanel"], [role="tablist"]') &&
    listas.some((o) => o !== l && o.contains(l) === false && o.compareDocumentPosition(l) & 16))
  const maiorLista = Math.max(0, ...listas.map((l) => [...l.querySelectorAll('[role="tab"]')].filter(visivel).length))

  // (e) botões cheios: a face (o próprio botão, ou a .face do Botao duo) em laranja ou grafite/preto, com texto (o enviar
  //     da caixa é só ícone), fora da navegação
  const cheios = []
  for (const el of document.querySelectorAll('button, a, [role="button"]')) {
    if (!visivel(el)) continue
    if (el.closest('nav, [data-sidebar="sidebar"], [data-sidebar="menu"]')) continue
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue
    const face = el.querySelector(':scope > .face') || el
    const s = getComputedStyle(face)
    const [r, g, b, a = 1] = rgb(s.backgroundColor)
    if (a < 0.6 || r === undefined) continue
    const laranja = Math.abs(r - 232) < 22 && Math.abs(g - 115) < 28 && Math.abs(b - 46) < 30
    // o oficial: preto no claro; no escuro ele inverte (face #F1F7FB)
    const preto = escuro ? r > 235 && g > 240 && b > 245 : r < 60 && g < 60 && b < 60
    if (!laranja && !preto) continue
    const t = texto(el)
    if (!t || t.length < 2) continue
    cheios.push({ cor: laranja ? 'laranja' : 'preto', texto: t.slice(0, 50) })
  }

  // (f) palavras proibidas na navegação e nos títulos (inclui o h1 só para leitor de tela)
  const ondeOlhar = [...document.querySelectorAll('nav, [data-sidebar="sidebar"], header, h1, h2, h3, [role="tab"], [role="dialog"] h2')]
    .filter((el) => visivel(el) || el.tagName === 'H1')
  const textoNav = ondeOlhar.map(texto).join(' | ')
  const achadas = proibidas.filter((p) => new RegExp(`(^|[^\\p{L}])${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}])`, 'iu').test(textoNav))
  const visivelTexto = [...document.querySelectorAll('body *')].filter((el) => el.children.length === 0 && visivel(el)).map(texto).join(' ')
  // (f2) o glossário no texto visível da tela inteira (não só navegação e títulos)
  const noCorpo = [...new Set((visivelTexto.match(/\b(aloca[çc][ãa]o|aloca[çc][õo]es|rejeit\w*|den[úu]ncias?|devolutiva|governan[çc]a|artefatos?|thread|dado nominal|modo sala|calend[áa]rio|biblioteca|liberar|atribuir|diagn[óo]stico|atividades e provas|ranking|seu time)\b/giu) || []).map((x) => x.toLowerCase()))]
  const demo = (visivelTexto.match(/\b(mockup|MVP|fase \d|décima rodada|D\d{1,2}|LLM|tokens?|dataset)\b/gi) || [])

  // (g) título com descrição: h1/h2 de cabeçalho seguido de uma frase
  const tituloDesc = []
  for (const h of document.querySelectorAll('h1, h2.titulo-tela')) {
    if (!visivel(h)) continue
    let p = h.nextElementSibling
    if (!p && h.parentElement && h.parentElement.children.length === 1) p = h.parentElement.nextElementSibling
    if (!p || !['P', 'DIV', 'SPAN'].includes(p.tagName) || !visivel(p)) continue
    if (p.querySelector('button, a, input, [role="tab"], h2, h3, li, table')) continue
    const t = texto(p)
    if (t.length >= 45 && /\s\S+\s\S+\s\S+\s/.test(t)) tituloDesc.push(`${texto(h).slice(0, 40)} → ${t.slice(0, 90)}`)
  }

  // (h) lateral e barra de baixo
  const navLateral = document.querySelector('[data-sidebar="sidebar"] nav[aria-label="Lugares"]')
  const lateral = navLateral ? [...navLateral.querySelectorAll('a')].filter((e) => visivel(e, false)).map(texto).slice(0, 6) : []
  const barra = [...document.querySelectorAll('nav[aria-label="Lugares"]')].find((n) => !n.closest('[data-sidebar="sidebar"]'))
  const barraVis = !!barra && visivel(barra, false) && Math.abs(caixa(barra).bottom - H) < 2
  const barraItens = barra ? [...barra.querySelectorAll('a')].map(texto) : []

  // (i) número laranja (contador) fora da navegação e do sino (R9: o único número laranja é o do sino)
  const contadores = []
  for (const el of document.querySelectorAll('span, div, b')) {
    if (!visivel(el) || el.closest('nav, [data-sidebar="sidebar"], [data-sino-botao], [role="dialog"][aria-label^="Esperando você"]')) continue
    const [r, g, b] = rgb(getComputedStyle(el).backgroundColor)
    if (!(Math.abs(r - 232) < 22 && Math.abs(g - 115) < 28 && Math.abs(b - 46) < 30)) continue
    const t = texto(el)
    if (/^\d{1,3}$/.test(t) && caixa(el).height <= 26) contadores.push(t)
  }

  // (j) o escuro: o fundo do body, os blocos brancos puros e o contraste de cada texto contra o fundo efetivo
  const bodyBg = getComputedStyle(document.body).backgroundColor
  const brancos = []
  const contraste = []
  if (escuro) {
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('svg') || el.tagName === 'IMG' || el.tagName === 'CANVAS') continue
      const r = caixa(el)
      if (r.width < 40 || r.height < 40 || !visivel(el, false)) continue
      const [cr, cg, cb, ca = 1] = rgb(getComputedStyle(el).backgroundColor)
      if (cr === 255 && cg === 255 && cb === 255 && ca === 1) brancos.push(`${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 3).join('.')} "${texto(el).slice(0, 40)}"`)
    }
    const estilos = new Map()
    const est = (e) => { let x = estilos.get(e); if (!x) { const c = getComputedStyle(e); x = { bg: c.backgroundColor, img: c.backgroundImage, op: Number(c.opacity) }; estilos.set(e, x) } return x }
    const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
    const sobre = (cima, baixo) => { const a = cima[3] ?? 1; return [0, 1, 2].map((i) => cima[i] * a + baixo[i] * (1 - a)) }
    /** o fundo efetivo: compõe os fundos dos ancestrais (de baixo para cima); null quando há imagem ou gradiente */
    const fundoDe = (el) => {
      const pilha = []
      for (let e = el; e; e = e.parentElement) {
        const s = est(e)
        if (s.img && s.img !== 'none') return null
        const c = rgb(s.bg)
        if (c.length >= 3 && (c[3] ?? 1) > 0) { pilha.push(c); if ((c[3] ?? 1) >= 1) break }
      }
      let f = [19, 31, 36]
      for (const c of pilha.reverse()) f = sobre(c, f)
      return f
    }
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('svg, [disabled], [aria-disabled="true"]')) continue
      const proprio = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)
      if (!proprio || !visivel(el, false)) continue
      let op = 1
      for (let e = el; e; e = e.parentElement) op *= est(e).op
      if (op < 0.95) continue
      const s = getComputedStyle(el)
      const cor = rgb(s.color)
      const fundo = fundoDe(el)
      if (!fundo || cor.length < 3) continue
      const c = sobre(cor, fundo)
      const L1 = lum(c), L2 = lum(fundo)
      const razao = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
      const px = parseFloat(s.fontSize), peso = Number(s.fontWeight)
      const minimo = px >= 24 || (px >= 19 && peso >= 700) ? 3 : 4.5
      if (razao < minimo) contraste.push(`${razao.toFixed(2)}:1 "${texto(el).slice(0, 36)}" (${s.color} sobre rgb(${fundo.map(Math.round).join(', ')}))`)
    }
  }

  // (l) o sino e "Esperando você" fora dele; (m) "Pra fazer"; (n) h1 visível; (o) o título da aba
  const sino = [...document.querySelectorAll('button[aria-label^="Esperando você"]')].some((b) => visivel(b, false))
  const folhas = [...document.querySelectorAll('body *')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && visivel(el))
  const esperando = folhas.some((el) => /Esperando você/i.test(texto(el)) && !el.closest('[role="dialog"], [data-sino-botao]'))
  const praFazer = folhas.some((el) => /^(pra|para) fazer\b/i.test(texto(el)) && !el.closest('nav, [data-sidebar="sidebar"]'))
  const h1Visivel = [...document.querySelectorAll('h1')].some((h) => visivel(h, false))

  // links internos visíveis (para a checagem de links quebrados)
  const links = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'))
    .filter((h) => h && h.startsWith('/') && !h.startsWith('//'))

  return {
    url: location.pathname + location.search + location.hash,
    rolaPagina: document.documentElement.scrollHeight > H + 1, alturaDoc: document.documentElement.scrollHeight,
    rolaDeLado: document.documentElement.scrollWidth > W + 1, larguraDoc: document.documentElement.scrollWidth,
    erroRota, abas: abas.length, maiorLista, nListas: listas.length, abaDentro, abasRotulos: abas.map(texto),
    cheios, achadas, noCorpo, demo: [...new Set(demo)], tituloDesc, lateral, barraVis, barraItens, contadores, links,
    bodyBg, brancos: brancos.slice(0, 6), contraste: contraste.slice(0, 8), nContraste: contraste.length, sino, esperando, praFazer, h1Visivel,
    titulo: document.title, tema: document.documentElement.getAttribute('data-tema'),
    vazia: corpo.length < 20,
    rascunho: /Esta é a sua introdução/i.test(document.body.innerText),
  }
}

/* ── Infra ───────────────────────────────────────────────────────────────────────────────────────────────── */
const dorme = (ms) => new Promise((r) => setTimeout(r, ms))
const lancar = () => puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true, args: ['--hide-scrollbars=false', '--force-device-scale-factor=1', '--disable-dev-shm-usage'],
})
let browser = await lancar()
/** Se o Chrome cair no meio, outro sobe no lugar (uma rota falha, a conferência continua). */
async function navegador() {
  if (!browser.connected) { try { await browser.close() } catch { /* já caiu */ } browser = await lancar() }
  return browser
}
const falhas = []
const falha = (rota, largura, regra, medida, dono) => falhas.push({ rota, largura, regra, medida: String(medida).slice(0, 300), dono })
const resultado = { quando: new Date().toISOString(), rotas: [], redirecionamentos: [], links: [], roteiros: [], codigo: {}, falhas }
// se algo derrubar o processo antes da saída, o que já foi medido é gravado assim mesmo
let gravado = false
process.on('exit', () => {
  if (gravado) return
  try { mkdirSync(PASTA, { recursive: true }); writeFileSync(join(PASTA, 'resultado.json'), JSON.stringify({ ...resultado, interrompido: true }, null, 1)) } catch { /* nada a fazer */ }
  console.log(`\n(interrompido) ${falhas.length} falhas até aqui; resultado parcial em ${join(PASTA, 'resultado.json')}`)
  for (const f of falhas) console.log(`${f.rota} · ${f.largura} · ${f.regra} · ${f.medida} · ${f.dono}`)
})

async function abrir(w, h = 780) {
  // cada tela num contexto próprio: o localStorage de uma (a escola ativa, por exemplo) não vaza para a outra
  const ctx = await (await navegador()).createBrowserContext()
  const page = await ctx.newPage()
  const fechar = page.close.bind(page)
  page.close = async () => { try { await fechar() } catch { /* caiu */ } try { await ctx.close() } catch { /* caiu */ } }
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
  const erros = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning' && /R3|R4|no máximo/.test(m.text())) erros.push(`${m.type()}: ${m.text().slice(0, 240)}`) })
  page.on('pageerror', (e) => erros.push('pageerror: ' + String(e).slice(0, 240)))
  return { page, erros }
}

/** Clica no primeiro elemento clicável visível cujo texto é (exato) ou contém `t`. */
async function clicar(page, t, { exato = false, dentro = null } = {}) {
  const ok = await page.evaluate((t, exato, dentro) => {
    const raiz = dentro ? document.querySelector(dentro) : document
    if (!raiz) return false
    const els = [...raiz.querySelectorAll('button, a, [role="tab"], [role="menuitem"], [role="option"], [role="radio"], [role="switch"], label, summary')]
    // a caixa alta vem do CSS (botão, selo, navegação): compara sem caixa
    const txt = (e) => (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase()
    t = t.toLowerCase()
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.disabled }
    const el = els.find((e) => vis(e) && (exato ? txt(e) === t : txt(e).includes(t))) ||
      els.find((e) => vis(e) && (e.getAttribute('aria-label') || '').toLowerCase() === t)
    if (!el) return false
    el.scrollIntoView({ block: 'center' })
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', button: 0 }))
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse', button: 0 }))
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }))
    el.click()
    return true
  }, t, exato, dentro)
  await dorme(450)
  return ok
}

/** Navega DENTRO do app (sem recarregar), para o estado em memória sobreviver. */
async function irPara(page, caminho) {
  await page.evaluate((c) => { history.pushState({}, '', c); dispatchEvent(new PopStateEvent('popstate', { state: {} })) }, caminho)
  await dorme(600)
}
// textContent: o texto como foi escrito (a caixa alta do CSS não entra)
const textoDe = (page, sel = 'body') => page.evaluate((s) => (document.querySelector(s)?.textContent || '').replace(/\s+/g, ' '), sel)

async function emLotes(itens, n, fn) {
  const fila = [...itens]; const trabalhadores = []
  for (let i = 0; i < n; i++) trabalhadores.push((async () => { while (fila.length) await fn(fila.shift()) })())
  await Promise.all(trabalhadores)
}

/* ── 1. As rotas ─────────────────────────────────────────────────────────────────────────────────────────── */
const linksVistos = new Map()
if (faz('rotas')) {
  const tarefas = []
  for (const r of ROTAS.filter((r) => !opc.filtro || r.url.includes(opc.filtro))) for (const tema of TEMAS) for (const w of [1440, 375]) tarefas.push([r, w, tema])
  await emLotes(tarefas, 2, async ([r, w, tema]) => {
    const { page, erros } = await abrir(w)
    const escuro = tema === 'escuro'
    // ?tema= vai antes do #: força o tema nesta aba e sai do endereço
    const [semHash, hash = ''] = r.url.split('#')
    const url = `${semHash}${semHash.includes('?') ? '&' : '?'}tema=${tema}${hash ? '#' + hash : ''}`
    try {
      await page.goto(BASE + url, { waitUntil: 'networkidle0', timeout: 30000 })
      await dorme(1400) // as entradas animadas (folha, painel, a conversa que aparece aos poucos) precisam assentar
      const m = await page.evaluate(medirNaPagina, { proibidas: PROIBIDAS, escuro })
      const arq = join(PASTA, r.papel, `${r.nome}${escuro ? '-escuro' : ''}${w === 375 ? '-375' : ''}.png`)
      mkdirSync(dirname(arq), { recursive: true })
      await page.screenshot({ path: arq })
      for (const l of m.links) if (!linksVistos.has(l)) linksVistos.set(l, r.url)
      const reg = { ...r, largura: w, tema, ...m, links: undefined, errosConsole: erros, foto: arq.replace(raizMockups + '/', '') }
      resultado.rotas.push(reg)
      const L = `${w}${escuro ? ' escuro' : ''}`
      if (m.erroRota || m.vazia) falha(r.url, L, 'rota quebrada', m.erroRota ? 'erro do roteador' : 'página vazia', r.dono)
      if (erros.length) falha(r.url, L, 'erro de console', erros.join(' || '), r.dono)
      if (m.tema !== tema) falha(r.url, L, '(p) o ?tema= não valeu', `data-tema=${m.tema}`, 'B')
      if (/mockup/i.test(m.titulo)) falha(r.url, L, '(o) título da aba com "mockup"', m.titulo, 'B')
      if (escuro) {
        // (j) o escuro: só aqui; o resto da régua é medido no claro, para não repetir cada falha duas vezes
        if (m.bodyBg !== 'rgb(19, 31, 36)') falha(r.url, L, '(j) fundo do body no escuro', m.bodyBg, 'B')
        if (m.brancos.length) falha(r.url, L, '(j) bloco branco no escuro', m.brancos.join(' · '), r.dono)
        if (m.nContraste) falha(r.url, L, `(j) contraste baixo no escuro (${m.nContraste})`, m.contraste.join(' · '), r.dono)
        return
      }
      // a 375 a página pode rolar na vertical; a 1440, só o Mapa, os Fundamentos e a Privacidade
      if (w === 1440 && m.rolaPagina && !r.rolaPode) falha(r.url, L, 'R10 a página rola', `${m.alturaDoc}px em 780`, r.dono)
      if (w === 375 && m.rolaDeLado) falha(r.url, L, 'R10 rola para o lado', `${m.larguraDoc}px em 375`, r.dono)
      if (m.maiorLista > 3) falha(r.url, L, 'R3 mais de 3 abas', `${m.maiorLista}: ${m.abasRotulos.join(', ')}`, r.dono)
      if (m.nListas > 1) falha(r.url, L, 'R3 duas fileiras de abas', `${m.nListas} tablists: ${m.abasRotulos.join(', ')}`, r.dono)
      if (m.cheios.length > 1) falha(r.url, L, 'R4 mais de 1 botão cheio', m.cheios.map((c) => `${c.cor}: ${c.texto}`).join(' · '), r.dono)
      if (new Set(m.cheios.map((c) => c.cor)).size > 1) falha(r.url, L, 'R4 laranja e oficial juntos', m.cheios.map((c) => `${c.cor}: ${c.texto}`).join(' · '), r.dono)
      if (m.achadas.length) falha(r.url, L, 'glossário: palavra proibida', m.achadas.join(', '), r.dono)
      if (m.noCorpo.length && r.papel !== 'mapa') falha(r.url, L, 'glossário: palavra antiga no texto da tela', m.noCorpo.join(', '), r.dono)
      if (m.demo.length && r.papel !== 'mapa') falha(r.url, L, 'R12 palavra de bastidor na tela', m.demo.join(', '), r.dono)
      if (m.rascunho) falha(r.url, L, 'introdução ainda em rascunho', '"Esta é a sua introdução" na tela', r.dono)
      if (m.tituloDesc.length && r.papel !== 'mapa') falha(r.url, L, 'R6 título com descrição', m.tituloDesc.join(' || '), r.dono)
      if (m.contadores.length) falha(r.url, L, 'R9 número laranja fora do sino', m.contadores.join(', '), r.dono)
      if (r.casca && COM_SINO.includes(r.papel) && !m.sino) falha(r.url, L, '(l) sem o sino', 'button[aria-label^="Esperando você"] não visível', 'B')
      if (r.inicio && COM_SINO.includes(r.papel) && m.esperando) falha(r.url, L, '(l) "Esperando você" no Início', 'fora do sino', r.dono)
      if (r.papel === 'aluno' && r.inicio && m.praFazer) falha(r.url, L, '(m) "Pra fazer" no Início do aluno', 'a tarefa mora em Tarefas', r.dono)
      if (r.casca && !r.conversa && !m.h1Visivel) falha(r.url, L, '(n) sem título visível', 'nenhum h1 visível', r.dono)
      if (r.casca && w === 1440 && LUGARES[r.papel]) {
        const lugares = m.lateral.slice(0, LUGARES[r.papel].length)
        if (lugares.map((x) => x.replace(/\d+/g, '').trim().toLowerCase()).join('|') !== LUGARES[r.papel].join('|').toLowerCase()) falha(r.url, L, '(k) lateral fora dos lugares do papel', lugares.join(' · ') || '(sem lateral)', 'B')
      }
      if (r.casca && w === 375) {
        if (!m.barraVis) falha(r.url, L, '(k) sem barra de baixo a 375', 'nav[aria-label=Lugares] não visível no rodapé', 'B')
        else if (m.barraItens.map((x) => x.replace(/\d+/g, '').trim().toLowerCase()).join('|') !== BARRA[r.papel].join('|').toLowerCase()) falha(r.url, L, '(k) barra de baixo com outros itens', m.barraItens.join(' · '), 'B')
      }
    } catch (e) {
      falha(r.url, `${w}${escuro ? ' escuro' : ''}`, 'não abriu', String(e).slice(0, 200), r.dono)
    } finally { await page.close() }
  })
  resultado.rotas.sort((a, b) => (a.papel + a.nome + a.tema + a.largura).localeCompare(b.papel + b.nome + b.tema + b.largura))
}

/* ── 2. Endereços antigos ────────────────────────────────────────────────────────────────────────────────── */
if (faz('redirecionamentos')) {
  await emLotes(REDIRECIONA, 4, async ([de, para, dono]) => {
    const { page } = await abrir(1440)
    try {
      await page.goto(BASE + de, { waitUntil: 'networkidle0', timeout: 30000 })
      await dorme(400)
      const chegou = await page.evaluate(() => location.pathname + location.search)
      const quebrou = await page.evaluate(() => /Unexpected Application Error|404 Not Found/.test(document.body.innerText))
      const norm = (u) => { const x = new URL(BASE + u); if (x.searchParams.get('aba') === 'hoje') x.searchParams.delete('aba'); const p = [...x.searchParams].sort().map(([k, v]) => `${k}=${v}`).join('&'); return x.pathname + (p ? '?' + p : '') }
      const tema = await page.evaluate(() => document.documentElement.getAttribute('data-tema'))
      const pedido = new URL(BASE + de).searchParams.get('tema')
      const aceitos = Array.isArray(para) ? para : [para]
      const ok = !quebrou && aceitos.some((x) => norm(chegou) === norm(x)) && (!pedido || tema === pedido)
      resultado.redirecionamentos.push({ de, esperado: para, chegou, tema, ok })
      if (!ok) falha(de, '1440', '(p) endereço não chega ao lugar novo', `${quebrou ? 'quebrou' : 'chegou em ' + chegou}${pedido ? ` (tema ${tema})` : ''}; esperado ${aceitos.join(' ou ')}`, dono ?? 'B')
    } finally { await page.close() }
  })
}

/* ── 3. Links quebrados: todo link interno que apareceu nas telas, e todos os do Mapa ─────────────────────── */
if (faz('links')) {
  if (!linksVistos.size) {
    const { page } = await abrir(1440)
    await page.goto(BASE + '/', { waitUntil: 'networkidle0' })
    for (const l of await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h.startsWith('/')))) linksVistos.set(l, '/')
    await page.close()
  }
  const unicos = [...linksVistos.entries()].filter(([l]) => !ROTAS.some((r) => r.url === l))
  await emLotes(unicos, 4, async ([l, origem]) => {
    const { page, erros } = await abrir(1440)
    try {
      await page.goto(BASE + l, { waitUntil: 'networkidle0', timeout: 30000 })
      await dorme(300)
      const q = await page.evaluate(() => ({ quebrou: /Unexpected Application Error|404 Not Found/.test(document.body.innerText), n: document.body.innerText.trim().length, onde: location.pathname + location.search }))
      resultado.links.push({ link: l, origem, ...q, erros })
      if (q.quebrou || q.n < 20) falha(l, '1440', 'link quebrado', `aparece em ${origem}`, 'B')
      else if (erros.length) falha(l, '1440', 'erro de console', `${erros.join(' || ')} (link de ${origem})`, '?')
    } finally { await page.close() }
  })
}

/* ── 4. Os roteiros: clicar como a pessoa clicaria e ver o estado andar ───────────────────────────────────── */
async function roteiro(nome, dono, fn) {
  const { page, erros } = await abrir(1440)
  const passos = []
  const passo = (o, t) => passos.push(`${o ? 'ok' : 'FALHOU'} · ${t}`)
  try {
    await fn(page, passo)
  } catch (e) { passo(false, 'exceção: ' + String(e).slice(0, 200)) }
  const ok = passos.every((p) => p.startsWith('ok'))
  resultado.roteiros.push({ nome, ok, passos, erros })
  if (!ok) falha(nome, '1440', 'roteiro: o estado não andou', passos.filter((p) => !p.startsWith('ok')).join(' | '), dono)
  if (erros.length) falha(nome, '1440', 'erro de console no roteiro', erros.join(' || '), dono)
  const arq = join(PASTA, 'roteiros', `${nome}.png`)
  mkdirSync(dirname(arq), { recursive: true })
  // uma aba que fecha no meio (TargetCloseError) não derruba a conferência inteira
  try { await page.screenshot({ path: arq }) } catch (e) { passos.push('FALHOU · foto falhou: ' + String(e).slice(0, 120)) }
  try { await page.close() } catch { /* já fechou */ }
}

if (faz('roteiros')) {
  // A. Aprovar a versão adaptada tira o item do sino (DOC aprova; o sino é da base)
  const textoDoSino = (page) => page.evaluate(() => (document.querySelector('[role="dialog"][aria-label^="Esperando você"]')?.textContent || '').replace(/\s+/g, ' '))
  const rotuloDoSino = (page) => page.evaluate(() => document.querySelector('button[aria-label^="Esperando você"]')?.getAttribute('aria-label') || '')
  await roteiro('adaptada-sai-do-sino', 'DOC', async (page, passo) => {
    await page.goto(BASE + '/professor?sino=1&como=camila', { waitUntil: 'networkidle0' }); await dorme(700)
    passo((await textoDoSino(page)).includes('Prova adaptada'), 'o sino mostra "Prova adaptada"')
    passo(await clicar(page, 'Prova adaptada', { dentro: '[role="dialog"]' }), 'clica no item')
    await dorme(500)
    passo(page.url().includes('/professor/criados/prova-estequiometria'), `abre o documento (${page.url().replace(BASE, '')})`)
    passo(await clicar(page, 'Aprovar e enviar aos'), 'clica em "Aprovar e enviar aos 3 alunos"')
    await clicar(page, 'Continuar', { dentro: '[role="dialog"]' })
    await clicar(page, 'Aprovar e enviar', { exato: true, dentro: '[role="dialog"]' })
    passo(/Aprovado por/.test(await textoDe(page, 'main')), 'o documento diz "Aprovado por…"')
    await irPara(page, '/professor?sino=1')
    passo(!(await textoDoSino(page)).includes('Prova adaptada'), 'o item some do sino')
  })

  // A2. O sino: um item sem rota abre o painel por cima da tela atual, e Esc fecha a lista (B)
  await roteiro('sino-abre-o-item-aqui', 'B', async (page, passo) => {
    await page.goto(BASE + '/professor/criados?como=camila', { waitUntil: 'networkidle0' }); await dorme(700)
    const antes = await rotuloDoSino(page)
    passo(/Esperando você, \d+/.test(antes), `o sino tem número (${antes})`)
    passo(await clicar(page, antes), 'abre o sino')
    passo((await textoDoSino(page)).length > 20, 'a lista aparece')
    passo(await clicar(page, 'atenção', { dentro: '[role="dialog"][aria-label^="Esperando você"]' }), 'escolhe "Olívia · atenção"')
    await dorme(500)
    const onde = await page.evaluate(() => location.pathname + location.search)
    passo(onde.startsWith('/professor/criados') && onde.includes('item='), `continua em Criados, com o item (${onde})`)
    passo(await page.evaluate(() => [...document.querySelectorAll('[role="dialog"]')].some((d) => d.getBoundingClientRect().width > 200)), 'o painel do item abre')
  })

  // B. Aprovar as 26 notas: a coluna destrava no boletim e o Lucas vê a prova de mol corrigida (P1, P4, A2)
  await roteiro('notas-aprovadas-chegam-ao-aluno', 'PI', async (page, passo) => {
    await page.goto(BASE + '/professor/aprovar/prova-2b?como=camila', { waitUntil: 'networkidle0' }); await dorme(600)
    for (let i = 0; i < 6; i++) {
      const aberto = await page.evaluate(() => {
        const b = [...document.querySelectorAll('main li button, main [role="button"]')].find((x) => !x.dataset.visto && /Abaixo|branco|limite|Acima|aba/i.test(x.innerText))
        if (!b) return false
        b.dataset.visto = '1'; b.click(); return true
      })
      if (!aberto) break
      await dorme(500)
      await clicar(page, 'Fechar') || await page.keyboard.press('Escape')
    }
    passo(await clicar(page, 'Aprovar as 26 notas'), 'clica em "Aprovar as 26 notas" (aceso depois dos 5)')
    await clicar(page, 'Aprovar as 26 notas', { dentro: '[role="dialog"], [role="alertdialog"]' })
    passo(/Aprovad|Confirmado por/.test(await textoDe(page, 'main')), 'a página mostra o registro da aprovação')
    await irPara(page, '/aluno/tarefas?como=lucas')
    passo(/Prova de mol e massa molar[\s\S]{0,80}Corrigida/i.test(await textoDe(page, 'main')), 'o Lucas vê "Prova de mol e massa molar · Corrigida"')
  })

  // C. Confirmar a 3ºA faz ela aparecer em Turmas (P1 painel; P3 Turmas)
  await roteiro('confirmar-3a-aparece-em-turmas', 'PT', async (page, passo) => {
    await page.goto(BASE + '/professor?item=turma-3a&como=camila', { waitUntil: 'networkidle0' }); await dorme(600)
    passo(await clicar(page, 'Confirmar', { exato: true, dentro: '[role="dialog"]' }) || await clicar(page, 'Confirmar', { exato: true }), 'confirma no painel da fila')
    passo(/Gerar o acesso agora/i.test(await textoDe(page)), 'o painel oferece "Gerar o acesso agora"')
    await irPara(page, '/professor/turmas')
    const depois = await textoDe(page, 'main')
    passo(/3ºA/.test(depois) && !/Confirme sua turma/.test(depois), 'a 3ºA aparece na lista e a faixa some')
  })

  // D. Avisar um adulto chega à coordenação, que responde; o aluno lê (A1, C1)
  await roteiro('avisar-e-responder', 'CE', async (page, passo) => {
    await page.goto(BASE + '/aluno/avisar?como=lucas', { waitUntil: 'networkidle0' }); await dorme(600)
    await page.evaluate(() => { const t = document.querySelector('main textarea'); if (t) { const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; set.call(t, 'um colega me xingou no intervalo'); t.dispatchEvent(new Event('input', { bubbles: true })) } })
    await clicar(page, 'Alguém me tratou mal')
    passo(await clicar(page, 'Enviar', { exato: true }), 'envia o aviso')
    passo(/Aviso 34/.test(await textoDe(page, 'main')), 'mostra "Aviso 34"')
    await irPara(page, '/coordenacao?sino=1')
    passo(/Aviso 3[1-9]|Aviso de aluno|Aviso/.test(await textoDoSino(page)), 'o sino da coordenação mostra o aviso')
    await irPara(page, '/coordenacao/registros?aba=avisos&aviso=N-2026-0034')
    passo(await clicar(page, 'Responder e concluir'), 'clica em "Responder e concluir"')
    await page.evaluate(() => { const t = document.querySelector('[role="dialog"] textarea'); if (t) { const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; set.call(t, 'Oi, Lucas. A orientadora vai falar com você amanhã, às 8h.'); t.dispatchEvent(new Event('input', { bubbles: true })) } })
    passo(await clicar(page, 'Enviar', { exato: true, dentro: '[role="dialog"]' }), 'envia a resposta')
    await irPara(page, '/aluno/avisar')
    passo(/Respondido/i.test(await textoDe(page, 'main')), 'o aluno vê "Aviso 34 · Respondido"')
  })

  // E. Duas abas ao vivo: o pedido de nome numa aba aparece na fila do professor da outra, sem recarregar (B)
  await roteiro('duas-abas-ao-vivo', 'B', async (page, passo) => {
    await page.goto(BASE + '/professor?sino=1&como=camila', { waitUntil: 'networkidle0' }); await dorme(600)
    const antes = await textoDoSino(page)
    const outra = await page.browserContext().newPage()
    await outra.goto(BASE + '/e/colegio-aurora/turma', { waitUntil: 'networkidle0' })
    const r = await outra.evaluate(async () => {
      const m = await import('/src/dados/acesso.ts')
      const nome = m.listaDe('2b').find((n) => n.nome === 'Giovana Teles')
      return m.pedidos.pedir({ turmaId: '2b', nomeId: nome.id, matricula: '2026-0444', senha: 'segredo123' })
    })
    passo(r === 'ok', `o pedido da Giovana Teles entra (${r})`)
    await dorme(700)
    const depois = await textoDoSino(page)
    passo(antes !== depois && /Pedidos para entrar/.test(depois), 'a lista do sino mudou sem recarregar')
    await outra.close()
  })

  /* ── 13ª rodada: os pedidos novos (A a D) ── */
  // A. O atalho ADAPTAR abre a escolha entre os Criados (ou anexar)
  await roteiro('adaptar-abre-os-criados', 'DOC', async (page, passo) => {
    await page.goto(BASE + '/professor?adaptar=1&como=camila', { waitUntil: 'networkidle0' }); await dorme(900)
    const d = await textoDe(page, '[role="dialog"]')
    passo(d.length > 0, 'abre uma janela')
    passo(/Prova de estequiometria|estequiometria/i.test(d), 'a janela lista a prova de estequiometria dos Criados')
    passo(/anexar/i.test(d), 'a janela oferece anexar um arquivo')
  })

  // C. O Analista em tela inteira (coordenação e rede) responde a uma pergunta pronta
  const analistaResponde = (papel, url, dono) => roteiro(`analista-${papel}-responde`, dono, async (page, passo) => {
    await page.goto(BASE + url, { waitUntil: 'networkidle0' }); await dorme(900)
    const caixa = await page.evaluate(() => [...document.querySelectorAll('input, textarea')].some((e) => /Pergunte/i.test(e.getAttribute('placeholder') || '')))
    passo(caixa, 'tem a caixa "Pergunte sobre…"')
    const clicou = await page.evaluate(() => {
      const g = document.querySelector('[aria-label="Perguntas prontas"]') || document.querySelector('[role="log"]')
      const b = g && [...g.querySelectorAll('button')].find((x) => x.innerText.trim().length > 8 && x.getBoundingClientRect().width > 0)
      if (!b) return false
      b.click(); return true
    })
    passo(clicou, 'clica numa pergunta pronta')
    // a resposta chega palavra a palavra (até ~1,5 s depois do "Pensando…")
    await dorme(3200)
    passo((await textoDe(page, '[role="log"]')).length > 60, 'o Analista responde')
  })
  await analistaResponde('coordenacao', '/coordenacao/analista', 'CP')
  await analistaResponde('rede', '/rede/analista', 'RP')

  /** Digita na caixa do Analista e devolve o texto da conversa. */
  const perguntarAoAnalista = async (page, pergunta) => {
    const ok = await page.evaluate(() => {
      const c = [...document.querySelectorAll('input, textarea')].find((e) => /Pergunte/i.test(e.getAttribute('placeholder') || '') && e.getBoundingClientRect().width > 0)
      if (!c) return false
      document.querySelectorAll('[data-conferir-caixa]').forEach((e) => e.removeAttribute('data-conferir-caixa'))
      c.setAttribute('data-conferir-caixa', ''); return true
    })
    if (!ok) return null
    await page.click('[data-conferir-caixa]')
    await page.type('[data-conferir-caixa]', pergunta, { delay: 3 })
    await page.keyboard.press('Enter')
    // a resposta chega palavra a palavra (até ~1,5 s depois do "Pensando…")
    await dorme(3200)
    return textoDe(page, '[role="log"]')
  }

  // C2. Na rede, o Analista recusa nome e calcula a pergunta livre (o motor)
  await roteiro('analista-rede-recusa-nome', 'RP', async (page, passo) => {
    await page.goto(BASE + '/rede/analista', { waitUntil: 'networkidle0' }); await dorme(900)
    const t = await perguntarAoAnalista(page, 'quais alunos da araucária foram mal em matemática?')
    passo(t !== null, 'acha a caixa "Pergunte sobre…"')
    passo(/só vejo números agregados|so vejo numeros agregados/i.test(t || ''), 'responde "na rede eu só vejo números agregados"')
  })
  await roteiro('analista-rede-calcula', 'RP', async (page, passo) => {
    await page.goto(BASE + '/rede/analista', { waitUntil: 'networkidle0' }); await dorme(900)
    const t = await perguntarAoAnalista(page, 'quantos alunos do 8º ano usaram em setembro?')
    passo(/\d[\d.]* de [\d.]+/.test(t || ''), 'responde com "N de M" alunos')
    passo(/Araucária[\s\S]*Ipê[\s\S]*Manacá/.test(t || ''), 'por escola, de A a Z')
    const t2 = await perguntarAoAnalista(page, 'e em agosto?')
    passo(/agosto/i.test((t2 || '').slice((t || '').length)), '"e em agosto?" compara')
  })
  await roteiro('analista-escola-calcula', 'CP', async (page, passo) => {
    await page.goto(BASE + '/coordenacao/analista', { waitUntil: 'networkidle0' }); await dorme(900)
    const t = await perguntarAoAnalista(page, 'qual o acerto do 9º ano por disciplina?')
    passo(/a média esconde/i.test(t || '') && /abaixo de 50%/i.test(t || '') && !/63\s?%/.test(t || ''), 'não faz média: conta os alunos abaixo de 50%')
    const t2 = await perguntarAoAnalista(page, 'qual professor usa menos o Turmma?')
    passo(/por professor/i.test((t2 || '').slice((t || '').length)), 'recusa número por professor')
  })

  // C3. ?tema= força o tema e sai do endereço; a Aparência de Configurações muda na hora (B)
  await roteiro('tema-escuro-e-aparencia', 'B', async (page, passo) => {
    await page.goto(BASE + '/aluno?como=lucas&tema=escuro', { waitUntil: 'networkidle0' }); await dorme(500)
    const a = await page.evaluate(() => ({ tema: document.documentElement.getAttribute('data-tema'), busca: location.search, fundo: getComputedStyle(document.body).backgroundColor }))
    passo(a.tema === 'escuro' && a.fundo === 'rgb(19, 31, 36)', `fica escuro (${a.tema}, ${a.fundo})`)
    passo(!a.busca.includes('tema'), `o tema sai do endereço (${a.busca || 'vazio'})`)
    await page.goto(BASE + '/professor?como=camila&config=geral', { waitUntil: 'networkidle0' }); await dorme(600)
    passo(await clicar(page, 'Claro', { exato: true, dentro: '[role="dialog"]' }), 'Configurações › Aparência › Claro')
    passo(await page.evaluate(() => document.documentElement.getAttribute('data-tema')) === 'claro', 'fica claro na hora')
    await page.reload({ waitUntil: 'networkidle0' }); await dorme(400)
    passo(await page.evaluate(() => document.documentElement.getAttribute('data-tema')) === 'claro', 'recarregar mantém')
  })

  // D. Cada introdução anda até o fim (a comemoração). Aperta sempre o botão primário do rodapé, seja qual for o rótulo
  // (CONTINUAR, ENTENDI, SIM, ESTÃO CERTAS…); se ele estiver desligado, toca a primeira opção do passo (ou o GERAR) e espera.
  // O mínimo de passos é o do plano: a equipe Turmma tem 2 de propósito (3 telas, contando a comemoração).
  for (const [papel, url, dono, minimo] of [['aluno', '/aluno/bem-vindo?como=lucas&rever=1', 'PX', 3], ['professor', '/professor/bem-vindo?como=camila&rever=1', 'PX', 3],
    ['coordenacao', '/coordenacao/bem-vindo?rever=1', 'PX', 3], ['rede', '/rede/bem-vindo?rever=1', 'PX', 3], ['operacao', '/operacao/bem-vindo?rever=1', 'PX', 2]]) {
    await roteiro(`introducao-${papel}`, dono, async (page, passo) => {
      await page.goto(BASE + url, { waitUntil: 'networkidle0' }); await dorme(700)
      const noFim = () => page.evaluate(() => !!document.querySelector('[data-introducao-fim]'))
      let passos = 0
      for (let i = 0; i < 16 && !(await noFim()); i++) {
        const estado = await page.evaluate(() => {
          const r = document.querySelector('[data-introducao="rodape"]')
          const bs = r ? [...r.querySelectorAll('button')] : []
          const primario = bs[bs.length - 1]
          if (!primario) return 'sem-rodape'
          if (!primario.disabled) { primario.click(); return 'andou' }
          // desligado: toca a primeira opção ainda não marcada do passo, ou um GERAR
          const c = document.querySelector('[data-introducao="conteudo"]') || document.querySelector('main') || document.body
          const marcado = (e) => e.getAttribute('aria-checked') === 'true' || e.getAttribute('aria-pressed') === 'true' || e.checked === true
          const visivel = (e) => e.getBoundingClientRect().width > 0
          const gerar = [...c.querySelectorAll('button')].find((b) => visivel(b) && !b.disabled && /^gerar/i.test(b.innerText.trim()))
          const opcao = [...c.querySelectorAll('[role="radio"], [role="checkbox"], [role="switch"], [aria-pressed], input[type="radio"], input[type="checkbox"]')].find((e) => visivel(e) && !marcado(e) && !e.disabled)
          const botao = [...c.querySelectorAll('button')].find((b) => visivel(b) && !b.disabled)
          const alvo = gerar || opcao || botao
          if (!alvo) return 'preso'
          alvo.click(); return 'tocou'
        })
        if (estado === 'andou') { passos++; await dorme(500) }
        else if (estado === 'tocou') await dorme(1600)
        else break
      }
      passo(await noFim(), `chega ao fim, com COMEÇAR (${passos} passos)`)
      passo(passos >= minimo, `pelo menos ${minimo} passos`)
    })
  }

  // F. Os três roteiros do Mapa: cada passo com link abre a tela
  for (const titulo of ['Roteiro 1', 'Roteiro 2', 'Roteiro 3']) {
    await roteiro(`mapa-${titulo.replace(' ', '-').toLowerCase()}`, 'B', async (page, passo) => {
      await page.goto(BASE + '/', { waitUntil: 'networkidle0' }); await dorme(400)
      const passos = await page.evaluate((titulo) => {
        const h = [...document.querySelectorAll('h2')].find((x) => x.innerText.startsWith(titulo))
        return [...h.closest('section').querySelectorAll('a')].map((a) => ({ href: a.getAttribute('href'), nome: a.innerText.split('\n').slice(0, 2).join(' ') }))
      }, titulo)
      for (const p of passos) {
        await page.goto(BASE + p.href, { waitUntil: 'networkidle0' }); await dorme(500)
        // a tela pode trocar o endereço logo ao abrir (?tema=, ?como=, redirecionamento): uma segunda tentativa
        const medir = () => page.evaluate(() => ({ onde: location.pathname + location.search, quebrou: /Unexpected Application Error|404 Not Found/.test(document.body.innerText), n: document.body.innerText.length }))
        let q
        try { q = await medir() } catch { await dorme(800); q = await medir() }
        passo(!q.quebrou && q.n > 40, `${p.nome} → ${q.onde}`)
      }
    })
  }
}

/* ── 5. Código: tsc e oxlint ─────────────────────────────────────────────────────────────────────────────── */
if (faz('codigo')) {
  const tsc = spawnSync(join(raizMockups, 'node_modules/.bin/tsc'), ['-p', 'tsconfig.app.json', '--noEmit'], { cwd: raizMockups, encoding: 'utf8' })
  const lint = spawnSync('npx', ['oxlint', 'src'], { cwd: raizMockups, encoding: 'utf8' })
  const errosTsc = (tsc.stdout + tsc.stderr).split('\n').filter((l) => /error TS/.test(l))
  resultado.codigo = { tsc: { status: tsc.status, erros: errosTsc }, oxlint: { status: lint.status, saida: (lint.stdout + lint.stderr).trim().split('\n').slice(-40) } }
  for (const l of errosTsc) falha(l.split('(')[0], '-', 'tsc', l.slice(0, 220), '(pelo arquivo)')
  if (lint.status !== 0) falha('src', '-', 'oxlint', (lint.stdout + lint.stderr).trim().split('\n').slice(-3).join(' '), '(pelo arquivo)')
}

/* ── 6. Lado a lado: as 12 telas dos wireframes do blueprint × as telas reais ─────────────────────────────── */
if (faz('lado')) {
  const md = readFileSync(BLUEPRINT, 'utf8')
  const blocos = [...md.matchAll(/```\n([\s\S]*?)```/g)].map((m) => m[1])
  const b31 = blocos[0].split(/\n(?=375 × 667)/)
  const WF = [b31[0], b31[1], ...blocos.slice(1, 11)]
  const TELAS = [
    ['01-aluno-inicio', '/aluno', 1440, 780, []],
    ['02-aluno-inicio-celular', '/aluno', 375, 667, []],
    ['03-aluno-tarefa-pedir-ajuda', '/aluno/tarefas/estequiometria', 1440, 780, [['Pedir ajuda']]],
    ['04-aluno-prova', '/aluno/prova/prova-estequiometria', 1440, 780, [['Começar', true]]],
    ['05-professor-inicio', '/professor', 1440, 780, []],
    ['06-professor-conversa-documento', '/professor/conversa/nova?ferramenta=prova&turma=2b', 1440, 780, [['Gerar prova'], ['__espera', 2600]]],
    ['07-turma-hoje', '/professor/turmas/2b', 1440, 780, []],
    ['08-turma-alunos', '/professor/turmas/2b?aba=alunos', 1440, 780, []],
    ['09-comecar-aula', '/professor/turmas/2b/aula', 1440, 780, []],
    ['10-coordenacao-inicio', '/coordenacao', 1440, 780, []],
    ['11-coordenacao-escola', '/coordenacao/escola', 1440, 780, []],
    ['12-coordenacao-ia', '/coordenacao/registros?aba=ia', 1440, 780, []],
  ]
  const pastaLado = join(PASTA, 'lado-a-lado')
  mkdirSync(pastaLado, { recursive: true })
  resultado.ladoALado = []
  for (let i = 0; i < TELAS.length; i++) {
    const [nome, url, w, h, cliques] = TELAS[i]
    const { page } = await abrir(w, h)
    await page.goto(BASE + url, { waitUntil: 'networkidle0' }); await dorme(500)
    for (const [t, x] of cliques) { if (t === '__espera') await dorme(x); else await clicar(page, t, { exato: !!x }) }
    await dorme(400)
    const png = (await page.screenshot({ encoding: 'base64' }))
    const real = join(pastaLado, `${nome}-real.png`)
    writeFileSync(real, Buffer.from(png, 'base64'))
    await page.close()
    // a prancha: o wireframe à esquerda, a tela real à direita
    const prancha = await browser.newPage()
    const larguraReal = w === 375 ? 375 : 1100
    await prancha.setViewport({ width: 1100 + larguraReal + 60, height: 900, deviceScaleFactor: 1 })
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    await prancha.setContent(`<!doctype html><meta charset="utf-8"><body style="margin:0;padding:20px;font-family:-apple-system,system-ui;background:#f4f4f4;display:flex;gap:20px;align-items:flex-start">
      <div style="width:1100px"><div style="font:600 14px system-ui;margin-bottom:8px">Wireframe do blueprint</div>
      <pre style="margin:0;background:#fff;border:1px solid #ddd;padding:12px;font:11.5px/1.32 Menlo,monospace;white-space:pre;overflow:hidden">${esc(WF[i] || '(sem wireframe)')}</pre></div>
      <div style="width:${larguraReal}px"><div style="font:600 14px system-ui;margin-bottom:8px">Tela real · ${esc(url)} · ${w} × ${h}</div>
      <img src="data:image/png;base64,${png}" style="width:${larguraReal}px;border:1px solid #ddd;display:block"></div></body>`)
    await dorme(200)
    const arq = join(pastaLado, `${nome}.png`)
    await prancha.screenshot({ path: arq, fullPage: true })
    await prancha.close()
    resultado.ladoALado.push({ nome, url, prancha: arq.replace(raizMockups + '/', ''), real: real.replace(raizMockups + '/', '') })
  }
}

try { await browser.close() } catch { /* já caiu */ }

/* ── Saída ───────────────────────────────────────────────────────────────────────────────────────────────── */
mkdirSync(PASTA, { recursive: true })
writeFileSync(join(PASTA, 'resultado.json'), JSON.stringify(resultado, null, 1))
gravado = true
const porDono = {}
for (const f of falhas) porDono[f.dono] = (porDono[f.dono] || 0) + 1
console.log(`\n${falhas.length} falhas · ${resultado.rotas.length} fotos · ${resultado.redirecionamentos.length} redirecionamentos · ${resultado.links.length} links · ${resultado.roteiros.length} roteiros`)
console.log(Object.entries(porDono).map(([d, n]) => `${d}: ${n}`).join(' · '))
console.log('\nrota · largura · regra · medida · dono')
for (const f of falhas) console.log(`${f.rota} · ${f.largura} · ${f.regra} · ${f.medida} · ${f.dono}`)
for (const r of resultado.roteiros) console.log(`\nroteiro ${r.nome}: ${r.ok ? 'ok' : 'FALHOU'}\n  ${r.passos.join('\n  ')}`)
console.log(`\nresultado em ${join(PASTA, 'resultado.json')}`)
