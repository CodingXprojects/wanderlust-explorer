import React from 'react'
import { Button } from '../button'
import {Link} from 'react-router-dom'
function Hero() {
  return (
    <div className='flex flex-col items-center mx-56 gap-9'><h1
    className='font-extrabold text-[40px] text-center mt-5'>
         <span>Discover Your Next Adventure with AI:</span><br></br>Personalized itineries at your fingertips
        </h1>
        <p className='text-xl text-gray-500 text-center'>Your personal trip planner and travel curator

        </p>
        <Link to={'/create-trip'}>
<Button>Get started </Button>
</Link>
        </div>
  )
}

export default Hero