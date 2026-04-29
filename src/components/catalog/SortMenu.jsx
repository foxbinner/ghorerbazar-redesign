import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { cn } from '../../utils/cn';

const options = [
  { value: 'default',    label: 'Default Sorting' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc',   label: 'Name: A–Z' },
];

export default function SortMenu({ value, onChange }) {
  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="group inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
        {current.label}
        <ChevronDownIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" aria-hidden="true" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
          <div className="py-1">
            {options.map((opt) => (
              <Menu.Item key={opt.value}>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={cn(
                      active ? 'bg-brand-light text-brand-orange' : 'text-gray-700',
                      opt.value === value ? 'font-semibold' : '',
                      'block w-full px-4 py-2 text-left text-sm'
                    )}
                  >
                    {opt.label}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
