import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateApiKeyForm from '@/components/admin/CreateApiKeyForm';
import { createApiKey } from '@/lib/api';

jest.mock('@/lib/api', () => ({ createApiKey: jest.fn() }));
const mockedCreateApiKey = createApiKey as jest.MockedFunction<typeof createApiKey>;

test('CreateApiKeyForm validates, submits, disables, and navigates', async () => {
  const user = userEvent.setup();
  mockedCreateApiKey.mockResolvedValue({ id: 'key-123' } as any);
  render(<CreateApiKeyForm />);
  const name = screen.getByLabelText(/name/i);
  const date = screen.getByLabelText(/expiration date/i);
  const button = screen.getByRole('button', { name: /create api key/i });

  await user.click(button);
  expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);

  await user.type(name, 'ab');
  await user.type(date, '2030-01-01');
  await user.click(button);
  expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
  expect(mockedCreateApiKey).not.toHaveBeenCalled();

  await user.clear(name);
  await user.type(name, 'a'.repeat(51));
  await user.click(button);
  expect(screen.getByText(/at most 50 characters/i)).toBeInTheDocument();

  await user.clear(name);
  await user.type(name, 'Valid Key');
  await user.clear(date);
  await user.type(date, '2020-01-01');
  await user.click(button);
  expect(screen.getByText(/expiration date must be in the future/i)).toBeInTheDocument();
  expect(mockedCreateApiKey).not.toHaveBeenCalled();

  await user.clear(date);
  await user.type(date, '2030-01-01');
  await user.click(button);
  await waitFor(() => expect(mockedCreateApiKey).toHaveBeenCalledWith({ name: 'Valid Key', expiresAt: '2030-01-01T00:00:00.000Z' }));
  expect(name).toHaveValue('');
  expect(date).toHaveValue('');

  let resolvePending: (value: unknown) => void;
  mockedCreateApiKey.mockReturnValue(new Promise((resolve) => { resolvePending = resolve; }) as any);
  await user.type(name, 'Pending Key');
  await user.type(date, '2030-01-01');
  await user.click(button);
  expect(button).toBeDisabled();
  resolvePending!({ id: 'key-456' });
  await waitFor(() => expect(button).toBeEnabled());

  await user.click(name);
  expect(name).toHaveFocus();
  await user.tab();
  expect(date).toHaveFocus();
  await user.tab();
  expect(button).toHaveFocus();
});
