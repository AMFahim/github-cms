import { NextRequest, NextResponse } from 'next/server';
import { createGitHubService, GitHubFile } from '@/lib/github';
import { Draft, draftToMarkdown, generateDraftFilename } from '@/lib/drafts';
import { getValidatedConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { drafts, directory = 'content' } = body as {
      drafts: Draft[];
      directory?: string;
    };

    if (!drafts || !Array.isArray(drafts) || drafts.length === 0) {
      return NextResponse.json(
        { error: 'Drafts array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Get validated configuration
    let config;
    try {
      config = getValidatedConfig();
    } catch (error) {
      console.error('Configuration error:', error);
      return NextResponse.json(
        { error: 'GitHub configuration is invalid or missing' },
        { status: 500 }
      );
    }

    // Create GitHub service
    const githubService = createGitHubService({
      token: config.github.token,
      owner: config.github.owner,
      repo: config.github.repo,
      branch: config.github.branch,
    });

    // Convert drafts to GitHub files
    const githubFiles: GitHubFile[] = drafts.map((draft) => {
      const draftWithDates: Draft = {
        ...draft,
        createdAt: new Date(draft.createdAt),
        updatedAt: new Date(draft.updatedAt),
      };
      
      const markdownContent = draftToMarkdown(draftWithDates);
      const filename = generateDraftFilename(draftWithDates, directory);
      
      return {
        name: filename,
        content: markdownContent,
      };
    });

    // Commit all files at once
    const commitMessage = `Publish ${drafts.length} draft${drafts.length > 1 ? 's' : ''}: ${drafts.map(d => d.title).join(', ')}`;
    
    await githubService.commitMultipleFiles(githubFiles, commitMessage);

    // Return success with details
    return NextResponse.json({
      success: true,
      data: {
        published: githubFiles.map(file => file.name),
        total: drafts.length,
        commitMessage,
        repository: `${config.github.owner}/${config.github.repo}`,
        branch: config.github.branch,
      },
    });

  } catch (error) {
    console.error('Error publishing drafts to GitHub:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to publish drafts to GitHub',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { draft, directory = 'content', filePath } = body as {
      draft: Draft;
      directory?: string;
      filePath?: string;
    };

    if (!draft) {
      return NextResponse.json(
        { error: 'Draft is required' },
        { status: 400 }
      );
    }

    // Get validated configuration
    let config;
    try {
      config = getValidatedConfig();
    } catch (error) {
      console.error('Configuration error:', error);
      return NextResponse.json(
        { error: 'GitHub configuration is invalid or missing' },
        { status: 500 }
      );
    }

    // Create GitHub service
    const githubService = createGitHubService({
      token: config.github.token,
      owner: config.github.owner,
      repo: config.github.repo,
      branch: config.github.branch,
    });

    const draftWithDates: Draft = {
      ...draft,
      createdAt: new Date(draft.createdAt),
      updatedAt: new Date(draft.updatedAt),
    };
    
    // Convert draft to markdown
    const markdownContent = draftToMarkdown(draftWithDates);
    const filename = filePath || generateDraftFilename(draftWithDates, directory);
    const commitMessage = `Update: ${draft.title}`;

    // Commit single file
    await githubService.commitFile(filename, markdownContent, commitMessage);

    return NextResponse.json({
      success: true,
      data: {
        published: filename,
        title: draft.title,
        commitMessage,
        repository: `${config.github.owner}/${config.github.repo}`,
        branch: config.github.branch,
      },
    });

  } catch (error) {
    console.error('Error publishing single draft to GitHub:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to publish draft to GitHub',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
