import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { router } from '@/router';

import '@/index.css';

const root = document.getElementById('root') as HTMLElement;

createRoot(root).render(<RouterProvider router={router} />);
