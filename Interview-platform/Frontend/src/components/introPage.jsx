import Header from '../share_components/header'
import Footer from '../share_components/footer'
import { useEffect, useState, useRef } from 'react'
import { Parallax } from 'react-parallax'
import './introPage.css'

function introPage() {
    const [index, setindex] = useState(0);
    const [sectionScrollTop, setSectionScrollTop] = useState(0);
    const sectionRef = useRef(null);

    const slideshows = [
        {
            photosrc: "photo_not_found.jpg",
            message: "This is the site1"
        },
        {
            photosrc: "photo_not_found.jpg",
            message: "This is the site2"
        },
        {
            photosrc: "photo_not_found.jpg",
            message: "This is the site3"
        },
        {
            photosrc: "photo_not_found.jpg",
            message: "This is the site4"
        },
    ]

    const abouts = [
        {
            photosrc: "photo_not_found.jpg",
            message: "You can colloborate with multiple people and start teaching dsa with this app"
        },
        {
            photosrc: "photo_not_found.jpg",
            message: "You can conduct interviews via our specialised interview taking website"
        },
        {
            photosrc: "photo_not_found.jpg",
            message: "You can colloborate with team members to write the code in our ide concurrently"
        },
        {
            photosrc: "photo_not_found.jpg",
            message: "You can make your own custom avatrs and customise your profile"
        }
    ]

    function handlenext() {
        setindex((prevIndex) => (prevIndex + 1) % slideshows.length);
    }

    function handleprev() {
        setindex((prevIndex) => (prevIndex - 1 + slideshows.length) % slideshows.length);
    }

    const getAbsoluteOffsetTop = (element) => {
        let offsetTop = 0;
        while (element) {
            offsetTop += element.offsetTop;
            element = element.offsetParent;
        }
        return offsetTop;
    };

    useEffect(() => {
        const handleScroll = () => {
            if (sectionRef.current) {
                const offsetTop = getAbsoluteOffsetTop(sectionRef.current);
                const scrollTop = window.scrollY;
                const scrolled = Math.max(0, scrollTop - offsetTop + 80);
                setSectionScrollTop(scrolled);
            }
        }
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => {
            window.removeEventListener('scroll', handleScroll);
        }
    }, []);

    const aboutIndex = Math.min(Math.floor(sectionScrollTop / 1500), abouts.length - 1);

    return (
        <>
            <Header />
            <main className="Intro-section">
                <section className="photo-gallery-box">
                    <div className="slideshow-wrapper">
                        <button className="back-button" onClick={handleprev}>previous</button>
                        {
                            slideshows.map((slide, idx) => {
                                let positionClass = "next";
                                if (idx === index) {
                                    positionClass = "active";
                                } else if (idx === (index - 1 + slideshows.length) % slideshows.length) {
                                    positionClass = "prev";
                                }
                                return (
                                    <div className={`Outer-container ${positionClass}`} key={idx}>
                                        <div className="details">{slide.message}</div>
                                        <img src={slide.photosrc} alt="photo" className="Image-section"></img>
                                    </div>
                                )
                            })
                        }
                        <button className="Forward-button" onClick={handlenext}>next</button>
                    </div>
                </section>

                <section className="About-us-container" ref={sectionRef}>
                    <div className="About-us-section">
                        <div className="About-us-title">
                            <div className='Main-title'>About Us!</div>
                            <div className='content-of-title'>Scroll down to see the slides change!</div>
                        </div>
                        <div className='bottom-portion'>
                            <div className="content">
                                {
                                    abouts.map((aboutSlide, idx) => {
                                        const slideScrollStart = idx * 1500;
                                        const slideScrollEnd = (idx + 1) * 1500;
                                        const slideCenter = slideScrollStart + 750;
                                        const distFromCenter = Math.abs(sectionScrollTop - slideCenter);
                                        let opacity = 0;
                                        let translateY = 0;

                                        if (sectionScrollTop >= slideScrollStart && sectionScrollTop < slideScrollEnd) {
                                            if (distFromCenter < 500) {
                                                opacity = 1;
                                            } else {
                                                opacity = (750 - distFromCenter) / 250;
                                            }
                                            translateY = ((sectionScrollTop - slideCenter) / 750) * 40;
                                        }
                                        return (
                                            <div
                                                className={`Outer-container-abouts ${idx % 2 === 0 ? 'left' : 'right'} ${idx === aboutIndex ? 'active' : ''}`}
                                                key={idx}
                                                style={{
                                                    opacity: opacity,
                                                    pointerEvents: opacity > 0.1 ? 'auto' : 'none',
                                                    transform: `translateY(calc(-50% + ${translateY}px))`
                                                }}
                                            >
                                                <div className="details-abouts">{aboutSlide.message}</div>
                                                <img src={aboutSlide.photosrc} alt="photo" className="Image-section-abouts"></img>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    )
}

export default introPage;


