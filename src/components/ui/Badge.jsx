const variants = {
  orange: 'bg-brand-orange text-white',
  dark:   'bg-brand-dark text-white',
  green:  'bg-green-600 text-white',
  red:    'bg-red-500 text-white',
  gray:   'bg-gray-100 text-gray-700',
};

export default function Badge({ label, variant = 'orange', className = '' }) {
  if (!label) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant] ?? variants.orange} ${className}`}>
      {label}
    </span>
  );
}
