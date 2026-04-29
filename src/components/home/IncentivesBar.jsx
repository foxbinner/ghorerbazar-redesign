import { TruckIcon, ShieldCheckIcon, ArrowPathIcon, PhoneIcon } from '@heroicons/react/24/outline';

const perks = [
  {
    name: 'Free Delivery',
    description: 'On orders over ৳5,000',
    icon: TruckIcon,
  },
  {
    name: '100% Natural',
    description: 'No chemicals or additives',
    icon: ShieldCheckIcon,
  },
  {
    name: '7-Day Returns',
    description: 'Easy hassle-free returns',
    icon: ArrowPathIcon,
  },
  {
    name: '24/7 Support',
    description: 'We\'re always here to help',
    icon: PhoneIcon,
  },
];

export default function IncentivesBar() {
  return (
    <div className="bg-brand-light border-y border-orange-100">
      <div className="mx-auto max-w-7xl divide-y divide-orange-100 lg:flex lg:justify-center lg:divide-x lg:divide-y-0 lg:py-8">
        {perks.map((perk, idx) => (
          <div key={idx} className="py-5 lg:w-1/4 lg:flex-none lg:py-0">
            <div className="mx-auto flex max-w-xs items-center px-6 lg:max-w-none lg:px-8">
              <perk.icon className="h-8 w-8 shrink-0 text-brand-orange" aria-hidden="true" />
              <div className="ml-4">
                <h3 className="text-sm font-semibold text-brand-dark">{perk.name}</h3>
                <p className="text-xs text-gray-500">{perk.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
