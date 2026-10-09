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
  getFollowStatus,
  followUser,
  unfollowUser
} from '../../service/followService'


type PublicProfileProps = {

  userId: number

  onHomeClick: () => void

  onProfileClick: () => void

  onEventsClick: () => void

  onBackClick: () => void
}


function PublicProfile({

  userId,

  onHomeClick,

  onProfileClick,

  onEventsClick,

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
              await getFollowStatus(
                userId
              )


            if (!cancelled) {

              setIsFollowing(
                followStatus
              )
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

    if (!profile?.username) {

      return 'U'
    }


    return profile.username
      .substring(
        0,
        2
      )
      .toUpperCase()
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


              <div className="banner-number">

                7

              </div>


              <div className="banner-label">

                CREATIVE

              </div>


            </div>


            <div className="profile-main-info">


              {/* ================================= */}
              {/* PROFILE IMAGE */}
              {/* ================================= */}

              {
                profile.profileImageUrl
                  ? (

                      <img

                        src={
                          profile.profileImageUrl
                        }

                        alt={
                          profile.username
                        }

                        className="profile-avatar"

                      />

                    )
                  : (

                      <div className="profile-avatar">

                        {getInitials()}

                      </div>

                    )
              }


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

                <div className="profile-stats">


                  <div className="profile-stat">

                    <strong>

                      {skills.length}

                    </strong>

                    <span>

                      Skills

                    </span>

                  </div>


                  <div className="profile-stat">

                    <strong>

                      {experiences.length}

                    </strong>

                    <span>

                      Experience

                    </span>

                  </div>


                  <div className="profile-stat">

                    <strong>

                      {followersCount}

                    </strong>

                    <span>

                      Followers

                    </span>

                  </div>


                  <div className="profile-stat">

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

            {
              activeTab === 'posts'
              &&
              (

                <div className="profile-posts">


                  <article className="profile-post">


                    <div className="profile-post-header">


                      <div className="profile-post-avatar">

                        {getInitials()}

                      </div>


                      <div>


                        <div className="post-name">


                          <strong>

                            @{profile.username}

                          </strong>


                          <span className="small-verified">

                            ✓

                          </span>


                        </div>


                      </div>


                    </div>


                    <p>

                      This user's posts will appear here.

                    </p>


                  </article>


                </div>

              )
            }


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