
import { useEffect, useRef, useState } from 'react'

import {
  FaRegCommentDots,
  FaEllipsisV,
  FaDownload,
  FaTrash
} from 'react-icons/fa'

import {
  getUserPosts,
  deletePost,
  mediaUrl,
  type Post
} from '../../service/postService'

import { getToken } from '../../service/authService'
import LiveComments from '../LiveComments/LiveComments'
import LikeButton from '../LikeButton/LikeButton'

import './PostList.css'

type PostListProps = {
  userId: number
  own?: boolean
}

export default function PostList({
  userId,
  own = false
}: PostListProps) {

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [openCommentPostId, setOpenCommentPostId] =
    useState<number | null>(null)
  const [openMenuPostId, setOpenMenuPostId] =
    useState<number | null>(null)
  const [deletingPostId, setDeletingPostId] =
    useState<number | null>(null)

  const menuRef = useRef<HTMLDivElement>(null)

  // LOAD POSTS
  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError('')
    setPosts([])
    setOpenCommentPostId(null)
    setOpenMenuPostId(null)

    getUserPosts(userId)
      .then(data => {
        if (!cancelled) setPosts(data)
      })
      .catch(e => {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : 'Unable to load posts'
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  // CLOSE MENU ON OUTSIDE CLICK
  useEffect(() => {
    if (openMenuPostId === null) return

    const closeMenu = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpenMenuPostId(null)
      }
    }

    const escapeMenu = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenuPostId(null)
      }
    }

    document.addEventListener('mousedown', closeMenu)
    document.addEventListener('keydown', escapeMenu)

    return () => {
      document.removeEventListener('mousedown', closeMenu)
      document.removeEventListener('keydown', escapeMenu)
    }
  }, [openMenuPostId])

  // COMMENTS
  function toggleComments(postId: number) {
    setOpenCommentPostId(previous =>
      previous === postId ? null : postId
    )
    setOpenMenuPostId(null)
  }

  // THREE DOT MENU
  function toggleMenu(postId: number) {
    setOpenMenuPostId(previous =>
      previous === postId ? null : postId
    )
  }

  // DOWNLOAD
  async function handleDownload(
    downloadUrl: string,
    fileName: string
  ) {
    setError('')
    setOpenMenuPostId(null)

    try {
      const token = getToken()

      if (!token) {
        throw new Error('Please log in again.')
      }

      const response = await fetch(mediaUrl(downloadUrl), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(
          `Download failed (${response.status})`
        )
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = objectUrl
      link.download = fileName || 'creative-post'
      document.body.appendChild(link)
      link.click()
      link.remove()

      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl)
      }, 1000)

    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Unable to download media'
      )
    }
  }

  // DELETE POST
  async function remove(postId: number) {
    if (!own || deletingPostId !== null) return
    if (!window.confirm('Delete this post?')) return

    setDeletingPostId(postId)
    setError('')
    setOpenMenuPostId(null)

    try {
      await deletePost(postId)

      setPosts(previous =>
        previous.filter(post => post.postId !== postId)
      )

      if (openCommentPostId === postId) {
        setOpenCommentPostId(null)
      }

    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Delete failed'
      )
    } finally {
      setDeletingPostId(null)
    }
  }

  if (loading) {
    return (
      <div className="creative-post-list">
        <p>Loading posts...</p>
      </div>
    )
  }

  return (
    <div className="creative-post-list">

      {error && (
        <p role="alert" className="post-list-error">
          {error}
        </p>
      )}

      {posts.length === 0 && !error && (
        <p>No posts yet.</p>
      )}

      {posts.map(post => {
        const commentsOpen =
          openCommentPostId === post.postId
        const menuOpen =
          openMenuPostId === post.postId

        return (
          <article
            key={post.postId}
            className="creative-post-card"
          >

            {/* POST HEADER */}
            <div className="creative-post-header">

              <div className="creative-post-user">

                <div className="creative-post-avatar">
                  {post.username.slice(0, 2).toUpperCase()}
                </div>

                <div className="creative-post-user-details">
                  <strong>@{post.username}</strong>
                  <small>
                    {new Date(post.createdAt)
                      .toLocaleString('en-AU')}
                  </small>
                </div>

              </div>

              {/* THREE DOT MENU */}
              <div
                className="creative-post-menu-wrapper"
                ref={menuOpen ? menuRef : null}
              >
                <button
                  type="button"
                  className="creative-post-menu-button"
                  aria-label="Post options"
                  aria-expanded={menuOpen}
                  onClick={() => toggleMenu(post.postId)}
                >
                  <FaEllipsisV />
                </button>

                {menuOpen && (
                  <div className="creative-post-dropdown">

                    {post.media.map((media, index) => (
                      <button
                        key={media.mediaId}
                        type="button"
                        className="creative-post-menu-item"
                        onClick={() =>
                          void handleDownload(
                            media.downloadUrl,
                            media.originalFileName
                          )
                        }
                      >
                        <FaDownload />
                        <span>
                          {post.media.length === 1
                            ? 'Download'
                            : `Download ${index + 1}`}
                        </span>
                      </button>
                    ))}

                    {post.media.length === 0 && (
                      <span className="creative-post-menu-empty">
                        No media to download
                      </span>
                    )}

                    {own && (
                      <button
                        type="button"
                        className="creative-post-menu-item creative-post-delete"
                        disabled={deletingPostId !== null}
                        onClick={() =>
                          void remove(post.postId)
                        }
                      >
                        <FaTrash />
                        Delete Post
                      </button>
                    )}

                  </div>
                )}
              </div>
            </div>

            {/* CAPTION */}
            {post.caption && (
              <p className="creative-post-caption">
                {post.caption}
              </p>
            )}

            {/* MEDIA */}
            <div className="creative-post-media">
              {post.media.map(media =>
                media.mediaType === 'IMAGE' ? (
                  <img
                    key={media.mediaId}
                    src={mediaUrl(media.viewUrl)}
                    alt={media.originalFileName}
                    className="creative-post-image"
                    loading="lazy"
                  />
                ) : (
                  <a
                    key={media.mediaId}
                    href={mediaUrl(media.viewUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {media.originalFileName}
                  </a>
                )
              )}
            </div>

            {/* LIKE + COMMENT: SAME TWO-COLUMN STYLE AS DASHBOARD */}
            <div className="creative-post-actions creative-profile-post-actions">
              <LikeButton
                postId={post.postId}
                className="creative-post-action-button"
              />

              <button
                type="button"
                className={commentsOpen ? 'comments-active' : ''}
                onClick={() => toggleComments(post.postId)}
                aria-expanded={commentsOpen}
                aria-controls={`comments-${post.postId}`}
              >
                <FaRegCommentDots aria-hidden="true" />
                <span>Comment</span>
              </button>
            </div>

            {/* LIVE COMMENTS */}
            {commentsOpen && (
              <div
                id={`comments-${post.postId}`}
                className="creative-post-comments-container"
              >
                <LiveComments postId={post.postId} />
              </div>
            )}

          </article>
        )
      })}

    </div>
  )
}
