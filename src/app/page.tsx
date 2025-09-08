'use client';

import { useState } from 'react';
import GitHubContentViewer from '@/components/GitHubContentViewer';
import DraftManager from '@/components/DraftManager';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'content' | 'drafts'>('content');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                GitHub CMS
              </h1>
            </div>
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('content')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'content'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                 Content
              </button>
              <button
                onClick={() => setActiveTab('drafts')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'drafts'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Draft
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'content' && <GitHubContentViewer />}
        {activeTab === 'drafts' && <DraftManager />}
      </main>
    </div>
  );
}
