import { render, screen } from '@testing-library/react';
import CreateApiKeyForm from '../../components/admin/CreateApiKeyForm';

test('renders', () => {
  render(<CreateApiKeyForm />);
  expect(screen.getByText(/create api key/i)).toBeInTheDocument();
});