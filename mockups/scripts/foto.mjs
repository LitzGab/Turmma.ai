#!/usr/bin/env node
/* Fotografa uma rota do mockup no Chrome sem janela, no tamanho da janela do Gabriel (1440 × 780).
   Precisa do puppeteer-core, que NÃO é dependência do projeto: instale numa pasta temporária e rode de lá, ou
   `npm i --no-save puppeteer-core` aqui. Usa o Google Chrome do sistema. O servidor tem de estar em 127.0.0.1:5190.
   Uso:
     node scripts/foto.mjs --url /professor/ferramentas --out /tmp/nome.png
       [--w 1440] [--h 780]           tamanho da janela (celular: --w 375 --h 780)
       [--click "seletor css"]        clica (pode repetir; roda na ordem, junto com --text e --eval)
       [--text "Texto visível"]       clica no primeiro botão/link/aba/item cujo texto contém isto
       [--eval "código js"]           roda no contexto da página
       [--hover "seletor css"]        passa o mouse
       [--wait 400]                   espera extra em ms depois de cada passo (padrão 350)
       [--full]                       página inteira em vez da janela
       [--clear]                      apaga o localStorage do mockup antes (estado inicial)
   Saída: grava o PNG em ./shots/<out> e imprime o caminho, os erros de console e se a página rola
   (scrollHeight > altura da janela), que é o que o Gabriel reprova. */
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
import { dirname, isAbsolute, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const passos = []
const o = { w: 1440, h: 780, wait: 350, full: false, clear: false, url: '/', out: 'shot.png' }
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a === '--full') o.full = true
  else if (a === '--clear') o.clear = true
  else if (['--click', '--text', '--eval', '--hover'].includes(a)) passos.push([a.slice(2), args[++i]])
  else if (a.startsWith('--')) o[a.slice(2)] = args[++i]
}
const base = 'http://127.0.0.1:5190'
const url = o.url.startsWith('http') ? o.url : base + o.url
const out = isAbsolute(o.out) ? o.out : join(aqui, 'shots', o.out)
mkdirSync(dirname(out), { recursive: true })

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true, args: ['--hide-scrollbars=false', '--force-device-scale-factor=1'],
})
const erros = []
try {
  const page = await browser.newPage()
  await page.setViewport({ width: Number(o.w), height: Number(o.h), deviceScaleFactor: 1 })
  page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text().slice(0, 300)) })
  page.on('pageerror', (e) => erros.push('pageerror: ' + String(e).slice(0, 300)))
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })
  if (o.clear) { await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'networkidle0' }) }
  const dorme = (ms) => new Promise((r) => setTimeout(r, ms))
  await dorme(Number(o.wait))
  for (const [tipo, v] of passos) {
    if (tipo === 'click') await page.click(v)
    else if (tipo === 'hover') await page.hover(v)
    else if (tipo === 'eval') await page.evaluate(v)
    else if (tipo === 'text') {
      const ok = await page.evaluate((t) => {
        const els = [...document.querySelectorAll('button, a, [role="tab"], [role="menuitem"], [role="option"], [role="switch"], label, summary')]
        const el = els.find((e) => e.offsetParent !== null && (e.textContent || '').trim().includes(t)) || els.find((e) => (e.getAttribute('aria-label') || '').includes(t))
        if (!el) return false
        el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', button: 0 }))
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
        el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse', button: 0 }))
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }))
        el.click()
        return true
      }, v)
      if (!ok) erros.push(`--text: não achei "${v}"`)
    }
    await dorme(Number(o.wait))
  }
  const medida = await page.evaluate(() => ({
    rolaPagina: document.documentElement.scrollHeight > window.innerHeight + 1,
    alturaDoc: document.documentElement.scrollHeight, janela: window.innerHeight,
    rolaDeLado: document.documentElement.scrollWidth > window.innerWidth + 1,
  }))
  await page.screenshot({ path: out, fullPage: o.full })
  console.log(JSON.stringify({ out, url, ...medida, errosConsole: erros }, null, 1))
} finally { await browser.close() }
