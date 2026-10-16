import {
    siClojure,
    siCmake,
    siDart,
    siDocker,
    siElixir,
    siErlang,
    siFortran,
    siFsharp,
    siApachegroovy,
    siHaskell,
    siJulia,
    siNginx,
    siOcaml,
    siScala,
    siToml,
    siArduino,
    siGraphql,
    siKotlin,
    siLess,
    siLua,
    siMarkdown,
    siPerl,
    siR,
    siRuby,
    siSass,
    siSwift,
    siWebassembly,
    siXml,
    siPhp,
    siJavascript,
    siTypescript,
    siPython,
    siRust,
    siGo,
    siC,
    siCplusplus,
    siHtml5,
    siCss,
    siGnubash,
    siJson,
    siYaml,
} from 'simple-icons';
import { normalizeCodeLanguage } from './code-languages';
import { deviconLanguagePaths } from './language-icons/devicon-language-paths';

const iconPaths: Record<string, string> = {
    clojure: siClojure.path,
    cmake: siCmake.path,
    dart: siDart.path,
    dockerfile: siDocker.path,
    elixir: siElixir.path,
    erlang: siErlang.path,
    fortran: siFortran.path,
    fsharp: siFsharp.path,
    groovy: siApachegroovy.path,
    haskell: siHaskell.path,
    julia: siJulia.path,
    nginx: siNginx.path,
    ocaml: siOcaml.path,
    scala: siScala.path,
    toml: siToml.path,

    arduino: siArduino.path,
    graphql: siGraphql.path,
    kotlin: siKotlin.path,
    less: siLess.path,
    lua: siLua.path,
    markdown: siMarkdown.path,
    perl: siPerl.path,
    r: siR.path,
    ruby: siRuby.path,
    scss: siSass.path,
    swift: siSwift.path,
    wasm: siWebassembly.path,
    xml: siXml.path,
    php: siPhp.path,
    javascript: siJavascript.path,
    typescript: siTypescript.path,
    python: siPython.path,
    rust: siRust.path,
    go: siGo.path,
    c: siC.path,
    cpp: siCplusplus.path,
    html: siHtml5.path,
    css: siCss.path,
    bash: siGnubash.path,
    json: siJson.path,
    yaml: siYaml.path,
};

const neutralIconPaths: Record<string, string> = {
    powershell:
        'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 4 3 3-3 3m6 0h4',
    diff: 'M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4M16 3v8m-4-4h8M7 16h6',
    makefile:
        'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M8 13h8M8 17h5',
    sql: 'M20 6c0 2-3.6 3-8 3S4 8 4 6s3.6-3 8-3 8 1 8 3ZM4 6v12c0 2 3.6 3 8 3s8-1 8-3V6M4 12c0 2 3.6 3 8 3s8-1 8-3',
};

export function codeLanguageIconPath(language: string): string | undefined {
    const name = normalizeCodeLanguage(language);
    return deviconLanguagePaths[name] ?? iconPaths[name];
}

export function createCodeLanguageIcon(
    language: string,
    size = 24,
): SVGSVGElement {
    const namespace = 'http://www.w3.org/2000/svg';
    const icon = document.createElementNS(namespace, 'svg');
    icon.setAttribute('width', String(size));
    icon.setAttribute('height', String(size));
    const name = normalizeCodeLanguage(language);
    icon.setAttribute(
        'viewBox',
        deviconLanguagePaths[name] ? '0 0 128 128' : '0 0 24 24',
    );
    icon.setAttribute('aria-hidden', 'true');
    icon.style.flexShrink = '0';
    const path = document.createElementNS(namespace, 'path');
    const languagePath = codeLanguageIconPath(language);
    path.setAttribute(
        'd',
        languagePath ??
            neutralIconPaths[name] ??
            'm18 16 4-4-4-4M6 8l-4 4 4 4m8.5-12-5 16',
    );
    icon.setAttribute('fill', languagePath ? 'currentColor' : 'none');
    if (!languagePath) {
        icon.setAttribute('stroke', 'currentColor');
        icon.setAttribute('stroke-width', '1.8');
        icon.setAttribute('stroke-linecap', 'round');
        icon.setAttribute('stroke-linejoin', 'round');
    }
    icon.append(path);
    return icon;
}
