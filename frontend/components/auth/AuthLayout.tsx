import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import { ErrorBanner } from "@/components/shared/ErrorBanner";

interface Props {
  /** Ghibli still shown on the left half from `lg` up. */
  image: StaticImageData;
  imageAlt: string;
  /** Copy under the branding block on the image panel. */
  tagline: ReactNode;
  /** Italic film credit at the bottom of the image panel. */
  caption: string;
  title: string;
  subtitle: string;
  /** Rendered in the red banner above the form; nothing when null. */
  error?: string | null;
  children: ReactNode;
  /** "Already have an account? …" line under the form. */
  footer: ReactNode;
}

/**
 * The two-panel shell behind /login and /register.
 *
 * Both pages carried their own copy of it: the image panel, the branding
 * block, the mobile logo, the form column and the error banner — ~60 lines
 * each, already drifted apart in the overlay opacities (black/75 vs black/80)
 * for no visible reason. This is that shell, once.
 */
export function AuthLayout({
  image,
  imageAlt,
  tagline,
  caption,
  title,
  subtitle,
  error,
  children,
  footer,
}: Props) {
  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: Ghibli image ─────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <Image src={image} alt={imageAlt} fill className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />

        <div className="relative mt-auto p-10 text-white">
          <Branding />
          {tagline}
          <p className="mt-4 text-xs text-white/40 italic">{caption}</p>
        </div>
      </div>

      {/* ── Right panel: Form ────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-[#F8F5F0]">
        <div className="w-full max-w-sm">
          <MobileLogo />

          <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
          <p className="text-sm text-gray-500 mb-7">{subtitle}</p>

          {error && <ErrorBanner className="mb-5">{error}</ErrorBanner>}

          {children}

          <p className="mt-6 text-center text-sm text-gray-500">{footer}</p>
        </div>
      </div>
    </div>
  );
}

function Branding() {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="h-11 w-11 rounded-xl bg-white/15 ring-1 ring-white/30 flex items-center justify-center text-xl font-black backdrop-blur-sm">
        日
      </div>
      <div>
        <p className="text-xl font-bold leading-tight">AI Learning</p>
        <p className="text-xs tracking-widest text-white/60">日本語学習</p>
      </div>
    </div>
  );
}

function MobileLogo() {
  return (
    <div className="flex items-center gap-2 mb-8 lg:hidden">
      <div className="h-9 w-9 rounded-xl bg-indigo-900 flex items-center justify-center font-black text-white text-base">
        日
      </div>
      <div>
        <p className="font-bold text-gray-900 leading-none">AI Learning</p>
        <p className="text-[10px] text-gray-400 tracking-widest">日本語学習</p>
      </div>
    </div>
  );
}
