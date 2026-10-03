const languageAliases: Record<string, string> = {
    'c++': 'cpp',
    'c#': 'csharp',
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    sh: 'bash',
    shell: 'bash',
    yml: 'yaml',
    text: 'plaintext',
    txt: 'plaintext',
};

export const codeLanguages = [
    'plaintext',
    'php',
    'javascript',
    'typescript',
    'python',
    'rust',
    'go',
    'java',
    'c',
    'cpp',
    'csharp',
    'html',
    'css',
    'sql',
    'bash',
    'json',
    'yaml',
];

export function normalizeCodeLanguage(language: string): string {
    const name = language.trim().toLowerCase();
    return languageAliases[name] ?? name;
}
