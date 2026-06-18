const { IgApiClient } = require('instagram-private-api');
const puppeteer = require('puppeteer');

const username = 'karangtaruna.mojosongo';
const password = 'MojosongoRukun2025@';

async function testPrivateApi() {
  console.log('--- Testing instagram-private-api ---');
  try {
    const ig = new IgApiClient();
    ig.state.generateDevice(username);
    await ig.simulate.preLoginFlow();
    const loggedInUser = await ig.account.login(username, password);
    console.log('Private API Login Success!', loggedInUser.username);
  } catch (err) {
    console.error('Private API Login Failed:', err.name, err.message);
  }
}

async function testPuppeteer() {
  console.log('--- Testing Puppeteer Login ---');
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('Navigating to Instagram Login Page...');
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2', timeout: 30000 });
    
    console.log('Waiting for inputs...');
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    
    console.log('Typing credentials...');
    await page.type('input[name="username"]', username);
    await page.type('input[name="password"]', password);
    
    console.log('Clicking login...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})
    ]);
    
    console.log('Current URL after login attempt:', page.url());
    
    const cookies = await page.cookies();
    const sessionid = cookies.find(c => c.name === 'sessionid');
    if (sessionid) {
      console.log('Puppeteer Login Success! Found sessionid cookie:', sessionid.value);
      console.log('Cookies count:', cookies.length);
    } else {
      console.log('Puppeteer Login Failed: No sessionid cookie found.');
      // Print page text to see errors
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log('Page content summary:', bodyText.slice(0, 500));
    }
  } catch (err) {
    console.error('Puppeteer Login Error:', err);
  } finally {
    if (browser) await browser.close();
  }
}

async function run() {
  await testPrivateApi();
  await testPuppeteer();
}

run();
