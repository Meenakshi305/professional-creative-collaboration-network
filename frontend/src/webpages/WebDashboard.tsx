
import { useEffect, useRef, useState } from 'react'

import './WebDashboard.css'

import NavigationBar from '../shared/NavigationBar/NavigationBar'

import {
  searchUsers,
  getSuggestedUsers,
  type SearchUser,
  type SuggestedUser
} from '../service/userService'

type UserPost = {
  id: number
  caption: string
  image: string
}

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
  onHomeClick,
  onProfileClick,
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

  const [suggestionsLoading, setSuggestionsLoading] =
    useState(true)

  // ============================================
  // POSTS
  // ============================================

  const [postCaption, setPostCaption] = useState('')
  const [selectedImage, setSelectedImage] =
    useState<string | null>(null)

  const [userPosts, setUserPosts] = useState<UserPost[]>([])

  const imageInputRef = useRef<HTMLInputElement>(null)

  // ============================================
  // LIKE AND COMMENTS
  // ============================================

  const [likedPosts, setLikedPosts] =
    useState<(number | string)[]>([])

  const [openCommentPost, setOpenCommentPost] =
    useState<number | string | null>(null)

  const [commentText, setCommentText] = useState('')

  const [postComments, setPostComments] =
    useState<Record<string, string[]>>({})

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

    reader.readAsDataURL(file)
  }

  // ============================================
  // PUBLISH POST
  // ============================================

  const handlePublishPost = () => {

    if (!selectedImage) {
      return
    }

    const newPost: UserPost = {
      id: Date.now(),
      caption: postCaption.trim(),
      image: selectedImage
    }

    setUserPosts(previous => [newPost, ...previous])
    setPostCaption('')
    setSelectedImage(null)

    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  // ============================================
  // LIKE POST
  // ============================================

  const handleLike = (postId: number | string) => {

    setLikedPosts(previous =>
      previous.includes(postId)
        ? previous.filter(id => id !== postId)
        : [...previous, postId]
    )
  }

  // ============================================
  // COMMENTS
  // ============================================

  const handleAddComment = (postId: number | string) => {

    const newComment = commentText.trim()

    if (!newComment) {
      return
    }

    setPostComments(previous => ({
      ...previous,
      [String(postId)]: [
        ...(previous[String(postId)] || []),
        newComment
      ]
    }))

    setCommentText('')
  }

  const renderComments = (postId: number | string) => {

    if (openCommentPost !== postId) {
      return null
    }

    return (
      <div className="comment-section">

        {(postComments[String(postId)] || []).map(
          (comment, index) => (
            <div className="comment-item" key={index}>
              <div className="comment-avatar">PG</div>
              <div className="comment-content">
                <strong>Creative User</strong>
                <p>{comment}</p>
              </div>
            </div>
          )
        )}

        <div className="comment-input-row">
          <div className="comment-avatar">PG</div>

          <input
            type="text"
            placeholder="Write a comment..."
            value={commentText}
            onChange={event =>
              setCommentText(event.target.value)
            }
            onKeyDown={event => {
              if (event.key === 'Enter') {
                handleAddComment(postId)
              }
            }}
          />

          <button
            type="button"
            onClick={() => handleAddComment(postId)}
          >
            Post
          </button>
        </div>

      </div>
    )
  }

  const renderPostActions = (postId: number | string) => (
    <>
      <div className="post-actions post-actions-two">

        <button
          type="button"
          className={likedPosts.includes(postId) ? 'liked' : ''}
          onClick={() => handleLike(postId)}
        >
          {likedPosts.includes(postId) ? '♥ Liked' : '♡ Like'}
        </button>

        <button
          type="button"
          onClick={() => {
            setOpenCommentPost(
              openCommentPost === postId ? null : postId
            )
            setCommentText('')
          }}
        >
          💬 Comment
          {postComments[String(postId)]?.length
            ? ` (${postComments[String(postId)].length})`
            : ''}
        </button>

      </div>

      {renderComments(postId)}
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

      <NavigationBar
        activePage="home"
        onHomeClick={onHomeClick}
        onProfileClick={onProfileClick}
        onCollaborationClick={onCollaborationClick}
        onEventsClick={onEventsClick}
        searchArea={

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
        }
      />

      {/* ====================================== */}
      {/* DASHBOARD BODY */}
      {/* ====================================== */}

      <section className="dashboard-container">

        {/* =================================== */}
        {/* LEFT PROFILE */}
        {/* =================================== */}

        <aside className="dashboard-left">

          <section className="profile-card">

            <div className="profile-cover" />

            <div className="profile-details">

              <div className="profile-avatar">
                <span>PG</span>
              </div>

              <h2>Creative Professional</h2>

              <p className="profile-role">
                Creative Network Member
              </p>

              <p className="profile-location">
                Adelaide, South Australia
              </p>

            </div>

            <div className="profile-stats">

              <div>
                <span>Profile Views</span>
                <strong>24</strong>
              </div>

              <div>
                <span>Connections</span>
                <strong>18</strong>
              </div>

              <div>
                <span>Posts</span>
                <strong>{userPosts.length}</strong>
              </div>

            </div>

            <div className="profile-links">

              <button type="button" onClick={onProfileClick}>
                👤 View My Profile
              </button>

              <button type="button" onClick={onProfileClick}>
                🎨 My Portfolio
              </button>

              <button type="button" onClick={onEventsClick}>
                📅 My Events
              </button>

              <button
                type="button"
                onClick={onCollaborationClick}
              >
                🤝 Collaborations
              </button>

            </div>

          </section>

        </aside>

        {/* =================================== */}
        {/* CENTRE FEED */}
        {/* =================================== */}

        <section className="dashboard-feed">

          {/* CREATE POST */}

          <section className="create-post-card">

            <div className="create-post-top">

              <div className="small-avatar">
                <span>PG</span>
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

              {!selectedImage ? (

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
                  >
                    Publish Post
                  </button>

                </div>

              )}

            </div>

          </section>

          {/* ================================= */}
          {/* USER CREATED POSTS */}
          {/* ================================= */}

          {userPosts.map(post => (

            <article className="feed-post" key={post.id}>

              <div className="post-header">

                <div className="post-avatar">
                  <span>PG</span>
                </div>

                <div className="post-author">
                  <strong>Creative User</strong>
                  <span>Creative Professional</span>
                  <small>Just now</small>
                </div>

                <span className="post-more">•••</span>

              </div>

              <div className="post-content">

                {post.caption && <p>{post.caption}</p>}

                <img
                  src={post.image}
                  alt="Creative post"
                  className="published-post-image"
                />

              </div>

              {renderPostActions(post.id)}

            </article>

          ))}

          {/* ================================= */}
          {/* SAMPLE FEED POST */}
          {/* ================================= */}

          <article className="feed-post">

            <div className="post-header">

              <div className="post-avatar">
                <span>OM</span>
              </div>

              <div className="post-author">
                <strong>Oliver Miller</strong>
                <span>Photographer • Adelaide</span>
                <small>2 hours ago</small>
              </div>

              <span className="post-more">•••</span>

            </div>

            <div className="post-content">

              <p>
                Exploring Adelaide through my lens.
                Every street, colour and creative space
                has its own story to tell.
              </p>

              <div className="post-media-placeholder">

                <div className="portfolio-preview-content">

                  <span className="portfolio-preview-icon">
                    📷
                  </span>

                  <strong>Creative Portfolio</strong>

                  <span>
                    Photography • Adelaide
                  </span>

                </div>

              </div>

            </div>

            {renderPostActions('oliver-post')}

          </article>

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

                  {user.profileImageUrl ? (

                    <img
                      src={user.profileImageUrl}
                      alt={user.username}
                      className="small-avatar"
                      style={{ objectFit: 'cover' }}
                    />

                  ) : (

                    <div className="small-avatar">
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
