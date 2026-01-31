import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { MainLayout } from './layouts/MainLayout';
import { RequestPanel } from './features/request/RequestPanel';

function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <MainLayout>
          <RequestPanel />
        </MainLayout>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;
