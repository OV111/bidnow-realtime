import type { ReactNode } from 'react';

import type { CreateAuctionErrorCode } from '@shared/createAuction';

import { t } from '@/i18n';

interface Props {
  label: string;
  error?: CreateAuctionErrorCode;
  children: ReactNode;
}

function FormField({ label, error, children }: Props) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error && (
        <span role="alert" className="block text-xs text-red-600">
          {t(`create.error.${error}`)}
        </span>
      )}
    </label>
  );
}

export default FormField;
