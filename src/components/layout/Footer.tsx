'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12h3l3-6 4 12 3-6h5"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-9-9"
                    opacity="0.5"
                  />
                </svg>
              </div>
              <span className="font-display text-xl font-bold text-neutral-800">
                VoiceBridge AI
              </span>
            </div>
            <p className="text-neutral-500 max-w-md">
              Empowering clear communication for everyone. VoiceBridge AI is your
              multimodal speech empowerment companion.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-neutral-800 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/therapy"
                  className="text-neutral-500 hover:text-primary-600 transition-colors"
                >
                  Therapy Mode
                </Link>
              </li>
              <li>
                <Link
                  href="/bridge"
                  className="text-neutral-500 hover:text-primary-600 transition-colors"
                >
                  Bridge Mode
                </Link>
              </li>
              <li>
                <Link
                  href="/guides"
                  className="text-neutral-500 hover:text-primary-600 transition-colors"
                >
                  Visual Guides
                </Link>
              </li>
              <li>
                <Link
                  href="/progress"
                  className="text-neutral-500 hover:text-primary-600 transition-colors"
                >
                  My Progress
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-neutral-800 mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/settings"
                  className="text-neutral-500 hover:text-primary-600 transition-colors"
                >
                  Accessibility Settings
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-neutral-500 hover:text-primary-600 transition-colors"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-neutral-500 hover:text-primary-600 transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-neutral-500 hover:text-primary-600 transition-colors"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-neutral-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-400 text-sm">
            © {new Date().getFullYear()} VoiceBridge AI. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 text-sm">Built with</span>
            <span className="text-red-500">♥</span>
            <span className="text-neutral-400 text-sm">by MyndEdge</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
