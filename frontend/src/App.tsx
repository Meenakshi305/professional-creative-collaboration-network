import {
  useEffect,
  useState
} from 'react'

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

  | 'events'


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
  // AUTH MODE
  // ============================================

  const [
    authnMode,
    setAuthnMode
  ] = useState<
    'login' |
    'signup'
  >('signup')


  // ============================================
  // SIGNUP
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
  // LOGIN
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
  // UI
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
  ] = useState<CurrentUserResponse | null>(
    null
  )


  // ============================================
  // AGE
  // ============================================

  const ageCalculator = (
    dob: string
  ) => {

    const birthDate =
      new Date(
        dob
      )


    const today =
      new Date()


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
      &&
      !currentUser
    ) {

      loadCurrentUser()
    }

  }, [])


  // ============================================
  // CLEAR SIGNUP
  // ============================================

  const clearSignupForm = () => {

    setFullName(
      ''
    )

    setUsername(
      ''
    )

    setEmail(
      ''
    )

    setDofBirth(
      ''
    )

    setPassword(
      ''
    )

    setConfirmPassword(
      ''
    )

    setEmailOfGuardian(
      ''
    )
  }


  // ============================================
  // SIGNUP
  // ============================================

  const handleSignup = async (
    event:
      React.FormEvent<HTMLFormElement>
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
      !email.includes('@')
    ) {

      setUiMessages(
        'Please enter a valid email address.'
      )

      return
    }


    if (
      username.trim().length < 3
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
      password !== confirmPassword
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

  const handleLoginPage = async (
    event:
      React.FormEvent<HTMLFormElement>
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


      if (!response.token) {

        throw new Error(
          'Login failed because no authentication token was returned.'
        )
      }


      saveLoginSession(
        response
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


      await loadCurrentUser()


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
      }


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


  // ============================================
  // OPEN SEARCHED USER
  // ============================================

  const openPublicProfile = (
    userId: number
  ) => {

    if (
      currentUser
      &&
      currentUser.userId
      ===
      userId
    ) {

      setCurrentPage(
        'profile'
      )


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
  // SHARED LOGOUT
  // ============================================

  const logoutButton = (

    <div className="logout-container">

      <button

        type="button"

        className="logout-button"

        onClick={
          handleLogout
        }

      >

        Logout

      </button>

    </div>
  )


  // ============================================
  // PUBLIC PROFILE
  // ============================================

  if (
    isLogIn
    &&
    currentPage === 'publicProfile'
    &&
    selectedUserId !== null
  ) {

    return (

      <>

        {logoutButton}


        <PublicProfile

          userId={
            selectedUserId
          }

          onHomeClick={
            () =>
              setCurrentPage(
                'dashboard'
              )
          }

          onProfileClick={
            () =>
              setCurrentPage(
                'profile'
              )
          }

          onEventsClick={
            () =>
              setCurrentPage(
                'events'
              )
          }

          onBackClick={
            () =>
              setCurrentPage(
                'dashboard'
              )
          }

        />

      </>

    )
  }


  // ============================================
  // OWN PROFILE
  // ============================================

  if (
    isLogIn
    &&
    currentPage === 'profile'
  ) {

    return (

      <>

        {logoutButton}


        <Profile

          onHomeClick={
            () =>
              setCurrentPage(
                'dashboard'
              )
          }

          onProfileClick={
            () =>
              setCurrentPage(
                'profile'
              )
          }

          onEventsClick={
            () =>
              setCurrentPage(
                'events'
              )
          }

        />

      </>

    )
  }


  // ============================================
  // EVENTS
  // ============================================

  if (
    isLogIn
    &&
    currentPage === 'events'
  ) {

    return (

      <>

        {logoutButton}


        <Events

          onHomeClick={
            () =>
              setCurrentPage(
                'dashboard'
              )
          }

          onProfileClick={
            () =>
              setCurrentPage(
                'profile'
              )
          }

          onEventsClick={
            () =>
              setCurrentPage(
                'events'
              )
          }

        />

      </>

    )
  }


  // ============================================
  // DASHBOARD
  // ============================================

  if (isLogIn) {

    return (

      <>


        <div className="logged-in-header">


          {
            currentUser
            &&
            (

              <div className="current-user-info">


                <strong>

                  Welcome,
                  {' '}
                  {currentUser.fullName}

                </strong>


                <span>

                  @{currentUser.username}

                </span>


                <span>

                  {currentUser.email}

                </span>


                <span>

                  Role:
                  {' '}
                  {currentUser.role}

                </span>


              </div>

            )
          }


          <button

            type="button"

            className="logout-button"

            onClick={
              handleLogout
            }

          >

            Logout

          </button>


        </div>


        <Dashboard

          onHomeClick={
            () =>
              setCurrentPage(
                'dashboard'
              )
          }

          onProfileClick={
            () =>
              setCurrentPage(
                'profile'
              )
          }

          onEventsClick={
            () =>
              setCurrentPage(
                'events'
              )
          }

          onUserClick={
            openPublicProfile
          }

        />


      </>

    )
  }


  // ============================================
  // LOGIN / SIGNUP
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

          Professional Creative
          {' '}
          Collaboration Network

        </h1>


        <p>

          A creative platform for building
          professional connections,
          showcasing creative work,
          discovering collaboration
          opportunities and participating
          in creative events.

        </p>


      </section>


      <section className="auth-card">


        <div className="auth-tabs">


          <button

            type="button"

            className={
              authnMode === 'signup'
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
              authnMode === 'login'
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
            authnMode === 'signup'
              ? 'Be a Part of Creative Network'
              : 'Login to Creative Network'
          }

        </h2>


        {/* SIGNUP */}

        {
          authnMode === 'signup'
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

                />

              </label>


              <label>

                Date of Birth:

                <input

                  type="date"

                  value={
                    dofBirth
                  }

                  onChange={
                    event =>
                      setDofBirth(
                        event.target.value
                      )
                  }

                />

              </label>


              {
                isUnder18
                &&
                (

                  <div>


                    <p>

                      Users under 18 require
                      guardian consent.

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

                />

              </label>


              {
                uiMessages
                &&
                (

                  <p className="form-message">

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


        {/* LOGIN */}

        {
          authnMode === 'login'
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

                />

              </label>


              {
                uiMessages
                &&
                (

                  <p className="form-message">

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