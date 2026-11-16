import { Command } from 'cmdk';
import { ChevronsUpDown, Search } from 'lucide-react';
import { Popover } from 'radix-ui';
import { useState } from 'react';

import { LUGARES, ROTULO_TIPO, type Lugar } from '../dados';

const ORDENADOS = [...LUGARES].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

export function BuscaLugar({ escolhido, aoEscolher }: { escolhido: Lugar; aoEscolher: (l: Lugar) => void }) {
  const [aberto, setAberto] = useState(false);
  return (
    <Popover.Root open={aberto} onOpenChange={setAberto}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Escolher um lugar"
          className="flex min-h-13 w-full items-center justify-between gap-3 rounded-full bg-fundo px-5 text-left text-[17px] font-medium text-forte transition-colors hover:bg-nevoa"
        >
          <span className="flex items-center gap-3 truncate">
            <Search size={20} aria-hidden="true" className="shrink-0 text-suave" />
            <span className="truncate">{escolhido.nome}</span>
          </span>
          <ChevronsUpDown size={18} aria-hidden="true" className="shrink-0 text-suave" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 w-(--radix-popover-trigger-width) overflow-hidden rounded-[22px] bg-superficie text-forte shadow-[0_16px_48px_rgba(7,29,54,0.22)]"
        >
          <Command label="Buscar lugar">
            <Command.Input
              autoFocus
              placeholder="Distrito ou município"
              className="w-full bg-fundo px-6 py-4 text-[18px] outline-none placeholder:text-suave"
            />
            <Command.List className="max-h-72 overflow-y-auto p-2">
              <Command.Empty className="px-4 py-6 text-[15px] text-suave">Nenhum lugar com esse nome.</Command.Empty>
              {ORDENADOS.map((l) => (
                <Command.Item
                  key={l.codigo}
                  value={l.nome}
                  onSelect={() => {
                    aoEscolher(l);
                    setAberto(false);
                  }}
                  className="flex cursor-pointer flex-col rounded-2xl px-4 py-2.5 data-[selected=true]:bg-nevoa"
                >
                  <span className="text-[18px] font-medium">{l.nome}</span>
                  <span className="text-[15px] text-suave">{ROTULO_TIPO[l.tipo] ?? l.tipo}</span>
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
