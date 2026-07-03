import { useEffect, useState } from 'react';
import './footer.css'
function Footer() {
    const EMAIL_ADDRESS = "madhanyuvi2009@gmail.com";
    const [hidden, sethidden] = useState(true)
    const [scrollY, setscroll] = useState(0)

    const handlescroll = () => {
        const current = window.scrollY;
        const totalHeight = document.documentElement.scrollHeight;
        const viewportHeight = window.innerHeight;

        // Use >= (greater than or equal) instead of == (strict equal)
        // Check if the scroll position is near the bottom of the page
        if (current + viewportHeight >= totalHeight - 50) {
            sethidden(false);
        } else {
            sethidden(true);
        }
        setscroll(current);
    };
    useEffect(() => {
        window.addEventListener('scroll', handlescroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handlescroll);
        };
    }, [scrollY]);
    return (
        <>
            <div className={`Outer-footer-box ${hidden ? 'footer--hidden' : ''}`}>
                <div className="mail-id">Gmail-<a href={`mailto:${EMAIL_ADDRESS}`}>{EMAIL_ADDRESS}</a></div>
                <div className="location-part">Location:Walajapet,Tamil Nadu,India</div>
                <div className="Personal-info-tab">
                    <div className="Phone-number">+91-8610193065</div>
                    <a href="https://www.linkedin.com/in/madhankumarkumaran/" className="LinkedIn-profile" target="_blank">LinkedIn</a>
                </div>
            </div>
        </>
    )
}
export default Footer;