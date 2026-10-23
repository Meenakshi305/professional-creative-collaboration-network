import {
  useEffect,
  useState
} from 'react'

import './Admin.css'

import {
  getCurrentUser,
  type CurrentUserResponse
} from '../../service/authService'


type AdminProps = {

  onHomeClick: () => void

  onProfileClick: () => void
}


function Admin({

  onHomeClick,

  onProfileClick

}: AdminProps) {


  const [
    currentUser,
    setCurrentUser
  ] = useState<
    CurrentUserResponse |
    null
  >(null)


  const [
    isLoading,
    setIsLoading
  ] = useState(true)


  const [
    error,
    setError
  ] = useState('')


  // ============================================
  // LOAD ADMIN USER
  // ============================================

  useEffect(() => {

    let cancelled =
      false


    const loadAdmin =
      async () => {

        try {

          setIsLoading(
            true
          )


          setError(
            ''
          )


          const user =
            await getCurrentUser()


          if (
            cancelled
          ) {

            return
          }


          if (
            user.role !== 'ADMIN'
          ) {

            setError(
              'You do not have permission to access this page.'
            )

            return
          }


          setCurrentUser(
            user
          )


        } catch (error) {

          console.error(
            'Admin page error:',
            error
          )


          if (
            !cancelled
          ) {

            setError(
              error instanceof Error
                ? error.message
                : 'Unable to load admin dashboard.'
            )
          }


        } finally {

          if (
            !cancelled
          ) {

            setIsLoading(
              false
            )
          }
        }
      }


    void loadAdmin()


    return () => {

      cancelled =
        true
    }

  }, [])


  // ============================================
  // LOADING
  // ============================================

  if (
    isLoading
  ) {

    return (

      <main className="admin-page">


        <section className="admin-access-card">


          <h2>

            Loading Admin Dashboard...

          </h2>


        </section>


      </main>
    )
  }


  // ============================================
  // ACCESS DENIED
  // ============================================

  if (
    error
    ||
    !currentUser
  ) {

    return (

      <main className="admin-page">


        <section className="admin-access-card">


          <div className="admin-access-icon">

            🔒

          </div>


          <h2>

            Access Denied

          </h2>


          <p>

            {
              error
              ||
              'Administrator access is required.'
            }

          </p>


          <button

            type="button"

            className="admin-primary-button"

            onClick={
              onHomeClick
            }

          >

            Back to Dashboard

          </button>


        </section>


      </main>
    )
  }


  return (

    <main className="admin-page">


      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}

      <header className="admin-header">


        <div>


          <p className="admin-eyebrow">

            PLATFORM ADMINISTRATION

          </p>


          <h1>

            Admin Dashboard

          </h1>


          <p className="admin-welcome">

            Welcome, {
              currentUser.fullName
            }

          </p>


        </div>


        <div className="admin-header-actions">


          <button

            type="button"

            className="admin-secondary-button"

            onClick={
              onHomeClick
            }

          >

            🏠 Dashboard

          </button>


          <button

            type="button"

            className="admin-secondary-button"

            onClick={
              onProfileClick
            }

          >

            👤 My Profile

          </button>


        </div>


      </header>


      {/* ====================================== */}
      {/* ADMIN INFO */}
      {/* ====================================== */}

      <section className="admin-user-strip">


        <div>


          <span className="admin-user-label">

            Logged in as

          </span>


          <strong>

            @{currentUser.username}

          </strong>


        </div>


        <div>


          <span className="admin-user-label">

            Email

          </span>


          <strong>

            {currentUser.email}

          </strong>


        </div>


        <div>


          <span className="admin-user-label">

            Role

          </span>


          <strong className="admin-role-badge">

            {currentUser.role}

          </strong>


        </div>


      </section>


      {/* ====================================== */}
      {/* SUMMARY CARDS */}
      {/* ====================================== */}

      <section className="admin-summary-grid">


        <article className="admin-stat-card">


          <div className="admin-stat-icon">

            👥

          </div>


          <div>


            <span>

              Registered Users

            </span>


            <strong>

              --

            </strong>


            <p>

              Platform accounts

            </p>


          </div>


        </article>


        <article className="admin-stat-card">


          <div className="admin-stat-icon">

            🚩

          </div>


          <div>


            <span>

              Reports

            </span>


            <strong>

              --

            </strong>


            <p>

              Pending moderation

            </p>


          </div>


        </article>


        <article className="admin-stat-card">


          <div className="admin-stat-icon">

            📝

          </div>


          <div>


            <span>

              Posts

            </span>


            <strong>

              --

            </strong>


            <p>

              Published content

            </p>


          </div>


        </article>


        <article className="admin-stat-card">


          <div className="admin-stat-icon">

            📅

          </div>


          <div>


            <span>

              Events

            </span>


            <strong>

              --

            </strong>


            <p>

              Platform events

            </p>


          </div>


        </article>


      </section>


      {/* ====================================== */}
      {/* MANAGEMENT TOOLS */}
      {/* ====================================== */}

      <section className="admin-section">


        <div className="admin-section-heading">


          <div>


            <p className="admin-eyebrow">

              MANAGEMENT

            </p>


            <h2>

              Admin Tools

            </h2>


          </div>


        </div>


        <div className="admin-tools-grid">


          <button

            type="button"

            className="admin-tool-card"

          >


            <span className="admin-tool-icon">

              👥

            </span>


            <div>


              <strong>

                Manage Users

              </strong>


              <p>

                View user accounts and manage access.

              </p>


            </div>


            <span className="admin-tool-arrow">

              ›

            </span>


          </button>


          <button

            type="button"

            className="admin-tool-card"

          >


            <span className="admin-tool-icon">

              🚩

            </span>


            <div>


              <strong>

                Review Reports

              </strong>


              <p>

                Review reported users and content.

              </p>


            </div>


            <span className="admin-tool-arrow">

              ›

            </span>


          </button>


          <button

            type="button"

            className="admin-tool-card"

          >


            <span className="admin-tool-icon">

              📝

            </span>


            <div>


              <strong>

                Review Posts

              </strong>


              <p>

                Monitor posts published on the platform.

              </p>


            </div>


            <span className="admin-tool-arrow">

              ›

            </span>


          </button>


          <button

            type="button"

            className="admin-tool-card"

          >


            <span className="admin-tool-icon">

              📅

            </span>


            <div>


              <strong>

                Review Events

              </strong>


              <p>

                Monitor events created by users.

              </p>


            </div>


            <span className="admin-tool-arrow">

              ›

            </span>


          </button>


          <button

            type="button"

            className="admin-tool-card"

          >


            <span className="admin-tool-icon">

              🤝

            </span>


            <div>


              <strong>

                Collaborations

              </strong>


              <p>

                Review collaboration opportunities.

              </p>


            </div>


            <span className="admin-tool-arrow">

              ›

            </span>


          </button>


          <button

            type="button"

            className="admin-tool-card"

          >


            <span className="admin-tool-icon">

              🛡️

            </span>


            <div>


              <strong>

                Moderation

              </strong>


              <p>

                Manage platform safety and moderation.

              </p>


            </div>


            <span className="admin-tool-arrow">

              ›

            </span>


          </button>


        </div>


      </section>


      {/* ====================================== */}
      {/* RECENT ACTIVITY */}
      {/* ====================================== */}

      <section className="admin-section">


        <div className="admin-section-heading">


          <div>


            <p className="admin-eyebrow">

              PLATFORM

            </p>


            <h2>

              Recent Activity

            </h2>


          </div>


        </div>


        <div className="admin-empty-state">


          <span>

            📊

          </span>


          <strong>

            Admin activity will appear here

          </strong>


          <p>

            User reports, moderation actions and platform activity
            can be connected to the backend next.

          </p>


        </div>


      </section>


    </main>
  )
}


export default Admin