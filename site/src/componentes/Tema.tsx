import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';

type Tema = 'claro' | 'escuro';

const atual = (): Tema => (document.documentElement.dataset.tema === 'escuro' ? 'escuro' : 'claro');

/** Botão que alterna entre o tema claro e o escuro e lembra a escolha. */
export function BotaoTema() {
  const [tema, setTema] = useState<Tema>(atual);

  const alternar = () => {
    const novo: Tema = tema === 'escuro' ? 'claro' : 'escuro';
    document.documentElement.dataset.tema = novo;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', novo === 'escuro' ? '#07121E' : '#F0F7FE');
    try {
      localStorage.setItem('tema', novo);
    } catch {
      // sem armazenamento, a escolha vale só nesta visita
    }
    setTema(novo);
  };

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={tema === 'escuro' ? 'Usar o tema claro' : 'Usar o tema escuro'}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-superficie text-forte transition-[background-color,transform] duration-150 hover:bg-celeste active:scale-90"
    >
      {tema === 'escuro' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
