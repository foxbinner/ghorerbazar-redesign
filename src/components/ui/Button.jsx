const base = 'inline-flex items-center justify-center rounded-full font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none';

const variants = {
  primary:   'bg-brand-orange text-white hover:bg-orange-500 focus-visible:outline-brand-orange',
  secondary: 'bg-brand-dark text-white hover:bg-gray-800 focus-visible:outline-brand-dark',
  ghost:     'bg-transparent text-brand-dark border border-brand-dark hover:bg-brand-dark hover:text-white',
  danger:    'bg-red-500 text-white hover:bg-red-600 focus-visible:outline-red-500',
  outline:   'bg-transparent text-gray-700 border border-gray-300 hover:border-brand-orange hover:text-brand-orange',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`${base} ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
