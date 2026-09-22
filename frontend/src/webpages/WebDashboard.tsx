import { useState } from 'react'
import './WebDashboard.css'

type PostCreated = {
  id: number
  text: string
  image?: string
  video?: string
}

function Dashboard(){
    const [sideOpen, setSideOpen] = useState(false)
    const [likePosts, setLikePosts] = useState<number[]>([])
    const [postText, setPostText] = useState('')
    const [postMessage, setPostMessage] = useState('')
    const [postCreated, setPostCreated] = useState<PostCreated[]>([])
    const [selectImage, setSelectImage] = useState<string | null>(null)
    const [selectVideo, setSelectVideo] = useState<string | null>(null)

    const handleImgSelect = (event: React.ChangeEvent<HTMLInputElement>) => { 
        const file = event.target.files?.[0]
        if (!file) {
            return
        }
        const imageUrl = URL.createObjectURL(file)
        setSelectImage(imageUrl)
        event.target.value = ''
    }
    const handleVdoSelect = ( event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) {
            return
        }
        const videoUrl = URL.createObjectURL(file)
        setSelectVideo(videoUrl)
        event.target.value = ''
    }

    const handleLikes=(postId:number)=>{
        if(likePosts.includes(postId)){
            setLikePosts(likePosts.filter(id=>id !== postId))
        }
        else{
            setLikePosts([...likePosts,postId])
        }
    }

    const handleCreatePost = () => {
        if (postText.trim() === '' && !selectImage && !selectVideo) {
            setPostMessage('Please enter something before posting.')
            return
        }

        const newPost: PostCreated = {
            id: Date.now(),
            text: postText.trim(),
            image: selectImage ?? undefined,
            video: selectVideo ?? undefined
        }
        setPostCreated([newPost, ...postCreated])
        setPostText('')
        setSelectImage(null)
        setSelectVideo(null)
        setPostMessage('')
    }

    return(
        <main className='dashboard-page'>
            <div className='side-container' onMouseEnter={()=>setSideOpen(true)}
                onMouseLeave={()=>setSideOpen(false)}>
                <button className='menu-button' onClick={()=>setSideOpen(!sideOpen)}> ☰ </button>
                <aside className={`side ${sideOpen ? 'side-open' : ''}`}>
                <nav className='side-nav'>
                    <button>
                        <span>🏠</span>
                        {sideOpen&&<span>Dashboard</span>}
                    </button>
                    <button>
                        <span>👤</span>
                        {sideOpen&&<span>Profiles</span>}
                    </button>
                    <button>
                        <span>🤝</span>
                        {sideOpen&&<span>Collaborations</span>}
                    </button>
                    <button>
                        <span>🗓️</span>
                        {sideOpen&&<span>Events</span>}
                    </button>
                    <button>
                        <span>⚙️</span>
                        {sideOpen&&<span>Settings</span>}
                    </button>
                </nav>
                </aside>
            </div>
            <section className='dashboard-main'>
                <header className="dashboard-header">
                    <div className="dashboard-search">
                        <span>⌕</span>
                        <input
                        type="text"
                        placeholder="Search Creatives, Collaborations and Events"
                        />
                    </div>
                    <button className="notification-button">
                        🔔
                        <span className="notification-badge">3</span>
                    </button>
                </header>
                <section className='feed-layout'>
                    <div className='feed-main'>

                        {/* Creating Posts Section */}
                        <div className="creative-post-cards">
                            <div className="creative-post-top">
                                <div className="avatar">👤</div>
                                <textarea placeholder="Share your Creative Updates here..." value={postText}
                                    onChange={(e) => setPostText(e.target.value)}/>
                            </div>
                            {selectImage && ( 
                                    <div className="selected-image-preview"> 
                                        <img src={selectImage} alt="Preview of Post"/>
                                        <button type="button" className="remove-selected-image" onClick={() => setSelectImage(null)} title="Remove image">
                                            ✕
                                        </button>
                                    </div>
                                    )
                                }
                            {selectVideo && ( 
                                <div className="selected-video-preview">
                                    <video src={selectVideo} controls/>
                                    <button
                                    type="button"
                                    className="remove-selected-video"
                                    onClick={() => setSelectVideo(null)}
                                    title="Remove video"
                                    >
                                    ✕
                                    </button>
                                </div>
                            )}
                            {postMessage && (
                                <p className="post-message">
                                {postMessage}
                                </p>
                            )}
                            <div className="creative-post-actions">
                                <div className="creativepost-options">
                                <input id="postImageInput" type="file" accept="image/*" onChange={handleImgSelect} hidden/>
                                <input id="postVideoInput" type="file" accept="video/*" onChange={handleVdoSelect} hidden/>
                                <button type="button" title="Add image" onClick={() => document.getElementById('postImageInput')?.click()}>🖼️</button>
                                <button type="button" title="Add video" onClick={() => document.getElementById('postVideoInput')?.click()}>🎥</button>
                                {/* <button title="Add link">🔗</button> */}
                                </div>
                                <button className="creativepost-button" onClick={handleCreatePost}> POST </button>
                            </div>

                        </div>
                        {/* Newly Created Dummy Posts */}
                        {postCreated.map((post) => (
                        <article className="creativefeed-post" key={post.id} >
                            <div className="creativepost-header">
                            <div className="avatar">👤</div>
                            <div>
                                <h3>You</h3>
                                <p>Creative Professional • Just now</p>
                            </div>
                            <button className="moreinfo-button">
                                •••
                            </button>
                            </div>
                            <p className="creativepost-description">
                            {post.text}
                            </p>
                            {post.image && (
                                <div className="created-post-image">
                                    <img
                                    src={post.image}
                                    alt="Creative post"
                                    />
                                </div>
                                )
                            }
                            {post.video && (
                                <div className="created-post-video">
                                    <video src={post.video} controls />
                                </div>
                            )}
                            <div className="creativepost-footer">
                                <div className="creativepost-reactions">
                                    <button>
                                    ♡ <span>0 likes</span>
                                    </button>
                                    <button>
                                    💬 <span>0 comments</span>
                                    </button>
                                </div>
                                <div className="creativepost-extra-actions">
                                    <button title="Save"> 📁 </button>
                                    <button title="Share"> ⌯⌲ </button>
                                </div>
                            </div>
                        </article>
                        ))}
                        {/* Dummy Post 1 */}
                        <article className="creativefeed-post">
                            <div className="creativepost-header">
                                <div className="avatar">👤</div>
                                <div>
                                    <h3>Oliver Miller</h3>
                                    <p>Photographer • 2 hours ago</p>
                                </div>
                                <button className="moreinfo-button">•••</button>
                            </div>
                            <p className="creativepost-description"> Exploring the Adelaide streets through my lens. Every corner has its own story to show.</p>
                            <div className="portfolio-placeholder">
                                <span>Portfolio Image</span>
                            </div>
                            <div className="creativepost-footer">
                                <div className="creativepost-reactions">
                                    <button className={likePosts.includes(1) ? 'like-button liked' : 'like-button'}
                                        onClick={() => handleLikes(1)}>{likePosts.includes(1) ? '♥' : '♡'}
                                        <span>{9 + (likePosts.includes(1) ? 1 : 0)} likes</span>
                                    </button>
                                    <button>💬 <span>3 comments</span></button>
                                </div>
                                <div className="creativepost-extra-actions">
                                    <button title="Save">📂</button>
                                    <button title="Share">⌯⌲</button>
                                </div>
                            </div>
                        </article>
                            {/* DUMMY POST 2 */}
                            <article className="creativefeed-post">

                                <div className="creativepost-header">
                                    <div className="avatar">👤</div>
                                    <div>
                                    <h3>Amelia Green</h3>
                                    <p>Graphic Designer • Yesterday</p>
                                    </div>
                                    <button className="moreinfo-button">•••</button>
                                </div>

                                <p className="creativepost-description">
                                    Currently working on new brand identity-project. 
                                    Excited about the final stages and eagerly waiting for results!
                                </p>
                                
                                <div className="portfolio-placeholder">
                                    <span>Portfolio Image</span>
                                </div>

                                <div className="creativepost-footer">
                                    <div className="creativepost-reactions">
                                        <button 
                                            className={likePosts.includes(2) ? 'like-button liked' : 'like-button'}
                                            onClick={() => handleLikes(2)}>{likePosts.includes(2) ? '♥' : '♡'}
                                            <span>{16 + (likePosts.includes(2) ? 1 : 0)} likes</span>
                                        </button>
                                        <button>💬 <span>3 comments</span></button>
                                    </div>
                                    <div className="creativepost-extra-actions">
                                        <button title="Save">📂</button>
                                        <button title="Share">⌯⌲</button>
                                    </div>
                                </div>
                            </article>
                    </div>
                    {/* RIGHT SIDE */}
                    <aside className="feed-right">
                        <div className="dashboard-card">
                            <div className="rightcard-heading">
                                <h3>Suggested Creatives</h3>
                                <button>View All</button>
                            </div>
                            <div className="creative-professional">
                                <div className="avatar">👤</div>
                                <div className="creativeprof-info">
                                    <strong>Rhea Kapoor</strong>
                                    <span>Illustrator</span>
                                </div>
                                <button className="follow-buttons">Follow</button>
                            </div>
                            <div className="creative-professional">
                                <div className="avatar">👤</div>
                                <div className="creativeprof-info">
                                    <strong>Karan Malhotra</strong>
                                    <span>Filmmaker</span>
                                </div>
                                <button className="follow-buttons">Follow</button>
                            </div>
                        </div>
                        <div className="dashboard-card">
                            <div className="rightcard-heading">
                                <h3>Collaboration Opportunities</h3>
                                <button>View All</button>
                            </div>
                            <div className="minor-item">
                                <span className="minor-icon">📷</span>
                                <div>
                                    <strong>Music Video Production</strong>
                                    <p>Looking for a video editor for a creative project.</p>
                                </div>
                            </div>
                            <div className="minor-item">
                                <span className="minor-icon">🎨</span>
                                <div>
                                    <strong>Brand Campaign Design</strong>
                                    <p>Graphic designer needed for a new campaign.</p>
                                </div>
                            </div>
                        </div>
                        <div className="dashboard-card">
                            <div className="rightcard-heading">
                                <h3>Upcoming Events</h3>
                                <button>View All</button>
                            </div>
                            <div className="minor-item">
                                <span className="minor-icon">📅</span>
                                <div>
                                    <strong>Creative Networking Meetup</strong>
                                    <p>24 Sep • In-person</p>
                                </div>
                            </div>
                            <div className="minor-item">
                                <span className="minor-icon">💻</span>
                                <div>
                                    <strong>Digital Art Workshop</strong>
                                    <p>10 Oct • Online</p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </section>
            </section>
        </main>
    )
}
export default Dashboard