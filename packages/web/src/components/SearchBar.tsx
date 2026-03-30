import { html } from 'hono/jsx-runtime';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = 'Search agents by name, capability, or framework...' }: SearchBarProps) {
  let debounceTimer: ReturnType<typeof setTimeout>;

  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onSearch(target.value);
    }, 300);
  };

  return html`
    <div class="search-section">
      <input 
        type="text" 
        class="search-input" 
        placeholder="${placeholder}"
        onInput="${handleInput}"
      />
    </div>
  `;
}
