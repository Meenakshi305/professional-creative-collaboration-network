import { useCallback, useEffect, useState } from 'react'
import { commentModerationApi, type CommentReport, type CommentPreview } from '../../service/commentModerationService'
import './CommentModerationPanel.css'

type Props = { superAdmin?: boolean }
export default function CommentModerationPanel({ superAdmin = false }: Props) {
  const [reports,setReports] = useState<CommentReport[]>([])
  const [error,setError] = useState('')
  const [busy,setBusy] = useState(false)
  const [preview,setPreview] = useState<Record<number, CommentPreview>>({})
  const refresh = useCallback(async () => {
    setError('')
    try { const result = await (superAdmin ? commentModerationApi.reports() : commentModerationApi.assigned()); setReports(result.content ?? []) }
    catch(e) { setError(e instanceof Error ? e.message : 'Unable to load comment reports') }
  },[superAdmin])
  useEffect(()=>{void refresh()},[refresh])
  async function act(action:()=>Promise<unknown>) {
    setBusy(true);setError('')
    try { await action(); await refresh() }
    catch(e) { setError(e instanceof Error ? e.message : 'Action failed') }
    finally {setBusy(false)}
  }
  const note = (question:string) => {const value=window.prompt(question);return value?.trim() && value.trim().length>=10 ? value.trim():null}
  return <section className="cn-comment-panel">
    <div className="cn-comment-head"><h2>Comment Reports</h2><button onClick={()=>void refresh()} disabled={busy}>Refresh</button></div>
    {error && <p role="alert" className="cn-comment-error">{error}</p>}
    {reports.length===0 ? <p>No comment reports in this view.</p> : reports.map(r=><article className="cn-comment-card" key={r.id}>
      <strong>Report #{r.id} — {r.status}</strong>
      <p>Post #{r.postId} • Comment #{r.commentId} • Reporter #{r.reporterId}</p>
      <p><b>Reason:</b> {r.reason}</p>
      {preview[r.id] && <blockquote>{preview[r.id].content}</blockquote>}
      <div className="cn-comment-actions">
        <button disabled={busy} onClick={()=>void act(async()=>{ const data=await commentModerationApi.preview(r.id);setPreview(p=>({...p,[r.id]:data})) })}>View comment</button>
        {r.status==='PENDING' && <>
          <button disabled={busy} onClick={()=>{const n=note('Reason for upholding? (10+ characters)');if(n)void act(()=>commentModerationApi.resolve(r.id,'UPHELD',n))}}>Uphold</button>
          <button disabled={busy} onClick={()=>{const n=note('Reason for dismissal? (10+ characters)');if(n)void act(()=>commentModerationApi.resolve(r.id,'DISMISSED',n))}}>Dismiss</button>
          <button disabled={busy} onClick={()=>{const n=window.prompt('Assign to admin ID (SuperAdmin), or to your own ID (Admin)');const id=Number(n);if(n&&Number.isSafeInteger(id)&&id>0)void act(()=>commentModerationApi.assign(r.id,id))}}>Assign</button>
        </>}
        {r.status==='UPHELD' && <button disabled={busy} onClick={()=>{const n=note('Reason for permanent comment removal? (10+ characters)');if(n&&window.confirm('Permanently delete this comment?'))void act(()=>commentModerationApi.remove(r.id,n))}}>Remove comment</button>}
      </div>
    </article>)}
  </section>
}
