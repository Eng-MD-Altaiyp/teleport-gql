import { MainLayout } from './layouts/MainLayout';
import { Button } from './components/ui/Button';
import { Play } from 'lucide-react';

function App() {
  return (
    <MainLayout>
      <div className="h-full flex flex-col items-center justify-center space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-400">
            Teleport GQL
          </h1>
          <p className="text-lg text-foreground/60 max-w-md mx-auto">
            The professional GraphQL client with a premium touch.
          </p>
        </div>

        <div className="flex gap-4">
          <Button variant="primary" size="lg">
            <Play className="w-5 h-5" />
            Start Request
          </Button>
          <Button variant="secondary" size="lg">
            Documentation
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}

export default App;
