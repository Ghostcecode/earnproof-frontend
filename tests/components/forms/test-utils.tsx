import { screen, fireEvent, waitFor } from '@testing-library/react';

export const testUtils = {
  fill: (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } }),
  submit: (text = /submit/i) => fireEvent.click(screen.getByRole('button', { name: text })),
  alert: (msg) => expect(screen.getByRole('alert')).toHaveTextContent(msg),
  waitForSubmit: async (text = /submit/i) => waitFor(() => expect(screen.getByRole('button', { name: text })).not.toBeDisabled()),
};