import React from 'react';

interface BannerComponentProps {
    setShowNFT: React.Dispatch<React.SetStateAction<boolean>>;
}

const BannerComponent: React.FC<BannerComponentProps> = ({ setShowNFT }) => {
    return (
        <div>
            <main className="main">
                <header className="header">
                    <div className="container">
                        <div className="headInner d-flex align-items-center justify-content-between">
                            <img
                                className="logo"
                                src={require('../../assets/images/logo.svg').default} // Use `require` for relative paths
                                alt="Meta Relay"
                                title="Meta Relay"
                            />
                            <div className="d-flex align-items-center gap-md-4 gap-2">
                                <a href="https://x.com/metarelayer" className="btn-link d-flex align-items-center" title="Twitter" target='_blank'>
                                    <img
                                        className="me-1"
                                        src={require('../../assets/images/t_icn.svg').default} // Use `require` for relative paths
                                        alt=""
                                    />
                                    Twitter
                                </a>
                                <div onClick={() => setShowNFT(true)} className="d-flex align-items-center btn btn-primary rounded-pill" title="Try App">
                                    Try App
                                    <img
                                        className="ms-2"
                                        src={require('../../assets/images/rt_icn.svg').default} // Use `require` for relative paths
                                        alt=""
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                <section className="section banner py-lg-5 pt-5">
                    <div className="container">
                        <div className="row align-items-center">
                            <div className="col-lg-6">
                                <h1 className="mb-3 mb-lg-4">Blockchain for Billions—Gas-Free, Stress-Free, Future-Ready</h1>
                                <p>Unlocking the Monad Chain for Everyone—No Barriers, No Limits</p>
                            </div>
                            <div className="col-lg-6 pt-4 pt-lg-0">
                                <img
                                    src={require('../../assets/images/right_img.png')} // Use `require` for relative paths
                                    className="image-fluid w-100"
                                    alt=""
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default BannerComponent;