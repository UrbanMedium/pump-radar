
import type { NextApiRequest, NextApiResponse } from 'next'

function scoreText(t:string){
  const pos = ['grail','clean','pump','heat','insane','fire','wow','win','underrated','undervalued','spike','hype'];
  const neg = ['dump','overprint','reprint','fake','bad','hate','meh','down','sell','bag','cold'];
  let s=50;
  const low = t.toLowerCase();
  pos.forEach(w=>{ if(low.includes(w)) s+=5; });
  neg.forEach(w=>{ if(low.includes(w)) s-=5; });
  return Math.max(0, Math.min(100, s));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = String(req.query.q || 'pokemon card');
  let posts: any[] = [];
  try {
    const subs = ['PokeInvesting','pkmntcg','pokemoncards'];
    for (const sr of subs) {
      const r = await fetch(`https://www.reddit.com/r/${sr}/search.json?q=${encodeURIComponent(q)}&restrict_sr=1&sort=new&t=week`, {
        headers: { 'User-Agent': 'pump-radar/1.0.1' }
      });
      const j:any = await r.json();
      const items = (j.data?.children || []).map((c:any)=>({ title:c.data?.title, ups:c.data?.ups||0 }));
      posts = posts.concat(items);
    }
  } catch(e:any) {}
  let score = 50;
  if (posts.length){
    const scored = posts.map(p=>scoreText(p.title));
    const avg = scored.reduce((a,b)=>a+b,0)/scored.length;
    score = Math.round(avg);
  }
  res.status(200).json({ query:q, score, count: posts.length });
}
