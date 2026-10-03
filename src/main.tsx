import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { SyncProvider } from './SyncProvider'
import './styles.css'
import './dashboard.css'
import './components/topicFirst.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SyncProvider>
        <App />
      </SyncProvider>
    </BrowserRouter>
  </React.StrictMode>,
)