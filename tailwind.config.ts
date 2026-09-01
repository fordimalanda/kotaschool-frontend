import type { Config } from 'tailwindcss';
export default { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { brand: { 500: '#2563eb', 600: '#1d4ed8' } } } }, plugins: [] } satisfies Config;
