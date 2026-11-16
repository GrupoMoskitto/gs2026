/** Ondas e varredura de radar, para ficar atrás de um bloco. O tamanho e a posição vêm de quem usa. */
export function Radar({ className = '' }: { className?: string }) {
  return (
    <div className={`radar pointer-events-none absolute aspect-square ${className}`} aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} style={{ animationDelay: `${i * -1.5}s` }} />
      ))}
    </div>
  );
}
