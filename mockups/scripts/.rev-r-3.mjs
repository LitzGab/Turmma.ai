import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 780 })
const erros=[]; p.on('pageerror', e=>erros.push(String(e))); p.on('console', m=>{ if(m.type()==='error') erros.push(m.text().slice(0,200)) })
const sh = (n)=>p.screenshot({ path: `/Users/gabriel/Code/Turmma/mockups/scripts/shots/polimento/revisao-R/${n}.png` })
const d = (ms)=>new Promise(r=>setTimeout(r,ms))
const marca = (fn, arg)=>p.evaluate((src,arg)=>{ document.querySelectorAll('[data-alvo]').forEach(e=>e.removeAttribute('data-alvo')); const el=(new Function('arg','return ('+src+')(arg)'))(arg); if(el) el.setAttribute('data-alvo','1'); return !!el }, fn.toString(), arg)
const real = async (fn,arg)=>{ const ok = await marca(fn,arg); if(!ok){console.log('nao achou',arg);return} await p.click('[data-alvo]'); await d(450) }
const menus = ()=>p.evaluate(()=>[...document.querySelectorAll('[role=menu]')].map(m=>m.innerText.replace(/\n/g,' / ')).join(' | '))
const ultimoBotao = (t)=>{ const r=[...document.querySelectorAll('tr')].find(x=>x.textContent.includes(t)); const bs=[...r.querySelectorAll('button')]; return bs[bs.length-1] }
await p.goto('http://127.0.0.1:5190/operacao', { waitUntil: 'networkidle0' }); await p.evaluate(()=>localStorage.clear()); await p.reload({ waitUntil: 'networkidle0' })
for (const [t,n] of [['Secretaria Municipal de Educação de Joinville','m-rede'],['E. M. Araucária','m-escola-ativa'],['E. M. Figueira','m-escola-convite']]) { await real(ultimoBotao, t); await sh(n); console.log(n, await menus()); await p.keyboard.press('Escape'); await d(250) }
await real((t)=>[...[...document.querySelectorAll('tr')].find(x=>x.textContent.includes(t)).querySelectorAll('button')].find(b=>/revogar/i.test(b.textContent)), 'E. M. Figueira')
await real(()=>[...document.querySelectorAll('[role=alertdialog] button, [role=dialog] button')].find(b=>/^revogar$/i.test(b.textContent.trim())))
await sh('revogado'); console.log('fig', await p.evaluate(()=>[...document.querySelectorAll('tr')].find(x=>x.textContent.includes('E. M. Figueira')).innerText.replace(/\s+/g,' ')))
await p.goto('http://127.0.0.1:5190/rede', { waitUntil: 'networkidle0' }); await d(300)
console.log('rede', (await p.evaluate(()=>document.body.innerText)).match(/Figueira\n[^\n]*/)?.[0])
await real(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='SM')); await sh('rede-avatar'); console.log('avatar', await menus())
await p.goto('http://127.0.0.1:5190/familia', { waitUntil: 'networkidle0' }); await d(300)
await real(()=>[...document.querySelectorAll('header button')].pop()); await sh('familia-menu'); console.log('fam', await menus())
await p.setViewport({ width: 375, height: 780 }); await p.goto('http://127.0.0.1:5190/rede', { waitUntil: 'networkidle0' }); await d(300)
await real(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='SM')); await sh('rede-375-avatar'); console.log('avatar375', await menus())
console.log('ERROS', erros); await b.close()
