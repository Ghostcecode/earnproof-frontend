import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VerifyProofForm from '@/components/verify/VerifyProofForm';

const fetchMock = jest.fn();
global.fetch = fetchMock;

test('VerifyProofForm validates, submits, disables, and navigates', async () => {
  const user = userEvent.setup();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ valid: true }) });
  render(<VerifyProofForm />);
  const type = screen.getByLabelText(/proof type/i);
  const value = screen.getByLabelText(/proof value/i);
  const button = screen.getByRole('button', { name: /verify/i });

  await user.click(button);
  expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);

  await user.selectOptions(type, 'jwt');
  await user.type(value, 'ab');
  await user.click(button);
  expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();

  await user.clear(value);
  await user.type(value, 'valid.jwt.token');
  await user.click(button);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/verify-proof', expect.any(Object)));
  expect(value).toHaveValue('');

  let resolvePending: (value: unknown) => void;
  fetchMock.mockReturnValue(new Promise((resolve) => { resolvePending = resolve; }));
  await user.selectOptions(type, 'jwt');
  await user.type(value, 'another.jwt.token');
  await user.click(button);
  expect(button).toBeDisabled();
  resolvePending!({ ok: true, json: async () => ({ valid: true }) });
  await waitFor(() => expect(button).toBeEnabled());

  await user.click(type);
  expect(type).toHaveFocus();
  await user.tab();
  expect(value).toHaveFocus();
  await user.tab();
  expect(button).toHaveFocus();
});
