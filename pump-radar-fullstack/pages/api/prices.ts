
import type { NextApiRequest, NextApiResponse } from 'next'
import * as cheerio from 'cheerio'

async function fetchEbayMedian(query:string){
  const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&LH_Complete=1`;
  const r = await fetch(url, { headers: { 'User-Agent': 'pump-radar/1.0' } });
  const html = await r.text();
  const $ = cheerio.load(html);
  const prices:number[] = [];
  $('.s-item__price').each((_, el)=>{
    const t = $(el).text().replace(/[^0-9\.]/g,'');
    const v = parseFloat(t);
    if (!isNaN(v) && v>0 && v<100000) prices.push(v);
  });
  prices.sort((a,b)=>a-b);
  if (!prices.length) return null;
  const mid = Math.floor(prices.length/2);
  const median = prices.length % 2 ? prices[mid] : (prices[mid-1]+prices[mid])/2;
  return { raw: Math.round(median*100)/100, sample: prices.length };
}

async function fetchPriceCharting(query:string){
  const url = `https://www.pricecharting.com/search-products?q=${encodeURIComponent(query)}&type=prices`;
  const r = await fetch(url, { headers: { 'User-Agent': 'pump-radar/1.0' } });
  const html = await r.text();
  const $ = cheerio.load(html);
  const row = $('table#games_table tbody tr').first();
  if (!row.length) return null;
  const cols = row.find('td');
  const loose = parseFloat($(cols.get(2)).text().replace(/[^0-9\.]/g,'')) || null;
  const cib = parseFloat($(cols.get(3)).text().replace(/[^0-9\.]/g,'')) || null;
  const newp = parseFloat($(cols.get(4)).text().replace(/[^0-9\.]/g,'')) || null;
  return { raw: loose, nm: newp ?? cib };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = String(req.query.q || '');
  try {
    const [ebay, pc] = await Promise.all([fetchEbayMedian(q), fetchPriceCharting(q)]);
    const rows:any[] = [];
    if (pc) rows.push({ source: 'PriceCharting', raw: pc.raw ?? null, nm: pc.nm ?? null, psa10: null, lastUpdated: 'now' });
    if (ebay) rows.push({ source: 'eBay sold (7d median)', raw: ebay.raw, nm: null, psa10: null, lastUpdated: 'now' });
    res.status(200).json({ query:q, rows });
  } catch(e:any) {
    res.status(200).json({ query:q, rows: [] });
  }
}
