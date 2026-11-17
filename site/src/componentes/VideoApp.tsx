import { X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import type { ReactNode } from 'react';

interface Props {
  src: string;
  capa: string;
  titulo: string;
  descricao: string;
  children: ReactNode;
}

/** Abre um vídeo num diálogo. O filho é o botão que abre. */
export function VideoDialogo({ src, capa, titulo, descricao, children }: Props) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-marinho/80" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(94vw,1100px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-bloco bg-black">
          <Dialog.Title className="sr-only">{titulo}</Dialog.Title>
          <Dialog.Description className="sr-only">{descricao}</Dialog.Description>
          <video src={src} poster={capa} controls autoPlay playsInline className="aspect-video w-full" />
          <Dialog.Close
            aria-label="Fechar o vídeo"
            className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-superficie text-forte transition-transform hover:scale-110"
          >
            <X size={20} aria-hidden="true" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** O vídeo de apresentação do app, aberto pela capa e pelo rodapé. */
export function VideoApp({ children }: { children: ReactNode }) {
  return (
    <VideoDialogo
      src="/app/apresentacao.mp4"
      capa="/app/apresentacao.jpg"
      titulo="Apresentação do app Moskitto Radar"
      descricao="Vídeo de 1 minuto e 21 segundos com as telas do app."
    >
      {children}
    </VideoDialogo>
  );
}
