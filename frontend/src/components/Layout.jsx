import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

const Layout = ({children,showSidebar=false}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  return (
    <div className='min-h-screen bg-base-100 text-base-content'>
        <div className='flex min-h-screen'>
            {showSidebar && (
              <Sidebar
                mobileOpen={mobileSidebarOpen}
                onClose={() => setMobileSidebarOpen(false)}
              />
            )}

            <div className='flex-1 flex flex-col min-w-0 min-h-screen'>
                <Navbar
                  showSidebarToggle={showSidebar}
                  onSidebarToggle={() => setMobileSidebarOpen((open) => !open)}
                />

                <main className='flex-1 overflow-y-auto bg-base-100'>
                    {children}
                </main>
            </div>

        </div>
      
    </div>
  )
}

export default Layout
