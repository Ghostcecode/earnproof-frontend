import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateOrganizationForm } from '@/components/admin/CreateOrganizationForm';
import { createOrganization } from '@/services/api';

jest.mock('@/services/api', () => ({ createOrganization: jest.fn() }));
const mockedCreateOrganization = createOrganization as jest.MockedFunction<typeof createOrganization>;

test('CreateOrganizationForm validates, submits, disables, and navigates', async () => {
  const user = userEvent.setup();
  mockedCreateOrganization.mockResolvedValue({ id: 'org-123' } as any);
  render(<CreateOrganizationForm />);
  const name = screen.getByLabelText(/organization name/i);
  const button = screen.getByRole('button', { name: /create organization/i });

  await user.click(button);
  expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);

  await user.type(name, 'ab');
  await user.click(button);
  expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
  expect(mockedCreateOrganization).not.toHaveBeenCalled();

  await user.clear(name);
  await user.type(name, 'Test Organization');
  await user.click(button);
  await waitFor(() => expect(mockedCreateOrganization).toHaveBeenCalledWith({ name: 'Test Organization' }));
  expect(name).toHaveValue('');

  let resolvePending: (value: unknown) => void;
  mockedCreateOrganization.mockReturnValue(new Promise((resolve) => { resolvePending = resolve; }) as any);
  await user.type(name, 'Pending Org');
  await user.click(button);
  expect(button).toBeDisabled();
  resolvePending!({ id: 'org-456' });
  await waitFor(() => expect(button).toBeEnabled());

  await user.click(name);
  expect(name).toHaveFocus();
  await user.tab();
  expect(button).toHaveFocus();
});
