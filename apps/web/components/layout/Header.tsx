'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useProject } from '@/context/ProjectContext';
// We would import the SVG paths or components here, but for now we embed them.

export function Header() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { projects, selectedProject, setSelectedProjectId, isLoading } = useProject();

    return (
        <header className="header">
            <div className="header-left">
                <Link href="/" className="logo">
                    {/* Mentha Leaf Logo without Tick */}
                    <svg
                        id="Capa_1"
                        xmlns="http://www.w3.org/2000/svg"
                        version="1.1"
                        viewBox="0 0 40 40"
                    >
                        <path
                            fill="#000000"
                            d="M19.7,26.3l3.2-4.2c1.7-2.6,3.5-5.4,3.9-8.5l-1.8,3.4c-1.3,1.8-2.6,3.8-4.1,5.4s-2.3,2.3-2.7,2.4-.2,0-.2-.2c-1-3.3-1.1-7.5.3-10.7s6.4-8,9.5-10.6,2.5-2.1,2.7-2c2.5,4.1,4.3,9.4,3.1,14.3-1.5,6.1-7.9,10.2-13.9,10.7Z"
                        />
                        <path
                            fill="#000000"
                            d="M33.7,20.5v15.1c0,1-1.6,2.5-2.6,2.7-2.4.4-4.2-1-4.4-3.4s-.2-6.1,0-8,0-.4.2-.6,1.7-.9,2.1-1.2c1.8-1.2,3.3-2.7,4.7-4.5Z"
                        />
                        <path
                            fill="#000000"
                            d="M16.3,25.4c-.1.1-.9-.6-1.1-.7-1.6-1.5-3.1-3.8-4-5.8-.3,0-.1.3,0,.4.6,2.5,2.6,4.8,4.1,6.9-3.5-.3-7.2-2.6-8.2-6.2s.4-5.7,1.7-8.4c.1,0,1.4,1,1.6,1.1,1.9,1.6,5,4.4,5.8,6.7s.4,4,0,6Z"
                        />
                        <path
                            fill="#000000"
                            d="M7.3,24.4c1.9,2,4.3,3.2,7,3.9-.3,2.2.5,6.1-.4,8.1s-3.4,2.6-5.1,1.5-1.5-1.6-1.5-2.2v-11.2Z"
                        />
                        <path
                            fill="#000000"
                            d="M23.9,27.5v8.1c0,.4-.8,1.6-1.1,1.9-1.6,1.4-4.4,1.1-5.4-.9s-.5-1.4-.5-1.6v-6.7c2.4,0,4.7-.1,7-.8Z"
                        />
                    </svg>
                </Link>
                <div className={`project-dropdown ${isDropdownOpen ? 'open' : ''}`}>
                    <button
                        className="project-selector"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <span>
                            {isLoading ? 'Loading...' : selectedProject?.name || 'Select Project'}
                        </span>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                                d="M3 4.5L6 7.5L9 4.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                    <div className="dropdown-menu">
                        <div className="dropdown-items">
                            {projects.map((p) => (
                                <button
                                    key={p.id}
                                    className={`dropdown-item ${p.id === selectedProject?.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedProjectId(p.id);
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    {p.name}
                                </button>
                            ))}
                            {projects.length === 0 && !isLoading && (
                                <div className="dropdown-item">No brands found</div>
                            )}
                        </div>
                        <div className="dropdown-divider"></div>
                        <button className="dropdown-action">Add Brand</button>
                    </div>
                </div>
            </div>

            <div className="header-center">
                <button className="period-selector">
                    <span>Overview</span>
                </button>
            </div>

            <div className="header-right">
                {/* Avatar Top */}
                <div className="avatar">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=mentha" alt="User" />
                </div>
                {/* Hamburger Bottom */}
                <button className="icon-btn hamburger-btn">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path
                            d="M3 5H17M3 10H17M3 15H17"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
            </div>
        </header>
    );
}
