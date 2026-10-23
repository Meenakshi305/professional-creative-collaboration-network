
import { useCallback, useEffect, useState } from 'react'

import {
  getPostComments,
  addPostComment,
  deletePostComment,
  type PostComment
} from '../../service/commentService'

import './LiveComments.css'

type Props = {
  postId: number
}

export default function LiveComments({ postId }: Props) {
  const [comments, setComments] = useState<PostComment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const data = await getPostComments(postId)
    setComments(data)
  }, [postId])

  useEffect(() => {
    let active = true
    let busy = false

    setComments([])
    setLoading(true)
    setError('')

    const refresh = async () => {
      if (busy || !active) return

      busy = true

      try {
        const data = await getPostComments(postId)
        if (active) {
          setComments(data)
          setError('')
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load comments'
          )
        }
      } finally {
        busy = false
        if (active) setLoading(false)
      }
    }

    void refresh()

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refresh()
      }
    }, 3000)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [postId])

  async function submitComment(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const content = text.trim()
    if (!content || sending) return

    setSending(true)
    setError('')

    try {
      const saved = await addPostComment(postId, content)

      setComments(previous =>
        previous.some(c => c.commentId === saved.commentId)
          ? previous
          : [...previous, saved]
      )

      setText('')
      await load()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to post comment'
      )
    } finally {
      setSending(false)
    }
  }

  async function removeComment(commentId: number) {
    if (deleting !== null) return

    setDeleting(commentId)
    setError('')

    try {
      await deletePostComment(postId, commentId)

      setComments(previous =>
        previous.filter(c => c.commentId !== commentId)
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete comment'
      )
    } finally {
      setDeleting(null)
    }
  }

  return (
    <section className="live-comments">

      <h4>Comments ({comments.length})</h4>

      {loading && <p>Loading comments...</p>}

      {error && (
        <p className="live-comment-error" role="alert">
          {error}
        </p>
      )}

      <div className="live-comment-list">
        {!loading && comments.length === 0 && (
          <p>No comments yet. Be the first to comment!</p>
        )}

        {comments.map(comment => (
          <div
            key={comment.commentId}
            className="live-comment-item"
          >
            <div className="comment-avatar">
              {comment.username
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div className="comment-content">
              <strong>@{comment.username}</strong>

              <p>{comment.content}</p>

              <small>
                {new Date(
                  comment.createdAt
                ).toLocaleString()}
              </small>
            </div>

            {comment.ownComment && (
              <button
                type="button"
                className="delete-comment-btn"
                disabled={deleting !== null}
                onClick={() =>
                  void removeComment(comment.commentId)
                }
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      <form
        className="live-comment-form"
        onSubmit={submitComment}
      >
        <input
          type="text"
          placeholder="Write a comment..."
          value={text}
          maxLength={1000}
          onChange={event => setText(event.target.value)}
        />

        <button
          type="submit"
          disabled={!text.trim() || sending}
        >
          {sending ? 'Posting...' : 'Post'}
        </button>
      </form>

    </section>
  )
}
