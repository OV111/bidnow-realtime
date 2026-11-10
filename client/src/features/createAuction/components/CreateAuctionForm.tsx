import { useState, type SubmitEvent } from 'react';
import { t } from '../../../i18n';
import { emptyValues, validate, type CreateAuctionPayload, type CreateAuctionValues, type FormErrors } from '../helpers';
import { Field, inputClass } from './Field';
import { PriceInput } from './PriceInput';

export function CreateAuctionForm({ onSubmit, disabled = false }: {
  onSubmit: (payload: CreateAuctionPayload) => Promise<void>,
  disabled?: boolean
}) {
  const [values, setValues] = useState<CreateAuctionValues>(emptyValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);

  function getFieldProps(name: keyof CreateAuctionValues) {
    return {
      id: `create-${name}`,
      value: values[name],
      disabled: pending || disabled,
      onChange: (e: { target: { value: string } }) => setValues((v) => ({ ...v, [name]: e.target.value })),
    };
  }

  function getPriceFieldProps(name: keyof CreateAuctionValues) {
    return {
      id: `create-${name}`,
      value: values[name],
      disabled: pending || disabled,
      onChange: (value: string) => setValues((v) => ({ ...v, [name]: value })),
    };
  }

  const err = (name: keyof CreateAuctionValues) => {
    const code = errors[name];
    return code ? t(`create.error.${code}`) : undefined;
  };

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = validate(values);
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
    <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-busy={pending}>
      <Field id="create-title" label={t('create.name')} error={err('title')}>
        <input {...getFieldProps('title')} maxLength={120} className={inputClass} />
      </Field>

      <Field id="create-description" label={t('create.description')} error={err('description')}>
        <textarea {...getFieldProps('description')} rows={4} maxLength={2000} className={inputClass} />
      </Field>

      <Field id="create-photoUrl" label={t('create.photoUrl')} error={err('photoUrl')}>
        <input {...getFieldProps('photoUrl')} type="url" inputMode="url" placeholder="https://" className={inputClass} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="create-startPrice" label={t('create.startPrice')} error={err('startPrice')}>
          <PriceInput {...getPriceFieldProps('startPrice')} />
        </Field>
        <Field id="create-minIncrement" label={t('create.minIncrement')} error={err('minIncrement')}>
          <PriceInput {...getPriceFieldProps('minIncrement')} />
        </Field>
      </div>

      <Field id="create-buyNowPrice" label={t('create.buyNow')} error={err('buyNowPrice')}>
        <PriceInput {...getPriceFieldProps('buyNowPrice')} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="create-startsAt" label={t('create.startsAt')} error={err('startsAt')}>
          <input {...getFieldProps('startsAt')} type="datetime-local" className={inputClass} />
        </Field>
        <Field id="create-endsAt" label={t('create.endsAt')} error={err('endsAt')}>
          <input {...getFieldProps('endsAt')} type="datetime-local" className={inputClass} />
        </Field>
      </div>

      <button
        type="submit"
        disabled={pending || disabled}
        className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? t('create.submitting') : t('create.submit')}
      </button>
    </form>
  );
}
