import { NextRequest, NextResponse } from 'next/server';
import { createGitHubService } from '@/lib/github';
import { markdownToHTML } from '@/lib/markdown';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Get validated configuration
    let config;
    try {
      config = await import('@/lib/config').then(m => m.getValidatedConfig());
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

    // Fetch the markdown content
    const markdownContent = await githubService.fetchMarkdownFile(filePath);
    
    // Convert to HTML
    const htmlContent = markdownToHTML(markdownContent);

    return NextResponse.json({
      success: true,
      data: {
        markdownContent,
        htmlContent,
        filePath,
      },
    });

  } catch (error) {
    console.error('Error fetching GitHub content:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch content from GitHub',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paths } = body;

    if (!paths || !Array.isArray(paths)) {
      return NextResponse.json(
        { error: 'Paths array is required' },
        { status: 400 }
      );
    }

    // Get validated configuration
    let config;
    try {
      config = await import('@/lib/config').then(m => m.getValidatedConfig());
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

    // Fetch multiple files
    const results = await Promise.allSettled(
      paths.map(async (path: string) => {
        const markdownContent = await githubService.fetchMarkdownFile(path);
        const htmlContent = markdownToHTML(markdownContent);
        return {
          path,
          markdownContent,
          htmlContent,
        };
      })
    );

    const successful = results
      .filter((result): result is PromiseFulfilledResult<{ path: string; markdownContent: string; htmlContent: string }> => result.status === 'fulfilled')
      .map(result => result.value);

    const failed = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map((result, index) => ({
        path: paths[index],
        error: result.reason.message,
      }));

    return NextResponse.json({
      success: true,
      data: {
        successful,
        failed,
        total: paths.length,
      },
    });

  } catch (error) {
    console.error('Error fetching multiple GitHub files:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch files from GitHub',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
