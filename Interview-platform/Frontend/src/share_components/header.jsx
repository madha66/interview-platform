import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import './header.css';
function Header() {
    const [hidden, sethidden] = useState(false)
    const [scrolly, setscrolly] = useState(0)
    const handlescroll = () => {
        const currentscrolly = window.scrollY;
        if (currentscrolly > scrolly && currentscrolly > 50) {
            sethidden(true)
        }
        else {
            sethidden(false)
        }
        setscrolly(currentscrolly)
    }
    const [open, setopen] = useState(false)
    const handleMouseEnter = () => {
        setopen(true)
    }
    const handleMouseLeave = () => {
        setopen(false)
    }
    useEffect(() => {
        window.addEventListener('scroll', handlescroll, { passive: true })
        return () => {
            window.removeEventListener('scroll', handlescroll)
        }
    }, [scrolly])
    return (
        <>
            <div className={`Outer-component-box ${hidden ? 'header--hidden' : ''}`}>
                <div className="Title-part">
                    <p>Dockers</p>
                </div>
                <div className="Nav-bar-part">
                    <Link to="/" style={{ textDecoration: 'none' }}><div className="home-part">Home</div></Link>
                    <div className="about-part">about</div>
                    <button className="Hamburger-box" onMouseEnter={handleMouseEnter}>
                        <img src="/hamburger.svg" className="hamburger-icon" alt="Menu" />
                        {
                            open && (
                                <div className='List-container' onMouseLeave={handleMouseLeave}>
                                    <ul>
                                        <Link to="/login" style={{ textDecoration: 'none' }}><li > Login </li></Link>
                                        <li>Signup</li>
                                    </ul>
                                </div>
                            )
                        }
                    </button>
                </div>
            </div>
        </>
    )
}
export default Header;
