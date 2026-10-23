import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode
} from 'react'

import CreativeAppShell from './shared/Sidebar/CreativeAppShell'
import type { MainPage } from './shared/Sidebar/Sidebar'


import './App.css'
import './webpages/WebDashboard.css'


import logoWebsite
  from './assets/logoWebsite.png'


import Dashboard
  from './webpages/WebDashboard'

import Profile
  from './pages/Profile/Profile'

import PublicProfile
  from './pages/Profile/PublicProfile'

import Events
  from './pages/Events/Events'

import Collaboration
  from './pages/Collaboration/Collaboration'



import {
  signupUser,
  loginUser,
  logoutUser,
  saveLoginSession,
  hasLoginSession,
  getCurrentUser,
  clearLoginSession,
  type CurrentUserResponse
} from './service/authService'


type Page =
  | 'dashboard'
  | 'profile'
  | 'publicProfile'
  | 'collaboration'
  | 'events'
  | 'admin'
  | 'notifications'
  | 'settings'


function CreativeCollabNetwork() {


  // ============================================
  // PAGE
  // ============================================

  const [
    currentPage,
    setCurrentPage
  ] = useState<Page>(
    'dashboard'
  )


  const [
    selectedUserId,
    setSelectedUserId
  ] = useState<number | null>(
    null
  )


  // ============================================
  // AUTHENTICATION
  // ============================================

  const [
    authnMode,
    setAuthnMode
  ] = useState<
    'login'
    |
    'signup'
  >(
    'signup'
  )


  // ============================================
  // SIGNUP FIELDS
  // ============================================

  const [
    fullName,
    setFullName
  ] = useState('')


  const [
    username,
    setUsername
  ] = useState('')


  const [
    email,
    setEmail
  ] = useState('')


  const [
    dofBirth,
    setDofBirth
  ] = useState('')


  const [
    password,
    setPassword
  ] = useState('')


  const [
    confirmPassword,
    setConfirmPassword
  ] = useState('')


  const [
    emailOfGuardian,
    setEmailOfGuardian
  ] = useState('')


  // ============================================
  // LOGIN FIELDS
  // ============================================

  const [
    loginEmail,
    setLoginEmail
  ] = useState('')


  const [
    loginPassword,
    setLoginPassword
  ] = useState('')


  // ============================================
  // UI STATES
  // ============================================

  const [
    uiMessages,
    setUiMessages
  ] = useState('')


  const [
    isLoading,
    setIsLoading
  ] = useState(false)


  // ============================================
  // SESSION
  // ============================================

  const [
    isLogIn,
    setIsLogIn
  ] = useState(
    () =>
      hasLoginSession()
  )


  const [
    currentUser,
    setCurrentUser
  ] = useState<
    CurrentUserResponse
    |
    null
  >(
    null
  )


  // ============================================
  // AGE CALCULATION
  // ============================================

  const ageCalculator = (
    dob: string
  ): number => {

    const birthDate =
      new Date(
        `${dob}T00:00:00`
      )


    const today =
      new Date()


    if (
      Number.isNaN(
        birthDate.getTime()
      )
      ||
      birthDate > today
    ) {

      return -1
    }


    let age =
      today.getFullYear()
      -
      birthDate.getFullYear()


    const monthDifference =
      today.getMonth()
      -
      birthDate.getMonth()


    if (
      monthDifference < 0
      ||
      (
        monthDifference === 0
        &&
        today.getDate()
        <
        birthDate.getDate()
      )
    ) {

      age--
    }


    return age
  }


  const isUnder18 =
    dofBirth !== ''
    &&
    ageCalculator(
      dofBirth
    ) >= 0
    &&
    ageCalculator(
      dofBirth
    ) < 18


  // ============================================
  // LOAD CURRENT USER
  // ============================================

  const loadCurrentUser =
    async () => {

      try {

        const user =
          await getCurrentUser()


        setCurrentUser(
          user
        )


        return user


      } catch (error) {

        console.error(
          'Current user error:',
          error
        )


        clearLoginSession()


        setCurrentUser(
          null
        )


        setIsLogIn(
          false
        )


        setAuthnMode(
          'login'
        )


        setUiMessages(
          'Your session has expired. Please login again.'
        )


        return null
      }
    }


  // ============================================
  // RESTORE SESSION
  // ============================================

  useEffect(() => {

    if (
      hasLoginSession()
    ) {

      void loadCurrentUser()
    }

  }, [])


  // ============================================
  // CLEAR SIGNUP FORM
  // ============================================

  const clearSignupForm =
    () => {

      setFullName('')

      setUsername('')

      setEmail('')

      setDofBirth('')

      setPassword('')

      setConfirmPassword('')

      setEmailOfGuardian('')
    }


  // ============================================
  // SIGNUP
  // ============================================

  const handleSignup =
    async (
      event:
        FormEvent<
          HTMLFormElement
        >
    ) => {

      event.preventDefault()


      setUiMessages(
        ''
      )


      if (
        !fullName.trim()
        ||
        !username.trim()
        ||
        !email.trim()
        ||
        !dofBirth
        ||
        !password
        ||
        !confirmPassword
      ) {

        setUiMessages(
          'Please fill all required fields.'
        )

        return
      }


      if (
        ageCalculator(
          dofBirth
        ) < 0
      ) {

        setUiMessages(
          'Please enter a valid date of birth.'
        )

        return
      }


      if (
        isUnder18
        &&
        !emailOfGuardian.trim()
      ) {

        setUiMessages(
          'Users under 18 require a guardian email.'
        )

        return
      }


      if (
        !email.includes(
          '@'
        )
      ) {

        setUiMessages(
          'Please enter a valid email address.'
        )

        return
      }


      if (
        isUnder18
        &&
        (
          !emailOfGuardian.includes(
            '@'
          )
          ||
          emailOfGuardian
            .trim()
            .toLowerCase()
          ===
          email
            .trim()
            .toLowerCase()
        )
      ) {

        setUiMessages(
          'Please enter a valid, separate guardian email.'
        )

        return
      }


      if (
        username
          .trim()
          .length < 3
      ) {

        setUiMessages(
          'Username must contain at least 3 characters.'
        )

        return
      }


      if (
        password.length < 8
      ) {

        setUiMessages(
          'Password must contain at least 8 characters.'
        )

        return
      }


      if (
        password
        !==
        confirmPassword
      ) {

        setUiMessages(
          'Passwords do not match.'
        )

        return
      }


      try {

        setIsLoading(
          true
        )


        const response =
          await signupUser({

            fullName:
              fullName.trim(),

            username:
              username.trim(),

            email:
              email.trim(),

            password,

            dateOfBirth:
              dofBirth

          })


        setLoginEmail(
          email.trim()
        )


        clearSignupForm()


        setAuthnMode(
          'login'
        )


        setUiMessages(
          response.message
          ||
          'Account created successfully. Please login.'
        )


      } catch (error) {

        console.error(
          'Signup error:',
          error
        )


        setUiMessages(

          error instanceof Error

            ? error.message

            : 'Unable to create account.'

        )


      } finally {

        setIsLoading(
          false
        )
      }
    }


  // ============================================
  // LOGIN
  // ============================================

  const handleLoginPage =
    async (
      event:
        FormEvent<
          HTMLFormElement
        >
    ) => {

      event.preventDefault()


      setUiMessages(
        ''
      )


      if (
        !loginEmail.trim()
        ||
        !loginPassword
      ) {

        setUiMessages(
          'Please enter email and password.'
        )

        return
      }


      try {

        setIsLoading(
          true
        )


        const response =
          await loginUser({

            email:
              loginEmail.trim(),

            password:
              loginPassword

          })


        if (
          !response.token
        ) {

          throw new Error(
            'Login failed because no authentication token was returned.'
          )
        }


        saveLoginSession(
          response
        )


        const user =
          await getCurrentUser()


        setCurrentUser(
          user
        )


        setIsLogIn(
          true
        )


        setLoginPassword(
          ''
        )


        setCurrentPage(
          'dashboard'
        )


        setSelectedUserId(
          null
        )


        setUiMessages(
          ''
        )


      } catch (error) {

        console.error(
          'Login error:',
          error
        )


        clearLoginSession()


        setIsLogIn(
          false
        )


        setCurrentUser(
          null
        )


        setUiMessages(

          error instanceof Error

            ? error.message

            : 'Unable to login.'

        )


      } finally {

        setIsLoading(
          false
        )
      }
    }


  // ============================================
  // LOGOUT
  // ============================================

  const handleLogout =
    async () => {

      try {

        await logoutUser()


      } catch (error) {

        console.error(
          'Logout error:',
          error
        )


      } finally {

        clearLoginSession()


        setCurrentUser(
          null
        )


        setIsLogIn(
          false
        )


        setCurrentPage(
          'dashboard'
        )


        setSelectedUserId(
          null
        )


        setAuthnMode(
          'login'
        )


        setLoginEmail(
          ''
        )


        setLoginPassword(
          ''
        )


        setUiMessages(
          'You have logged out successfully.'
        )
      }
    }


  // ============================================
  // NAVIGATION
  // ============================================

  const goHome = () => {

    setCurrentPage(
      'dashboard'
    )


    setSelectedUserId(
      null
    )
  }


  const goProfile = () => {

    setCurrentPage(
      'profile'
    )


    setSelectedUserId(
      null
    )
  }


  const goCollaboration =
    () => {

      setCurrentPage(
        'collaboration'
      )


      setSelectedUserId(
        null
      )
    }


  const goEvents = () => {

    setCurrentPage(
      'events'
    )


    setSelectedUserId(
      null
    )
  }


  // ============================================
  // PUBLIC PROFILE
  // ============================================

  const openPublicProfile =
    (
      userId: number
    ) => {

      if (
        currentUser
        &&
        currentUser.userId
        ===
        userId
      ) {

        goProfile()

        return
      }


      setSelectedUserId(
        userId
      )


      setCurrentPage(
        'publicProfile'
      )
    }


  // ============================================
  // SHARED SIDEBAR ROUTING (no duplicate header)
  // ============================================

  const handleSidebarNavigate = (page: MainPage) => {
    const destination: Record<MainPage, Page> = {
      home: 'dashboard',
      profile: 'profile',
      collaborations: 'collaboration',
      events: 'events',
      notifications: 'notifications',
      settings: 'settings',
      admin: 'admin'
    }
    if (page === 'admin' && !['ADMIN', 'SUPER_ADMIN'].includes(currentUser?.role?.replace(/^ROLE_/i, '').toUpperCase() ?? '')) {
      setUiMessages('You do not have permission to access the admin page.')
      return
    }
    setCurrentPage(destination[page])
    setSelectedUserId(null)
    setUiMessages('')
  }

  if (isLogIn && currentUser) {
    // Public profiles remain part of the Profile section of the primary sidebar.
    const sidebarPage: MainPage = currentPage === 'dashboard'
      ? 'home'
      : currentPage === 'collaboration'
        ? 'collaborations'
        : currentPage === 'publicProfile'
          ? 'profile'
          : currentPage

    let pageContent: ReactNode
    switch (currentPage) {
      case 'dashboard':
        pageContent = (
          <Dashboard
            onHomeClick={goHome}
            onProfileClick={goProfile}
            onCollaborationClick={goCollaboration}
            onEventsClick={goEvents}
            onUserClick={openPublicProfile}
          />
        )
        break
      case 'profile':
        pageContent = (
          <Profile
            onHomeClick={goHome}
            onProfileClick={goProfile}
            onCollaborationClick={goCollaboration}
            onEventsClick={goEvents}
          />
        )
        break
      case 'publicProfile':
        pageContent = selectedUserId !== null ? (
          <PublicProfile
            userId={selectedUserId}
            onHomeClick={goHome}
            onProfileClick={goProfile}
            onCollaborationClick={goCollaboration}
            onEventsClick={goEvents}
            onBackClick={goHome}
          />
        ) : <p>No user selected.</p>
        break
      case 'collaboration':
        pageContent = (
          <Collaboration
            onHomeClick={goHome}
            onProfileClick={goProfile}
            onCollaborationClick={goCollaboration}
            onEventsClick={goEvents}
          />
        )
        break
      case 'events':
        pageContent = (
          <Events
            onHomeClick={goHome}
            onProfileClick={goProfile}
            onCollaborationClick={goCollaboration}
            onEventsClick={goEvents}
          />
        )
        break
      case 'notifications':
        pageContent = <main className="cp-pending-page"><h1>Notifications</h1><p>Notification page integration pending.</p></main>
        break
      case 'settings':
        pageContent = <main className="cp-pending-page"><h1>Settings</h1><p>Settings page integration pending.</p></main>
        break
      case 'admin':
        // CreativeAppShell renders AdminLayout (with its own second sidebar).
        pageContent = null
        break
    }

    return (
      <CreativeAppShell
        activePage={sidebarPage}
        onNavigate={handleSidebarNavigate}
        onLogout={() => { void handleLogout() }}
      >
        {uiMessages && <div className="cp-app-message" role="status">{uiMessages}</div>}
        {pageContent}
      </CreativeAppShell>
    )
  }

  // ============================================
  // SESSION LOADING
  // ============================================

  if (
    isLogIn
    &&
    !currentUser
  ) {

    return (

      <main className="page-container">


        <p>

          Loading your account...

        </p>


      </main>
    )
  }


  // ============================================
  // LOGIN / SIGNUP PAGE
  // ============================================

  return (

    <main className="page-container">


      <section className="intro-section">


        <img

          src={
            logoWebsite
          }

          alt="Professional Creative Collaboration Network Logo"

          className="logoWebsite"

        />


        <span className="eyebrow">

          CREATE || CONNECT || COLLABORATE

        </span>


        <h1>

          Professional Creative Collaboration Network

        </h1>


        <p>

          A creative platform for building professional
          connections, showcasing creative work,
          discovering collaboration opportunities
          and participating in creative events.

        </p>


      </section>


      <section className="auth-card">


        <div className="auth-tabs">


          <button

            type="button"

            className={
              authnMode
              ===
              'signup'

                ? 'active-tab'

                : ''
            }

            onClick={
              () => {

                setAuthnMode(
                  'signup'
                )


                setUiMessages(
                  ''
                )
              }
            }

          >

            Sign Up

          </button>


          <button

            type="button"

            className={
              authnMode
              ===
              'login'

                ? 'active-tab'

                : ''
            }

            onClick={
              () => {

                setAuthnMode(
                  'login'
                )


                setUiMessages(
                  ''
                )
              }
            }

          >

            Login

          </button>


        </div>


        <h2>

          {
            authnMode
            ===
            'signup'

              ? 'Be a Part of Creative Network'

              : 'Login to Creative Network'
          }

        </h2>


        {/* ================================= */}
        {/* SIGNUP FORM */}
        {/* ================================= */}

        {
          authnMode
          ===
          'signup'
          &&
          (

            <form

              className="auth-form"

              onSubmit={
                handleSignup
              }

            >


              <label>

                Full Name:


                <input

                  type="text"

                  placeholder="Enter full name"

                  value={
                    fullName
                  }

                  onChange={
                    event =>
                      setFullName(
                        event.target.value
                      )
                  }

                  required

                />


              </label>


              <label>

                Username:


                <input

                  type="text"

                  placeholder="Choose username"

                  value={
                    username
                  }

                  onChange={
                    event =>
                      setUsername(
                        event.target.value
                      )
                  }

                  minLength={
                    3
                  }

                  required

                />


              </label>


              <label>

                Email Address:


                <input

                  type="email"

                  placeholder="Enter email address"

                  value={
                    email
                  }

                  onChange={
                    event =>
                      setEmail(
                        event.target.value
                      )
                  }

                  required

                />


              </label>


              <label>

                Date of Birth:


                <input

                  type="date"

                  value={
                    dofBirth
                  }

                  max={
                    new Date()
                      .toLocaleDateString(
                        'en-CA'
                      )
                  }

                  onChange={
                    event =>
                      setDofBirth(
                        event.target.value
                      )
                  }

                  required

                />


              </label>


              {
                isUnder18
                &&
                (

                  <div>


                    <p>

                      Users under 18 require guardian consent.

                    </p>


                    <label>

                      Guardian Email:


                      <input

                        type="email"

                        placeholder="Enter guardian email"

                        value={
                          emailOfGuardian
                        }

                        onChange={
                          event =>
                            setEmailOfGuardian(
                              event.target.value
                            )
                        }

                        required

                      />


                    </label>


                  </div>

                )
              }


              <label>

                Password:


                <input

                  type="password"

                  placeholder="Create password"

                  value={
                    password
                  }

                  onChange={
                    event =>
                      setPassword(
                        event.target.value
                      )
                  }

                  minLength={
                    8
                  }

                  required

                />


              </label>


              <label>

                Confirm Password:


                <input

                  type="password"

                  placeholder="Confirm password"

                  value={
                    confirmPassword
                  }

                  onChange={
                    event =>
                      setConfirmPassword(
                        event.target.value
                      )
                  }

                  required

                />


              </label>


              {
                uiMessages
                &&
                (

                  <p

                    className="form-message"

                    role="status"

                  >

                    {uiMessages}

                  </p>

                )
              }


              <button

                className="primary-button"

                type="submit"

                disabled={
                  isLoading
                }

              >

                {
                  isLoading

                    ? 'Creating Account...'

                    : 'Join our Creative Network'
                }

              </button>


            </form>

          )
        }


        {/* ================================= */}
        {/* LOGIN FORM */}
        {/* ================================= */}

        {
          authnMode
          ===
          'login'
          &&
          (

            <form

              className="auth-form"

              onSubmit={
                handleLoginPage
              }

            >


              <label>

                Email Address:


                <input

                  type="email"

                  placeholder="Enter your email address"

                  value={
                    loginEmail
                  }

                  onChange={
                    event =>
                      setLoginEmail(
                        event.target.value
                      )
                  }

                  required

                />


              </label>


              <label>

                Password:


                <input

                  type="password"

                  placeholder="Enter your password"

                  value={
                    loginPassword
                  }

                  onChange={
                    event =>
                      setLoginPassword(
                        event.target.value
                      )
                  }

                  required

                />


              </label>


              {
                uiMessages
                &&
                (

                  <p

                    className="form-message"

                    role="status"

                  >

                    {uiMessages}

                  </p>

                )
              }


              <button

                className="primary-button"

                type="submit"

                disabled={
                  isLoading
                }

              >

                {
                  isLoading

                    ? 'Logging In...'

                    : 'Log In to Creative Network'
                }

              </button>


            </form>

          )
        }


      </section>


    </main>
  )
}


export default CreativeCollabNetwork