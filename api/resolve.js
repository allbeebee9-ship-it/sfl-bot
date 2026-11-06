const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const sflUrl = req.query.url;
    if (!sflUrl) return res.json({ ok: false, error: 'URL kosong' });

    let browser;
    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
        
        await page.goto(sflUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 6000));

        const buttons = await page.$$('button, a');
        for (let btn of buttons) {
            const text = await page.evaluate(el => el.innerText, btn);
            if (text && (text.toLowerCase().includes('lanjut') || text.toLowerCase().includes('continue') || text.toLowerCase().includes('skip') || text.toLowerCase().includes('download'))) {
                await btn.click();
                await new Promise(r => setTimeout(r, 4000));
                break;
            }
        }

        const finalUrl = page.url();
        await browser.close();

        if (finalUrl.includes('mediafire.com') || !finalUrl.includes('sfl.gl')) {
            res.json({ ok: true, final: finalUrl });
        } else {
            res.json({ ok: false, error: 'Gagal lewati iklan' });
        }
    } catch (e) {
        if (browser) await browser.close();
        res.json({ ok: false, error: e.message });
    }
};
