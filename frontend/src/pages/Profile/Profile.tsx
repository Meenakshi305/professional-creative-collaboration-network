import { useState } from "react";
import "./Profile.css";

type ProfileTab = "portfolio" | "posts" | "achievements";

function Profile() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("portfolio");
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(248);
  const [followersOnly, setFollowersOnly] = useState(true);

  const handleFollow = () => {
    if (following) {
      setFollowers(followers - 1);
    } else {
      setFollowers(followers + 1);
    }

    setFollowing(!following);
  };

  return (
    <div className="profile-page">

      <div className="profile-banner"></div>

      <div className="profile-header">
        <div className="profile-avatar"></div>

        <div className="profile-info">
          <div className="profile-name-placeholder"></div>
          <p>{followers} followers</p>
        </div>

        <button
          className={`follow-button ${following ? "following" : ""}`}
          onClick={handleFollow}
        >
          {following ? "Following" : "Follow"}
        </button>
      </div>

      <div className="skills">
        <span>Illustration</span>
        <span>Branding</span>
        <span>Photography</span>
      </div>

      <div className="profile-tabs">
        <button
          className={activeTab === "portfolio" ? "active" : ""}
          onClick={() => setActiveTab("portfolio")}
        >
          Portfolio
        </button>

        <button
          className={activeTab === "posts" ? "active" : ""}
          onClick={() => setActiveTab("posts")}
        >
          Posts
        </button>

        <button
          className={activeTab === "achievements" ? "active" : ""}
          onClick={() => setActiveTab("achievements")}
        >
          Achievements
        </button>
      </div>

      {activeTab === "portfolio" && (
        <div className="portfolio-grid">
          <div className="portfolio-item">work 01</div>
          <div className="portfolio-item">work 02</div>
          <div className="portfolio-item">work 03</div>
          <div className="portfolio-item">work 04</div>
          <div className="portfolio-item">work 05</div>
          <div className="portfolio-item">work 06</div>
        </div>
      )}

      {activeTab === "posts" && (
        <div className="posts-section">
          <div className="post-card">
            <div className="post-line long"></div>
            <div className="post-line short"></div>
          </div>

          <div className="post-card">
            <div className="post-line medium"></div>
          </div>
        </div>
      )}

      {activeTab === "achievements" && (
        <div className="achievements-section">
          <div className="achievement-row">
            <span>Featured collaborator — Spring Showcase</span>
            <span>2025</span>
          </div>

          <div className="achievement-row">
            <span>42 completed collaborations</span>
            <span>all time</span>
          </div>

          <div className="achievement-row">
            <span>Top rated: Illustration</span>
            <span>4.9 / 5</span>
          </div>
        </div>
      )}

      <div className="visibility-section">
        <span>Profile visibility</span>

        <button
          className={`visibility-switch ${followersOnly ? "on" : ""}`}
          onClick={() => setFollowersOnly(!followersOnly)}
          aria-label="Toggle profile visibility"
        >
          <span></span>
        </button>

        <span className="visibility-status">
          {followersOnly ? "followers only" : "public"}
        </span>
      </div>

    </div>
  );
}

export default Profile;