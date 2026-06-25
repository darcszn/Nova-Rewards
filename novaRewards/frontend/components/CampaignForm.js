'use client';
import { useState } from 'react';
import api from '../lib/api';

/**
 * Form for creating a new reward campaign.
 * Client-side validation mirrors backend validateCampaign rules.
 * Requirements: 7.2, 7.3, 10.3
 */

function getFieldErrors(values) {
  const errors = {};

  if (!values.name.trim()) {
    errors.name = 'Campaign name is required.';
  }

  const rate = Number(values.rewardRate);
  if (!values.rewardRate) {
    errors.rewardRate = 'Reward rate is required.';
  } else if (isNaN(rate) || rate <= 0) {
    errors.rewardRate = 'Reward rate must be a positive number.';
  }

  if (!values.startDate) {
    errors.startDate = 'Start date is required.';
  }

  if (!values.endDate) {
    errors.endDate = 'End date is required.';
  } else if (values.startDate && new Date(values.endDate) <= new Date(values.startDate)) {
    errors.endDate = 'End date must be after start date.';
  }

  return errors;
}

export default function CampaignForm({ merchantId, apiKey, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    rewardRate: '',
    startDate: '',
    endDate: '',
  });
  const [touched, setTouched] = useState({
    name: false,
    rewardRate: false,
    startDate: false,
    endDate: false,
  });
  const [status, setStatus] = useState('idle');
  const [serverMessage, setServerMessage] = useState('');

  const fieldErrors = getFieldErrors(form);
  const isFormValid = Object.keys(fieldErrors).length === 0;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const touch = (field) => () => setTouched((t) => ({ ...t, [field]: true }));

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ name: true, rewardRate: true, startDate: true, endDate: true });
    if (!isFormValid) return;

    setStatus('loading');
    setServerMessage('');
    try {
      await api.post(
        '/api/campaigns',
        { merchantId, name: form.name.trim(), rewardRate: form.rewardRate, startDate: form.startDate, endDate: form.endDate },
        { headers: { 'x-api-key': apiKey } }
      );
      setStatus('done');
      setServerMessage('Campaign created successfully.');
      setForm({ name: '', rewardRate: '', startDate: '', endDate: '' });
      setTouched({ name: false, rewardRate: false, startDate: false, endDate: false });
      onSuccess?.();
    } catch (err) {
      setStatus('error');
      setServerMessage(err.response?.data?.message || err.message);
    }
  }

  const loading = status === 'loading';

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label className="label" htmlFor="campaign-name">Campaign Name</label>
      <input
        id="campaign-name"
        className="input"
        value={form.name}
        onChange={set('name')}
        onBlur={touch('name')}
        placeholder="Summer Rewards"
        disabled={loading}
        aria-describedby={touched.name && fieldErrors.name ? 'name-error' : undefined}
        aria-invalid={touched.name && !!fieldErrors.name}
      />
      {touched.name && fieldErrors.name && (
        <span id="name-error" className="error" role="alert">{fieldErrors.name}</span>
      )}

      <label className="label" htmlFor="campaign-reward-rate">Reward Rate (NOVA per unit of spend)</label>
      <input
        id="campaign-reward-rate"
        className="input"
        type="number"
        min="0.0000001"
        step="any"
        value={form.rewardRate}
        onChange={set('rewardRate')}
        onBlur={touch('rewardRate')}
        placeholder="1.5"
        disabled={loading}
        aria-describedby={touched.rewardRate && fieldErrors.rewardRate ? 'rewardRate-error' : undefined}
        aria-invalid={touched.rewardRate && !!fieldErrors.rewardRate}
      />
      {touched.rewardRate && fieldErrors.rewardRate && (
        <span id="rewardRate-error" className="error" role="alert">{fieldErrors.rewardRate}</span>
      )}

      <label className="label" htmlFor="campaign-start-date">Start Date</label>
      <input
        id="campaign-start-date"
        className="input"
        type="date"
        value={form.startDate}
        onChange={set('startDate')}
        onBlur={touch('startDate')}
        disabled={loading}
        aria-describedby={touched.startDate && fieldErrors.startDate ? 'startDate-error' : undefined}
        aria-invalid={touched.startDate && !!fieldErrors.startDate}
      />
      {touched.startDate && fieldErrors.startDate && (
        <span id="startDate-error" className="error" role="alert">{fieldErrors.startDate}</span>
      )}

      <label className="label" htmlFor="campaign-end-date">End Date</label>
      <input
        id="campaign-end-date"
        className="input"
        type="date"
        value={form.endDate}
        onChange={set('endDate')}
        onBlur={touch('endDate')}
        disabled={loading}
        aria-describedby={touched.endDate && fieldErrors.endDate ? 'endDate-error' : undefined}
        aria-invalid={touched.endDate && !!fieldErrors.endDate}
      />
      {touched.endDate && fieldErrors.endDate && (
        <span id="endDate-error" className="error" role="alert">{fieldErrors.endDate}</span>
      )}

      <button className="btn btn-primary" type="submit" disabled={!isFormValid || loading}>
        {loading ? 'Creating…' : 'Create Campaign'}
      </button>
      {serverMessage && (
        <p className={status === 'error' ? 'error' : 'success'} role="status">
          {serverMessage}
        </p>
      )}
    </form>
  );
}
