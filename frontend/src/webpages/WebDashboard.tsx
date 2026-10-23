import { getFeedPosts, createPost, mediaUrl, type Post } from '../service/postService'
import { getCurrentUser, type CurrentUserResponse } from '../service/authService'
import { getUserProfile, type ProfileResponse } from '../service/profileService'

import { useEffect, useRef, useState } from 'react'

import './WebDashboard.css'

import LiveComments from '../shared/LiveComments/LiveComments'
import LikeButton from '../shared/LikeButton/LikeButton'

import {
  searchUsers,
  getSuggestedUsers,
  type SearchUser,
  type SuggestedUser
} from '../service/userService'


type DashboardProps = {
  onHomeClick: () => void
  onProfileClick: () => void
  onCollaborationClick: () => void
  onEventsClick: () => void
  onUserClick: (userId: number) => void
}

const collaborations = [
  {
    id: 1,
    title: 'Music Video Production',
    description: 'Looking for a creative video editor.'
  },
  {
    id: 2,
    title: 'Brand Campaign Design',
    description: 'Graphic designer required for a new campaign.'
  }
]

const events = [
  {
    id: 1,
    title: 'Creative Networking Meetup',
    details: '24 Sep • Adelaide • In-person'
  },
  {
    id: 2,
    title: 'Digital Art Workshop',
    details: '10 Oct • Online'
  }
]

