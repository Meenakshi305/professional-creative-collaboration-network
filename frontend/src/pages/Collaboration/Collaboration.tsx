import './Collaboration.css'
import NavigationBar from '../../shared/NavigationBar/NavigationBar'

type CollaborationProps = {
  onHomeClick: () => void
  onProfileClick: () => void
  onCollaborationClick: () => void
  onEventsClick: () => void
}

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
        <section className="collaboration-intro">
          <p className="collaboration-eyebrow">
            CREATIVE COLLABORATION
          </p>

          <h1>Collaboration Opportunities</h1>

          <p>
            Discover creative projects, connect with professionals and
            find opportunities that match your skills.
          </p>
        </section>
      </main>
    </div>
  )
}

export default Collaboration