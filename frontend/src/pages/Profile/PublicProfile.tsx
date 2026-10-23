import PostList from '../../shared/PostList/PostList'
import {
  useEffect,
  useState
} from 'react'

import './Profile.css'

import NavigationBar
  from '../../shared/NavigationBar/NavigationBar'

import {
  getCurrentUser
} from '../../service/authService'

import {
  getUserProfile,
  type ProfileResponse
} from '../../service/profileService'

import {
  getExperiences,
  type Experience
} from '../../service/experienceService'

import {
  getFollowersCount,
  getFollowingCount,
  getFollowRelationship,
  followUser,
  unfollowUser
} from '../../service/followService'


type PublicProfileProps = {

  userId: number

  onHomeClick: () => void

  onProfileClick: () => void

  onEventsClick: () => void
  onCollaborationClick: () => void

  onBackClick: () => void
}


function PublicProfile({

  userId,

  onHomeClick,

  onProfileClick,

  onEventsClick,
  onCollaborationClick,

  onBackClick

}: PublicProfileProps) {


  // ============================================
  // PROFILE
  // ============================================

  const [
    profile,
    setProfile
  ] = useState<ProfileResponse | null>(
    null
  )


  // Show initials if the profile photo is absent or cannot load.
  const [profileImageFailed, setProfileImageFailed] = useState(false)

  useEffect(() => {
    setProfileImageFailed(false)
  }, [userId])

  // ============================================
  // SKILLS
  // ============================================

  const [
    skills,
    setSkills
  ] = useState<string[]>([])


  // ============================================
  // EXPERIENCE
  // ============================================

  const [
    experiences,
    setExperiences
  ] = useState<Experience[]>([])


  // ============================================
  // FOLLOW COUNTS
  // ============================================

  const [
    followersCount,
    setFollowersCount
  ] = useState(0)


  const [
    followingCount,
    setFollowingCount
  ] = useState(0)


  // ============================================
  // FOLLOW STATE
  // ============================================

  const [
    isFollowing,
    setIsFollowing
  ] = useState(false)


  const [followsMe, setFollowsMe] = useState(false)

  const [
    isOwnProfile,
    setIsOwnProfile
  ] = useState(false)


  const [
    isFollowLoading,
    setIsFollowLoading
  ] = useState(false)


  // ============================================
  // UI
  // ============================================

  const [
    activeTab,
    setActiveTab
  ] = useState<
    'posts' |
    'experience' |
    'achievements'
  >('posts')


  const [
    isLoading,
    setIsLoading
  ] = useState(true)


  const [
    message,
    setMessage
  ] = useState('')


  // ============================================
  // LOAD PUBLIC PROFILE
  // ============================================

  useEffect(() => {

    let cancelled =
      false


    const loadPublicProfile =
      async () => {

        try {

          setIsLoading(
            true
          )


          setMessage(
            ''
          )


          setFollowersCount(
            0
          )


          setFollowingCount(
            0
          )


          setIsFollowing(
            false
          )
          setFollowsMe(false)


          // ====================================
          // CURRENT LOGGED-IN USER
          // ====================================

          const loggedInUser =
            await getCurrentUser()


          if (cancelled) {

            return
          }


          const ownProfile =
            loggedInUser.userId
            ===
            userId


          setIsOwnProfile(
            ownProfile
          )


          // ====================================
          // PROFILE
          //
          // Main profile loads independently.
          // Follow count failure will not break it.
          // ====================================

          const profileData =
            await getUserProfile(
              userId
            )


          if (cancelled) {

            return
          }


          setProfile(
            profileData
          )


          // ====================================
          // SKILLS
          // ====================================

          const loadedSkills =
            profileData.skills
              ? profileData.skills
                  .split(',')
                  .map(
                    skill =>
                      skill.trim()
                  )
                  .filter(Boolean)
              : []


          setSkills(
            loadedSkills
          )


          // ====================================
          // EXPERIENCE
          //
          // Failure does not stop profile.
          // ====================================

          try {

            const experienceData =
              await getExperiences(
                userId
              )


            if (!cancelled) {

              setExperiences(
                experienceData
              )
            }


          } catch (error) {

            console.warn(
              'Experience could not be loaded:',
              error
            )


            if (!cancelled) {

              setExperiences(
                []
              )
            }
          }


          // ====================================
          // FOLLOW COUNTS
          //
          // If user has none:
          //
          // Followers = 0
          // Following = 0
          //
          // No profile error.
          // ====================================

          const [
            followers,
            following
          ] =
            await Promise.all([

              getFollowersCount(
                userId
              ),

              getFollowingCount(
                userId
              )

            ])


          if (cancelled) {

            return
          }


          setFollowersCount(
            followers
          )


          setFollowingCount(
            following
          )


          // ====================================
          // FOLLOW STATUS
          //
          // Only check when looking at
          // another person's profile.
          // ====================================

          if (!ownProfile) {

            const followStatus =
              await getFollowRelationship(
                userId
              )


            if (!cancelled) {

              setIsFollowing(
                followStatus.iFollow
              )
              setFollowsMe(followStatus.followsMe)
            }
          }


        } catch (error) {

          console.error(
            'Public profile load error:',
            error
          )


          if (!cancelled) {

            setMessage(
              error instanceof Error
                ? error.message
                : 'Unable to load profile.'
            )
          }


        } finally {

          if (!cancelled) {

            setIsLoading(
              false
            )
          }
        }
      }


    loadPublicProfile()


    return () => {

      cancelled =
        true
    }

  }, [userId])


  // ============================================
  // FOLLOW / UNFOLLOW
  // ============================================

  const handleFollowToggle =
    async () => {

      if (
        isOwnProfile
        ||
        isFollowLoading
      ) {

        return
      }


      try {

        setIsFollowLoading(
          true
        )


        setMessage(
          ''
        )


        // ====================================
        // UNFOLLOW
        // ====================================

        if (isFollowing) {

          await unfollowUser(
            userId
          )


          setIsFollowing(
            false
          )


        } else {

          // ==================================
          // FOLLOW
          // ==================================

          await followUser(
            userId
          )


          setIsFollowing(
            true
          )
        }


        // ====================================
        // RELOAD REAL VALUES FROM BACKEND
        //
        // This makes UI match MySQL.
        // ====================================

        const [
          updatedFollowers,
          updatedFollowing
        ] =
          await Promise.all([

            getFollowersCount(
              userId
            ),

            getFollowingCount(
              userId
            )

          ])


        setFollowersCount(
          updatedFollowers
        )


        setFollowingCount(
          updatedFollowing
        )


      } catch (error) {

        console.error(
          'Follow toggle error:',
          error
        )


        setMessage(
          error instanceof Error
            ? error.message
            : 'Unable to update follow status.'
        )


      } finally {

        setIsFollowLoading(
          false
        )
      }
    }


  // ============================================
  // INITIALS
  // ============================================

  const getInitials = () => {
    // Prefer the person's full name when the profile API provides it.
    // Otherwise split usernames such as aarav_sharma into AS.
    const fullName = profile && 'fullName' in profile &&
      typeof profile.fullName === 'string'
        ? profile.fullName.trim()
        : ''
    const name = fullName || profile?.username || ''
    const words = name.split(/[\s_.-]+/).filter(Boolean)

    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase()
    }

    return words.length === 1 ? words[0].slice(0, 2).toUpperCase() : 'U'
  }


  // ============================================
  // DATE
  // ============================================

  const formatDate = (
    value: string | null
  ) => {

    if (!value) {

      return ''
    }


    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString(
      'en-AU',
      {
        month:
          'short',

        year:
          'numeric'
      }
    )
  }


  // ============================================
  // LOADING
  // ============================================

  if (isLoading) {

    return (

      <div className="profile-screen">


        <NavigationBar

          activePage="profile"

          onHomeClick={
            onHomeClick
          }

          onProfileClick={
            onProfileClick
          }

          onCollaborationClick={onCollaborationClick}
          onEventsClick={
            onEventsClick
          }

        />


        <main className="profile-page">


          <div className="profile-content">


            <section className="profile-section-card">

              Loading profile...

            </section>


          </div>


        </main>


      </div>
    )
  }


  // ============================================
  // PROFILE NOT FOUND
  // ============================================

  if (!profile) {

    return (

      <div className="profile-screen">


        <NavigationBar

          activePage="profile"

          onHomeClick={
            onHomeClick
          }

          onProfileClick={
            onProfileClick
          }

          onCollaborationClick={onCollaborationClick}
          onEventsClick={
            onEventsClick
          }

        />


        <main className="profile-page">


          <div className="profile-content">


            <button

              type="button"

              className="back-dashboard-button"

              onClick={
                onBackClick
              }

            >

              ← Back

            </button>


            <section className="profile-section-card">

              {
                message
                ||
                'Profile not found.'
              }

            </section>


          </div>


        </main>


      </div>
    )
  }


  return (

    <div className="profile-screen">


      {/* ====================================== */}
      {/* NAVIGATION */}
      {/* ====================================== */}

      <NavigationBar

        activePage="profile"

        onHomeClick={
          onHomeClick
        }

        onProfileClick={
          onProfileClick
        }

        onEventsClick={
          onEventsClick
        }
          onCollaborationClick={onCollaborationClick}

      />


      <main className="profile-page">


        <div className="profile-content">


          {/* ================================== */}
          {/* BACK */}
          {/* ================================== */}

          <div className="profile-navigation">


            <button

              type="button"

              className="back-dashboard-button"

              onClick={
                onBackClick
              }

            >


              <span className="back-arrow">

                ←

              </span>


              Back to Dashboard


            </button>


            <div className="profile-page-label">


              <span className="profile-page-dot" />


              Creative Profile


            </div>


          </div>


          {/* ================================== */}
          {/* MESSAGE */}
          {/* ================================== */}

          {
            message
            &&
            (

              <section className="profile-section-card">

                {message}

              </section>

            )
          }


          {/* ================================== */}
          {/* PROFILE HEADER */}
          {/* ================================== */}

          <section className="profile-card">


            <div className="profile-banner">


              <div className="banner-label">

                CREATIVE

              </div>


            </div>


            <div className="profile-main-info">


              {/* ================================= */}
              {/* PROFILE IMAGE */}
              {/* ================================= */}

              {profile.profileImageUrl && !profileImageFailed ? (
                <img
                  src={profile.profileImageUrl}
                  alt={`${profile.username}'s profile`}
                  className="profile-avatar"
                  onError={() => setProfileImageFailed(true)}
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="profile-avatar public-profile-initials"
                  aria-label={`${profile.username} avatar`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    fontSize: 'clamp(24px, 3vw, 42px)',
                    fontWeight: 700,
                    lineHeight: 1,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {getInitials()}
                </div>
              )}


              <div className="profile-heading">


                <div className="profile-name-row">


                  {/* ================================= */}
                  {/* USERNAME */}
                  {/* ================================= */}

                  <div>


                    <div className="profile-name-line">


                      <h1>

                        @{profile.username}

                      </h1>


                      <span className="verified-badge">

                        ✓

                      </span>


                    </div>


                  </div>


                  {/* ================================= */}
                  {/* FOLLOW BUTTON */}
                  {/* ================================= */}

                  {
                    !isOwnProfile
                    &&
                    (

                      <button

                        type="button"

                        className="edit-profile-button"

                        onClick={
                          handleFollowToggle
                        }

                        disabled={
                          isFollowLoading
                        }

                      >

                        {
                          isFollowLoading
                            ? 'Please wait...'
                            : isFollowing
                              ? 'Following'
                              : 'Follow'
                        }

                      </button>

                    )
                  }


                  {!isOwnProfile && followsMe && (
                    <span className="follow-relationship-badge">Follows you</span>
                  )}

                  {/* ================================= */}
                  {/* OWN PROFILE */}
                  {/* ================================= */}

                  {
                    isOwnProfile
                    &&
                    (

                      <button

                        type="button"

                        className="edit-profile-button"

                        onClick={
                          onProfileClick
                        }

                      >

                        My Profile

                      </button>

                    )
                  }


                </div>


                {/* ================================= */}
                {/* BIO */}
                {/* ================================= */}

                <p className="profile-bio">

                  {
                    profile.bio
                    ||
                    'No bio added yet.'
                  }

                </p>


                {/* ================================= */}
                {/* COUNTS */}
                {/* DISPLAY ONLY - NOT CLICKABLE */}
                {/* ================================= */}

                <div className="profile-stats instagram-follow-stats">


                  <div className="profile-stat instagram-follow-stat">

                    <strong>

                      {followersCount}

                    </strong>

                    <span>

                      Followers

                    </span>

                  </div>


                  <div className="profile-stat instagram-follow-stat">

                    <strong>

                      {followingCount}

                    </strong>

                    <span>

                      Following

                    </span>

                  </div>


                </div>


              </div>


            </div>


          </section>


          {/* ================================== */}
          {/* SKILLS */}
          {/* ================================== */}

          <section className="profile-section-card">


            <div className="profile-section-heading">


              <div>


                <p className="section-eyebrow">

                  PROFESSIONAL SKILLS

                </p>


                <h2>

                  Skills

                </h2>


              </div>


            </div>


            <div className="skills-list">


              {
                skills.length === 0
                  ? (

                      <p>

                        No skills added yet.

                      </p>

                    )
                  : skills.map(
                      skill => (

                        <div

                          className="skill-chip"

                          key={
                            skill
                          }

                        >

                          {skill}

                        </div>

                      )
                    )
              }


            </div>


          </section>


          {/* ================================== */}
          {/* POSTS / ACHIEVEMENTS */}
          {/* ================================== */}

          <section
            className="
              profile-section-card
              profile-work-section
            "
          >


            <div className="profile-tabs">


              <button

                type="button"

                className={
                  activeTab === 'posts'
                    ? 'profile-tab active'
                    : 'profile-tab'
                }

                onClick={
                  () =>
                    setActiveTab(
                      'posts'
                    )
                }

              >

                Posts

              </button>


              <button
                type="button"
                className={activeTab === 'experience' ? 'profile-tab active' : 'profile-tab'}
                onClick={() => setActiveTab('experience')}
              >
                Experience
              </button>

              <button

                type="button"

                className={
                  activeTab === 'achievements'
                    ? 'profile-tab active'
                    : 'profile-tab'
                }

                onClick={
                  () =>
                    setActiveTab(
                      'achievements'
                    )
                }

              >

                Achievements

              </button>


            </div>


            {/* ================================= */}
            {/* POSTS */}
            {/* ================================= */}

            {activeTab === 'experience' && (
              <>
          {/* ================================== */}
          {/* EXPERIENCE */}
          {/* ================================== */}

          <section className="profile-section-card">


            <div className="profile-section-heading">


              <div>


                <p className="section-eyebrow">

                  CAREER HISTORY

                </p>


                <h2>

                  Experience

                </h2>


              </div>


            </div>


            <div className="achievements-list">


              {
                experiences.length === 0
                  ? (

                      <p>

                        No experience added yet.

                      </p>

                    )
                  : experiences.map(
                      experience => (

                        <article

                          className="achievement-card"

                          key={
                            experience.id
                          }

                        >


                          <div className="achievement-icon">

                            💼

                          </div>


                          <div className="achievement-info">


                            <div className="achievement-title-row">


                              <h3>

                                {
                                  experience.jobTitle
                                }

                              </h3>


                              <span>

                                {
                                  formatDate(
                                    experience.startDate
                                  )
                                }

                                {' – '}

                                {
                                  experience.currentRole
                                    ? 'Present'
                                    : formatDate(
                                        experience.endDate
                                      )
                                }

                              </span>


                            </div>


                            <p>

                              <strong>

                                {
                                  experience.organisation
                                }

                              </strong>

                            </p>


                            {
                              experience.description
                              &&
                              (

                                <p>

                                  {
                                    experience.description
                                  }

                                </p>

                              )
                            }


                          </div>


                        </article>

                      )
                    )
              }


            </div>


          </section>


              </>
            )}

            {activeTab === 'posts' && (
              <PostList userId={userId} own={isOwnProfile} />
            )}

            {/* ================================= */}
            {/* ACHIEVEMENTS */}
            {/* ================================= */}

            {
              activeTab === 'achievements'
              &&
              (

                <div className="achievements-list">


                  {
                    profile.achievements
                      ? (

                          <article className="achievement-card">


                            <div className="achievement-icon">

                              ★

                            </div>


                            <div className="achievement-info">


                              <h3>

                                Achievements

                              </h3>


                              <p>

                                {
                                  profile.achievements
                                }

                              </p>


                            </div>


                          </article>

                        )
                      : (

                          <p>

                            No achievements added yet.

                          </p>

                        )
                  }


                </div>

              )
            }


          </section>


        </div>


      </main>


    </div>
  )
}


export default PublicProfile