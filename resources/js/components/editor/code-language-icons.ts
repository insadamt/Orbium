import {
    siPhp,
    siJavascript,
    siTypescript,
    siPython,
    siRust,
    siGo,
    siOpenjdk,
    siC,
    siCplusplus,
    siDotnet,
    siHtml5,
    siCss,
    siPostgresql,
    siGnubash,
    siJson,
    siYaml,
} from 'simple-icons';
import { normalizeCodeLanguage } from './code-languages';

const iconPaths: Record<string, string> = {
    php: siPhp.path,
    javascript: siJavascript.path,
    typescript: siTypescript.path,
    python: siPython.path,
    rust: siRust.path,
    go: siGo.path,
    java: siOpenjdk.path,
    c: siC.path,
    cpp: siCplusplus.path,
    csharp: siDotnet.path,
    html: siHtml5.path,
    css: siCss.path,
    sql: siPostgresql.path,
    bash: siGnubash.path,
    json: siJson.path,
    yaml: siYaml.path,
};

export function codeLanguageIconPath(language: string): string | undefined {
    return iconPaths[normalizeCodeLanguage(language)];
}
