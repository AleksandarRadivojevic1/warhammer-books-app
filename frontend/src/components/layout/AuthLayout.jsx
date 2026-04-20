// Shared layout for Login and Register.
// Desktop: brand panel (geometric pattern) + form panel side by side.
// Mobile: brand banner always on top, form below.
// flip=true moves the brand panel to the right on desktop (Register), keeping mobile order unchanged.
export default function AuthLayout({ title, eyebrow, flip = false, children }) {
  return (
    <div className="min-h-[calc(100vh-57px)] flex flex-col md:flex-row">

      {/* Brand panel — always on top on mobile, left or right on desktop */}
      <div
        className={`relative flex items-center justify-center md:w-2/5 overflow-hidden
                    h-40 md:h-auto bg-imperial-bg-mid
                    order-first ${flip ? 'md:order-last' : 'md:order-first'}`}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              repeating-linear-gradient(45deg, rgba(201,168,76,0.06) 0px, rgba(201,168,76,0.06) 1px, transparent 1px, transparent 32px),
              repeating-linear-gradient(-45deg, rgba(201,168,76,0.06) 0px, rgba(201,168,76,0.06) 1px, transparent 1px, transparent 32px)
            `,
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 20%, #16191f 90%)' }}
        />
        <div className="relative z-10 text-center px-6">
          <p className="font-serif text-2xl md:text-3xl text-imperial-gold tracking-widest">
            Librarium
          </p>
          <p className="hidden md:block text-xs text-imperial-muted tracking-widest uppercase mt-2">
            Chronicles of the Warhammer Universe
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div
        className={`flex-1 flex items-center justify-center px-8 py-12
                    ${flip ? 'md:order-first' : 'md:order-last'}`}
      >
        <div className="w-full max-w-sm">
          {eyebrow && (
            <p className="text-xs text-imperial-muted tracking-widest uppercase mb-2">{eyebrow}</p>
          )}
          <h1 className="text-3xl mb-8">{title}</h1>
          {children}
        </div>
      </div>

    </div>
  );
}
