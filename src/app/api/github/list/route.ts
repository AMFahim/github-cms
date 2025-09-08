import { NextRequest, NextResponse } from 'next/server';
import { createGitHubService } from '@/lib/github';
import { getValidatedConfig } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const directory = searchParams.get('directory') || 'content';

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

    // List markdown files in the specified directory
    const markdownFiles = await githubService.listMarkdownFiles(directory);

    return NextResponse.json({
      success: true,
      data: {
        files: markdownFiles,
        directory,
        total: markdownFiles.length,
      },
    });

  } catch (error) {
    console.error('Error listing GitHub files:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to list files from GitHub',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
