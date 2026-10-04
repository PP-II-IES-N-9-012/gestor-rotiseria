const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

const OUTPUT_DIRS = [
  path.join(__dirname, '..', 'public', 'capturas'),
  path.join(__dirname, '..', 'docs', 'capturas'),
  'C:\\Users\\casti\\.gemini\\antigravity-ide\\brain\\418afc3a-2857-45b4-9a2b-0d1d06a535d6\\capturas'
];

OUTPUT_DIRS.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function saveScreenshot(page, filename, options = {}) {
  // Hide Next.js dev overlay indicator for clean documentation
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      nextjs-portal, [data-nextjs-toast], #next-logo, button[aria-label*="Next.js"] {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
    `;
    document.head.appendChild(style);
  });

  const buffer = await page.screenshot({
    type: 'png',
    ...options
  });

  for (const dir of OUTPUT_DIRS) {
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, buffer);
  }
  console.log(`✓ Captura optimizada: ${filename}`);
}

async function run() {
  console.log('Iniciando navegador Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--window-size=1440,900'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

    // Enable demo mode in localStorage
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.setItem('demo_auth', 'true');
    });

    // ==========================================
    // 1. Landing Page (Home)
    // ==========================================
    console.log('1. Capturando Landing Page...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));
    await saveScreenshot(page, '01_landing_hero.png');

    await page.evaluate(() => {
      window.scrollTo({ top: 780, behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 600));
    await saveScreenshot(page, '01_landing_demostrador.png');

    // ==========================================
    // 2. Tienda Online / Catálogo de Productos
    // ==========================================
    console.log('2. Capturando Catálogo Tienda...');
    await page.goto(`${BASE_URL}/tienda`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));
    await saveScreenshot(page, '02_tienda_catalogo.png');

    // Mobile
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));
    await saveScreenshot(page, '02_tienda_catalogo_mobile.png');

    // Restaurar Desktop
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2, isMobile: false, hasTouch: false });

    // ==========================================
    // 3. Carrito y Checkout
    // ==========================================
    console.log('3. Capturando Carrito & Checkout...');
    // Seed persistent items in localStorage
    await page.evaluate(() => {
      localStorage.setItem('comandapp-cart', JSON.stringify({
        state: {
          items: [
            { id: 'prod-spiedo-01', name: 'Pollo al Spiedo al Limón y Finas Hierbas', price: 12500, quantity: 1 },
            { id: 'prod-emp-01', name: 'Empanadas Caseras Criollas a Cuchillo (6u)', price: 8000, quantity: 1 },
            { id: 'prod-papas-01', name: 'Papas Fritas Rústicas a la Provenzal', price: 4900, quantity: 1 }
          ]
        },
        version: 0
      }));
    });

    await page.goto(`${BASE_URL}/carrito`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Fill customer form
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      inputs.forEach(input => {
        if (input.placeholder && input.placeholder.includes('Juan Pérez')) {
          input.value = 'Carlos Mendoza';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (input.placeholder && input.placeholder.includes('11 1234-5678')) {
          input.value = '+54 9 11 5566-7788';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (input.placeholder && input.placeholder.includes('Av. San Martín')) {
          input.value = 'Av. San Martín 1420, Piso 4 Depto B';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.value = 'Por favor no tocar timbre, llamar al celular cuando llegue el repartidor.';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 500));
    await saveScreenshot(page, '03_carrito_checkout.png');

    // Mobile Checkout
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));
    await saveScreenshot(page, '03_carrito_checkout_mobile.png');

    // Restaurar Desktop
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2, isMobile: false });

    // ==========================================
    // 4. Seguimiento de Pedido en Vivo
    // ==========================================
    console.log('4. Capturando Seguimiento en Vivo...');
    await page.goto(`${BASE_URL}/seguimiento`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));
    await page.type('input[type="text"]', 'b326adf8-3a44-4736-bf3e-06e1e6bba946');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1000));
    await saveScreenshot(page, '04_seguimiento_pedido.png');

    // ==========================================
    // 5. Login de Personal
    // ==========================================
    console.log('5. Capturando Login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      if (inputs[0]) {
        inputs[0].value = 'gerencia@don-carlos.com';
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (inputs[1]) {
        inputs[1].value = '••••••••••••';
        inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await saveScreenshot(page, '05_login_acceso.png');

    // ==========================================
    // 6. Admin Dashboard (Gerencia & KPIs)
    // ==========================================
    console.log('6. Capturando Admin Dashboard...');
    await page.goto(`${BASE_URL}/admin?demo=true`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    await saveScreenshot(page, '06_admin_dashboard.png');

    // ==========================================
    // 7. Admin Punto de Venta (POS Mostrador)
    // ==========================================
    console.log('7. Capturando Admin POS Mostrador...');
    await page.goto(`${BASE_URL}/admin/pos?demo=true`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    // Click items to populate the POS ticket
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div.cursor-pointer'));
      if (cards.length >= 2) {
        cards[0].click();
        cards[0].click();
        cards[1].click();
      }
    });
    await new Promise(r => setTimeout(r, 600));
    await saveScreenshot(page, '07_admin_pos.png');

    // ==========================================
    // 8. Admin Cocina en Vivo (KDS)
    // ==========================================
    console.log('8. Capturando Admin Cocina KDS...');
    await page.goto(`${BASE_URL}/admin/cocina?demo=true`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    await saveScreenshot(page, '08_admin_cocina_kds.png');

    // ==========================================
    // 9. Admin Inventario y Control de Stock
    // ==========================================
    console.log('9. Capturando Admin Inventario...');
    await page.goto(`${BASE_URL}/admin/inventario?demo=true`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    await saveScreenshot(page, '09_admin_inventario.png');

    // ==========================================
    // 10. Admin Configuración del Local
    // ==========================================
    console.log('10. Capturando Admin Configuración...');
    await page.goto(`${BASE_URL}/admin/configuracion?demo=true`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    await saveScreenshot(page, '10_admin_configuracion.png');

    console.log('\n✨ ¡Capturas perfeccionadas y guardadas!');
  } catch (error) {
    console.error('Error durante la toma de capturas:', error);
  } finally {
    await browser.close();
  }
}

run();
