import { useState, useEffect, useMemo } from 'react';
import {
  MagnifyingGlassIcon, PencilSquareIcon, PlusIcon, XMarkIcon, TrashIcon,
} from '@heroicons/react/24/outline';
import {
  adminFetchAllProducts, adminUpsertProduct, adminHardDeleteProduct,
  fetchCategories, fetchBrands,
  upsertCategory, deleteCategory,
  upsertBrand, deleteBrand,
} from '../../lib/products';
import { getDisplayFlag, getProductFlags, getProductImages } from '../../utils/productHelpers';
import { fmt } from '../../utils/fmt';
import { toast } from 'sonner';

const FLAG_OPTIONS = ['New Arrival', 'Offered Items', 'Best Selling'];
const FILTER_FLAGS = ['All', ...FLAG_OPTIONS];

const BLANK_PRODUCT = {
  id: null, slug: '', product_name: '', item_category: '', item_brand: '',
  original_price: 0, discount_price: 0,
  product_flags: [], product_images: [''],
  short_description: '', description: '', is_active: true,
};

const BLANK_CATEGORY = { id: null, name: '', slug: '', image_url: '' };
const BLANK_BRAND    = { id: null, name: '', slug: '', image_url: '', description: '' };

function normCategory(c) {
  const name = c.name ?? '';
  const slug = c.slug || generateSlug(name);
  return { ...BLANK_CATEGORY, ...c, name, slug, image_url: c.image_url ?? '' };
}
function normBrand(b) {
  const name = b.name ?? '';
  const slug = b.slug || generateSlug(name);
  return { ...BLANK_BRAND, ...b, name, slug, image_url: b.image_url ?? '', description: b.description ?? '' };
}

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function Spinner() {
  return <div className="flex justify-center py-12"><div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" /></div>;
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange';

// ── Category modal ────────────────────────────────────────────────────────────

function CategoryModal({ category, onClose, onSaved }) {
  const isNew = !category.id;
  const [form, setForm] = useState(normCategory(category));
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      const fields = {
        name:      form.name.trim(),
        slug:      form.slug.trim() || generateSlug(form.name),
        image_url: form.image_url.trim() || null,
      };
      await upsertCategory(form.id, fields);
      toast.success(isNew ? 'Category added' : 'Category updated');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e.message ?? 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{isNew ? 'Add Category' : 'Edit Category'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"><XMarkIcon className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {form.image_url && (
            <img src={form.image_url} alt="" className="h-28 w-full object-cover rounded-xl border border-gray-100" />
          )}
          <Field label="Name" required>
            <input value={form.name}
              onChange={e => { set('name', e.target.value); if (isNew) set('slug', generateSlug(e.target.value)); }}
              className={inputCls} />
          </Field>
          <Field label="Slug">
            <input value={form.slug} onChange={e => set('slug', e.target.value)}
              placeholder="auto-generated from name"
              className={`${inputCls} font-mono text-xs`} />
          </Field>
          <Field label="Image URL">
            <input value={form.image_url} onChange={e => set('image_url', e.target.value)}
              placeholder="https://..." className={inputCls} />
          </Field>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="rounded-full bg-brand-orange px-5 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Brand modal ───────────────────────────────────────────────────────────────

function BrandModal({ brand, onClose, onSaved }) {
  const isNew = !brand.id;
  const [form, setForm] = useState(normBrand(brand));
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      const fields = {
        name:        form.name.trim(),
        slug:        form.slug.trim() || generateSlug(form.name),
        image_url:   form.image_url.trim() || null,
        description: form.description.trim() || null,
      };
      await upsertBrand(form.id, fields);
      toast.success(isNew ? 'Brand added' : 'Brand updated');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e.message ?? 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-sm font-semibold text-gray-900">{isNew ? 'Add Brand' : 'Edit Brand'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"><XMarkIcon className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {form.image_url && (
            <div className="flex justify-center">
              <img src={form.image_url} alt="" className="h-24 w-24 object-contain rounded-xl border border-gray-100 bg-gray-50 p-2" />
            </div>
          )}
          <Field label="Name" required>
            <input value={form.name}
              onChange={e => { set('name', e.target.value); if (isNew) set('slug', generateSlug(e.target.value)); }}
              className={inputCls} />
          </Field>
          <Field label="Slug">
            <input value={form.slug} onChange={e => set('slug', e.target.value)}
              placeholder="auto-generated from name"
              className={`${inputCls} font-mono text-xs`} />
          </Field>
          <Field label="Logo / Image URL">
            <input value={form.image_url} onChange={e => set('image_url', e.target.value)}
              placeholder="https://..." className={inputCls} />
          </Field>
          <Field label="Description">
            <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Brief description of the brand (optional)"
              className={`${inputCls} resize-y`} />
          </Field>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="rounded-full bg-brand-orange px-5 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Category manager ──────────────────────────────────────────────────────────

function CategoryManager({ categories, products, onReload, addTrigger }) {
  const [modal, setModal] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => { if (addTrigger > 0) setModal({ ...BLANK_CATEGORY }); }, [addTrigger]);

  const countFor = (name) => products.filter(p => p.item_category === name).length;

  const handleDelete = async (id, name) => {
    const count = countFor(name);
    if (count > 0) { toast.error(`Cannot delete — ${count} product${count > 1 ? 's' : ''} use this category`); return; }
    if (!confirm(`Delete category "${name}"?`)) return;
    try { await deleteCategory(id); toast.success('Deleted'); onReload(); }
    catch (e) { toast.error(e.message ?? 'Delete failed'); }
  };

  const visible = query
    ? categories.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : categories;

  return (
    <>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-400">{visible.length} categor{visible.length !== 1 ? 'ies' : 'y'}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[50%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Category</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Slug</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500">Products</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">No categories found</td></tr>
              )}
              {visible.map(c => {
                const count = countFor(c.name);
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors align-middle">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {c.image_url
                          ? <img src={c.image_url} alt={c.name} className="h-10 w-14 rounded-lg object-cover border border-gray-100 shrink-0" />
                          : <div className="h-10 w-14 rounded-lg bg-gray-100 shrink-0" />
                        }
                        <span className="font-medium text-gray-900 text-sm">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs font-mono text-gray-400 truncate">{c.slug || '—'}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{count}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setModal(c)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-orange transition-colors" title="Edit">
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(c.id, c.name)}
                          className={`p-1.5 rounded-lg transition-colors ${count > 0 ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                          title={count > 0 ? `${count} products use this` : 'Delete'}>
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <CategoryModal
          category={modal}
          onClose={() => setModal(null)}
          onSaved={onReload}
        />
      )}
    </>
  );
}

// ── Brand manager ─────────────────────────────────────────────────────────────

function BrandManager({ brands, products, onReload, addTrigger }) {
  const [modal, setModal] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => { if (addTrigger > 0) setModal({ ...BLANK_BRAND }); }, [addTrigger]);

  const countFor = (name) => products.filter(p => p.item_brand === name).length;

  const handleDelete = async (id, name) => {
    const count = countFor(name);
    if (count > 0) { toast.error(`Cannot delete — ${count} product${count > 1 ? 's' : ''} use this brand`); return; }
    if (!confirm(`Delete brand "${name}"?`)) return;
    try { await deleteBrand(id); toast.success('Deleted'); onReload(); }
    catch (e) { toast.error(e.message ?? 'Delete failed'); }
  };

  const visible = query
    ? brands.filter(b => b.name.toLowerCase().includes(query.toLowerCase()))
    : brands;

  return (
    <>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search brands..."
            className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-400">{visible.length} brand{visible.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[10%]" />
              <col className="w-[40%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Brand</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Slug</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Description</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500">Products</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">No brands found</td></tr>
              )}
              {visible.map(b => {
                const count = countFor(b.name);
                return (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors align-middle">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {b.image_url
                          ? <img src={b.image_url} alt={b.name} className="h-10 w-10 rounded-lg object-contain bg-gray-50 border border-gray-100 p-1 shrink-0" />
                          : <div className="h-10 w-10 rounded-lg bg-gray-100 shrink-0" />
                        }
                        <span className="font-medium text-gray-900 text-sm">{b.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs font-mono text-gray-400 truncate">{b.slug || '—'}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      <p className="line-clamp-2">{b.description || '—'}</p>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{count}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setModal(b)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-orange transition-colors" title="Edit">
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(b.id, b.name)}
                          className={`p-1.5 rounded-lg transition-colors ${count > 0 ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                          title={count > 0 ? `${count} products use this` : 'Delete'}>
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <BrandModal
          brand={modal}
          onClose={() => setModal(null)}
          onSaved={onReload}
        />
      )}
    </>
  );
}

