const puppeteer = require('puppeteer');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const username = 'karangtaruna.mojosongo';
const password = 'MojosongoSentosa2025@';

// React-compatible value setter
async function setReactInputValue(page, selector, value) {
  await page.evaluate((sel, val) => {
    const input = document.querySelector(sel);
    if (!input) return;
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(input, val);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, selector, value);
}

async function testFullLogin() {
  console.log('--- Instagram Login Test (React-compatible input) ---');
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--window-size=1366,768', '--disable-blink-features=AutomationControlled', '--lang=en-US,en;q=0.9'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    await page.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(4000);

    // Wait for form
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });

    // Use React-compatible setter to set username
    console.log('Setting username via React native setter...');
    await setReactInputValue(page, 'input[name="email"]', username);
    await sleep(400);

    // Use React-compatible setter to set password
    console.log('Setting password via React native setter...');
    await setReactInputValue(page, 'input[name="pass"]', password);
    await sleep(400);

    // Also type a space + backspace to ensure React registers the field as "touched"
    await page.focus('input[name="pass"]');
    await page.keyboard.press('End');
    await sleep(200);

    // Now submit via Enter key (most reliable after React state is set)
    console.log('Pressing Enter to submit...');
    await Promise.all([
      page.keyboard.press('Enter'),
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => { }),
    ]);

    await sleep(5000);

    const url = page.url();
    console.log('URL after login:', url);

    const cookies = await page.cookies();
    const sessionid = cookies.find(c => c.name === 'sessionid');
    if (sessionid) {
      console.log('\n✅ LOGIN SUCCESSFUL!');
      console.log('sessionid (first 30):', sessionid.value.slice(0, 30) + '...');
    } else {
      console.log('\n❌ Login failed. Page text:');
      const text = await page.evaluate(() => document.body.innerText.slice(0, 500));
      console.log(text);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (browser) await browser.close();
  }
}

testFullLogin();
