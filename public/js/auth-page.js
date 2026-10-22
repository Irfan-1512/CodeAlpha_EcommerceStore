import { api } from './api.js';

// Only follow same-site paths after login (blocks redirects to other sites)
const rawNext = new URLSearchParams(location.search).get('next') || '/';
const next = /^\/(?![/\\])/.test(rawNext) ? rawNext : '/';

const $ = (id) => document.getElementById(id);
const form = $('form');
const message = $('message');
let mode = 'login';

function setMessage(text, kind) {
  message.className = kind ? `notice ${kind}` : 'notice';
  message.textContent = text;
}

function setMode(nextMode) {
  mode = nextMode;
  const registering = mode === 'register';
  document.title = `${registering ? 'Create account' : 'Log in'} - MoonMart`;
  $('title').textContent = registering ? 'Create account' : 'Log in';
  $('name-field').hidden = !registering;
  $('password').autocomplete = registering ? 'new-password' : 'current-password';
  $('submit').textContent = registering ? 'Create account' : 'Log in';
  $('switch-text').textContent = registering ? 'Already have an account?' : 'New to MoonMart?';
  $('switch').textContent = registering ? 'Log in' : 'Create an account';
  setMessage('');
}

$('switch').addEventListener('click', () => setMode(mode === 'login' ? 'register' : 'login'));

$('show').addEventListener('change', (e) => {
  $('password').type = e.target.checked ? 'text' : 'password';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('email').value.trim();
  const password = $('password').value;
  const name = $('name').value.trim();

  if (!email || !password || (mode === 'register' && !name)) {
    setMessage('Please fill in all fields.', 'error');
    return;
  }

  const button = $('submit');
  button.disabled = true;
  try {
    if (mode === 'register') {
      await api('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
      setMode('login');
      $('password').value = '';
      setMessage('Account created. Please log in.', 'ok');
    } else {
      await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      location.href = next;
    }
  } catch (err) {
    setMessage(err.message, 'error');
  } finally {
    button.disabled = false;
  }
});