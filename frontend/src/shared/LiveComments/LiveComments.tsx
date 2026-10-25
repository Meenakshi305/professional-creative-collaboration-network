
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import {
  getPostComments,
  addPostComment,
  updatePostComment,
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
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [error, setError] = useState('')

  const requestSequence = useRef(0)

  const load = useCallback(async () => {
    const sequence = ++requestSequence.current
    const data = await getPostComments(postId)

    if (sequence === requestSequence.current) {
      setComments(data)
    }
  }, [postId])

  useEffect(() => {
    let active = true
    let busy = false

    requestSequence.current += 1
    setComments([])
    setLoading(true)
    setError('')
    setEditingId(null)
    setEditText('')

    const refresh = async () => {
      if (busy || !active) return

      busy = true
      const sequence = ++requestSequence.current

      try {
        const data = await getPostComments(postId)

        if (active && sequence === requestSequence.current) {
          setComments(data)
          setError('')
        }
      } catch (err) {
        if (active && sequence === requestSequence.current) {
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
      requestSequence.current += 1
      window.clearInterval(timer)
    }
  }, [postId])

  // =====================================
  // ADD COMMENT + BACKEND AUTO MODERATION
  // =====================================

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const content = text.trim()
    if (!content || sending) return

    setSending(true)
    setError('')

    try {
      const saved = await addPostComment(postId, content)

      requestSequence.current += 1
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

  // =====================================
  // EDIT COMMENT + BACKEND AUTO MODERATION
  // =====================================

  function startEdit(comment: PostComment) {
    setEditingId(comment.commentId)
    setEditText(comment.content)
    setError('')
  }

  async function saveEdit(commentId: number) {
    const content = editText.trim()

    if (!content || savingEdit) return

    setSavingEdit(true)
    setError('')

    try {
      const updated = await updatePostComment(
        postId,
        commentId,
        content
      )

      requestSequence.current += 1

      setComments(previous =>
        previous.map(comment =>
          comment.commentId === commentId
            ? updated
            : comment
        )
      )

      setEditingId(null)
      setEditText('')
      await load()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update comment'
      )
    } finally {
      setSavingEdit(false)
    }
  }

  // =====================================
  // DELETE OWN COMMENT
  // =====================================

  async function removeComment(commentId: number) {
    if (deleting !== null) return

    setDeleting(commentId)
    setError('')

    try {
      await deletePostComment(postId, commentId)

      requestSequence.current += 1
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
              {comment.username.slice(0, 2).toUpperCase()}
            </div>

            <div className="comment-content">
              <strong>@{comment.username}</strong>

              {editingId === comment.commentId ? (
                <div className="live-comment-edit">
                  <input
                    type="text"
                    value={editText}
                    maxLength={1000}
                    onChange={event =>
                      setEditText(event.target.value)
                    }
                  />

                  <div className="live-comment-edit-actions">
                    <button
                      type="button"
                      disabled={savingEdit || !editText.trim()}
                      onClick={() =>
                        void saveEdit(comment.commentId)
                      }
                    >
                      {savingEdit ? 'Saving...' : 'Save'}
                    </button>

                    <button
                      type="button"
                      disabled={savingEdit}
                      onClick={() => {
                        setEditingId(null)
                        setEditText('')
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p>{comment.content}</p>
              )}

              <small>
                {new Date(comment.createdAt).toLocaleString()}
              </small>
            </div>

            {comment.ownComment &&
              editingId !== comment.commentId && (
                <div className="live-comment-actions">
                  <button
                    type="button"
                    className="edit-comment-btn"
                    disabled={savingEdit || deleting !== null}
                    onClick={() => startEdit(comment)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="delete-comment-btn"
                    disabled={deleting !== null || savingEdit}
                    onClick={() =>
                      void removeComment(comment.commentId)
                    }
                  >
                    {deleting === comment.commentId
                      ? 'Deleting...'
                      : 'Delete'}
                  </button>
                </div>
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
