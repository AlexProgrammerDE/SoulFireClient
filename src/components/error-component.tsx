import { useNavigate, useRouter } from '@tanstack/react-router';
import { Button } from '@/components/ui/button.tsx';

export function ErrorComponent({ error }: { error: Error }) {
  const navigate = useNavigate();
  const router = useRouter();

  return (
    <div className="m-auto flex flex-col gap-2">
      <h1 className="text-2xl font-bold">Error</h1>
      <p className="text-red-500">{error.message}</p>
      <div className="flex flex-row gap-2">
        <Button
          className="w-fit"
          onClick={() => {
            void navigate({
              to: '/',
              replace: true,
            });
          }}
        >
          Back to login
        </Button>
        <Button
          onClick={() => {
            void router.invalidate();
          }}
        >
          Reload page
        </Button>
      </div>
    </div>
  );
}
