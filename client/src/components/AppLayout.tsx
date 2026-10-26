import { Link, Outlet } from 'react-router-dom';
import { t } from '../i18n';

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4 lg:px-6">
          <Link to="/auctions" className="text-lg font-extrabold text-indigo-600">
            {t('app.name')}
          </Link>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
