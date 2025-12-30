import React from "react";

const Header = () => {
    return (
        <div className="bg-white rounded shadow-lg py-5 px-7">
            <header>
                <nav className="flex justify-between">
                    <div className="flex items-center space-x-3 lg:pr-16 pr-6">
                        <h2 className="font-bold text-2xl leading-6 text-gray-800">Cloudtype Example</h2>
                    </div>
                </nav>
            </header>
        </div>
    )
}

export default Header;