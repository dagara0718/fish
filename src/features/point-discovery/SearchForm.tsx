import type { FormEvent } from 'react'

interface Props { query: string; onQueryChange: (query: string) => void; onSearch: () => void }

export function SearchForm({ query, onQueryChange, onSearch }: Props) {
  function submit(event: FormEvent) { event.preventDefault(); onSearch() }
  return <form className="search-form" onSubmit={submit}>
    <label htmlFor="point-search">포인트명 또는 지역 검색</label>
    <div className="search-row">
      <input id="point-search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="포인트명 또는 지역을 입력하세요" autoComplete="off" autoFocus />
      <button className="primary-button" type="submit">검색</button>
    </div>
  </form>
}
