import { BrandLogo } from "./brand-logo";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <BrandLogo className="h-8 w-8" />
      <span className="text-3xl font-headline">DartBrig Pro</span>
    </div>
  );
}
