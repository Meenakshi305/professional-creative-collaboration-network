// Importing "useState" -> UserScreen
import { useState } from 'react'
import './App.css'
import './webpages/WebDashboard.css'
import logoWebsite from './assets/logoWebsite.png'
import Dashboard from './webpages/WebDashboard'

function CreativeCollabNetwork() {
  // User States
  const [authnMode, setAuthnMode] = useState<'login' | 'signup'>('signup')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [dofBirth, setDofBirth] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [uiMessages, setUiMessages] = useState('')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const dumEmail='Pratik123@gmail.com'
  const dumPassword='Pratik@321'

  const[isLogIn, setIsLogIn] = useState(false)

  // Guardian States
  const [emailOfGuardian, setEmailOfGuardian] = useState('')
  // AgeCalculator function
  const ageCalculator = (dob: string) => {
  const dofBirth = new Date(dob)
  const today = new Date()

  let age = today.getFullYear() - dofBirth.getFullYear()
  const monthDiff = today.getMonth() - dofBirth.getMonth()
  if (monthDiff < 0 ||(monthDiff === 0 && today.getDate() < dofBirth.getDate())) {age--}
  return age
  }

  const isUnder18 = dofBirth !== '' && ageCalculator(dofBirth) < 18

  const handleSignup = (e: React.SyntheticEvent<HTMLFormElement>)=>{
    e.preventDefault()

    if(!fullName||!email||!dofBirth||!password||!confirmPassword){
      setUiMessages("Please ensure all required fields are filled")
      return
    }

    if (isUnder18 && !emailOfGuardian) {
    setUiMessages('Under 18 Users requires Guardian email.')
    return
    }

    if(!email.includes('@')){
      setUiMessages("Please enter valid email address")
      return
    }

    if(password.length<8){
      setUiMessages("Password must contain atleast 8 characters")
      return
    }

    if(password!==confirmPassword){
      setUiMessages("Password doesn't match. Kindly re-enter it again")
      return
    }

    setUiMessages("Account created Successfully!! Welcome to out creative network")
    setIsLogIn(true)

  }

  const handleLoginPage=(e:React.SyntheticEvent<HTMLFormElement>)=>{
    e.preventDefault()
    if (!loginEmail||!loginPassword){
      setUiMessages("Kindly enter Email and Password to Login")
      return
    }
    if (loginEmail==dumEmail&&loginPassword==dumPassword){
      setUiMessages("Login Successful !! Wecome to Creative Netowork")
      setIsLogIn(true)
      return
    }
    setUiMessages('Incorrect Email and Password !!')
  }

  if (isLogIn) {
  return <Dashboard/>
  }
  return (
    <main className='page-container'>
      {isLogIn && (<h2>Dashboard - Successful Login</h2>)}
      <section className='intro-section'>
        <img 
        src={logoWebsite} 
        alt='Professional Creative Collaboration Network Logo' className='logoWebsite'/>

        <span className='eyebrow'>
            CREATE || CONNECT || COLLABORATE
        </span>  
        
        <h1>Professional Creative Collaboration Network</h1>
        <p>
          A Creative platform for building creative professional connections, showcase portfolio,
          discover collaboration opportunities and participate in creative events.
        </p>
      </section>

      <section className='auth-card'>
          {/* Sign-Up Button */}
        <div className='auth-tabs'> 
          <button
          className={authnMode === 'signup' ? 'active-tab' : ''} 
          onClick={()=>setAuthnMode('signup')}>
            SignUp
          </button>

          {/* Log-in Button */}
          <button 
          className={authnMode === 'login' ? 'active-tab' : ''}
          onClick={()=> setAuthnMode('login')}>
            Login
          </button>
        </div>
          <h2>
            {authnMode === 'signup' ? 'Be a part of Creative Network': 'Professional Creative Collaboration Network'}
          </h2>
          {/* SignUp Page */}
          {authnMode === 'signup' &&(
            <form className='auth-form' onSubmit={handleSignup}>
              {/* Full Name */}
              <label>
                Full Name: <input type='text' placeholder='Kindly Enter Full Name'
                value={fullName}
                onChange={(e)=>setFullName(e.target.value)}/> 
              </label>
              {/* Email */}
              <label>
                Email: <input type='email' placeholder='Kindly Enter Email'
                value={email}
                onChange={(e)=>setEmail(e.target.value)}/> 
              </label>
              {/* DOB */}
              <label>
                Date of Birth: <input type='date'
                value={dofBirth}
                onChange={(e)=>setDofBirth(e.target.value)}/>
              </label>

              {isUnder18 && (
                <div className="guardian-section">
                  <p>Seems your age is not 18, you require guardian consent</p>
                  <label>
                    Guardian Email
                    <input
                      type="email"placeholder="Enter guardian email" value={emailOfGuardian}
                      onChange={(e) => setEmailOfGuardian(e.target.value)}
                    />
                  </label>
                </div>)
              }

              {/* Password */}
              <label>
                Password: <input type='password' placeholder='Create new password'
                value={password}
                onChange={(e)=>setPassword(e.target.value)}/>
              </label>
              {/* Confirm Password */}
              <label>
                Confirm Password: <input type='password' placeholder='Kindly Confirm your password'
                value={confirmPassword}
                onChange={(e)=>setConfirmPassword(e.target.value)}/>
              </label>

              {uiMessages && (<p className="form-message">{uiMessages}</p>)}

              <button className='primary-button' type='submit'>Join our Creative Network</button>
            </form>
          )}
          {authnMode==='login'&&(
            <form className='auth-form' onSubmit={handleLoginPage}>
              <label>
                Email Address:
                <input type='email' placeholder='Kindly enter your email address'
                 value={loginEmail}
                 onChange={(e)=>setLoginEmail(e.target.value)}/>
              </label>

              <label>
                Password:
                <input type='password' placeholder='Kindly enter your password'
                value={loginPassword}
                onChange={(e)=>setLoginPassword(e.target.value)}/>
              </label>
              
              {uiMessages && (
                <p className='form-message'>{uiMessages}</p>
              )}

              <button className='primary-button' type='submit'>
                Log-In to Creative Network
              </button>
            </form>
          )}
      </section>
    </main>
  )
}

export default CreativeCollabNetwork