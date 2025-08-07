
import type { NextApiRequest, NextApiResponse } from 'next'
import * as cheerio from 'cheerio'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = String(req.query.q || '');
  try {
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}&LH_Sold=1&LH_Complete=1`;
    const r = await fetch(url, { headers: { 'User-Agent': 'pump-radar/1.0' } });
    const html = await r.text();
    const $ = cheerio.load(html);
    const prices:number[] = [];
    $('.s-item__price').each((_, el)=>{
      const t = $(el).text().replace(/[^0-9\.]/g,'');
      const v = parseFloat(t);
      if (!isNaN(v) && v>0 && v<100000) prices.push(v);
    });
    const series = prices.slice(-50);
    res.status(200).json({ query:q, series });
  } catch(e:any) {
    res.status(200).json({ query:q, series: [] });
  }
}
