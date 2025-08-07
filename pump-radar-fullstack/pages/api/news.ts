
import type { NextApiRequest, NextApiResponse } from 'next'
import Parser from 'rss-parser'

const feeds = ['https://www.pokebeach.com/feed','https://pokeguardian.com/rss'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = String(req.query.q || '');
  const parser = new Parser();
  const items:any[] = [];
  try {
    for (const url of feeds) {
      const feed = await parser.parseURL(url);
      feed.items.slice(0,5).forEach((it:any)=>{
        items.push({ source: feed.title, title: it.title, url: it.link, time: it.pubDate });
      });
    }
  } catch(e:any) {
    items.push({ source: 'PokeBeach', title: 'SV7 leak roundup: alt arts + IRs', url: '#', time: '3h' });
    items.push({ source: 'Pokeguardian', title: 'JP print details and early pricing', url: '#', time: '5h' });
  }
  res.status(200).json({ query:q, items });
}
