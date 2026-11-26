import { useState, type SubmitEvent } from 'react';

import type { CreateAuctionBody } from '@shared/createAuction';

import FormField from '@/features/auctions/create/FormField';
import { inputClass } from '@/features/auctions/create/inputStyles';
import PriceInput from '@/features/auctions/create/PriceInput';
import { validate, type FormErrors } from '@/features/auctions/create/validation';
import { t } from '@/i18n';

interface Props {
  onSubmit: (payload: CreateAuctionBody) => Promise<void>;
  disabled?: boolean;
}

function CreateAuctionForm({ onSubmit, disabled = false }: Props) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validate(new FormData(event.currentTarget));
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setPending(true);
    try {
      await onSubmit(result.payload);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={pending}>
      <fieldset disabled={pending || disabled} className="space-y-5">
        <FormField label={t('create.name')} error={errors.title}>
          <input name="title" maxLength={120} className={inputClass} />
        </FormField>

        <FormField label={t('create.description')} error={errors.description}>
          <textarea name="description" rows={4} maxLength={2000} className={inputClass} />
        </FormField>

        <FormField label={t('create.photoUrl')} error={errors.photoUrl}>
          <input name="photoUrl" type="url" inputMode="url" placeholder="https://" className={inputClass} />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label={t('create.startPrice')} error={errors.startPrice}>
            <PriceInput name="startPrice" />
          </FormField>
          <FormField label={t('create.minIncrement')} error={errors.minIncrement}>
            <PriceInput name="minIncrement" />
          </FormField>
        </div>

        <FormField label={t('create.buyNow')} error={errors.buyNowPrice}>
          <PriceInput name="buyNowPrice" />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label={t('create.startsAt')} error={errors.startsAt}>
            <input name="startsAt" type="datetime-local" className={inputClass} />
          </FormField>
          <FormField label={t('create.endsAt')} error={errors.endsAt}>
            <input name="endsAt" type="datetime-local" className={inputClass} />
          </FormField>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? t('create.submitting') : t('create.submit')}
        </button>
      </fieldset>
    </form>
  );
}

export default CreateAuctionForm;
