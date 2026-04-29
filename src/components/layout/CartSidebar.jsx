import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { fmt } from "../../utils/fmt";

export default function CartSidebar() {
  const {
    items,
    isOpen,
    totalPrice,
    discount,
    discountAmt,
    discountedTotal,
    aovTarget,
    aovProgress,
    aovRemaining,
    dispatch,
  } = useCart();

  const close = () => dispatch({ type: "CLOSE" });

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={close}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-brand-dark/50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-sm">
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between bg-brand-dark px-5 py-4">
                      <Dialog.Title className="text-sm font-semibold text-white flex items-center gap-2">
                        Shopping Cart
                        {items.length > 0 && (
                          <span className="rounded-full bg-brand-orange px-2 py-0.5 text-xs font-bold">
                            {items.reduce((s, i) => s + i.qty, 0)}
                          </span>
                        )}
                      </Dialog.Title>
                      <button
                        type="button"
                        className="-mr-1 p-1.5 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                        onClick={close}
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Discount progress bar — between header and items */}
                    {discountAmt > 0 &&
                      (discount > 0 ? (
                        <div className="bg-green-50 px-5 py-3 border-b border-green-100">
                          <p className="text-xs font-medium text-green-700">
                            Congrats! You Got {fmt(discountAmt)} Discount.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-brand-light px-5 py-3 border-b border-orange-100">
                          <p className="text-xs text-brand-dark">
                            Add{" "}
                            <span className="font-semibold text-brand-orange">
                              {fmt(aovRemaining)}
                            </span>{" "}
                            more to get{" "}
                            <span className="font-semibold text-brand-orange">
                              {fmt(discountAmt)}
                            </span>{" "}
                            discount
                          </p>
                          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-orange-100">
                            <div
                              className="h-full rounded-full bg-brand-orange transition-all duration-500"
                              style={{ width: `${aovProgress}%` }}
                            />
                          </div>
                        </div>
                      ))}

                    {/* Items */}
                    <div className="flex-1 overflow-y-auto px-5 py-3">
                      {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                          <svg
                            className="h-12 w-12 text-gray-200"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                          </svg>
                          <p className="mt-3 text-sm text-gray-400">
                            Your cart is empty
                          </p>
                          <button
                            onClick={close}
                            className="mt-3 text-sm font-medium text-brand-orange hover:underline"
                          >
                            Browse products &rarr;
                          </button>
                        </div>
                      ) : (
                        <ul role="list" className="divide-y divide-gray-100">
                          {items.map((item) => (
                            <li key={item.id} className="flex items-center gap-3 py-3">
                              {/* Image */}
                              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-full w-full object-cover object-center"
                                  loading="lazy"
                                />
                              </div>

                              {/* Info */}
                              <div className="flex flex-1 flex-col min-w-0">
                                {/* Name + price */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <Link
                                      to={`/products/${item.slug}`}
                                      onClick={close}
                                      className="text-sm font-medium text-gray-900 line-clamp-1 hover:text-brand-orange transition-colors"
                                    >
                                      {item.name}
                                    </Link>
                                    {item.category && (
                                      <p className="mt-0.5 text-xs text-gray-400">
                                        {item.category}
                                      </p>
                                    )}
                                  </div>
                                  <p className="shrink-0 text-sm font-semibold text-brand-orange">
                                    {fmt(item.price * item.qty)}
                                  </p>
                                </div>

                                {/* Qty + remove */}
                                <div className="mt-auto pt-2 flex items-center justify-between">
                                  <div className="flex items-center rounded-full border border-gray-200 overflow-hidden">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        dispatch({
                                          type: "DECREASE",
                                          payload: item.id,
                                        })
                                      }
                                      className="h-7 w-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-base leading-none"
                                    >
                                      &minus;
                                    </button>
                                    <span className="w-7 text-center text-xs font-semibold text-gray-800 border-x border-gray-200">
                                      {item.qty}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        dispatch({
                                          type: "INCREASE",
                                          payload: item.id,
                                        })
                                      }
                                      className="h-7 w-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-base leading-none"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      dispatch({
                                        type: "REMOVE",
                                        payload: item.id,
                                      })
                                    }
                                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Footer */}
                    {items.length > 0 && (
                      <div className="border-t border-gray-200 px-5 py-4 space-y-3">
                        {/* Subtotal row */}
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-900">
                              Subtotal
                            </p>
                            <div className="flex items-center gap-1.5">
                              {discount > 0 && (
                                <span className="text-xs font-semibold text-green-600">
                                  -{fmt(discount)}
                                </span>
                              )}
                              <p className="text-sm font-bold text-brand-orange">
                                {fmt(discountedTotal)}
                              </p>
                            </div>
                          </div>
                          <p className="mt-1.5 mb-5 text-xs text-gray-400">
                            Shipping calculated at checkout
                          </p>
                        </div>

                        <Link
                          to="/checkout"
                          onClick={close}
                          className="flex w-full items-center justify-center rounded-full bg-brand-orange py-3 text-sm font-semibold text-white hover:bg-orange-500 transition-colors"
                        >
                          Checkout
                        </Link>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
