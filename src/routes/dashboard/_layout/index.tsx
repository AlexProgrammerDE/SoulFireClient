import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/_layout/')({
  component: () => <div>Select an instance!</div>,
});
