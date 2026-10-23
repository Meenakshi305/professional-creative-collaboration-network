import { useEffect, useState } from 'react'
import { FaHeart, FaRegHeart } from 'react-icons/fa'
import {
  getLikeStatus,
  likePost,
  unlikePost,
  type LikeStatus
} from '../../service/likeService'

type Props = {
  postId: number
  className?: string
}

export default function LikeButton({ postId, className = '' }: Props) {
  const [status, setStatus] = useState<LikeStatus>({
    postId,
    likeCount: 0,
    likedByMe: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setStatus({ postId, likeCount: 0, likedByMe: false })
    setLoading(true)
    setError('')
    getLikeStatus(postId)
      .then(data => { if (active) setStatus(data) })
      .catch(err => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load likes')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [postId])

  async function toggleLike() {
    if (saving || loading) return
    setSaving(true)
    setError('')
    try {
      const updated = status.likedByMe
        ? await unlikePost(postId)
        : await likePost(postId)
      setStatus(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update like')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="creative-like-control">
      <button
        type="button"
        className={`${className} ${status.likedByMe ? 'is-liked' : ''}`}
        onClick={() => void toggleLike()}
        disabled={loading || saving}
        aria-pressed={status.likedByMe}
        aria-label={`${status.likedByMe ? 'Unlike' : 'Like'} post; ${status.likeCount} likes`}
      >
        {status.likedByMe ? <FaHeart aria-hidden="true" /> : <FaRegHeart aria-hidden="true" />}
        <span>{status.likedByMe ? 'Liked' : 'Like'}</span>
        <span className="like-count">{loading ? '…' : status.likeCount}</span>
      </button>
      {error && <div className="like-error-message" role="alert">{error}</div>}
    </div>
  )
}
