# GitHub CMS

A Next.js application for managing Markdown content stored in GitHub repositories. Users can fetch, create, edit, and publish Markdown content through a web interface.

## Technology Stack

- **Next.js** - React framework with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe development

## Dependencies

- **@octokit/rest** - Official GitHub REST API client for repository operations
- **marked** - I have used it for Markdown to HTML parser for content rendering
- **dompurify** -I have Used it for HTML sanitization to prevent XSS attacks
- **jsdom** - I have used it for the Server-side DOM implementation for safe HTML processing
- **@tailwindcss/typography** - I have used it for the beautiful typography styles for rendered Markdown content
- **date-fns** -I have used for timestamp handling like in the title generate and other things.

## Local Development

1. **Install dependencies**
   ```bash
   npm install
   #or
   yarn install
   ```

2. **Environment Configuration**
   
   Create a `.env.local` file:
   ```env
   GITHUB_TOKEN=your_personal_access_token_here
   GITHUB_OWNER=your_github_username
   GITHUB_REPO=your_repository_name
   GITHUB_BRANCH=main
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

   Application available at [http://localhost:3000](http://localhost:3000)

## GitHub Token Setup

Create a Personal Access Token at [GitHub Settings](https://github.com/settings/tokens) with `repo` scope permissions.

## Build

```bash
npm run build
npm run start
# or
yarn build
yarn start
```