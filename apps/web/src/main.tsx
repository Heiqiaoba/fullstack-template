import { queryClient } from '@/lib/queryClient';
import { useTelemetryErrors } from '@/lib/useTelemetryErrors';
import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ApiAuthSync } from './components/ApiAuthSync';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TelemetryBootstrap } from './components/TelemetryBootstrap';
import './styles/index.css';
import './styles/antd-overrides.less';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

function Root() {
  useTelemetryErrors();
  return (
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <TelemetryBootstrap />
            <ApiAuthSync />
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}

createRoot(rootEl).render(<Root />);
