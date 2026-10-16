import puppeteer from 'puppeteer-core'
const B = 'http://127.0.0.1:5190'
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const p = await b.newPage()
await p.setViewport({ width: 1440, height: 780 })
const espera = (ms) => new Promise((r) => setTimeout(r, ms))
const erros = []
p.on('pageerror', (e) => erros.push(String(e)))
p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()) })
const limpar = async () => { await p.goto(B + '/'); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear() }) }
const tipo = async (sel, t) => { await p.waitForSelector(sel); await p.focus(sel); await p.keyboard.type(t) }
const clicaTexto = async (t, exato) => { await p.evaluate((t, exato) => { const el = [...document.querySelectorAll('button, a')].find((x) => { const s = x.textContent.trim().toLowerCase(); return (exato ? s === t.toLowerCase() : s.includes(t.toLowerCase())) && !x.disabled }); if (!el) throw new Error('sem ' + t); el.click() }, t, exato); await espera(500) }
const onde = () => p.evaluate(() => location.pathname + location.search)
const codigo = async () => { try { await p.waitForSelector('input[aria-label="Dígito 1 de 6"]', { timeout: 4000 }) } catch { return 'SEM VERIFICACAO em ' + await onde() } await p.focus('input[aria-label="Dígito 1 de 6"]'); await p.keyboard.type('123456'); await espera(200); await clicaTexto('Confirmar e entrar'); return 'ok' }
const r = {}
const passo = async (nome, f) => { try { await f() } catch (e) { r[nome + '_ERRO'] = String(e).slice(0, 160) + ' @ ' + await onde() } }

await passo('professor', async () => {
  await limpar(); await p.goto(B + '/convite#t9KQ2xLmP4aR'); await espera(600)
  await clicaTexto('Aceitar e entrar'); await espera(500); r.professor = await onde()
})
await passo('coord', async () => {
  await limpar(); await p.goto(B + '/convite?papel=coordenacao#hm-aurora'); await espera(600)
  await tipo('input[type=password]', 'senha1234'); await clicaTexto('Criar senha', true)
  r.coordVerif = await onde(); r.coordCod = await codigo(); r.coordenacao = await onde()
})
await passo('secretaria', async () => {
  await limpar()
  for (const vez of [1, 2]) {
    await p.goto(B + '/entrar?quem=equipe'); await espera(600)
    await tipo('input[type=email]', 'secretaria@educacao.joinville.example'); await tipo('input[type=password]', 'senha1234')
    await clicaTexto('Entrar', true)
    r['secretariaVerif' + vez] = await onde(); r['secCod' + vez] = await codigo(); r['secretaria' + vez] = await onde()
    if (vez === 1) { await clicaTexto('Continuar'); await clicaTexto('Começar'); r.secretariaDepois = await onde() }
  }
})
await passo('equipe', async () => {
  await limpar(); await p.goto(B + '/entrar?quem=equipe'); await espera(600)
  await tipo('input[type=email]', 'equipe@turmma.example'); await tipo('input[type=password]', 'senha1234')
  await clicaTexto('Entrar', true); r.eqCod = await codigo(); r.equipe = await onde()
})
await passo('diretos', async () => {
  await limpar()
  for (const u of ['/rede', '/operacao', '/coordenacao']) { await p.goto(B + u); await espera(500); r['direto' + u] = await onde() }
})
const rever = async () => {
  await p.click('button[aria-label$="menu da conta"]'); await espera(400)
  await p.evaluate(() => [...document.querySelectorAll('[role=menuitem]')].find((x) => x.textContent.includes('Rever a introdução')).click()); await espera(600)
}
await passo('rever', async () => {
  await limpar()
  await p.goto(B + '/professor'); await espera(900); await rever(); r.reverProf = await onde()
  await p.goto(B + '/coordenacao'); await espera(900); await rever(); r.reverCoord = await onde()
  await p.click('button[aria-label="Sair"]'); await espera(500); r.xCoord = await onde()
  await p.goto(B + '/coordenacao/bem-vindo?rever=1'); await espera(500); await clicaTexto('Continuar'); await clicaTexto('Começar')
  await p.goto(B + '/coordenacao/bem-vindo'); await espera(500); r.vistaSemRever = await onde()
})
await passo('prefs', async () => {
  await p.evaluate(() => localStorage.setItem('turmma-demo-v2:preferencias', JSON.stringify({ texto: { aluno: 'padrao', professor: 'grande', coordenacao: 'padrao' }, prova: { questoes: 15, alternativas: 4, gabarito: true }, coordenacao: { resumo: false, alerta: true }, rede: { destaque: 'ia', relatorioMensal: true }, escolaAoAbrir: 'ultima' })))
  await p.goto(B + '/professor?config=assistente'); await espera(900)
  r.questoes = await p.evaluate(() => document.querySelector('[role=radiogroup][aria-label="Questões por prova"] [aria-checked=true]')?.textContent)
  r.zoomProf = await p.evaluate(() => document.documentElement.style.zoom)
  await p.goto(B + '/coordenacao?config=notificacoes'); await espera(900)
  r.switches = await p.evaluate(() => [...document.querySelectorAll('[role=switch]')].map((x) => `${x.getAttribute('aria-label')}=${x.getAttribute('aria-checked')}`).join(' | '))
  r.zoomCoord = await p.evaluate(() => document.documentElement.style.zoom)
})
r.eventos = await p.evaluate(() => JSON.parse(localStorage.getItem('turmma-demo-v2:eventos') || '[]').map((e) => e.tipo + ':' + JSON.stringify(e.dados) + ':' + e.quem.nome).join(' || '))
r.erros = erros
console.log(JSON.stringify(r, null, 1))
await b.close()
