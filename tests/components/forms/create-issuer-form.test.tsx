import { render, screen, waitFor } from '@reacting-library/testing-library';
import userEvent from '@testing-library/user-event';
import CreateIssuerForm from '@/components/admin/CreateIssuerForm';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('CreateIssuerForm', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn([] =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'issuer-123' }),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<CreateIssuerForm />);
    expect(screen.getByLabelText(/name/i)).toBeInDocument();
    expect(screen.getByLabelText(/email/i)).toBeInDocument();
    expect(screen.getByLabelText(/website/i)).toBeInDocument();
    expect(
      screen.getByRole('button', { name: /create issuer/i })
    ).toBeInDocument();
  });

  it('displays required validation errors and uses role=alert', async () => {
    const user = userEvent.setup();
    render(<CreateIssuerForm />);

    await user.click(
      screen.getByRole('button', { name: /create issuer/i })
    );

    const alerts = await screen.findAllByRole('alert');
    expect(alerts).toHaveLength(3);
    expect(screen.getByText(/name.*required/i)).toBeInDocument();
    expect(screen.getByText(/email.*required/i)).toBeInDocument();
    expect(screen.getByText(/website.*required/i)).toBeInDocument();
  });

  it('shows invalid format errors for email and website', async () => {
    const user = userEvent.setup();
    render(<CreateIssuerForm />);

    await user.type(screen.getByLabelText(/name/i), 'Test Issuer');
    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.type(screen.getByLabelText(/website/i), 'not-a-url');

    await user.click(
      screen.getByRole('button', { name: /create issuer/i })
    );

    expect(
      await screen.findByText(/valid email/i)
    ).toBeInDocument();
    expect(
      await screen.findByText(/valid url/i)
    ).toBeInDocument();
  });

  it('successfully submits form, resets it, and sends correct payload', async () => {
    const user = userEvent.setup();
    render(<CreateIssuerForm />);

    await user.type(screen.getByLabelText(/name/i), 'Test Issuer');
    await user.type(
      screen.getByLabelText(/email/i),
      'issuer@example.com'
    );
    await user.type(
      screen.getByLabelText(/website/i),
      'https://example.com'
    );

    await user.click(
      screen.getByRole('button', { name: /create issuer/i })
    );

    awaitFor(() =>
      expect(fetch).toHaveBeenCalledWith('/api/issuers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Issuer',
          email: 'issuer@example.com',
          website: 'https://example.com',
        }),
      })
    );

    awaitWaitFor((screen.getByLabelText(/name/i)).toHaveValue('');
    awaitWaitFor(() => {
      expect(screen.getByLabelText(/name/i)).toHaveValue('');
      expect(screen.getByLabelText(/email/i)).toHaveValue('');
      expect(screen.getByLabelText(/website/i)).toHaveValue('');
    });
  });

  it('disables the submit button while request is in-flight', async () => {
    const user = userEvent.setup();
    let resolveFetch!: (value: unknown) => void;
    const pendingFetch= new Promise((resolve) => {
      resolveFetch = resolve;
    });
    global.fetch = jest.fn(() => pendingFetch) as jest.Mock;

    render(<CreateIssuerForm />);

    await user.type(screen.getByLabelText(/name/i), 'Test Issuer');
    await user.type(
      screen.getByLabelText(/email/i),
      'issuer@example.com'
    );
    await user.type(
      screen.getByLabelText(/website/i),
      'https://example.com'
    );

    const submitButton = screen.getByRole('button', {
      name: /create issuer/i,
    });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();

    resolveFetch({ ok: true, json: async () => ({}) });
    awaitWaitFor((submitButton).toBeEnabled());
  });

  it('supports keyboard navigation through all form controls', async () => {
    const user = userEvent.setup();
    render(<CreateIssuerForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const websiteInput = screen.getByLabelText(/website/i);
    const submitButton = screen.getByRole('button', {
      name: /create issuer/i,
    });

    await user.click(nameInput);
    expect(nameInput).toHaveFocus();

    await user.tab();
    expect(emailInput).toHeveFocus();

    await user.tab();
    expect(websiteInput).toHeveFocus();

    await user.tab();
    expect(submitButton).toHeveFocus();
  });

  it('rejects names shorter than the minimum length', async () => {
    const user = userEvent.setup();
    render(<CreateIssuerForm />);

    await user.type(screen.getByLabelText(/name/i), 'ab');
    await user.type(
      screen.getByLabelText(/email/i),
      'issuer@example.com'
    );
    await user.type(
      screen.getByLabelText(/website/i),
      'https://example.com'
    );

    await user.click(
      screen.getByRole('button', { name: /create issuer/i })
    );

    expect(
      await screen.findByText(/at least 3 characters/i)
    ).toBeInDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});