function Dashboard({
  onCollaborationClick,
  onEventsClick,
  onUserClick
}: DashboardProps) {

  // ============================================
  // SEARCH
  // ============================================

  const [searchText, setSearchText] = useState('')
  const [searchedCreatives, setSearchedCreatives] =
    useState<SearchUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  // ============================================
  // SUGGESTED CREATIVES
  // ============================================

  const [suggestedUsers, setSuggestedUsers] =
    useState<SuggestedUser[]>([])
  const [failedSuggestedImages, setFailedSuggestedImages] = useState<number[]>([])

  const [suggestionsLoading, setSuggestionsLoading] =
    useState(true)

  // ============================================
  // POSTS
  // ============================================

  const [postCaption, setPostCaption] = useState('')
  const [selectedImage, setSelectedImage] =
    useState<string | null>(null)

  const [userPosts, setUserPosts] = useState<Post[]>([])

  // Logged-in creative's avatar for the compact post composer.
  const [dashboardUser, setDashboardUser] = useState<CurrentUserResponse | null>(null)
  const [dashboardProfile, setDashboardProfile] = useState<ProfileResponse | null>(null)
  useEffect(() => {
    let cancelled = false
    getCurrentUser().then(async user => {
      if (cancelled) return
      setDashboardUser(user)
      try {
        const profile = await getUserProfile(user.userId)
        if (!cancelled) setDashboardProfile(profile)
      } catch (error) {
        console.warn('Composer profile image unavailable:', error)
      }
    }).catch(error => console.warn('Composer account unavailable:', error))
    return () => { cancelled = true }
  }, [])

  const profileName = dashboardUser?.fullName?.trim() || dashboardUser?.username || 'My Profile'
  const profileInitials = profileName.split(/\s+/).slice(0, 2)
    .map(part => part.charAt(0)).join('').toUpperCase()


  const imageInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [postError, setPostError] = useState('')
  const [feedLoading, setFeedLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  useEffect(() => {
    let cancelled = false
    setFeedLoading(true)
    getFeedPosts()
      .then(posts => {
        if (!cancelled) setUserPosts(posts)
      })
      .catch(error => {
        if (!cancelled) setPostError(error instanceof Error ? error.message : 'Unable to load feed')
      })
      .finally(() => {
        if (!cancelled) setFeedLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  // ============================================
  // LIKE AND COMMENTS
  // ============================================

  const [openCommentPost, setOpenCommentPost] =
    useState<number | null>(null)

  // ============================================
  // FILTER SEARCH
  // ============================================

  const normalizedSearch = searchText.trim().toLowerCase()

  const filteredCollaborations = collaborations.filter(
    collaboration =>
      collaboration.title.toLowerCase().includes(normalizedSearch) ||
      collaboration.description.toLowerCase().includes(normalizedSearch)
  )

  const filteredEvents = events.filter(
    event =>
      event.title.toLowerCase().includes(normalizedSearch) ||
      event.details.toLowerCase().includes(normalizedSearch)
  )

  // ============================================
  // BACKEND USER SEARCH
  // ============================================

  useEffect(() => {

    const query = searchText.trim()
    let cancelled = false

    if (!query) {
      setSearchedCreatives([])
      setSearchError('')
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    setSearchError('')

    const timeout = window.setTimeout(async () => {

      try {

        const users = await searchUsers(query)

        if (!cancelled) {
          setSearchedCreatives(users)
        }

      } catch (error) {

        if (!cancelled) {
          console.error('Search users error:', error)
          setSearchedCreatives([])
          setSearchError(
            error instanceof Error
              ? error.message
              : 'Unable to search creatives.'
          )
        }

      } finally {

        if (!cancelled) {
          setIsSearching(false)
        }
      }

    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }

  }, [searchText])

  // ============================================
  // LOAD SUGGESTED CREATIVES
  // ============================================

  useEffect(() => {

    let cancelled = false

    const loadSuggestions = async () => {

      try {

        setSuggestionsLoading(true)

        const users = await getSuggestedUsers()

        if (!cancelled) {
          setSuggestedUsers(users)
        }

      } catch (error) {

        console.error('Suggested creatives error:', error)

        if (!cancelled) {
          setSuggestedUsers([])
        }

      } finally {

        if (!cancelled) {
          setSuggestionsLoading(false)
        }
      }
    }

    void loadSuggestions()

    return () => {
      cancelled = true
    }

  }, [])

  // ============================================
  // OPEN PUBLIC PROFILE
  // ============================================

  const handleCreativeClick = (userId: number) => {

    setSearchText('')
    setSearchedCreatives([])
    setSearchError('')

    onUserClick(userId)
  }

  // ============================================
  // USER INITIALS
  // ============================================

  const getUserInitials = (
    user: SearchUser | SuggestedUser
  ) => {

    const name = user.fullName || user.username

    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
  }

  // ============================================
  // IMAGE SELECT
  // ============================================

  const handleImageSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file = event.target.files?.[0]

    if (!file || !file.type.startsWith('image/')) {
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImage(reader.result)
      }
    }

    setSelectedFile(file)
    reader.readAsDataURL(file)
  }

  // ============================================
  // PUBLISH POST
  // ============================================

  const handlePublishPost = async () => {
    if ((!postCaption.trim() && !selectedFile) || publishing) return
    setPublishing(true)
    setPostError('')
    try {
      const saved = await createPost(postCaption, selectedFile ? [selectedFile] : [])
      setUserPosts(previous => [saved, ...previous.filter(p => p.postId !== saved.postId)])
      setPostCaption('')
      setSelectedImage(null)
      setSelectedFile(null)
      if (imageInputRef.current) imageInputRef.current.value = ''
    } catch (e) {
      setPostError(e instanceof Error ? e.message : 'Could not publish post')
    } finally { setPublishing(false) }
  }

  // ============================================
  // LIVE COMMENTS (PERSISTED IN MYSQL)
  // ============================================

  const renderPostActions = (postId: number) => (
    <>
      <div className="post-actions post-actions-two">
        {/* Persisted MySQL likes and count */}
        <LikeButton
          postId={postId}
          className="dashboard-like-button"
        />

        <button
          type="button"
          className="dashboard-comment-button"
          aria-expanded={openCommentPost === postId}
          onClick={() =>
            setOpenCommentPost(previous =>
              previous === postId ? null : postId
            )
          }
        >
          <span aria-hidden="true">💬</span>
          <span>Comment</span>
        </button>
      </div>

      {openCommentPost === postId && (
        <LiveComments key={postId} postId={postId} />
      )}
    </>
  )

  // ============================================
  // DASHBOARD
  // ============================================

  return (

    <main className="dashboard-page">

      {/* ====================================== */}
      {/* NAVIGATION BAR */}
      {/* ====================================== */}

      <header className="cp-home-heading">
        <div>
          <h1>Discover</h1>
          <p>Find inspiration, people and creative opportunities.</p>
        </div>
      </header>
      <div className="cp-dashboard-search-row">
          <div className="search-wrapper">

            <div className="dashboard-search">

              <span>⌕</span>

              <input
                type="text"
                placeholder="Search creatives, collaborations and events"
                value={searchText}
                onChange={event =>
                  setSearchText(event.target.value)
                }
              />

              {searchText && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => setSearchText('')}
                >
                  ✕
                </button>
              )}

            </div>

            {searchText && (

              <div className="search-results">

                {/* CREATIVES */}

                <div className="search-result-section">
                  <h4>Creatives</h4>

                  {isSearching && (
                    <div className="no-search-results">
                      Searching...
                    </div>
                  )}

                  {!isSearching && searchError && (
                    <div className="no-search-results">
                      {searchError}
                    </div>
                  )}

                  {!isSearching &&
                    !searchError &&
                    searchedCreatives.map(creative => (

                      <button
                        key={creative.userId}
                        type="button"
                        className="search-result-item"
                        onClick={() =>
                          handleCreativeClick(creative.userId)
                        }
                      >

                        {creative.profileImageUrl ? (
                          <img
                            src={creative.profileImageUrl}
                            alt={creative.username}
                            className="search-result-avatar"
                          />
                        ) : (
                          <div className="search-result-avatar">
                            {getUserInitials(creative)}
                          </div>
                        )}

                        <div className="search-result-info">
                          <strong>
                            {creative.fullName || creative.username}
                          </strong>
                          <span>@{creative.username}</span>

                          {creative.bio && (
                            <span>
                              {creative.bio.length > 70
                                ? `${creative.bio.substring(0, 70)}...`
                                : creative.bio}
                            </span>
                          )}
                        </div>

                        <span className="search-result-arrow">
                          ›
                        </span>

                      </button>
                    ))
                  }

                </div>

                {/* COLLABORATIONS */}

                {filteredCollaborations.length > 0 && (

                  <div className="search-result-section">
                    <h4>Collaborations</h4>

                    {filteredCollaborations.map(collaboration => (
                      <button
                        key={collaboration.id}
                        type="button"
                        className="search-result-item"
                        onClick={onCollaborationClick}
                      >
                        <div className="search-result-icon">
                          🤝
                        </div>

                        <div className="search-result-info">
                          <strong>{collaboration.title}</strong>
                          <span>{collaboration.description}</span>
                        </div>

                        <span className="search-result-arrow">
                          ›
                        </span>
                      </button>
                    ))}
                  </div>

                )}

                {/* EVENTS */}

                {filteredEvents.length > 0 && (

                  <div className="search-result-section">
                    <h4>Events</h4>

                    {filteredEvents.map(event => (
                      <button
                        key={event.id}
                        type="button"
                        className="search-result-item"
                        onClick={onEventsClick}
                      >
                        <div className="search-result-icon">
                          📅
                        </div>

                        <div className="search-result-info">
                          <strong>{event.title}</strong>
                          <span>{event.details}</span>
                        </div>

                        <span className="search-result-arrow">
                          ›
                        </span>
                      </button>
                    ))}
                  </div>

                )}

                {!isSearching &&
                  !searchError &&
                  searchedCreatives.length === 0 &&
                  filteredCollaborations.length === 0 &&
                  filteredEvents.length === 0 && (

                    <div className="no-search-results">
                      <strong>No results found</strong>
                      <p>
                        No creatives, collaborations or events
                        match "{searchText}".
                      </p>
                    </div>

                  )}

              </div>

            )}

          </div>
      </div>

      {/* ====================================== */}
      {/* DASHBOARD BODY */}
      {/* ====================================== */}

      <section className="dashboard-container">

        {/* =================================== */}
        {/* The redundant left profile card was removed. */}

        {/* CENTRE FEED */}
        {/* =================================== */}

        <section className="dashboard-feed">

          {/* CREATE POST */}

          <section className="create-post-card">

            <div className="create-post-top">

              <div className="small-avatar cp-composer-avatar">
                {dashboardProfile?.profileImageUrl ? (
                  <img src={dashboardProfile.profileImageUrl} alt={profileName} onError={event => { event.currentTarget.style.display = 'none' }} />
                ) : (
                  <span>{profileInitials || 'U'}</span>
                )}
              </div>

              <input
                type="text"
                className="start-post-button"
                placeholder="Share your creative work or update..."
                value={postCaption}
                onChange={event =>
                  setPostCaption(event.target.value)
                }
              />

            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageSelect}
            />

            {selectedImage && (

              <div className="selected-image-preview">

                <img
                  src={selectedImage}
                  alt="Selected post preview"
                />

                <button
                  type="button"
                  className="remove-selected-image"
                  onClick={() => {
                    setSelectedImage(null)
                    setSelectedFile(null)

                    if (imageInputRef.current) {
                      imageInputRef.current.value = ''
                    }
                  }}
                  aria-label="Remove selected image"
                >
                  ✕
                </button>

              </div>

            )}

            <div className="create-post-action">

              {!selectedImage && !postCaption.trim() ? (

                <button
                  type="button"
                  className="add-post-button"
                  onClick={() =>
                    imageInputRef.current?.click()
                  }
                >

                  <span className="add-post-icon">
                    +
                  </span>

                  <span className="add-post-text">
                    <strong>Create Post</strong>
                    <small>Share an update or image</small>
                  </span>

                </button>

              ) : (

                <div className="post-ready-actions">

                  <button
                    type="button"
                    className="change-image-button"
                    onClick={() =>
                      imageInputRef.current?.click()
                    }
                  >
                    Change Image
                  </button>

                  <button
                    type="button"
                    className="publish-ready-button"
                    onClick={handlePublishPost}
                    disabled={publishing}
                  >
                    {publishing ? 'Publishing...' : 'Publish Post'}
                  </button>

                </div>

              )}

            </div>

          </section>

          {/* ================================= */}
          {/* POSTS FROM BACKEND: SELF AND FOLLOWED USERS */}
          {/* ================================= */}

          {postError && <p role="alert">{postError}</p>}
          {feedLoading && <p>Loading posts...</p>}
          {!feedLoading && !postError && userPosts.length === 0 && <p>No posts yet. Follow creatives or create your first post.</p>}
          {userPosts.map(post => (

            <article className="feed-post" key={post.postId}>

              <div className="post-header">

                <div className="post-avatar">
                  <span>{post.username.slice(0, 2).toUpperCase()}</span>
                </div>

                <div className="post-author">
                  <strong onClick={() => onUserClick(post.userId)} style={{ cursor: 'pointer' }}>@{post.username}</strong>
                  <span>Creative Professional</span>
                  <small>{new Date(post.createdAt).toLocaleString()}</small>
                </div>

                <span className="post-more">•••</span>

              </div>

              <div className="post-content">

                {post.caption && <p>{post.caption}</p>}

                {post.media.map(media => media.mediaType === 'IMAGE' ? (
                  <img key={media.mediaId} src={mediaUrl(media.viewUrl)} alt={media.originalFileName} className="published-post-image" />
                ) : (
                  <a key={media.mediaId} href={mediaUrl(media.viewUrl)} target="_blank" rel="noreferrer">{media.originalFileName}</a>
                ))}

              </div>

              {renderPostActions(post.postId)}

            </article>

          ))}

          {/* ================================= */}
          {/* Feed contains only persisted posts from the API. */}

        </section>

        {/* =================================== */}
        {/* RIGHT DISCOVERY */}
        {/* =================================== */}

        <aside className="dashboard-right">

          {/* SUGGESTED CREATIVES */}

          <section className="discovery-card">

            <div className="card-heading">
              <h3>Suggested Creatives</h3>
            </div>

            {suggestionsLoading && (
              <p>Loading creatives...</p>
            )}

            {!suggestionsLoading &&
              suggestedUsers.length === 0 && (
                <p>No suggested creatives available.</p>
              )}

            {!suggestionsLoading &&
              suggestedUsers.map(user => (

                <div
                  className="creative-person"
                  key={user.userId}
                >

                  {user.profileImageUrl?.trim() &&
                  !failedSuggestedImages.includes(user.userId) ? (
                    <img
                      src={user.profileImageUrl}
                      alt={`${user.fullName || user.username} profile`}
                      className="small-avatar suggested-avatar-photo"
                      onError={() =>
                        setFailedSuggestedImages(previous =>
                          previous.includes(user.userId)
                            ? previous
                            : [...previous, user.userId]
                        )
                      }
                    />
                  ) : (
                    <div
                      className="small-avatar suggested-avatar-initials"
                      aria-label={`${user.fullName || user.username} initials`}
                    >
                      <span>{getUserInitials(user)}</span>
                    </div>
                  )}

                  <div>

                    <strong>
                      {user.fullName || user.username}
                    </strong>

                    <span>@{user.username}</span>

                    {user.skills && (
                      <small style={{ display: 'block' }}>
                        {user.skills.length > 35
                          ? `${user.skills.substring(0, 35)}...`
                          : user.skills}
                      </small>
                    )}

                    {user.matchedSkills &&
                      user.matchedSkills.length > 0 && (

                        <small
                          style={{
                            display: 'block',
                            marginTop: '4px',
                            fontWeight: 600
                          }}
                        >
                          Matched: {user.matchedSkills.join(', ')}
                        </small>

                      )}

                  </div>

                  <button
                    type="button"
                    className="follow-button"
                    onClick={() =>
                      handleCreativeClick(user.userId)
                    }
                  >
                    View
                  </button>

                </div>

              ))}

          </section>

          {/* COLLABORATIONS */}

          <section className="discovery-card">

            <div className="card-heading">

              <h3>Collaboration Opportunities</h3>

              <button
                type="button"
                onClick={onCollaborationClick}
              >
                View All
              </button>

            </div>

            {collaborations.map(collaboration => (

              <div
                key={collaboration.id}
                className="discovery-item"
              >

                <span>🤝</span>

                <div>
                  <strong>{collaboration.title}</strong>
                  <p>{collaboration.description}</p>
                </div>

              </div>

            ))}

          </section>

          {/* UPCOMING EVENTS */}

          <section className="discovery-card">

            <div className="card-heading">

              <h3>Upcoming Events</h3>

              <button
                type="button"
                onClick={onEventsClick}
              >
                View All
              </button>

            </div>

            {events.map(event => (

              <div
                key={event.id}
                className="discovery-item"
              >

                <span>📅</span>

                <div>
                  <strong>{event.title}</strong>
                  <p>{event.details}</p>
                </div>

              </div>

            ))}

          </section>

        </aside>

      </section>

      {/* ====================================== */}
      {/* FOOTER */}
      {/* ====================================== */}

      <footer className="dashboard-footer">

        <div className="footer-links">
          <span>About</span>
          <span>Privacy</span>
          <span>Safety</span>
          <span>Terms</span>
          <span>Help</span>
        </div>

        <p>
          © 2026 Professional Creative Collaboration Network
        </p>

      </footer>

    </main>
  )
}

export default Dashboard
