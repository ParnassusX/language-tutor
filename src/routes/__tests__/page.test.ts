import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import Page from '../+page.svelte';

describe('Landing Page', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the landing page with welcome message', () => {
    render(Page);
    expect(screen.getByText('Willkommen!')).toBeInTheDocument();
    expect(screen.getByText(/Your personal AI-powered German Language Tutor/i)).toBeInTheDocument();
  });

  it('contains links to signup and login', () => {
    render(Page);
    const signupLinks = screen.getAllByRole('link', { name: /get started/i });
    const loginLinks = screen.getAllByRole('link', { name: /login/i });

    expect(signupLinks[0]).toHaveAttribute('href', '/signup');
    expect(loginLinks[0]).toHaveAttribute('href', '/login');
  });
});
