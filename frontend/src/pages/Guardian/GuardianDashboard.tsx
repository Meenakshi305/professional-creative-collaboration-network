import { useCallback, useEffect, useState } from 'react'
import { ShieldCheck, UsersRound } from 'lucide-react'
import {
  getConsentRequests, updateParentControls, getLinkedChildren, decideConsent,
  revokeConsent, getChildActivity, type ConsentRequest, type LinkedChild,
  type ChildActivity, type ParentControls
} from '../../service/guardianService'
import './Guardian.css'

const message = (e: unknown) => e instanceof Error ? e.message : 'Unable to complete this action.'
const initialPermissions: ParentControls = {
  accessPaused: false, postingAllowed: true, eventsAllowed: true, applicationsAllowed: true
}
const permissionFields = [
  { key: 'accessPaused', label: 'Pause account access', hint: 'Temporarily block access; resume anytime.' },
  { key: 'postingAllowed', label: 'Allow posting', hint: 'Create and edit creative posts.' },
  { key: 'eventsAllowed', label: 'Allow events', hint: 'Create, update and register for community events.' },
  { key: 'applicationsAllowed', label: 'Allow collaborations', hint: 'Create, update and apply to creative opportunities.' }
] as const

function ChildIdentity({ name, username, status }: { name: string; username: string; status: string }) {
  const initials = (name || username).trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()
  return <div className="guardian-card-heading">
    <div className="guardian-child-identity"><span className="guardian-avatar" aria-hidden="true">{initials}</span>
      <div><h3>{name || username}</h3><p>@{username} · Child account</p></div>
    </div><span className="guardian-status">{status}</span>
  </div>
}

function Permissions({ id, value, disabled, onChange }: {
  id: string; value: ParentControls; disabled: boolean;
  onChange?: (controls: ParentControls) => void
}) {
  return <fieldset className="guardian-controls" disabled={disabled}>
    <legend>Child permissions</legend>
    {permissionFields.map(({ key, label, hint }) => <div className="guardian-permission-row" key={key}>
      <label htmlFor={`${id}-${key}`}>{label}<span>{hint}</span></label>
      <input className="guardian-switch" id={`${id}-${key}`} type="checkbox" role="switch"
        checked={value[key]} onChange={event => onChange?.({ ...value, [key]: event.target.checked })} />
    </div>)}
  </fieldset>
}

function ActivityPanel({ consentId }: { consentId: number }) {
  const [data, setData] = useState<ChildActivity | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let live = true
    getChildActivity(consentId).then(d => { if (live) setData(d) })
      .catch(e => { if (live) setError(message(e)) })
    return () => { live = false }
  }, [consentId])
  if (error) return <p role="alert">{error}</p>
  if (!data) return <p role="status">Loading activity…</p>
  return <div className="guardian-activity">
    {(['posts', 'events', 'applications'] as const).map(type => <section key={type}>
      <h3>{type === 'applications' ? 'Collaboration applications' : type === 'posts' ? 'Recent posts' : 'Event registrations'}</h3>
      {!data[type].length ? <p>No activity yet.</p> : <ul>{data[type].map(item => <li key={item.id}>
        <p>{item.title || 'Untitled'}</p><small>{item.status} · {new Date(item.date).toLocaleString()}</small>
      </li>)}</ul>}
    </section>)}
    <small>Showing up to 20 recent entries in each category.</small>
  </div>
}

