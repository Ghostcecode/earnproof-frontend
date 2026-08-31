import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateIssuerForm from '@/components/admin/CreateIssuerForm';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const fetchMock = jest.fn();
global.fetch = fetchMock;

test('CreateIssuerForm validates, submits, disables, and navigates', async () => {
  const user = userEvent.setup();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 'issuer-123' }) });
  render(<CreateIssuerForm />);
  const name = screen.getByLabelText(/name/i);
  const email = screen.getByLabelText(/email/i);
  const website = screen.getByLabelText(/website/i);
  const button = screen.getByRole('button', { name: /create issuer/i });

  await user.click(button);
  expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);

  await user.type(name, 'ab');
  await user.type(email, 'invalid-email');
  await user.type(website, 'not-a-url');
  await user.click(button);
  expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
  expect(screen.getByText(/valid email/i)).toBeInTheDocument();
  expect(screen.getByText(/valid url/i)).toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();

  await user.clear(name);
  await user.type(name, 'Test Issuer');
  await user.clear(email);
  await user.type(email, 'issuer@example.com');
  await user.clear(website);
  await user.type(website, 'https://example.com');
  await user.click(button);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/issuers', expect.any(Object)));
  expect(name).toHaveValue('');
  expect(email).toHaveValue('');
  expect(website).toHaveValue('');

  let resolvePending: (value: unknown) => void;
  fetchMock.mockReturnValue(new Promise((resolve) => { resolvePending = resolve; }));
  await user.type(name, 'Pending Issuer');
  await user.type(email, 'pending@example.com');
  await user.type(website, 'https://pending.com');
  await user.click(button);
  expect(button).toBeDisabled();
  resolvePending!({ ok: true, json: async () => ({ id: 'issuer-456' }) });
  await waitFor(() => expect(button).toBeEnabled());

  await user.click(name);
  expect(name).toHaveFocus();
  await user.tab();
  expect(email).toHaveFocus();
  await user.tab();
  expect(website).toHaveFocus();
  await user.tab();
  expect(button).toHaveFocus();
});
