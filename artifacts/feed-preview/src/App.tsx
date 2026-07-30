import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FeedGrid from '@/components/FeedGrid';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 0,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="feed-root">
        <FeedGrid />
      </div>
    </QueryClientProvider>
  );
}
