import {
  useEffect,
  useState
} from 'react'

import './Profile.css'

import NavigationBar
  from '../../shared/NavigationBar/NavigationBar'

import {
  getCurrentUser,
  type CurrentUserResponse
} from '../../service/authService'

import {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  type ProfileResponse
} from '../../service/profileService'

import {
  getExperiences,
  addExperience,
  updateExperience,
  deleteExperience,
  type Experience
} from '../../service/experienceService'

import {
  getFollowersCount,
  getFollowingCount
} from '../../service/followService'


type EditableProfile = {
  bio: string
  achievements: string
}


type ExperienceForm = {
  jobTitle: string
  organisation: string
  startDate: string
  endDate: string
  currentRole: boolean
  description: string
}


type ProfileProps = {

  onHomeClick: () => void

  onProfileClick: () => void

  onEventsClick: () => void
}


function Profile({

  onHomeClick,

  onProfileClick,

  onEventsClick

}: ProfileProps) {


  // ============================================
  // CURRENT USER
  // ============================================

  const [
    currentUser,
    setCurrentUser
  ] = useState<CurrentUserResponse | null>(
    null
  )


  // ============================================
  // PROFILE
  // ============================================

  const [
    ,
    setProfile
  ] = useState<ProfileResponse | null>(
    null
  )


  const [
    bio,
    setBio
  ] = useState('')


  const [
    skills,
    setSkills
  ] = useState<string[]>([])


  const [
    achievements,
    setAchievements
  ] = useState('')


  const [
    profileImageUrl,
    setProfileImageUrl
  ] = useState('')


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
  // PROFILE IMAGE
  // ============================================

  const [
    selectedImage,
    setSelectedImage
  ] = useState<File | null>(
    null
  )


  const [
    imagePreview,
    setImagePreview
  ] = useState('')


  // ============================================
  // PROFILE EDIT
  // ============================================

  const [
    editForm,
    setEditForm
  ] = useState<EditableProfile>({

    bio: '',

    achievements: ''

  })


  // ============================================
  // SKILLS
  // ============================================

  const [
    isAddingSkill,
    setIsAddingSkill
  ] = useState(false)


  const [
    newSkill,
    setNewSkill
  ] = useState('')


  // ============================================
  // EXPERIENCE
  // ============================================

  const [
    experiences,
    setExperiences
  ] = useState<Experience[]>([])


  const [
    isExperienceModalOpen,
    setIsExperienceModalOpen
  ] = useState(false)


  const [
    editingExperience,
    setEditingExperience
  ] = useState<Experience | null>(
    null
  )


  const [
    experienceForm,
    setExperienceForm
  ] = useState<ExperienceForm>({

    jobTitle: '',

    organisation: '',

    startDate: '',

    endDate: '',

    currentRole: false,

    description: ''

  })


  // ============================================
  // TABS
  // ============================================

  const [
    activeTab,
    setActiveTab
  ] = useState<
    'posts' |
    'achievements'
  >('posts')


  // ============================================
  // UI STATES
  // ============================================

  const [
    isEditing,
    setIsEditing
  ] = useState(false)


  const [
    isLoading,
    setIsLoading
  ] = useState(true)


  const [
    isSaving,
    setIsSaving
  ] = useState(false)


  const [
    message,
    setMessage
  ] = useState('')


  // ============================================
  // LOAD PROFILE
  // ============================================

  useEffect(() => {

    const loadProfile =
      async () => {

        try {

          setIsLoading(
            true
          )


          setMessage(
            ''
          )


          const user =
            await getCurrentUser()


          setCurrentUser(
            user
          )


          const [
            profileData,
            experienceData,
            followerCount,
            followingCountValue
          ] =
            await Promise.all([

              getUserProfile(
                user.userId
              ),

              getExperiences(
                user.userId
              ),

              getFollowersCount(
                user.userId
              ),

              getFollowingCount(
                user.userId
              )

            ])


          setProfile(
            profileData
          )


          setExperiences(
            experienceData
          )


          setFollowersCount(
            followerCount
          )


          setFollowingCount(
            followingCountValue
          )


          setBio(
            profileData.bio || ''
          )


          setAchievements(
            profileData.achievements || ''
          )


          setProfileImageUrl(
            profileData.profileImageUrl || ''
          )


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


        } catch (error) {

          console.error(
            'Profile load error:',
            error
          )


          setMessage(
            error instanceof Error
              ? error.message
              : 'Unable to load profile.'
          )


        } finally {

          setIsLoading(
            false
          )
        }
      }


    loadProfile()

  }, [])


  // ============================================
  // IMAGE PREVIEW CLEANUP
  // ============================================

  useEffect(() => {

    return () => {

      if (imagePreview) {

        URL.revokeObjectURL(
          imagePreview
        )
      }
    }

  }, [imagePreview])


  // ============================================
  // INITIALS
  // ============================================

  const getInitials = () => {

    if (!currentUser?.fullName) {

      return 'U'
    }


    return currentUser.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(
        name =>
          name.charAt(0)
      )
      .join('')
      .toUpperCase()
  }


  // ============================================
  // EDIT PROFILE
  // ============================================

  const openEditProfile = () => {

    setEditForm({

      bio,

      achievements

    })


    setSelectedImage(
      null
    )


    if (imagePreview) {

      URL.revokeObjectURL(
        imagePreview
      )
    }


    setImagePreview(
      ''
    )


    setMessage(
      ''
    )


    setIsEditing(
      true
    )
  }


  const handleEditChange = (
    event:
      React.ChangeEvent<
        HTMLInputElement |
        HTMLTextAreaElement
      >
  ) => {

    const {
      name,
      value
    } = event.target


    setEditForm(
      current => ({

        ...current,

        [name]:
          value

      })
    )
  }


  // ============================================
  // IMAGE
  // ============================================

  const handleImageSelection = (
    event:
      React.ChangeEvent<HTMLInputElement>
  ) => {

    const file =
      event.target.files?.[0]


    if (!file) {

      return
    }


    if (
      !file.type.startsWith(
        'image/'
      )
    ) {

      setMessage(
        'Please select an image file.'
      )

      return
    }


    if (
      file.size >
      5 * 1024 * 1024
    ) {

      setMessage(
        'Profile image must be smaller than 5 MB.'
      )

      return
    }


    if (imagePreview) {

      URL.revokeObjectURL(
        imagePreview
      )
    }


    setSelectedImage(
      file
    )


    setImagePreview(
      URL.createObjectURL(
        file
      )
    )


    setMessage(
      ''
    )
  }


  // ============================================
  // SAVE PROFILE
  // ============================================

  const saveProfile = async (
    event:
      React.FormEvent<HTMLFormElement>
  ) => {

    event.preventDefault()


    if (!currentUser) {

      return
    }


    try {

      setIsSaving(
        true
      )


      setMessage(
        ''
      )


      if (selectedImage) {

        const uploaded =
          await uploadProfileImage(

            currentUser.userId,

            selectedImage

          )


        const refreshed =
          uploaded.includes('?')
            ? `${uploaded}&t=${Date.now()}`
            : `${uploaded}?t=${Date.now()}`


        setProfileImageUrl(
          refreshed
        )
      }


      const updated =
        await updateUserProfile(

          currentUser.userId,

          {

            bio:
              editForm.bio.trim(),

            skills:
              skills.join(', '),

            achievements:
              editForm
                .achievements
                .trim()

          }
        )


      setProfile(
        updated
      )


      setBio(
        updated.bio || ''
      )


      setAchievements(
        updated.achievements || ''
      )


      if (!selectedImage) {

        setProfileImageUrl(
          updated.profileImageUrl || ''
        )
      }


      const savedSkills =
        updated.skills
          ? updated.skills
              .split(',')
              .map(
                skill =>
                  skill.trim()
              )
              .filter(Boolean)
          : []


      setSkills(
        savedSkills
      )


      if (imagePreview) {

        URL.revokeObjectURL(
          imagePreview
        )
      }


      setImagePreview(
        ''
      )


      setSelectedImage(
        null
      )


      setIsEditing(
        false
      )


      setMessage(
        'Profile saved successfully.'
      )


    } catch (error) {

      console.error(
        error
      )


      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save profile.'
      )


    } finally {

      setIsSaving(
        false
      )
    }
  }


  const cancelEdit = () => {

    if (imagePreview) {

      URL.revokeObjectURL(
        imagePreview
      )
    }


    setImagePreview(
      ''
    )


    setSelectedImage(
      null
    )


    setIsEditing(
      false
    )
  }


  // ============================================
  // SKILLS
  // ============================================

  const saveSkills = async (
    updatedSkills: string[]
  ) => {

    if (!currentUser) {

      return
    }


    const updated =
      await updateUserProfile(

        currentUser.userId,

        {

          bio,

          skills:
            updatedSkills.join(', '),

          achievements

        }
      )


    setProfile(
      updated
    )


    setSkills(
      updated.skills
        ? updated.skills
            .split(',')
            .map(
              skill =>
                skill.trim()
            )
            .filter(Boolean)
        : []
    )
  }


  const addSkillHandler = async (
    event:
      React.FormEvent<HTMLFormElement>
  ) => {

    event.preventDefault()


    const skill =
      newSkill.trim()


    if (!skill) {

      return
    }


    const exists =
      skills.some(

        existing =>
          existing.toLowerCase()
          ===
          skill.toLowerCase()

      )


    if (exists) {

      setMessage(
        'That skill already exists.'
      )

      return
    }


    try {

      setIsSaving(
        true
      )


      await saveSkills([
        ...skills,
        skill
      ])


      setNewSkill(
        ''
      )


      setIsAddingSkill(
        false
      )


      setMessage(
        'Skill added successfully.'
      )


    } catch (error) {

      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save skill.'
      )


    } finally {

      setIsSaving(
        false
      )
    }
  }


  const removeSkillHandler =
    async (
      skillToRemove: string
    ) => {

      try {

        setIsSaving(
          true
        )


        await saveSkills(

          skills.filter(
            skill =>
              skill !== skillToRemove
          )

        )


        setMessage(
          'Skill removed successfully.'
        )


      } catch (error) {

        setMessage(
          error instanceof Error
            ? error.message
            : 'Unable to remove skill.'
        )


      } finally {

        setIsSaving(
          false
        )
      }
    }


  // ============================================
  // EXPERIENCE
  // ============================================

  const openAddExperience = () => {

    setEditingExperience(
      null
    )


    setExperienceForm({

      jobTitle: '',

      organisation: '',

      startDate: '',

      endDate: '',

      currentRole: false,

      description: ''

    })


    setIsExperienceModalOpen(
      true
    )
  }


  const openEditExperience = (
    experience: Experience
  ) => {

    setEditingExperience(
      experience
    )


    setExperienceForm({

      jobTitle:
        experience.jobTitle,

      organisation:
        experience.organisation,

      startDate:
        experience.startDate,

      endDate:
        experience.endDate || '',

      currentRole:
        experience.currentRole,

      description:
        experience.description || ''

    })


    setIsExperienceModalOpen(
      true
    )
  }


  const handleExperienceChange = (
    event:
      React.ChangeEvent<
        HTMLInputElement |
        HTMLTextAreaElement
      >
  ) => {

    const {
      name,
      value
    } = event.target


    setExperienceForm(
      current => ({

        ...current,

        [name]:
          value

      })
    )
  }


  const handleCurrentRoleChange = (
    event:
      React.ChangeEvent<HTMLInputElement>
  ) => {

    const checked =
      event.target.checked


    setExperienceForm(
      current => ({

        ...current,

        currentRole:
          checked,

        endDate:
          checked
            ? ''
            : current.endDate

      })
    )
  }


  const saveExperienceHandler = async (
    event:
      React.FormEvent<HTMLFormElement>
  ) => {

    event.preventDefault()


    if (!currentUser) {

      return
    }


    if (
      !experienceForm.jobTitle.trim()
      ||
      !experienceForm.organisation.trim()
      ||
      !experienceForm.startDate
    ) {

      setMessage(
        'Please complete the required experience fields.'
      )

      return
    }


    if (
      !experienceForm.currentRole
      &&
      !experienceForm.endDate
    ) {

      setMessage(
        'Please enter the end date.'
      )

      return
    }


    try {

      setIsSaving(
        true
      )


      const request = {

        jobTitle:
          experienceForm.jobTitle.trim(),

        organisation:
          experienceForm.organisation.trim(),

        startDate:
          experienceForm.startDate,

        endDate:
          experienceForm.currentRole
            ? null
            : experienceForm.endDate,

        currentRole:
          experienceForm.currentRole,

        description:
          experienceForm.description.trim()

      }


      if (editingExperience) {

        const updated =
          await updateExperience(

            currentUser.userId,

            editingExperience.id,

            request

          )


        setExperiences(
          current =>
            current.map(
              item =>
                item.id === updated.id
                  ? updated
                  : item
            )
        )


        setMessage(
          'Experience updated successfully.'
        )


      } else {

        const created =
          await addExperience(

            currentUser.userId,

            request

          )


        setExperiences(
          current => [

            created,

            ...current

          ]
        )


        setMessage(
          'Experience added successfully.'
        )
      }


      setEditingExperience(
        null
      )


      setIsExperienceModalOpen(
        false
      )


    } catch (error) {

      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save experience.'
      )


    } finally {

      setIsSaving(
        false
      )
    }
  }


  const deleteExperienceHandler =
    async (
      experienceId: number
    ) => {

      if (!currentUser) {

        return
      }


      if (
        !window.confirm(
          'Delete this experience?'
        )
      ) {

        return
      }


      try {

        await deleteExperience(

          currentUser.userId,

          experienceId

        )


        setExperiences(
          current =>
            current.filter(
              item =>
                item.id !== experienceId
            )
        )


        setMessage(
          'Experience deleted successfully.'
        )


      } catch (error) {

        setMessage(
          error instanceof Error
            ? error.message
            : 'Unable to delete experience.'
        )
      }
    }


  const formatExperienceDate = (
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


          <div className="profile-navigation">


            <button

              type="button"

              className="back-dashboard-button"

              onClick={
                onHomeClick
              }

            >

              <span className="back-arrow">

                ←

              </span>

              Back to Dashboard

            </button>


            <div className="profile-page-label">

              <span className="profile-page-dot" />

              Professional Profile

            </div>


          </div>


          {
            message
            &&
            (

              <section className="profile-section-card">

                {message}

              </section>

            )
          }


          {/* PROFILE HEADER */}

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


              {
                profileImageUrl
                  ? (

                      <img

                        src={
                          profileImageUrl
                        }

                        alt="Profile"

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


                  <div>


                    <div className="profile-name-line">

                      <h1>

                        {
                          currentUser?.fullName
                          ||
                          'Creative User'
                        }

                      </h1>

                      <span className="verified-badge">

                        ✓

                      </span>

                    </div>


                    <p className="profile-title">

                      @{currentUser?.username}

                    </p>


                  </div>


                  <button

                    type="button"

                    className="edit-profile-button"

                    onClick={
                      openEditProfile
                    }

                  >

                    Edit Profile

                  </button>


                </div>


                <div className="profile-meta">

                  <span>

                    ✉ {currentUser?.email}

                  </span>

                  <span>

                    Role: {currentUser?.role}

                  </span>

                </div>


                <p className="profile-bio">

                  {
                    bio
                    ||
                    'Add a professional bio to your profile.'
                  }

                </p>


                {/* NOT CLICKABLE */}

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


          {/* SKILLS */}

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


              <button

                type="button"

                className="profile-small-button"

                onClick={
                  () =>
                    setIsAddingSkill(
                      true
                    )
                }

              >

                + Add Skill

              </button>


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

                          <span>

                            {skill}

                          </span>


                          <button

                            type="button"

                            className="remove-skill-button"

                            disabled={
                              isSaving
                            }

                            onClick={
                              () =>
                                removeSkillHandler(
                                  skill
                                )
                            }

                          >

                            ×

                          </button>


                        </div>

                      )
                    )
              }


            </div>


          </section>


          {/* EXPERIENCE */}

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


              <button

                type="button"

                className="profile-small-button"

                onClick={
                  openAddExperience
                }

              >

                + Add Experience

              </button>


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

                                {experience.jobTitle}

                              </h3>


                              <span>

                                {
                                  formatExperienceDate(
                                    experience.startDate
                                  )
                                }

                                {' – '}

                                {
                                  experience.currentRole
                                    ? 'Present'
                                    : formatExperienceDate(
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


                            <div
                              style={{
                                display:
                                  'flex',
                                gap:
                                  '10px',
                                marginTop:
                                  '14px'
                              }}
                            >


                              <button

                                type="button"

                                className="profile-small-button"

                                onClick={
                                  () =>
                                    openEditExperience(
                                      experience
                                    )
                                }

                              >

                                Edit

                              </button>


                              <button

                                type="button"

                                className="profile-small-button"

                                onClick={
                                  () =>
                                    deleteExperienceHandler(
                                      experience.id
                                    )
                                }

                              >

                                Delete

                              </button>


                            </div>


                          </div>


                        </article>

                      )
                    )
              }


            </div>


          </section>


          {/* POSTS / ACHIEVEMENTS */}

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

                            {currentUser?.fullName}

                          </strong>

                          <span className="small-verified">
                            ✓
                          </span>

                        </div>

                        <span>
                          No posts yet
                        </span>

                      </div>


                    </div>


                    <p>

                      Your posts will appear here.

                    </p>


                  </article>


                </div>

              )
            }


            {
              activeTab === 'achievements'
              &&
              (

                <div className="achievements-list">


                  {
                    achievements
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
                                {achievements}
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


        {/* EDIT PROFILE MODAL */}

        {
          isEditing
          &&
          (

            <div
              className="edit-modal-overlay"
              onMouseDown={
                cancelEdit
              }
            >


              <div
                className="edit-modal"
                onMouseDown={
                  event =>
                    event.stopPropagation()
                }
              >


                <div className="edit-modal-header">


                  <div>

                    <p className="section-eyebrow">
                      PROFILE SETTINGS
                    </p>

                    <h2>
                      Edit Profile
                    </h2>

                  </div>


                  <button
                    type="button"
                    className="edit-modal-close"
                    onClick={
                      cancelEdit
                    }
                  >

                    ×

                  </button>


                </div>


                <form
                  className="edit-profile-form"
                  onSubmit={
                    saveProfile
                  }
                >


                  <div className="edit-form-group">


                    <label htmlFor="profileImage">

                      Profile Picture

                    </label>


                    {
                      imagePreview
                        ? (

                            <img
                              src={
                                imagePreview
                              }
                              alt="Preview"
                              style={{
                                width:
                                  '110px',
                                height:
                                  '110px',
                                borderRadius:
                                  '50%',
                                objectFit:
                                  'cover'
                              }}
                            />

                          )
                        : profileImageUrl
                          ? (

                              <img
                                src={
                                  profileImageUrl
                                }
                                alt="Current profile"
                                style={{
                                  width:
                                    '110px',
                                  height:
                                    '110px',
                                  borderRadius:
                                    '50%',
                                  objectFit:
                                    'cover'
                                }}
                              />

                            )
                          : null
                    }


                    <input

                      id="profileImage"

                      type="file"

                      accept="image/png,image/jpeg,image/jpg,image/webp"

                      onChange={
                        handleImageSelection
                      }

                    />


                  </div>


                  <div className="edit-form-group">


                    <label htmlFor="bio">

                      Professional Bio

                    </label>


                    <textarea

                      id="bio"

                      name="bio"

                      rows={5}

                      value={
                        editForm.bio
                      }

                      onChange={
                        handleEditChange
                      }

                    />


                  </div>


                  <div className="edit-form-group">


                    <label htmlFor="achievements">

                      Achievements

                    </label>


                    <textarea

                      id="achievements"

                      name="achievements"

                      rows={4}

                      value={
                        editForm.achievements
                      }

                      onChange={
                        handleEditChange
                      }

                    />


                  </div>


                  <div className="edit-modal-actions">


                    <button

                      type="button"

                      className="edit-cancel-button"

                      onClick={
                        cancelEdit
                      }

                    >

                      Cancel

                    </button>


                    <button

                      type="submit"

                      className="edit-save-button"

                      disabled={
                        isSaving
                      }

                    >

                      {
                        isSaving
                          ? 'Saving...'
                          : 'Save Changes'
                      }

                    </button>


                  </div>


                </form>


              </div>


            </div>

          )
        }


        {/* SKILL MODAL */}

        {
          isAddingSkill
          &&
          (

            <div
              className="edit-modal-overlay"
              onMouseDown={
                () =>
                  setIsAddingSkill(
                    false
                  )
              }
            >


              <div
                className="skill-modal"
                onMouseDown={
                  event =>
                    event.stopPropagation()
                }
              >


                <div className="edit-modal-header">


                  <div>

                    <p className="section-eyebrow">

                      PROFESSIONAL SKILLS

                    </p>

                    <h2>

                      Add Skill

                    </h2>

                  </div>


                  <button

                    type="button"

                    className="edit-modal-close"

                    onClick={
                      () =>
                        setIsAddingSkill(
                          false
                        )
                    }

                  >

                    ×

                  </button>


                </div>


                <form
                  onSubmit={
                    addSkillHandler
                  }
                >


                  <div className="edit-form-group">


                    <label htmlFor="newSkill">

                      Skill

                    </label>


                    <input

                      id="newSkill"

                      type="text"

                      value={
                        newSkill
                      }

                      onChange={
                        event =>
                          setNewSkill(
                            event.target.value
                          )
                      }

                      placeholder="Example: Photography"

                      autoFocus

                    />


                  </div>


                  <div className="edit-modal-actions">


                    <button

                      type="button"

                      className="edit-cancel-button"

                      onClick={
                        () =>
                          setIsAddingSkill(
                            false
                          )
                      }

                    >

                      Cancel

                    </button>


                    <button

                      type="submit"

                      className="edit-save-button"

                      disabled={
                        isSaving
                      }

                    >

                      Add Skill

                    </button>


                  </div>


                </form>


              </div>


            </div>

          )
        }


        {/* EXPERIENCE MODAL */}

        {
          isExperienceModalOpen
          &&
          (

            <div
              className="edit-modal-overlay"
              onMouseDown={
                () =>
                  setIsExperienceModalOpen(
                    false
                  )
              }
            >


              <div
                className="edit-modal"
                onMouseDown={
                  event =>
                    event.stopPropagation()
                }
              >


                <div className="edit-modal-header">


                  <div>

                    <p className="section-eyebrow">
                      CAREER HISTORY
                    </p>

                    <h2>

                      {
                        editingExperience
                          ? 'Edit Experience'
                          : 'Add Experience'
                      }

                    </h2>

                  </div>


                  <button

                    type="button"

                    className="edit-modal-close"

                    onClick={
                      () =>
                        setIsExperienceModalOpen(
                          false
                        )
                    }

                  >

                    ×

                  </button>


                </div>


                <form
                  className="edit-profile-form"
                  onSubmit={
                    saveExperienceHandler
                  }
                >


                  <div className="edit-form-group">

                    <label htmlFor="jobTitle">
                      Job Title
                    </label>

                    <input
                      id="jobTitle"
                      name="jobTitle"
                      type="text"
                      required
                      value={
                        experienceForm.jobTitle
                      }
                      onChange={
                        handleExperienceChange
                      }
                    />

                  </div>


                  <div className="edit-form-group">

                    <label htmlFor="organisation">
                      Organisation
                    </label>

                    <input
                      id="organisation"
                      name="organisation"
                      type="text"
                      required
                      value={
                        experienceForm.organisation
                      }
                      onChange={
                        handleExperienceChange
                      }
                    />

                  </div>


                  <div className="edit-form-row">


                    <div className="edit-form-group">

                      <label htmlFor="startDate">
                        Start Date
                      </label>

                      <input
                        id="startDate"
                        name="startDate"
                        type="date"
                        required
                        value={
                          experienceForm.startDate
                        }
                        onChange={
                          handleExperienceChange
                        }
                      />

                    </div>


                    <div className="edit-form-group">

                      <label htmlFor="endDate">
                        End Date
                      </label>

                      <input
                        id="endDate"
                        name="endDate"
                        type="date"
                        value={
                          experienceForm.endDate
                        }
                        disabled={
                          experienceForm.currentRole
                        }
                        required={
                          !experienceForm.currentRole
                        }
                        onChange={
                          handleExperienceChange
                        }
                      />

                    </div>


                  </div>


                  <label
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap:
                        '10px'
                    }}
                  >

                    <input
                      type="checkbox"
                      checked={
                        experienceForm.currentRole
                      }
                      onChange={
                        handleCurrentRoleChange
                      }
                      style={{
                        width:
                          'auto'
                      }}
                    />

                    I currently work here

                  </label>


                  <div className="edit-form-group">

                    <label htmlFor="experienceDescription">
                      Description
                    </label>

                    <textarea
                      id="experienceDescription"
                      name="description"
                      rows={5}
                      value={
                        experienceForm.description
                      }
                      onChange={
                        handleExperienceChange
                      }
                    />

                  </div>


                  <div className="edit-modal-actions">


                    <button
                      type="button"
                      className="edit-cancel-button"
                      onClick={
                        () =>
                          setIsExperienceModalOpen(
                            false
                          )
                      }
                    >

                      Cancel

                    </button>


                    <button
                      type="submit"
                      className="edit-save-button"
                      disabled={
                        isSaving
                      }
                    >

                      {
                        editingExperience
                          ? 'Update Experience'
                          : 'Add Experience'
                      }

                    </button>


                  </div>


                </form>


              </div>


            </div>

          )
        }


      </main>


    </div>
  )
}


export default Profile