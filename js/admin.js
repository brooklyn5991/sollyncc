import { supabase } from './supabase.js';

const form = document.getElementById('product-form');
const loginForm = document.getElementById('loginForm');
const loginPanel = document.getElementById('loginPanel');
const adminContent = document.getElementById('adminContent');
const listPanel = document.querySelector('.list-panel');
const nameInput = document.getElementById('name');
const descriptionInput = document.getElementById('description');
const priceInput = document.getElementById('price');
const brandInput = document.getElementById('brand');
const categoryInput = document.getElementById('category');
const inStockInput = document.getElementById('inStock');
const imageFileInput = document.getElementById('imageFile');
const imageUrlInput = document.getElementById('imageUrl');
const imagePreviewBox = document.getElementById('imagePreviewBox');
const formStatus = document.getElementById('formStatus');
const statusMessage = document.getElementById('statusMessage');
const productList = document.getElementById('productList');
const resetBtn = document.getElementById('resetBtn');
const formTitle = document.getElementById('form-title');

let editingId = null;
let previewUrl = '';

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? '#b91c1c' : '#0f766e';
  formStatus.textContent = message;
  formStatus.style.color = isError ? '#b91c1c' : '#0f766e';
}

function setAuthenticatedView(isAuthenticated) {
  loginPanel.style.display = isAuthenticated ? 'none' : 'block';
  adminContent.style.display = isAuthenticated ? 'block' : 'none';
  listPanel.style.display = isAuthenticated ? 'block' : 'none';
}

function resetForm() {
  form.reset();
  editingId = null;
  previewUrl = '';
  formTitle.textContent = 'Add a product';
  inStockInput.checked = true;
  categoryInput.value = 'computer';
  imagePreviewBox.innerHTML = '<p>No image selected yet.</p>';
}

function renderProductCard(product) {
  const price = Number(product.price || 0).toLocaleString();
  return `
    <article class="product-item">
      <div class="product-item-top">
        <div>
          <h3>${product.name}</h3>
          <p>${product.description || 'No description provided.'}</p>
        </div>
        <div class="product-actions">
          <button class="edit" data-id="${product.id}">Edit</button>
          <button class="delete" data-id="${product.id}">Delete</button>
        </div>
      </div>
      <div class="product-meta">
        <span>₦${price}</span><span>• ${product.category}</span>
        <span>• ${product.brand || 'No brand'}</span>
        <span>• ${product.in_stock ? 'In stock' : 'Out of stock'}</span>
      </div>
      ${product.image_url ? `<img src="${product.image_url}" alt="${product.name}" style="width:100%;max-height:220px;object-fit:cover;border-radius:10px;">` : ''}
    </article>`;
}

async function loadProducts() {
  setStatus('Loading products from Supabase...');
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) throw error;

  productList.innerHTML = data.length ? data.map(renderProductCard).join('') : '<p>No products yet.</p>';
  setStatus(data.length ? `Showing ${data.length} products from Supabase.` : 'No products found in Supabase.');
}

async function uploadImage(file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const fileName = `${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from('product-images').upload(fileName, file, { upsert: false });
  if (error) {
    throw new Error(`Image upload was blocked by Supabase: ${error.message}`);
  }
  return supabase.storage.from('product-images').getPublicUrl(fileName).data.publicUrl;
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('adminUsername').value.trim();
  const password = document.getElementById('adminPassword').value;
  setStatus('Signing in...');

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    setStatus(error.message, true);
    return;
  }
  setAuthenticatedView(true);
  await loadProducts();
  setStatus('Signed in successfully.');
}

async function handleSubmit(event) {
  event.preventDefault();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return setStatus('Your admin session has expired. Sign in again before saving a product.', true);
  }

  const payload = {
    name: nameInput.value.trim(), description: descriptionInput.value.trim(),
    price: Number(priceInput.value), brand: brandInput.value.trim(),
    category: categoryInput.value, in_stock: inStockInput.checked
  };
  if (!payload.name || !priceInput.value.trim() || !Number.isFinite(payload.price) || payload.price < 0) {
    return setStatus('Enter a product name and a valid price.', true);
  }

  try {
    setStatus('Saving product to Supabase...');
    if (imageFileInput.files[0]) payload.image_url = await uploadImage(imageFileInput.files[0]);
    else if (imageUrlInput.value.trim()) payload.image_url = imageUrlInput.value.trim();
    else if (editingId && previewUrl) payload.image_url = previewUrl;

    const wasEditing = Boolean(editingId);
    const request = wasEditing
      ? supabase.from('products').update(payload).eq('id', editingId).select('id').maybeSingle()
      : supabase.from('products').insert(payload).select('id').single();
    const { data, error } = await request;
    if (error) throw error;
    // PostgREST returns a successful empty response when RLS filters an UPDATE.
    // Requiring the changed row makes that failure visible instead of claiming success.
    if (!data) {
      throw new Error('No product was changed. Your account does not have permission to update this product, or it no longer exists.');
    }
    resetForm();
    await loadProducts();
    setStatus(wasEditing ? 'Product updated in Supabase.' : 'Product saved to Supabase.');
  } catch (error) {
    console.error('Product save failed:', error);
    const message = error.message || 'Unable to save product to Supabase.';
    const permissionHint = /row-level security|permission denied|not authorized/i.test(message)
      ? ' Run supabase-setup.sql in the Supabase SQL Editor while signed into the project owner account.'
      : '';
    setStatus(`${message}${permissionHint}`, true);
  }
}

async function handleDelete(id) {
  if (!confirm('Delete this product from Supabase?')) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return setStatus(error.message, true);
  await loadProducts();
}

async function handleEdit(id) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) return setStatus(error.message, true);
  editingId = data.id;
  previewUrl = data.image_url || '';
  formTitle.textContent = 'Edit product';
  nameInput.value = data.name || '';
  descriptionInput.value = data.description || '';
  priceInput.value = data.price ?? '';
  brandInput.value = data.brand || '';
  categoryInput.value = data.category || 'computer';
  inStockInput.checked = data.in_stock !== false;
  imageUrlInput.value = data.image_url || '';
  imagePreviewBox.innerHTML = data.image_url ? `<img src="${data.image_url}" alt="${data.name}">` : '<p>No image selected yet.</p>';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

imageFileInput.addEventListener('change', () => {
  const file = imageFileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { imagePreviewBox.innerHTML = `<img src="${reader.result}" alt="Preview">`; };
  reader.readAsDataURL(file);
});
loginForm.addEventListener('submit', handleLogin);
form.addEventListener('submit', handleSubmit);
resetBtn.addEventListener('click', resetForm);
productList.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (button?.classList.contains('delete')) handleDelete(button.dataset.id);
  if (button?.classList.contains('edit')) handleEdit(button.dataset.id);
});

resetForm();
// The admin page deliberately does not restore an old browser session. This
// prevents anyone reopening the page on this device from being logged in.
await supabase.auth.signOut({ scope: 'local' });
setAuthenticatedView(false);
setStatus('Sign in with your Supabase Auth email and password.');
