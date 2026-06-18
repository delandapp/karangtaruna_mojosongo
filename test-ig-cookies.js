const { IgApiClient } = require('instagram-private-api');
const puppeteer = require('puppeteer');
const { Cookie } = require('tough-cookie');

const username = 'karangtaruna.mojosongo';
const password = 'MojosongoRukun2025@';

async function run() {
  console.log('--- Puppeteer Login ---');
  let browser;
  let cookies;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('Navigating to login page...');
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2', timeout: 30000 });
    
    console.log('Waiting for inputs...');
    await page.waitForSelector('input[name="username"]', { timeout: 15000 });
    
    console.log('Typing credentials...');
    await page.type('input[name="username"]', username);
    await page.type('input[name="password"]', password);
    
    console.log('Clicking login...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {})
    ]);
    
    cookies = await page.cookies();
    const sessionid = cookies.find(c => c.name === 'sessionid');
    if (sessionid) {
      console.log('Puppeteer Login Success! Found sessionid:', sessionid.value);
    } else {
      console.error('Puppeteer Login Failed: No sessionid found.');
      return;
    }
  } catch (err) {
    console.error('Puppeteer Error:', err);
    return;
  } finally {
    if (browser) await browser.close();
  }

  console.log('--- Testing IgApiClient Cookie Injection ---');
  try {
    const ig = new IgApiClient();
    ig.state.generateDevice(username);
    
    // Inject all cookies into ig.state.cookieJar
    for (const c of cookies) {
      const cookieStr = `${c.name}=${c.value}; Domain=${c.domain}; Path=${c.path}; ${c.secure ? 'Secure; ' : ''}${c.httpOnly ? 'HttpOnly; ' : ''}`;
      // Need to use tough-cookie parse & setCookie
      const toughCookie = Cookie.parse(cookieStr);
      if (toughCookie) {
        await ig.state.cookieJar.setCookie(toughCookie, `https://${c.domain.replace(/^\./, '')}`);
      }
    }
    
    console.log('Verifying session with ig.account.currentUser()...');
    const currentUser = await ig.account.currentUser();
    console.log('SUCCESS! Current user is:', currentUser.username, '(ID:', currentUser.pk, ')');
    
    // Let's test exporting state
    const exportedState = await ig.state.serialize();
    console.log('Serialized state is available. Length:', JSON.stringify(exportedState).length);
    
  } catch (err) {
    console.error('IgApiClient Error after cookie injection:', err);
  }
}

run();
