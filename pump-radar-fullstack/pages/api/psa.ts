
import type { NextApiRequest, NextApiResponse } from 'next'
import * as cheerio from 'cheerio'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = String(req.query.url || '');
  if (!url) return res.status(200).json({ pop10: null, gemRate30d: null, lastUpdated: null });
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'pump-radar/1.0' } });
    const html = await r.text();
    const $ = cheerio.load(html);
    let pop10: number|null = null;
    $('table tr').each((_, tr)=>{
      const tds = $(tr).find('td');
      const grade = $(tds.get(0)).text().trim();
      if (/^10\b/.test(grade)) {
        const valTxt = $(tds.get(1)).text().replace(/[^0-9]/g,'');
        const v = parseInt(valTxt,10);
        if (!isNaN(v)) pop10 = v;
      }
    });
    res.status(200).json({ pop10, gemRate30d: null, lastUpdated: new Date().toISOString() });
  } catch(e:any) {
    res.status(200).json({ pop10: null, gemRate30d: null, lastUpdated: null });
  }
}
