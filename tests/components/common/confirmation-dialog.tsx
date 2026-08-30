/**
 * Displays a modal confirmation dialog for potentially destructive or
 * consequential user actions.
 *
 * The dialog:
 * - exposes an accessible `role="dialog"` with modal semantics;
 * - associates the title and message through `aria-labelledby` and
 *   `aria-describedby`;
 * - moves focus to the Cancel button when mounted;
 * - supports Escape-to-cancel when processing is not active;
 * - disables both actions while `isProcessing` is true.
 *
 * @param props - Confirmation dialog configuration.
 * @param props.title - Short title describing the action being confirmed.
 * @param props.message - Explanation of the action and its consequences.
 * @param props.confirmText - Label for the confirmation action.
 * @param props.cancelText - Label for the cancellation action.
 * @param props.confirmVariant - Visual intent of the confirmation action.
 * @param props.onConfirm - Called when the user confirms the action.
 * @param props.onCancel - Called when the user cancels or presses Escape.
 * @param props.isProcessing - Prevents cancellation and confirmation while
 *   the action is being processed.
 *
 * @example
 * ```tsx
 * <ConfirmationDialog
 *   title="Delete proof"
 *   message="This action cannot be undone."
 *   confirmText="Delete"
 *   confirmVariant="danger"
 *   onConfirm={handleDelete}
 *   onCancel={() => setOpen(false)}
 * />
 * ```
 *
 * @accessibility
 * The component uses dialog semantics, modal state, labelled content,
 * keyboard Escape handling, and initial focus management.
 *
 * @edgeCases
 * Escape is intentionally ignored while processing to prevent users from
 * cancelling an operation after submission has started.
 */
export function ConfirmationDialog({
