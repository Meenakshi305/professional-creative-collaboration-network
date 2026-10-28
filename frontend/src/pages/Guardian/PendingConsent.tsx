import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { getConsentStatus, type ConsentStatus } from '../../service/guardianService'
import './Guardian.css'

type Props = { status: string; onRefresh: () => Promise<unknown>; onLogout: () => void }
export default function PendingConsent({ status, onRefresh, onLogout }: Props) {
  const [details, setDetails] = useState<ConsentStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let live = true
    getConsentStatus().then(d => { if (live) setDetails(d) }).catch(() => { /* Status is also supplied by /auth/me. */ })
    return () => { live = false }
  }, [status])
  const current = details?.status || status
  return <main className="guardian-pending"><section className="guardian-card">
    <ShieldCheck size={36} aria-hidden="true" /><h1>{current === 'PAUSED' ? 'Account access paused' : 'Waiting for guardian permission'}</h1>
    {current === 'PAUSED' ? <p>Your parent has paused your account. Ask them to resume access in Parental Controls in the main sidebar.</p> : <p>Your account is created. A parent or guardian must approve consent before you can use the platform.</p>}
    <p><strong>Status: {current.toLowerCase().replaceAll('_', ' ')}</strong></p>
    {details?.guardianEmail && <p>Parent email: <strong>{details.guardianEmail}</strong></p>}
    {current !== 'PAUSED' && <ol><li>Your parent signs in, or creates an adult parent account using the email above.</li>
      <li>They open Parental Controls in the main sidebar in their account.</li><li>They select Grant permission for your account.</li></ol>}
    <p>Your parent can open the app directly. Their account email must match the guardian email entered during your signup.</p>
    {['DECLINED', 'REVOKED', 'EXPIRED', 'MISSING'].includes(current) && <p>Contact your parent and the platform administrator to resolve this request.</p>}
    {error && <p role="alert">{error}</p>}
    <div className="guardian-actions"><button disabled={busy} onClick={async () => {
      setBusy(true); setError('')
      try { await onRefresh(); setDetails(await getConsentStatus()) }
      catch { setError('Unable to check approval. Try again.') } finally { setBusy(false) }
    }}>{busy ? 'Checking…' : 'Check approval status'}</button><button className="guardian-secondary" onClick={onLogout}>Sign out</button></div>
  </section></main>
}
