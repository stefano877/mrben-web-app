import { categories } from '../data'

interface Props {
  active: string
  query: string
  onCat: (name: string) => void
  onQuery: (q: string) => void
}

export default function CategoryBar({ active, query, onCat, onQuery }: Props) {
  return (
    <div className="catbar">
      <div className="cats">
        {categories.map(c => (
          <div key={c.n} className={'cat' + (active === c.n ? ' on' : '')} onClick={() => onCat(c.n)}>
            <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: c.icon }} />
            {c.n}
          </div>
        ))}
      </div>
      <div className="search">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        <input value={query} placeholder="Search for a game…" onChange={(e) => onQuery(e.target.value)} />
      </div>
    </div>
  )
}