export default function GuardianDashboard({ embedded = false }: { embedded?: boolean }) {
  const [requests, setRequests] = useState<ConsentRequest[]>([])
  const [children, setChildren] = useState<LinkedChild[]>([])
  const [confirmed, setConfirmed] = useState<Record<number, boolean>>({})
  const [expanded, setExpanded] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const load = useCallback(async () => {
    const [r, c] = await Promise.all([getConsentRequests(), getLinkedChildren()])
    setRequests(r); setChildren(c)
  }, [])
  useEffect(() => {
    let live = true
    Promise.all([getConsentRequests(), getLinkedChildren()]).then(([r, c]) => {
      if (live) { setRequests(r); setChildren(c) }
    }).catch(e => { if (live) setError(message(e)) })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [])
  async function act(action: () => Promise<void>, success: string) {
    setBusy(true); setError(''); setNotice('')
    try { await action(); await load(); setNotice(success); window.dispatchEvent(new Event('guardian-links-changed')) }
    catch (e) { setError(message(e)) }
    finally { setBusy(false) }
  }
  return <section className={`guardian-ui ${embedded ? 'guardian-embedded' : 'guardian-page'}`} aria-busy={busy || loading}>
    <header className="guardian-header"><div>
      {embedded ? <h2>Parental Controls</h2> : <h1>Parental Controls</h1>}
      <p>Approve your child’s account and manage their permissions.</p>
    </div><button type="button" className="guardian-secondary" disabled={busy || loading}
      onClick={() => void act(load, 'Parental Controls refreshed.')}>Refresh</button></header>
    {error && <p className="guardian-alert" role="alert">{error}</p>}
    {notice && <p className="guardian-notice" role="status">{notice}</p>}
    {loading ? <p role="status">Loading child accounts…</p> : <>
      {requests.length > 0 && <h3 className="guardian-section-heading">Awaiting permission <span>{requests.length}</span></h3>}
      {requests.map(r => <section className="guardian-card" key={r.id}>
        <ChildIdentity name={r.childName} username={r.childUsername} status="Awaiting permission" />
        <div className="guardian-approval">
          <p>This child entered your email during signup and needs your permission to use Creative Network.</p>
          <p className="guardian-muted">Request expires {new Date(r.expiresAt).toLocaleString()}.</p>
          <label className="guardian-check"><input type="checkbox" disabled={busy} checked={!!confirmed[r.id]}
            onChange={e => setConfirmed(previous => ({ ...previous, [r.id]: e.target.checked }))} />
            <span>I am this child’s parent or guardian and agree to their participation and activity monitoring.</span></label>
          <div className="guardian-actions"><button type="button" disabled={busy || !confirmed[r.id]}
            onClick={() => void act(() => decideConsent(r.id, true, confirmed[r.id]), 'Permission granted. The child can now use Creative Network.')}>Grant permission</button>
            <button type="button" className="guardian-secondary" disabled={busy}
              onClick={() => { if (window.confirm('Decline permission? The child account will remain restricted.'))
                void act(() => decideConsent(r.id, false, false), 'Permission declined. The child account remains restricted.') }}>Decline</button></div>
        </div>
        <Permissions id={`pending-${r.id}`} value={initialPermissions} disabled />
        <p className="guardian-muted">Grant permission to manage these controls. The child cannot access the app while approval is pending.</p>
      </section>)}
      {children.length > 0 && <h3 className="guardian-section-heading">Linked child accounts <span>{children.length}</span></h3>}
      {children.map(c => <section className="guardian-card" key={c.consentId}>
        <ChildIdentity name={c.fullName} username={c.username} status={c.controls.accessPaused ? 'Access paused' : 'Permission granted'} />
        <Permissions id={`child-${c.consentId}`} value={c.controls} disabled={busy}
          onChange={next => void act(() => updateParentControls(c.consentId, next), next.accessPaused
            ? 'Saved · Child access is paused. Turn off pause to resume.' : 'Saved · Child access active. Permissions updated.')} />
        <p className="guardian-muted">Changes apply immediately, including while your child is signed in.</p>
        <div className="guardian-activity-counts" aria-label="Child activity totals">
          <span>{c.posts} posts</span><span>{c.events} events</span><span>{c.applications} applications</span>
        </div>
        <div className="guardian-actions"><button type="button" className="guardian-secondary" disabled={busy}
          aria-expanded={expanded === c.consentId} aria-controls={`child-activity-${c.consentId}`}
          onClick={() => setExpanded(expanded === c.consentId ? null : c.consentId)}>{expanded === c.consentId ? 'Hide child activity' : 'View child activity'}</button>
          <button type="button" className="guardian-danger" disabled={busy} onClick={() => {
            if (window.confirm('Withdraw consent? The child will lose access and administrative help will be needed to restore consent. Use Pause account access for a temporary restriction.')) {
              setExpanded(null); void act(() => revokeConsent(c.consentId), 'Consent withdrawn. The child account is restricted.')
            }
          }}>Withdraw consent</button></div>
        {expanded === c.consentId && <div id={`child-activity-${c.consentId}`}><ActivityPanel consentId={c.consentId} /></div>}
      </section>)}
      {!requests.length && !children.length && <div className="guardian-card guardian-empty"><UsersRound aria-hidden="true" />
        <h3>No child accounts yet</h3><p>Requests appear here when a child enters your account email during signup.</p></div>}
      {requests.length > 0 && !children.length && <p className="guardian-notice"><ShieldCheck size={16} aria-hidden="true" /> Child access: pending guardian approval.</p>}
      <p className="guardian-muted">Monitoring ends when your child turns 18. Platform safety restrictions still apply.</p>
    </>}
  </section>
}
