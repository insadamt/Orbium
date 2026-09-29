import { Code2 } from 'lucide-react';
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

export default function LanguageIcon({ language }: { language: string }) {
    const path = iconPaths[language];
    return path ? (
        <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
        >
            <path d={path} />
        </svg>
    ) : (
        <Code2 size={15} aria-hidden="true" />
    );
}
