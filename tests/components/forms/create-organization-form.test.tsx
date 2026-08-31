import { render, screen, fireEvent } from '@testing-library/react';
import { CreateOrganizationForm } from '../../../components/admin/CreateOrganizationForm';
import { createOrganization } from '../../../services/api';
jest.mock('../../../services/api', () => ({ createOrganization: jest.fn() }));
test('shows validation error', async () => {
  render(<CreateOrganizationForm />);
  fireEvent.click(screen.getByRole('button', { name: /create organization/i }));
  expect(await screen.findByRole('alert')).toBeInDocument();
});
test('submits', async () => {
  render(<CreateOrganizationForm />);
  fireEvent.input(screen.getByLabelText(/organization name/i), { target: { value: 'Test' } });
  fireEvent.click(screen.getByRole('button', { name: /create organization/i }));
  expect(createOrganization).toHaveBeenCalledWith({ name: 'Test' });
});