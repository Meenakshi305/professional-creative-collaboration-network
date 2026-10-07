import { useRef, useState } from 'react'
import './WebDashboard.css'
import NavigationBar from '../shared/NavigationBar/NavigationBar'

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
}
function Dashboard({
  onHomeClick,
  onProfileClick,
  onCollaborationClick,
  onEventsClick
}: DashboardProps) {
    const [searchText, setSearchText] = useState('')
    const [creativesFollowed, setCreativesFollowed] = useState<number[]>([])
    const [postCaption, setPostCaption] = useState('')
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [userPosts, setUserPosts] = useState<UserPost[]>([])
    const imageInputRef = useRef<HTMLInputElement>(null)
    const [likedPosts, setLikedPosts] = useState<(number | string)[]>([])
    const [openCommentPost, setOpenCommentPost] = useState<number | string | null>(null)
    const [commentText, setCommentText] = useState('')
    const [postComments, setPostComments] = useState<Record<string, string[]>>({})
    // Sample Search Datasets:
        const creatives = [
        {
            id: 1,
            name: 'Charlie Smith',
            role: 'Painter',
            location: 'Adelaide'
        },
        {
            id: 2,
            name: 'Isla Wilson',
            role: 'Musician',
            location: 'Adelaide'
        },
        {
            id: 3,
            name: 'Oliver Miller',
            role: 'Photographer',
            location: 'Adelaide'
        }
        ]
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
        const normalizedSearch = searchText.trim().toLowerCase()

        const filteredCreatives = creatives.filter((creative) =>
        creative.name.toLowerCase().includes(normalizedSearch) ||
        creative.role.toLowerCase().includes(normalizedSearch) ||
        creative.location.toLowerCase().includes(normalizedSearch)
        )

        const filteredCollaborations = collaborations.filter((collaboration) =>
        collaboration.title.toLowerCase().includes(normalizedSearch) ||
        collaboration.description.toLowerCase().includes(normalizedSearch)
        )

        const filteredEvents = events.filter((event) =>
        event.title.toLowerCase().includes(normalizedSearch) ||
        event.details.toLowerCase().includes(normalizedSearch)
        )

        const handleFollow = (creativeId: number) => {
            setCreativesFollowed((previousFollowed) => {
                if (previousFollowed.includes(creativeId)) {
                return previousFollowed.filter((id) => id !== creativeId)
                }

                return [...previousFollowed, creativeId]
            })
            }
            const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0]

            if (file) {
                const imageUrl = URL.createObjectURL(file)
                setSelectedImage(imageUrl)
            }
            }
            const handlePublishPost = () => {
                if (!selectedImage) {
                    return
                }

                const newPost: UserPost = {
                    id: Date.now(),
                    caption: postCaption.trim(),
                    image: selectedImage
                }

                setUserPosts((previousPosts) => [
                    newPost,
                    ...previousPosts
                ])

                setPostCaption('')
                setSelectedImage(null)

                if (imageInputRef.current) {
                    imageInputRef.current.value = ''
                }
                }

            const handleLike = (postId: number | string) => {
            setLikedPosts((previousLikedPosts) => {
                if (previousLikedPosts.includes(postId)) {
                return previousLikedPosts.filter((id) => id !== postId)
                }

                return [...previousLikedPosts, postId]
            })
            }
            

            const handleAddComment = (postId: number | string) => {
                const newComment = commentText.trim()

                if (!newComment) {
                    return
                }

                setPostComments((previousComments) => ({
                    ...previousComments,

                    [String(postId)]: [
                    ...(previousComments[String(postId)] || []),
                    newComment
                    ]
                }))

                setCommentText('')
                }
  return (
    <main className="dashboard-page">

      {/* ================= HEADER ================= */}
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
                    onChange={(e) => setSearchText(e.target.value)}
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

                    {filteredCreatives.length > 0 && (
                    <div className="search-result-section">
                        <h4>Creatives</h4>

                        {filteredCreatives.map((creative) => (
                        <button
                            type="button"
                            className="search-result-item"
                            key={creative.id}
                        >
                            <div className="search-result-avatar">
                            {creative.name
                                .split(' ')
                                .map((word) => word[0])
                                .join('')}
                            </div>

                            <div className="search-result-info">
                            <strong>{creative.name}</strong>
                            <span>
                                {creative.role} • {creative.location}
                            </span>
                            </div>

                            <span className="search-result-arrow">›</span>
                        </button>
                        ))}
                    </div>
                    )}

                    {filteredCollaborations.length > 0 && (
                    <div className="search-result-section">
                        <h4>Collaborations</h4>

                        {filteredCollaborations.map((collaboration) => (
                        <button
                            type="button"
                            className="search-result-item"
                            key={collaboration.id}
                        >
                            <div className="search-result-icon">
                            🤝
                            </div>

                            <div className="search-result-info">
                            <strong>{collaboration.title}</strong>
                            <span>{collaboration.description}</span>
                            </div>

                            <span className="search-result-arrow">›</span>
                        </button>
                        ))}
                    </div>
                    )}

                    {filteredEvents.length > 0 && (
                    <div className="search-result-section">
                        <h4>Events</h4>

                        {filteredEvents.map((event) => (
                        <button
                            type="button"
                            className="search-result-item"
                            key={event.id}
                        >
                            <div className="search-result-icon">
                            📅
                            </div>

                            <div className="search-result-info">
                            <strong>{event.title}</strong>
                            <span>{event.details}</span>
                            </div>

                            <span className="search-result-arrow">›</span>
                        </button>
                        ))}
                    </div>
                    )}

                    {filteredCreatives.length === 0 &&
                    filteredCollaborations.length === 0 &&
                    filteredEvents.length === 0 && (
                        <div className="no-search-results">
                        <span>⌕</span>
                        <strong>No results found</strong>
                        <p>
                            No creatives, collaborations or events match
                            "{searchText}".
                        </p>
                        </div>
                    )}

                </div>
                )}

            </div>
            }
        />


      {/* ================= DASHBOARD BODY ================= */}
      <section className="dashboard-container">

        {/* ---------- LEFT PROFILE SECTION ---------- */}
        <aside className="dashboard-left">

          <section className="profile-card">

            <div className="profile-cover"></div>

            <div className="profile-details">
              <div className="profile-avatar"><span>PG</span></div>

              <h2>Pratik Gaikwad</h2>

              <p className="profile-role">
                Creative Professional
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
                <strong>6</strong>
              </div>
            </div>

            <div className="profile-links">
              <button onClick={onProfileClick}>👤 View My Profile</button>
              <button>🎨 My Portfolio</button>
              <button>📅 My Events</button>
              <button>🔖 Saved Items</button>
            </div>

          </section>

        </aside>


        {/* ---------- CENTRE FEED ---------- */}
        <section className="dashboard-feed">

          {/* Post Composer */}
          <section className="create-post-card">

            <div className="create-post-top">
              <div className="small-avatar"><span>PG</span></div>

              <input type="text" className="start-post-button" placeholder="Share your creative work or update..."
                value={postCaption} onChange={(e) => setPostCaption(e.target.value)}/>
            </div>
            <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect}/>
            {selectedImage && (
                <div className="selected-image-preview">

                    <img
                    src={selectedImage}
                    alt="Selected post preview"
                    />

                    <button
                    type="button"
                    className="remove-selected-image"
                    onClick={() => setSelectedImage(null)}
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
                    onClick={() => imageInputRef.current?.click()}
                    >
                    <span className="add-post-icon">+</span>

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
                        onClick={() => imageInputRef.current?.click()}
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
                
    {userPosts.map((post) => (
        <article
            className="feed-post"
            key={post.id}
        >

            <div className="post-header">

            <div className="post-avatar">
                <span>PG</span>
            </div>

            <div className="post-author">
                <strong>Pratik Gaikwad</strong>
                <span>Creative Professional • Adelaide</span>
                <small>Just now</small>
            </div>

            <button
                type="button"
                className="post-more"
            >
                •••
            </button>

            </div>

            <div className="post-content">

            {post.caption && (
                <p>{post.caption}</p>
            )}

            <img
                src={post.image}
                alt="Creative post"
                className="published-post-image"
            />

            </div>

            <div className="post-actions post-actions-two">
                <button
                    type="button"
                    className={likedPosts.includes(post.id) ? 'liked' : ''}
                    onClick={() => handleLike(post.id)}
                >
                    {likedPosts.includes(post.id) ? '♥ Liked' : '♡ Like'}
                </button>

                <button
                    type="button"
                    onClick={() =>
                    setOpenCommentPost(
                        openCommentPost === post.id ? null : post.id
                    )
                    }
                >
                    💬 Comment
                    {postComments[String(post.id)]?.length
                    ? ` (${postComments[String(post.id)].length})`
                    : ''}
                </button>

            </div>
            {openCommentPost === post.id && (
                <div className="comment-section">

                    {postComments[String(post.id)]?.map((comment, index) => (
                    <div
                        className="comment-item"
                        key={index}
                    >
                        <div className="comment-avatar">PG</div>

                        <div className="comment-content">
                        <strong>Pratik Gaikwad</strong>
                        <p>{comment}</p>
                        </div>
                    </div>
                    ))}

                    <div className="comment-input-row">

                    <div className="comment-avatar">PG</div>

                    <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleAddComment(post.id)
                        }
                        }}
                    />

                    <button
                        type="button"
                        onClick={() => handleAddComment(post.id)}
                    >
                        Post
                    </button>

                    </div>

                </div>
                )}

        </article>
        ))}

          {/* Example Feed Post */}
          <article className="feed-post">

            <div className="post-header">
              <div className="post-avatar"><span>OM</span></div>

              <div className="post-author">
                <strong>Oliver Miller</strong>
                <span>Photographer • Adelaide</span>
                <small>2 hours ago</small>
              </div>

              <button className="post-more">•••</button>
            </div>

            <div className="post-content">
              <p>
                Exploring Adelaide through my lens. Every street,
                colour and creative space has its own story to tell.
              </p>

                <div className="post-media-placeholder">
                    <div className="portfolio-preview-content">
                        <span className="portfolio-preview-icon">📷</span>
                        <strong>Creative Portfolio</strong>
                        <span>
                        Photography • Adelaide
                        </span>
                    </div>

                </div>
            </div>

            <div className="post-actions post-actions-two">
                <button
                    type="button"
                    className={likedPosts.includes('oliver-post') ? 'liked' : ''}
                    onClick={() => handleLike('oliver-post')}
                >
                    {likedPosts.includes('oliver-post') ? '♥ Liked' : '♡ Like'}
                </button>

                <button
                    type="button"
                    onClick={() =>
                    setOpenCommentPost(
                        openCommentPost === 'oliver-post'
                        ? null
                        : 'oliver-post'
                    )
                    }
                >
                    💬 Comment
                    {postComments['oliver-post']?.length
                    ? ` (${postComments['oliver-post'].length})`
                    : ''}
                </button>
            </div>
            {openCommentPost === 'oliver-post' && (
                <div className="comment-section">

                    {postComments['oliver-post']?.map((comment, index) => (
                    <div
                        className="comment-item"
                        key={index}
                    >
                        <div className="comment-avatar">PG</div>

                        <div className="comment-content">
                        <strong>Pratik Gaikwad</strong>
                        <p>{comment}</p>
                        </div>
                    </div>
                    ))}

                    <div className="comment-input-row">

                    <div className="comment-avatar">PG</div>

                    <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleAddComment('oliver-post')
                        }
                        }}
                    />

                    <button
                        type="button"
                        onClick={() => handleAddComment('oliver-post')}
                    >
                        Post
                    </button>

                    </div>

                </div>
                )}
          </article>

        </section>


        {/* ---------- RIGHT DISCOVERY SECTION ---------- */}
        <aside className="dashboard-right">

          <section className="discovery-card">
            <div className="card-heading">
              <h3>Suggested Creatives</h3>
              <button>View All</button>
            </div>

            <div className="creative-person">
              <div className="small-avatar"><span>CS</span></div>

              <div>
                <strong>Charlie Smith</strong>
                <span>Painter</span>
              </div>

              <button
                type="button"
                className={`follow-button ${
                    creativesFollowed.includes(1) ? 'following' : ''
                }`}
                onClick={() => handleFollow(1)}
                >
                {creativesFollowed.includes(1) ? '✓ Following' : '+ Follow'}
                </button>
            </div>

            <div className="creative-person">
              <div className="small-avatar"><span>IW</span></div>

              <div>
                <strong>Isla Wilson</strong>
                <span>Musician</span>
              </div>

              <button
                type="button"
                className={`follow-button ${
                    creativesFollowed.includes(2) ? 'following' : ''
                }`}
                onClick={() => handleFollow(2)}
                >
                {creativesFollowed.includes(2) ? '✓ Following' : '+ Follow'}
                </button>
            </div>
          </section>


          <section className="discovery-card">
            <div className="card-heading">
              <h3>Collaboration Opportunities</h3>
              <button>View All</button>
            </div>

            <div className="discovery-item">
              <span>📷</span>

              <div>
                <strong>Music Video Production</strong>
                <p>Looking for a creative video editor.</p>
              </div>
            </div>

            <div className="discovery-item">
              <span>🎨</span>

              <div>
                <strong>Brand Campaign Design</strong>
                <p>Graphic designer required for a new campaign.</p>
              </div>
            </div>
          </section>


          <section className="discovery-card">
            <div className="card-heading">
              <h3>Upcoming Events</h3>
              <button>View All</button>
            </div>

            <div className="discovery-item">
              <span>📅</span>

              <div>
                <strong>Creative Networking Meetup</strong>
                <p>24 Sep • Adelaide • In-person</p>
              </div>
            </div>

            <div className="discovery-item">
              <span>💻</span>

              <div>
                <strong>Digital Art Workshop</strong>
                <p>10 Oct • Online</p>
              </div>
            </div>
          </section>

        </aside>

      </section>


      {/* ================= FOOTER ================= */}
      <footer className="dashboard-footer">

        <div className="footer-links">
          <button>About</button>
          <button>Privacy</button>
          <button>Safety</button>
          <button>Terms</button>
          <button>Help</button>
        </div>

        <p>
          © 2026 Professional Creative Collaboration Network
        </p>

      </footer>

    </main>
  )
}

export default Dashboard