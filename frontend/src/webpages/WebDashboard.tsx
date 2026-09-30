import './WebDashboard.css'
import logoWebsite from '../assets/logoWebsite.png'

function Dashboard() {
  return (
    <main className="dashboard-page">

      {/* ================= HEADER ================= */}
      <header className="dashboard-header">
        <div className="header-container">

          <div className="dashboard-brand">

        <div className="brand-logo">
            <img
            src={logoWebsite}
            alt="Professional Creative Collaboration Network"
            />
        </div>

        <div className="brand-text">
            <strong>Professional Creative Collaboration Network</strong>
            <span>Create • Connect • Collaborate</span>
        </div>

        </div>

          <div className="dashboard-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search creatives, collaborations and events"
            />
          </div>

          <nav className="dashboard-navigation">
            <button className="nav-item active">
              <span>🏠</span>
              <small>Home</small>
            </button>

            <button className="nav-item">
              <span>👤</span>
              <small>Profiles</small>
            </button>

            <button className="nav-item">
              <span>🤝</span>
              <small>Collaborations</small>
            </button>

            <button className="nav-item">
              <span>📅</span>
              <small>Events</small>
            </button>

            <button className="nav-item">
              <span>🔔</span>
              <small>Notifications</small>
            </button>

            <button className="nav-item">
              <span>⚙️</span>
              <small>Settings</small>
            </button>
          </nav>

        </div>
      </header>


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
              <button>👤 View My Profile</button>
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

              <button className="start-post-button">
                Share your creative work or update...
              </button>
            </div>

            <div className="create-post-options">
              <button>🖼️ Photo</button>
              <button>🎥 Video</button>
              <button>🔗 Link</button>
              <button>✏️ Write Post</button>
            </div>

          </section>


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

            <div className="post-actions">
              <button>♡ Like</button>
              <button>💬 Comment</button>
              <button>🔖 Save</button>
              <button>↗ Share</button>
            </div>

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

              <button className="follow-button">
                + Follow
              </button>
            </div>

            <div className="creative-person">
              <div className="small-avatar"><span>IW</span></div>

              <div>
                <strong>Isla Wilson</strong>
                <span>Musician</span>
              </div>

              <button className="follow-button">
                + Follow
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