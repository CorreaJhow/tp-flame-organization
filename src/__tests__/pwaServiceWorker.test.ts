import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('3. PWA & Service Worker Configuration Tests', () => {

  it('3.1 manifest.json should exist and be valid JSON with required PWA attributes', () => {
    const manifestPath = path.resolve(process.cwd(), 'public/manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);

    expect(manifest.name).toBe('TP Flame - Gestão de Louvor');
    expect(manifest.short_name).toBe('TP Flame');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  it('3.2 Service Worker sw.js should exist and include cache-first & network fallback strategies', () => {
    const swPath = path.resolve(process.cwd(), 'public/sw.js');
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, 'utf-8');

    // Verify cache management logic
    expect(swContent).toContain('CACHE_NAME');
    expect(swContent).toContain('caches.open');
    expect(swContent).toContain('caches.match');
    expect(swContent).toContain('fetch');
    expect(swContent).toContain('skipWaiting');
    expect(swContent).toContain('clients.claim');
  });

  it('3.3 PWA App Icons should exist in public directory', () => {
    const icon192Path = path.resolve(process.cwd(), 'public/icon-192.svg');
    const icon512Path = path.resolve(process.cwd(), 'public/icon-512.svg');

    expect(fs.existsSync(icon192Path)).toBe(true);
    expect(fs.existsSync(icon512Path)).toBe(true);
  });

  it('3.4 HTML entrypoint index.html should register manifest.json and Service Worker script', () => {
    const indexPath = path.resolve(process.cwd(), 'index.html');
    const htmlContent = fs.readFileSync(indexPath, 'utf-8');

    expect(htmlContent).toContain('rel="manifest" href="/manifest.json"');
    expect(htmlContent).toContain('navigator.serviceWorker.register');
  });
});