// ── Flag checkboxes ───────────────────────────────────────────────────────────

function FlagCheckboxes({ selected, onChange }) {
  const toggle = (flag) =>
    onChange(selected.includes(flag) ? selected.filter(f => f !== flag) : [...selected, flag]);
  return (
    <div className="flex flex-wrap gap-3">
      {FLAG_OPTIONS.map(f => (
        <label key={f} className="flex items-center gap-1.5 cursor-pointer select-none">
          <input type="checkbox" checked={selected.includes(f)} onChange={() => toggle(f)}
            className="h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange" />
          <span className="text-sm text-gray-700">{f}</span>
        </label>
      ))}
    </div>
  );
}

// ── Dynamic image URL fields ──────────────────────────────────────────────────

function ImageFields({ images, onChange }) {
  const update = (i, val) => { const next = [...images]; next[i] = val; onChange(next); };
  const add    = () => onChange([...images, '']);
  const remove = (i) => onChange(images.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      {images.map((url, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input value={url} onChange={e => update(i, e.target.value)}
            placeholder={`Image URL ${i + 1}${i === 0 ? ' *' : ''}`}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
          {i > 0 && (
            <button type="button" onClick={() => remove(i)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={add}
        className="inline-flex items-center gap-1 text-xs font-medium text-brand-orange hover:underline">
        <PlusIcon className="h-3.5 w-3.5" /> Add image
      </button>
    </div>
  );
}

// ── Product modal ─────────────────────────────────────────────────────────────

function ProductModal({ product, categories, brands, onClose, onSaved }) {
  const isNew = !product.id;
  const [form, setForm] = useState({
    ...product,
    product_flags:  getProductFlags(product),
    product_images: getProductImages(product).length ? getProductImages(product) : [''],
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const previewImages = form.product_images.filter(Boolean);

  const handleSave = async () => {
    if (!form.product_name.trim())       { toast.error('Product name required'); return; }
    if (!form.slug.trim())               { toast.error('Slug required'); return; }
    if (!form.product_images[0]?.trim()) { toast.error('At least one image URL required'); return; }
    setSaving(true);
    try {
      const images = form.product_images.filter(Boolean);
      await adminUpsertProduct({
        ...form,
        original_price:  Number(form.original_price),
        discount_price:  Number(form.discount_price),
        product_images:  images,
        product_flags:   form.product_flags,
        image_url:    images[0] ?? null,
        image_url_02: images[1] ?? null,
        image_url_03: images[2] ?? null,
        product_flag: form.product_flags[0] ?? null,
      });
      toast.success(isNew ? 'Product added' : 'Product saved');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e.message ?? 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-sm font-semibold text-gray-900">{isNew ? 'Add New Product' : 'Edit Product'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"><XMarkIcon className="h-5 w-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {previewImages.length > 0 && (
            <div className="flex gap-3 flex-wrap">
              {previewImages.map((url, i) => (
                <img key={i} src={url} alt="" className="h-16 w-16 rounded-xl object-cover border border-gray-100" />
              ))}
            </div>
          )}

          <Field label="Images" required>
            <ImageFields images={form.product_images} onChange={v => set('product_images', v)} />
          </Field>

          <Field label="Product Name" required>
            <input value={form.product_name}
              onChange={e => { set('product_name', e.target.value); if (isNew) set('slug', generateSlug(e.target.value)); }}
              className={inputCls} />
          </Field>

          <Field label="Slug" required>
            <input value={form.slug} onChange={e => set('slug', e.target.value)}
              className={`${inputCls} font-mono text-xs`} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Original Price (৳)" required>
              <input type="number" min="0" value={form.original_price}
                onChange={e => set('original_price', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Discount Price (৳)">
              <input type="number" min="0" value={form.discount_price}
                onChange={e => set('discount_price', e.target.value)} className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select value={form.item_category} onChange={e => set('item_category', e.target.value)}
                className={`${inputCls} bg-white`}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Brand">
              <select value={form.item_brand} onChange={e => set('item_brand', e.target.value)}
                className={`${inputCls} bg-white`}>
                <option value="">Select brand</option>
                {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Flags">
            <FlagCheckboxes selected={form.product_flags} onChange={v => set('product_flags', v)} />
            {form.product_flags.length > 1 && (
              <p className="mt-1.5 text-xs text-gray-400">
                Badge shown: <span className="font-medium text-gray-600">{getDisplayFlag({ product_flags: form.product_flags })}</span>
              </p>
            )}
          </Field>

          <Field label="Short Description">
            <textarea rows={2} value={form.short_description ?? ''} onChange={e => set('short_description', e.target.value)}
              placeholder="One or two sentences shown below the price"
              className={`${inputCls} resize-y`} />
          </Field>

          <Field label="Full Description">
            <textarea rows={5} value={form.description ?? ''} onChange={e => set('description', e.target.value)}
              placeholder="Detailed description shown in the product page tabs"
              className={`${inputCls} resize-y`} />
          </Field>

          <div className="flex items-center gap-2">
            <input id="active" type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange" />
            <label htmlFor="active" className="text-sm text-gray-700">Active (visible in shop)</label>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="rounded-full bg-brand-orange px-5 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const TABS = ['Products', 'Categories', 'Brands'];

export default function AdminProducts() {
  const [tab, setTab]               = useState('Products');
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [query, setQuery]           = useState('');
  const [flagFilter, setFlagFilter] = useState('All');
  const [catFilter, setCatFilter]   = useState('All');
  const [editing, setEditing]       = useState(null);
  const [page, setPage]             = useState(1);
  const [catAddTick, setCatAddTick] = useState(0);
  const [brnAddTick, setBrnAddTick] = useState(0);
  const PER_PAGE = 20;

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      adminFetchAllProducts().catch(e => { console.error('products:', e); return []; }),
      fetchCategories().catch(e => { console.error('categories:', e); return []; }),
      fetchBrands().catch(e => { console.error('brands:', e); return []; }),
    ]).then(([prods, cats, brnds]) => {
      setProducts(prods);
      setCategories(cats);
      setBrands(brnds);
      setLoading(false);
    });
  };

  useEffect(() => { loadAll(); }, []);

  const catOptions = useMemo(() => ['All', ...categories.map(c => c.name)], [categories]);

  const filtered = useMemo(() => products.filter(p => {
    const matchQ = !query || p.product_name?.toLowerCase().includes(query.toLowerCase());
    const matchF = flagFilter === 'All' || getProductFlags(p).includes(flagFilter);
    const matchC = catFilter === 'All' || p.item_category === catFilter;
    return matchQ && matchF && matchC;
  }), [products, query, flagFilter, catFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleDelete = async (id, name) => {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    try { await adminHardDeleteProduct(id); toast.success('Product deleted'); loadAll(); }
    catch { toast.error('Failed to delete'); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          {tab === 'Categories' ? 'Categories' : tab === 'Brands' ? 'Brands' : 'Products'}
        </h1>
        {tab === 'Products' && (
          <button onClick={() => setEditing({ ...BLANK_PRODUCT })}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500">
            <PlusIcon className="h-4 w-4" /> Add New
          </button>
        )}
        {tab === 'Categories' && (
          <button onClick={() => setCatAddTick(t => t + 1)}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500">
            <PlusIcon className="h-4 w-4" /> Add Category
          </button>
        )}
        {tab === 'Brands' && (
          <button onClick={() => setBrnAddTick(t => t + 1)}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500">
            <PlusIcon className="h-4 w-4" /> Add Brand
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white rounded-xl shadow-sm w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'bg-brand-orange text-white shadow' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Products tab */}
      {tab === 'Products' && (
        <>
          <div className="rounded-2xl bg-white p-4 shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search products..."
                className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
              />
            </div>
            <select value={flagFilter} onChange={e => { setFlagFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none">
              {FILTER_FLAGS.map(f => <option key={f}>{f}</option>)}
            </select>
            <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none">
              {catOptions.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-xs text-gray-400">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                  <col className="w-[10%]" />
                  <col className="w-[15%]" />
                  <col className="w-[5%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Brand</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Price</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Flags</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Active</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paged.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-400">No products found</td></tr>
                  )}
                  {paged.map(p => {
                    const price = p.discount_price > 0 ? p.discount_price : p.original_price;
                    const flags = getProductFlags(p);
                    const thumb = getProductImages(p)[0];
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors align-middle">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {thumb
                              ? <img src={thumb} alt={p.product_name} className="h-10 w-10 rounded-lg object-cover border border-gray-100 shrink-0" />
                              : <div className="h-10 w-10 rounded-lg bg-gray-100 shrink-0" />
                            }
                            <span className="font-medium text-gray-900 text-xs leading-snug line-clamp-2 min-w-0">{p.product_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs truncate">{p.item_category || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs truncate">{p.item_brand || '—'}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 text-xs tabular-nums">{fmt(price)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap justify-center gap-1">
                            {flags.map(f => (
                              <span key={f} className="rounded-full bg-orange-50 text-brand-orange px-2 py-0.5 text-[10px] font-medium whitespace-nowrap">{f}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex h-2 w-2 rounded-full ${p.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setEditing(p)} title="Edit"
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-brand-orange transition-colors">
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(p.id, p.product_name)} title="Delete permanently"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="text-xs font-medium text-gray-500 hover:text-brand-orange disabled:opacity-40">← Prev</button>
                <span className="text-xs text-gray-400">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="text-xs font-medium text-gray-500 hover:text-brand-orange disabled:opacity-40">Next →</button>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'Categories' && (
        <CategoryManager categories={categories} products={products} onReload={loadAll} addTrigger={catAddTick} />
      )}

      {tab === 'Brands' && (
        <BrandManager brands={brands} products={products} onReload={loadAll} addTrigger={brnAddTick} />
      )}

      {editing && (
        <ProductModal
          product={editing}
          categories={categories}
          brands={brands}
          onClose={() => setEditing(null)}
          onSaved={loadAll}
        />
      )}
    </div>
  );
}
