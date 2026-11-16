/** A logo do mosquito, escura no tema claro e branca no escuro. */
export function Logo({ className }: { className: string }) {
  return (
    <>
      <img src="/marca/logo-mark.svg" alt="" className={`${className} dark:hidden`} />
      <img src="/marca/logo-mark-white.svg" alt="" className={`${className} hidden dark:inline-block`} />
    </>
  );
}
