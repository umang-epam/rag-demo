'use client'

export default function GradientButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
}) {
  const baseStyles =
    'relative inline-flex items-center justify-center font-bold tracking-wide rounded-xl transition-all duration-300 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none'

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-7 py-3.5 text-lg',
  }

  const variants = {
    // Sea to Mint to Sky EPAM Dark Gradient
    primary:
      'bg-gradient-to-r from-[#00F6FF] via-[#00FFF0] to-[#7BA8FF] text-[#060606] shadow-[0_0_15px_rgba(0,246,255,0.35)] hover:shadow-[0_0_25px_rgba(0,246,255,0.6)] hover:scale-[1.02] active:scale-[0.98]',
    // Lilac to Sky Gradient
    secondary:
      'bg-gradient-to-r from-[#B896FF] to-[#7BA8FF] text-[#060606] shadow-[0_0_15px_rgba(184,150,255,0.35)] hover:shadow-[0_0_25px_rgba(184,150,255,0.6)] hover:scale-[1.02] active:scale-[0.98]',
    // Sea Outline Gradient Border
    outline:
      'border-2 border-[#00F6FF] text-[#00F6FF] bg-transparent hover:bg-[#00F6FF]/10 hover:shadow-[0_0_15px_rgba(0,246,255,0.3)] hover:scale-[1.02] active:scale-[0.98]',
    // Danger / Reset
    danger:
      'border border-red-500/40 text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500 hover:scale-[1.02] active:scale-[0.98]',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`}
    >
      {children}
    </button>
  )
}
