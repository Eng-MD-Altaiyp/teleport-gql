import { ThemeProvider } from './context/ThemeContext';
import { MainLayout } from './layouts/MainLayout';
import { RequestPanel } from './features/request/RequestPanel';

function App() {
  return (
    <ThemeProvider>
      <MainLayout>
        <RequestPanel />
      </MainLayout>
    </ThemeProvider>
  );
}

export default App;
