import './Collaboration.css'
import NavigationBar from '../../shared/NavigationBar/NavigationBar'

type CollaborationProps = {
  onHomeClick: () => void
  onProfileClick: () => void
  onCollaborationClick: () => void
  onEventsClick: () => void
}

type CollaborationOpportunity = {
  id: number
  title: string
  creator: string
  description: string
  roleRequired: string
  category: string
  location: string
  skills: string[]
  closingDate: string
  status: 'OPEN' | 'CLOSED'
}

const collaborationOpportunities: CollaborationOpportunity[] = [
  {
    id: 1,
    title: 'Brand Identity Designer for Creative Startup',
    creator: 'North Studio',
    description:
      'We are looking for a graphic designer to help develop a fresh visual identity for an emerging creative brand. The project includes logo exploration, colour direction and supporting brand assets.',
    roleRequired: 'Graphic Designer',
    category: 'Design',
    location: 'Adelaide, SA',
    skills: ['Branding', 'Illustrator', 'Graphic Design'],
    closingDate: '18 Oct 2026',
    status: 'OPEN'
  },
  {
    id: 2,
    title: 'Photographer Needed for Live Creative Event',
    creator: 'Frame Collective',
    description:
      'Seeking a photographer to capture a live creative networking event. The collaboration will involve event photography, candid professional portraits and delivery of edited digital images.',
    roleRequired: 'Event Photographer',
    category: 'Photography',
    location: 'Sydney, NSW',
    skills: ['Photography', 'Lightroom', 'Event Coverage'],
    closingDate: '22 Oct 2026',
    status: 'OPEN'
  },
  {
    id: 3,
    title: 'Composer for Independent Short Film',
    creator: 'Silverline Films',
    description:
      'Our production team is searching for a composer interested in creating an original score for an independent short film. We are looking for someone comfortable working closely with a director.',
    roleRequired: 'Music Composer',
    category: 'Music',
    location: 'Remote',
    skills: ['Composition', 'Film Scoring', 'Audio Production'],
    closingDate: '28 Oct 2026',
    status: 'OPEN'
  },
  {
    id: 4,
    title: 'Video Editor for Social Campaign',
    creator: 'Motion House',
    description:
      'Join a small creative team producing a digital campaign for social platforms. We need a video editor who can transform supplied footage into engaging short-form content.',
    roleRequired: 'Video Editor',
    category: 'Film & Video',
    location: 'Melbourne, VIC',
    skills: ['Premiere Pro', 'Video Editing', 'Storytelling'],
    closingDate: '31 Oct 2026',
    status: 'OPEN'
  },
  {
    id: 5,
    title: 'UI/UX Designer for Creative Portfolio Platform',
    creator: 'Pixel Forge',
    description:
      'Looking for a UI/UX designer to collaborate on interface concepts for a portfolio-focused digital product. You will work on user flows, wireframes and polished interface designs.',
    roleRequired: 'UI/UX Designer',
    category: 'Digital Design',
    location: 'Remote',
    skills: ['Figma', 'UI Design', 'UX Design'],
    closingDate: '4 Nov 2026',
    status: 'OPEN'
  },
  {
    id: 6,
    title: 'Illustrator for Editorial Art Project',
    creator: 'Canvas Journal',
    description:
      'We are seeking an illustrator to produce a small collection of original editorial illustrations for an upcoming digital publication focused on contemporary creative culture.',
    roleRequired: 'Illustrator',
    category: 'Illustration',
    location: 'Brisbane, QLD',
    skills: ['Illustration', 'Digital Art', 'Photoshop'],
    closingDate: '8 Nov 2026',
    status: 'OPEN'
  }
]

function Collaboration({
  onHomeClick,
  onProfileClick,
  onCollaborationClick,
  onEventsClick
}: CollaborationProps) {
  return (
    <div className="collaboration-screen">
      <NavigationBar
        activePage="collaborations"
        onHomeClick={onHomeClick}
        onProfileClick={onProfileClick}
        onCollaborationClick={onCollaborationClick}
        onEventsClick={onEventsClick}
      />

      <main className="collaboration-page">
        <section className="collaboration-hero">
          <div className="collaboration-hero-content">
            <p className="collaboration-eyebrow">
              CREATIVE COLLABORATION
            </p>

            <h1>Find Your Next Creative Collaboration</h1>

            <p className="collaboration-description">
              Discover opportunities posted by creative professionals,
              find projects that match your skills and connect with
              people looking to build something together.
            </p>
          </div>

          <button
            className="post-opportunity-button"
            type="button"
          >
            + Post an Opportunity
          </button>
        </section>

        <section className="opportunities-section">
          <div className="opportunities-heading">
            <div>
              <h2>Collaboration Opportunities</h2>
              <p>
                Explore currently available creative projects and roles.
              </p>
            </div>

            <span className="opportunity-count">
              {collaborationOpportunities.length} opportunities
            </span>
          </div>

          <div className="opportunities-grid">
            {collaborationOpportunities.map((opportunity) => (
              <article
                className="opportunity-card"
                key={opportunity.id}
              >
                <div className="opportunity-card-top">
                  <span className="opportunity-category">
                    {opportunity.category}
                  </span>

                  <span className="opportunity-status">
                    {opportunity.status}
                  </span>
                </div>

                <h3>{opportunity.title}</h3>

                <p className="opportunity-creator">
                  Posted by {opportunity.creator}
                </p>

                <p className="opportunity-description">
                  {opportunity.description}
                </p>

                <div className="opportunity-details">
                  <div className="opportunity-detail">
                    <span className="detail-label">
                      Role required
                    </span>
                    <strong>{opportunity.roleRequired}</strong>
                  </div>

                  <div className="opportunity-detail">
                    <span className="detail-label">
                      Location
                    </span>
                    <strong>{opportunity.location}</strong>
                  </div>
                </div>

                <div className="opportunity-skills">
                  <span className="detail-label">
                    Skills
                  </span>

                  <div className="skill-list">
                    {opportunity.skills.map((skill) => (
                      <span
                        className="skill-tag"
                        key={skill}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="opportunity-footer">
                  <div className="closing-date">
                    <span>Applications close</span>
                    <strong>{opportunity.closingDate}</strong>
                  </div>

                  <button
                    className="apply-button"
                    type="button"
                  >
                    Apply
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Collaboration